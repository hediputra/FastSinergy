import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server_db.json");

app.use(express.json());

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], workflows: [], documents: [], assets: [], notifications: [], tasks: [], auditLogs: [] };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file", error);
    return { users: [], workflows: [], documents: [], assets: [], notifications: [], tasks: [], auditLogs: [] };
  }
}

// Helper to write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file", error);
  }
}

// API Routes
// 1. Get entire state (including audits, notifications, etc.)
app.get("/api/state", (req, res) => {
  const db = readDB();
  res.json(db);
});

// 2. Change/Login Role & handle 2FA reset
app.post("/api/auth/login-role", (req, res) => {
  const { role } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.role === role);

  if (!user) {
    return res.status(404).json({ error: "Perangkat Desa dengan peran ini tidak ditemukan." });
  }

  // If role is KADES or SEKDES, they need 2FA verification.
  // We reset is2FAVerified to false to trigger the OTP dialog in the frontend!
  if (user.has2FA) {
    user.is2FAVerified = false;
  } else {
    user.is2FAVerified = true;
  }

  // Create an audit log for switching/attempting login
  const log = {
    id: "l_" + Date.now(),
    user_name: user.name,
    role: user.role,
    action: `Mencoba login sebagai ${user.role} ${user.has2FA ? "(Menunggu 2FA)" : "(Berhasil Tanpa 2FA)"}`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: req.headers["user-agent"] || "Mozilla/5.0",
    created_at: new Date().toISOString()
  };
  db.auditLogs.unshift(log);

  writeDB(db);
  res.json({ user });
});

// 3. Verify 2FA
app.post("/api/auth/verify-2fa", (req, res) => {
  const { role, code } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.role === role);

  if (!user) {
    return res.status(404).json({ error: "User tidak ditemukan." });
  }

  if (code === "123456") {
    user.is2FAVerified = true;

    const log = {
      id: "l_" + Date.now(),
      user_name: user.name,
      role: user.role,
      action: `Berhasil verifikasi 2-Factor Authentication (2FA)`,
      ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      user_agent: req.headers["user-agent"] || "Mozilla/5.0",
      created_at: new Date().toISOString()
    };
    db.auditLogs.unshift(log);

    // Create a notification for successful login
    db.notifications.unshift({
      id: "n_" + Date.now(),
      user_id: user.id,
      title: "Login Aman 2FA Berhasil",
      message: `Sistem mendeteksi login sukses dengan verifikasi 2FA pada ${new Date().toLocaleTimeString("id-ID")}.`,
      is_read: false,
      created_at: new Date().toISOString()
    });

    writeDB(db);
    res.json({ success: true, user });
  } else {
    res.status(400).json({ error: "Kode 2FA salah. Silakan coba lagi (Tips: gunakan kode default '123456')." });
  }
});

// 4. Create Workflow (SPP, SPJ, Dinas, Perdes, APBDes)
app.post("/api/workflows", (req, res) => {
  const { title, type, description, amount, creator_role, creator_name, creator_id } = req.body;
  const db = readDB();

  // Define steps based on workflow type according to Tupoksi
  let steps: any[] = [];
  if (type === "SPP" || type === "SPJ") {
    // Kaur Keuangan Verifies -> Sekdes Verifies -> Kades Approves
    steps = [
      { id: "s_" + Date.now() + "_1", role: "KAUR_KEUANGAN", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_2", role: "SEKDES", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_3", role: "KADES", status: "PENDING", comment: "" }
    ];
  } else if (type === "PERJALANAN_DINAS") {
    // Kaur Umum checks naskah -> Kades Approves
    steps = [
      { id: "s_" + Date.now() + "_1", role: "KAUR_UMUM", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_2", role: "KADES", status: "PENDING", comment: "" }
    ];
  } else if (type === "PERATURAN_DESA") {
    // Sekdes checks draft -> Kades Approves
    steps = [
      { id: "s_" + Date.now() + "_1", role: "SEKDES", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_2", role: "KADES", status: "PENDING", comment: "" }
    ];
  } else { // APB_DES
    // Kaur Perencanaan compiles -> Kaur Keuangan controls -> Sekdes verifies -> Kades approves & publishes
    steps = [
      { id: "s_" + Date.now() + "_1", role: "KAUR_PERENCANAAN", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_2", role: "KAUR_KEUANGAN", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_3", role: "SEKDES", status: "PENDING", comment: "" },
      { id: "s_" + Date.now() + "_4", role: "KADES", status: "PENDING", comment: "" }
    ];
  }

  const newWorkflow = {
    id: "w_" + Date.now(),
    title,
    type,
    creator_id,
    creator_name,
    creator_role,
    amount: amount ? Number(amount) : undefined,
    description,
    current_step_index: 0,
    status: "PENDING",
    steps,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    document_url: `/docs/${type.toLowerCase()}_${Date.now()}.pdf`
  };

  db.workflows.unshift(newWorkflow);

  // Add audit log
  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name: creator_name,
    role: creator_role,
    action: `Membuat pengajuan alur kerja ${type}: ${title}`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString()
  });

  // Notify the first step role
  const firstRole = steps[0].role;
  const firstUserObj = db.users.find((u: any) => u.role === firstRole);
  db.notifications.unshift({
    id: "n_" + Date.now(),
    user_id: firstUserObj ? firstUserObj.id : "all",
    title: `Persetujuan Baru: ${type}`,
    message: `${creator_name} (${creator_role}) mengajukan "${title}". Memerlukan tindakan Anda.`,
    is_read: false,
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json(newWorkflow);
});

// 5. Approve/Reject Workflow Step
app.post("/api/workflows/:id/approve", (req, res) => {
  const { id } = req.params;
  const { action, comment, user_name, user_role } = req.body; // action: 'APPROVE' or 'REJECT'
  const db = readDB();
  const workflow = db.workflows.find((w: any) => w.id === id);

  if (!workflow) {
    return res.status(404).json({ error: "Alur persetujuan tidak ditemukan." });
  }

  const currentStep = workflow.steps[workflow.current_step_index];

  // Verify role permission
  if (currentStep.role !== user_role) {
    return res.status(403).json({ error: `Hanya peran ${currentStep.role} yang dapat melakukan tindakan pada langkah ini.` });
  }

  if (action === "REJECT") {
    currentStep.status = "REJECTED";
    currentStep.comment = comment;
    currentStep.user_name = user_name;
    currentStep.updated_at = new Date().toISOString();
    workflow.status = "REJECTED";
    workflow.updated_at = new Date().toISOString();

    // Log & notify creator
    db.auditLogs.unshift({
      id: "l_" + Date.now(),
      user_name,
      role: user_role,
      action: `Menolak alur kerja ${workflow.type}: ${workflow.title}. Alasan: ${comment}`,
      ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      user_agent: "Mozilla/5.0",
      created_at: new Date().toISOString()
    });

    db.notifications.unshift({
      id: "n_" + Date.now(),
      user_id: workflow.creator_id,
      title: `Pengajuan Ditolak: ${workflow.type}`,
      message: `Pengajuan Anda "${workflow.title}" ditolak oleh ${user_name} (${user_role}) dengan alasan: "${comment}".`,
      is_read: false,
      created_at: new Date().toISOString()
    });
  } else {
    // Approve step
    currentStep.status = "APPROVED";
    currentStep.comment = comment;
    currentStep.user_name = user_name;
    currentStep.updated_at = new Date().toISOString();

    // Is there a next step?
    if (workflow.current_step_index < workflow.steps.length - 1) {
      workflow.current_step_index += 1;
      const nextStep = workflow.steps[workflow.current_step_index];
      nextStep.status = "PENDING"; // set next step to pending
      workflow.updated_at = new Date().toISOString();

      // Log action
      db.auditLogs.unshift({
        id: "l_" + Date.now(),
        user_name,
        role: user_role,
        action: `Menyetujui/Memverifikasi langkah ke-${workflow.current_step_index} alur kerja ${workflow.type}: ${workflow.title}`,
        ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        user_agent: "Mozilla/5.0",
        created_at: new Date().toISOString()
      });

      // Notify next role
      const nextUserObj = db.users.find((u: any) => u.role === nextStep.role);
      db.notifications.unshift({
        id: "n_" + Date.now(),
        user_id: nextUserObj ? nextUserObj.id : "all",
        title: `Verifikasi Lanjutan: ${workflow.type}`,
        message: `Dokumen "${workflow.title}" telah disetujui oleh ${user_name} (${user_role}). Kini memerlukan verifikasi Anda.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } else {
      // Last step approved -> complete workflow
      workflow.status = "APPROVED";
      workflow.updated_at = new Date().toISOString();

      // Log & notify creator
      db.auditLogs.unshift({
        id: "l_" + Date.now(),
        user_name,
        role: user_role,
        action: `Menyetujui Akhir (Final Approval) alur kerja ${workflow.type}: ${workflow.title}`,
        ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        user_agent: "Mozilla/5.0",
        created_at: new Date().toISOString()
      });

      db.notifications.unshift({
        id: "n_" + Date.now(),
        user_id: workflow.creator_id,
        title: `Pengajuan Disetujui Penuh! 🎉`,
        message: `Selamat, pengajuan Anda "${workflow.title}" telah disetujui sepenuhnya oleh Kepala Desa pada tahap akhir!`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  }

  writeDB(db);
  res.json(workflow);
});

// 6. Manage Assets
app.post("/api/assets", (req, res) => {
  const { name, code, category, condition, value, acquisition_date, location, managed_by, user_name, user_role } = req.body;
  const db = readDB();

  const newAsset = {
    id: "a_" + Date.now(),
    name,
    code,
    category,
    condition,
    value: Number(value),
    acquisition_date,
    location,
    managed_by
  };

  db.assets.unshift(newAsset);

  // Audit Log
  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name,
    role: user_role,
    action: `Menambah aset desa baru: ${name} (${code}) senilai Rp${Number(value).toLocaleString("id-ID")}`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json(newAsset);
});

// 7. Manage DMS Documents
app.post("/api/documents", (req, res) => {
  const { title, type, sender_or_receiver, reference_number, category, description, user_name, user_role } = req.body;
  const db = readDB();

  const newDoc = {
    id: "d_" + Date.now(),
    title,
    type,
    sender_or_receiver,
    reference_number,
    category,
    description,
    created_at: new Date().toISOString(),
    uploaded_by: user_name
  };

  db.documents.unshift(newDoc);

  // If category is Layanan Mandiri Warga, add notification for village administrators
  if (category === "Layanan Mandiri Warga") {
    db.notifications.unshift({
      id: "n_" + Date.now(),
      user_id: "all",
      title: "Pengajuan Layanan Mandiri",
      message: `Warga (${sender_or_receiver}) mengirimkan permohonan baru: ${title} (${reference_number}).`,
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  // Audit Log
  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name,
    role: user_role,
    action: `Mengarsipkan dokumen DMS baru (${type}): ${title} - No: ${reference_number}`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json(newDoc);
});

// 7b. Citizen Aspirations and Complaints
app.post("/api/aspirasi", (req, res) => {
  const { name, category, complaint, contact } = req.body;
  const db = readDB();

  // Create real-time notification
  db.notifications.unshift({
    id: "n_" + Date.now(),
    user_id: "all",
    title: `Aspirasi Warga Baru: ${category}`,
    message: `Aspirasi dari ${name} (${contact}): "${complaint}"`,
    is_read: false,
    created_at: new Date().toISOString()
  });

  // Create audit log entry
  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name: name,
    role: "WARGA" as any,
    action: `Menyampaikan aspirasi/pengaduan kategori ${category}: "${complaint}"`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0 (Public Portal)",
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json({ success: true });
});

app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const { user_name, user_role } = req.query;
  const db = readDB();
  const index = db.documents.findIndex((d: any) => d.id === id);

  if (index !== -1) {
    const doc = db.documents[index];
    db.documents.splice(index, 1);

    db.auditLogs.unshift({
      id: "l_" + Date.now(),
      user_name: String(user_name || "Perangkat Desa"),
      role: (user_role as any) || "SEKDES",
      action: `Menghapus arsip dokumen DMS: ${doc.title}`,
      ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      user_agent: "Mozilla/5.0",
      created_at: new Date().toISOString()
    });

    writeDB(db);
    return res.json({ success: true });
  }

  res.status(404).json({ error: "Dokumen tidak ditemukan." });
});

// 8. Manage Tasks / Delegations
app.post("/api/tasks", (req, res) => {
  const { title, description, assigned_to, assigned_by, due_date, user_name, user_role } = req.body;
  const db = readDB();

  const newTask = {
    id: "t_" + Date.now(),
    title,
    description,
    assigned_to,
    assigned_by,
    status: "PENDING",
    due_date,
    created_at: new Date().toISOString()
  };

  db.tasks.unshift(newTask);

  // Audit Log
  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name,
    role: user_role,
    action: `Mendelegasikan tugas baru kepada ${assigned_to}: ${title}`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString()
  });

  // Notify assigned role
  const assignedUser = db.users.find((u: any) => u.role === assigned_to);
  db.notifications.unshift({
    id: "n_" + Date.now(),
    user_id: assignedUser ? assignedUser.id : "all",
    title: "Delegasi Tugas Baru",
    message: `Anda ditugaskan oleh ${assigned_by}: "${title}". Batas waktu: ${due_date}`,
    is_read: false,
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json(newTask);
});

// Update Task Status
app.post("/api/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, user_name, user_role } = req.body;
  const db = readDB();
  const task = db.tasks.find((t: any) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  const oldStatus = task.status;
  task.status = status;

  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name,
    role: user_role,
    action: `Mengubah status tugas "${task.title}" dari ${oldStatus} menjadi ${status}`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.json(task);
});

// 9. Manage Perangkat Desa Status (Angkat / Berhentikan - Kades only)
app.post("/api/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, user_name, user_role } = req.body; // status: "AKTIF" or "NONAKTIF"
  const db = readDB();

  if (user_role !== "KADES") {
    return res.status(403).json({ error: "Hanya Kepala Desa yang berwenang mengelola status jabatan perangkat desa." });
  }

  const targetUser = db.users.find((u: any) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: "Jabatan/Pengguna tidak ditemukan." });
  }

  const oldStatus = targetUser.status;
  targetUser.status = status;

  db.auditLogs.unshift({
    id: "l_" + Date.now(),
    user_name,
    role: user_role,
    action: `${status === "AKTIF" ? "Mengaktifkan/Mengangkat kembali" : "Menonaktifkan/Memberhentikan sementara"} ${targetUser.name} (${targetUser.role})`,
    ip_address: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.json(targetUser);
});

// 10. Mark all notifications as read
app.post("/api/notifications/read-all", (req, res) => {
  const { user_id } = req.body;
  const db = readDB();
  db.notifications.forEach((n: any) => {
    if (n.user_id === user_id || n.user_id === "all") {
      n.is_read = true;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

// Vite Setup for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SINERGY DEV SERVER] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
