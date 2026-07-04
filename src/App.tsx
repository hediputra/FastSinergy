/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Layers, 
  FileText, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Download, 
  Printer, 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Archive, 
  LogOut, 
  KeyRound, 
  Bell, 
  UserMinus,
  RefreshCw,
  TrendingUp,
  Coins,
  History,
  Building2,
  FileCheck,
  Menu,
  X,
  Globe,
  Home,
  Info,
  BookOpen,
  MessageSquare,
  Landmark
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import LaravelDocs from "./components/LaravelDocs";
import { Role, User, ApprovalWorkflow, Document, Asset, Notification, AuditLog, Task } from "./types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Custom tooltip for budget comparison chart
const BudgetTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-left">
        <p className="text-xs font-extrabold text-slate-800 mb-1.5">{label}</p>
        <div className="space-y-1 text-[11px] font-semibold">
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Pagu Anggaran:
            </span>
            <span className="text-[#0b2b4a] font-bold">
              Rp{payload[0].value.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2a7faa]" />
              Realisasi Belanja:
            </span>
            <span className="text-[#0b2b4a] font-bold">
              Rp{payload[1].value.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-1 mt-1 text-xs">
            <span className="text-slate-700 font-bold">Persentase Capaian:</span>
            <span className="text-emerald-600 font-extrabold">
              {Math.round((payload[1].value / payload[0].value) * 100)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  // Budget comparison data for Recharts visualization
  const budgetComparisonData = [
    { name: "Pemerintahan", pagu: 750000000, realisasi: 420000000 },
    { name: "Infrastruktur", pagu: 950000000, realisasi: 450000000 },
    { name: "Pembinaan", pagu: 250000000, realisasi: 120000000 },
    { name: "Pemberdayaan", pagu: 300000000, realisasi: 110000000 },
    { name: "Kebencanaan", pagu: 150000000, realisasi: 50000000 }
  ];

  // Application states
  const [dbState, setDbState] = useState<{
    users: User[];
    workflows: ApprovalWorkflow[];
    documents: Document[];
    assets: Asset[];
    notifications: Notification[];
    tasks: Task[];
    auditLogs: AuditLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  // UI Navigation
  const [activeTab, setActiveTab] = useState<
    "portal" | "dashboard" | "workflows" | "dms" | "assets" | "reports" | "audits" | "rbac" | "docs"
  >("portal");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Public Citizen Portal States
  const [publicActiveSection, setPublicActiveSection] = useState<"home" | "surat" | "transparansi" | "aspirasi" | "aset" | "perdes">("home");
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [regSearch, setRegSearch] = useState("");
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [trackedDoc, setTrackedDoc] = useState<Document | null>(null);
  const [trackedWorkflow, setTrackedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [showPublicSuccessAlert, setShowPublicSuccessAlert] = useState(false);
  const [publicSubmitType, setPublicSubmitType] = useState<"LETTER" | "ASPIRASI" | null>(null);
  const [publicSubmitResultCode, setPublicSubmitResultCode] = useState("");
  const [publicLetterForm, setPublicLetterForm] = useState({
    name: "",
    nik: "",
    type: "Surat Keterangan Usaha (SKU)",
    purpose: "",
    notes: ""
  });
  const [publicAspirasiForm, setPublicAspirasiForm] = useState({
    name: "",
    category: "Infrastruktur",
    complaint: "",
    contact: ""
  });

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // DMS Form state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocData, setNewDocData] = useState({
    title: "",
    type: "SURAT_MASUK" as any,
    sender_or_receiver: "",
    reference_number: "",
    category: "",
    description: ""
  });

  // Asset Form state
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetData, setNewAssetData] = useState({
    name: "",
    code: "",
    category: "TANAH" as any,
    condition: "BAIK" as any,
    value: "",
    acquisition_date: "",
    location: "",
    managed_by: ""
  });

  // Workflow Form state
  const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
  const [newWorkflowData, setNewWorkflowData] = useState({
    title: "",
    type: "SPP" as any,
    description: "",
    amount: ""
  });

  // Task Delegation state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    assigned_to: "SEKDES" as any,
    due_date: ""
  });

  // Approval action comment state
  const [approvalComment, setApprovalComment] = useState("");

  // Report state
  const [selectedReport, setSelectedReport] = useState<
    "semester1" | "semester2" | "bupati" | "bpd" | "masyarakat"
  >("semester1");

  // Load backend state
  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("Gagal mengambil data dari server.");
      const data = await res.json();
      setDbState(data);
      
      // Keep or restore active user from data
      if (currentUser) {
        const updatedUser = data.users.find((u: User) => u.id === currentUser.id);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      } else {
        // Default login as KAUR_UMUM initially to show some stats without blocking 2FA immediately
        const kaurUmum = data.users.find((u: User) => u.role === "KAUR_UMUM");
        if (kaurUmum) {
          setCurrentUser(kaurUmum);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Koneksi ke backend server terputus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Handle Role Switch
  const handleRoleSwitch = async (role: Role) => {
    try {
      const res = await fetch("/api/auth/login-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
      
      // If Kades/Sekdes, prompt 2FA
      if (data.user.has2FA && !data.user.is2FAVerified) {
        setShow2FAModal(true);
        setOtpCode("");
        setOtpError("");
      } else {
        setShow2FAModal(false);
      }
      
      // Refresh state to record login in audit log
      const stateRes = await fetch("/api/state");
      const stateData = await stateRes.json();
      setDbState(stateData);
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat beralih peran.");
    }
  };

  // Verify 2FA OTP
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: currentUser.role, code: otpCode })
      });
      if (!res.ok) {
        const err = await res.json();
        setOtpError(err.error);
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
      setShow2FAModal(false);
      
      // Refresh state
      const stateRes = await fetch("/api/state");
      const stateData = await stateRes.json();
      setDbState(stateData);
    } catch (err) {
      setOtpError("Masalah koneksi server.");
    }
  };

  // Public Citizen Portal Handlers
  const handlePublicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchAttempted(true);
    setTrackedDoc(null);
    setTrackedWorkflow(null);
    
    if (!publicSearchQuery.trim() || !dbState) return;

    const query = publicSearchQuery.trim().toLowerCase();
    
    // 1. Try to find in documents
    const foundDoc = dbState.documents.find(
      d => d.reference_number.toLowerCase().includes(query) || d.title.toLowerCase().includes(query)
    );
    
    // 2. Try to find in workflows
    const foundWorkflow = dbState.workflows.find(
      w => w.id.toLowerCase().includes(query) || w.title.toLowerCase().includes(query)
    );

    if (foundDoc) {
      setTrackedDoc(foundDoc);
    } else if (foundWorkflow) {
      setTrackedWorkflow(foundWorkflow);
    }
  };

  const handlePublicLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicLetterForm.name || !publicLetterForm.nik || !publicLetterForm.purpose) {
      alert("Silakan lengkapi seluruh field wajib.");
      return;
    }

    if (publicLetterForm.nik.length < 16) {
      alert("NIK harus terdiri dari 16 digit angka.");
      return;
    }

    const refNum = `REQ-SURAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const requestData = {
      title: `${publicLetterForm.type} - ${publicLetterForm.name}`,
      type: "SURAT_MASUK",
      sender_or_receiver: publicLetterForm.name,
      reference_number: refNum,
      category: "Layanan Mandiri Warga",
      description: `NIK: ${publicLetterForm.nik} | Keperluan: ${publicLetterForm.purpose} | Keterangan: ${publicLetterForm.notes || "-"}`,
      user_name: publicLetterForm.name,
      user_role: "WARGA"
    };

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (!res.ok) {
        alert("Gagal mengirim permohonan. Coba beberapa saat lagi.");
        return;
      }

      setPublicSubmitType("LETTER");
      setPublicSubmitResultCode(refNum);
      setShowPublicSuccessAlert(true);
      
      // Reset form
      setPublicLetterForm({
        name: "",
        nik: "",
        type: "Surat Keterangan Usaha (SKU)",
        purpose: "",
        notes: ""
      });

      // Refresh states
      await fetchState();
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat mengirim permohonan.");
    }
  };

  const handlePublicAspirasiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicAspirasiForm.name || !publicAspirasiForm.complaint) {
      alert("Silakan lengkapi nama dan isi aspirasi.");
      return;
    }

    try {
      const res = await fetch("/api/aspirasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publicAspirasiForm)
      });

      if (!res.ok) {
        alert("Gagal mengirim aspirasi. Coba beberapa saat lagi.");
        return;
      }

      setPublicSubmitType("ASPIRASI");
      setShowPublicSuccessAlert(true);

      // Reset form
      setPublicAspirasiForm({
        name: "",
        category: "Infrastruktur",
        complaint: "",
        contact: ""
      });

      // Refresh states
      await fetchState();
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat mengirim aspirasi.");
    }
  };

  // Create new Approval workflow
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newWorkflowData.title,
          type: newWorkflowData.type,
          description: newWorkflowData.description,
          amount: newWorkflowData.amount ? Number(newWorkflowData.amount) : undefined,
          creator_id: currentUser.id,
          creator_name: currentUser.name,
          creator_role: currentUser.role
        })
      });
      if (!res.ok) throw new Error("Gagal membuat alur persetujuan.");
      setShowAddWorkflowModal(false);
      setNewWorkflowData({ title: "", type: "SPP", description: "", amount: "" });
      fetchState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Perform Step Approval/Rejection
  const handleWorkflowAction = async (workflowId: string, action: "APPROVE" | "REJECT") => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/workflows/${workflowId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: approvalComment,
          user_name: currentUser.name,
          user_role: currentUser.role
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui status persetujuan.");
        return;
      }
      setApprovalComment("");
      fetchState();
    } catch (err) {
      alert("Kesalahan koneksi ke server.");
    }
  };

  // Add Asset
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAssetData,
          user_name: currentUser.name,
          user_role: currentUser.role
        })
      });
      if (!res.ok) throw new Error("Gagal menambahkan aset.");
      setShowAddAssetModal(false);
      setNewAssetData({
        name: "",
        code: "",
        category: "TANAH",
        condition: "BAIK",
        value: "",
        acquisition_date: "",
        location: "",
        managed_by: ""
      });
      fetchState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add DMS Document
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDocData,
          user_name: currentUser.name,
          user_role: currentUser.role
        })
      });
      if (!res.ok) throw new Error("Gagal mengarsipkan dokumen.");
      setShowAddDocModal(false);
      setNewDocData({
        title: "",
        type: "SURAT_MASUK",
        sender_or_receiver: "",
        reference_number: "",
        category: "",
        description: ""
      });
      fetchState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete DMS Document
  const handleDeleteDoc = async (id: string) => {
    if (!currentUser) return;
    if (!confirm("Apakah Anda yakin ingin menghapus arsip dokumen ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/documents/${id}?user_name=${encodeURIComponent(currentUser.name)}&user_role=${currentUser.role}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Gagal menghapus dokumen.");
      fetchState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delegate Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskData.title,
          description: newTaskData.description,
          assigned_to: newTaskData.assigned_to,
          assigned_by: currentUser.name,
          due_date: newTaskData.due_date,
          user_name: currentUser.name,
          user_role: currentUser.role
        })
      });
      if (!res.ok) throw new Error("Gagal mendelegasikan tugas.");
      setShowAddTaskModal(false);
      setNewTaskData({ title: "", description: "", assigned_to: "SEKDES", due_date: "" });
      fetchState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, status: "PENDING" | "PROSES" | "SELESAI") => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          user_name: currentUser.name,
          user_role: currentUser.role
        })
      });
      if (!res.ok) throw new Error("Gagal memperbarui tugas.");
      fetchState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Change Perangkat Desa Active status (Kades only)
  const handleToggleUserStatus = async (userId: string, currentStatus: "AKTIF" | "NONAKTIF") => {
    if (!currentUser || currentUser.role !== "KADES") return;
    const nextStatus = currentStatus === "AKTIF" ? "NONAKTIF" : "AKTIF";
    const msg = nextStatus === "NONAKTIF" 
      ? "Apakah Anda yakin ingin menonaktifkan sementara Perangkat Desa ini? Mereka tidak akan dapat login atau mengakses sistem."
      : "Apakah Anda yakin ingin mengangkat/mengaktifkan kembali Perangkat Desa ini?";
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          user_name: currentUser.name,
          user_role: currentUser.role
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal mengubah status perangkat.");
        return;
      }
      fetchState();
    } catch (err) {
      alert("Gagal memperbarui status perangkat.");
    }
  };

  // Mark all notifications as read
  const handleMarkNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  // Mock Export CSV helper
  const handleExportCSV = (reportName: string, dataHeaders: string[], rows: any[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [dataHeaders.join(",")].concat(rows.map(e => e.map(val => `"${val}"`).join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  // Helper to get printable full text of role
  const getRoleLabel = (r: Role) => {
    switch (r) {
      case Role.KADES: return "Kepala Desa";
      case Role.SEKDES: return "Sekretaris Desa";
      case Role.KAUR_UMUM: return "Kaur Umum";
      case Role.KAUR_KEUANGAN: return "Kaur Keuangan";
      case Role.KAUR_PERENCANAAN: return "Kaur Perencanaan";
      case Role.KASI_PEMERINTAHAN: return "Kasi Pemerintahan";
      case Role.KASI_KESEJAHTERAAN: return "Kasi Kesejahteraan";
      case Role.KASI_PELAYANAN: return "Kasi Pelayanan";
      case Role.KADUS: return "Kepala Dusun";
      default: return r;
    }
  };

  if (error && !dbState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6" id="error-screen">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Gagal Memuat Sistem</h2>
          <p className="text-slate-600 text-sm mb-6">{error || "Terjadi kesalahan yang tidak terduga pada database."}</p>
          <button
            onClick={fetchState}
            className="w-full bg-[#0b2b4a] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#154673] transition-colors"
          >
            Coba Hubungkan Kembali
          </button>
        </div>
      </div>
    );
  }

  const { users, workflows, documents, assets, notifications, tasks, auditLogs } = dbState || {
    users: [],
    workflows: [],
    documents: [],
    assets: [],
    notifications: [],
    tasks: [],
    auditLogs: []
  };

  // Filter lists based on states
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.sender_or_receiver.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || doc.type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || asset.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalAssetsValue = assets.reduce((acc, curr) => acc + curr.value, 0);
  const activeWorkflowsCount = workflows.filter(w => w.status === "PENDING").length;
  const unreadNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    return !n.is_read && (n.user_id === currentUser.id || n.user_id === "all");
  });

  // Active tasks for current user role
  const myTasks = tasks.filter(t => currentUser && t.assigned_to === currentUser.role);

  // Workflows that require action from the current user role
  const pendingActionWorkflows = workflows.filter(w => {
    if (w.status !== "PENDING" || !currentUser) return false;
    const currentStep = w.steps[w.current_step_index];
    return currentStep && currentStep.role === currentUser.role && currentStep.status === "PENDING";
  });

  // Render high-fidelity animated skeleton screens for specific tabs
  const renderSkeletonContent = () => {
    if (activeTab === "dashboard") {
      return (
        <div className="space-y-6 animate-pulse" id="skeleton-dashboard">
          {/* Greeting & Tupoksi Banner Skeleton */}
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left space-y-2.5 flex-1">
              <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded-lg w-3/4"></div>
            </div>
            <div className="h-16 bg-slate-100/80 rounded-xl w-64 shrink-0"></div>
          </div>

          {/* 4 Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { color: "bg-sky-50 text-sky-200", icon: Coins },
              { color: "bg-emerald-50 text-emerald-200", icon: TrendingUp },
              { color: "bg-amber-50 text-amber-200", icon: Building2 },
              { color: "bg-orange-50 text-orange-200", icon: Clock }
            ].map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div key={idx} className="bg-white/75 backdrop-blur-md p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                  <div className="space-y-2 flex-1 mr-3">
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-6 bg-slate-300 rounded-lg w-2/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  </div>
                  <div className={`p-3.5 ${card.color} rounded-xl shrink-0`}>
                    <IconComponent className="h-6 w-6 opacity-40" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2 Column Split Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/75 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded-full w-12"></div>
              </div>
              <div className="p-6 space-y-4 divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-slate-200 rounded w-12"></div>
                          <div className="h-4.5 bg-slate-300 rounded w-1/2"></div>
                        </div>
                        <div className="h-3.5 bg-slate-100 rounded w-5/6"></div>
                      </div>
                      <div className="h-4 bg-slate-100 rounded w-28 shrink-0"></div>
                    </div>
                    <div className="h-12 bg-slate-50/50 rounded-xl border border-slate-100"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/75 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 flex flex-col">
              <div className="h-5 bg-slate-200 rounded w-1/2 pb-3 border-b border-slate-100"></div>
              <div className="space-y-4 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-4 w-4 bg-slate-200 rounded-full shrink-0 mt-0.5"></div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "dms") {
      return (
        <div className="space-y-6 animate-pulse" id="skeleton-dms">
          {/* Search bar and Filters skeleton */}
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="h-10 bg-slate-200 rounded-xl w-full md:w-72"></div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <div className="h-10 bg-slate-100 rounded-xl w-24"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-32"></div>
            </div>
          </div>

          {/* File/Document List table skeleton */}
          <div className="bg-white/75 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-100 rounded w-32"></div>
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 bg-slate-200 rounded-xl shrink-0 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-300 opacity-50" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-full w-24 hidden sm:block shrink-0"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-16 shrink-0"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "assets") {
      return (
        <div className="space-y-6 animate-pulse" id="skeleton-assets">
          {/* Top Asset stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/75 backdrop-blur-md p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-100 rounded w-24"></div>
                  <div className="h-6 bg-slate-200 rounded-lg w-1/2"></div>
                </div>
                <div className="h-11 w-11 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-slate-300 opacity-40" />
                </div>
              </div>
            ))}
          </div>

          {/* Action filter bar */}
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="h-10 bg-slate-200 rounded-xl w-full md:w-72"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-32 shrink-0"></div>
          </div>

          {/* Asset Grid Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/75 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3.5 bg-slate-150 rounded w-1/2"></div>
                  </div>
                  <div className="h-5.5 w-16 bg-slate-100 rounded-full shrink-0"></div>
                </div>
                <div className="h-24 bg-slate-50 rounded-xl border border-slate-100/50 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-slate-200 opacity-40 animate-pulse" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100/50">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-16 shrink-0"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default Fallback Skeleton for other views
    return (
      <div className="space-y-6 animate-pulse" id="skeleton-fallback">
        <div className="bg-white/75 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-3">
          <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
          <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
        </div>
        <div className="bg-white/75 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] font-sans text-slate-800 overflow-hidden relative">
      
      {/* 2FA MODAL */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="modal-2fa-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full relative"
              id="modal-2fa-body"
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-full mb-4">
                  <KeyRound className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Dua-Faktor Otentikasi (2FA)</h3>
                <p className="text-slate-500 text-xs px-2 mb-6">
                  Sesuai kebijakan PT Fas Technology Solutions, akses jabatan <span className="font-bold text-[#0b2b4a]">{getRoleLabel(currentUser?.role || Role.KADES)}</span> memerlukan verifikasi ganda.
                </p>

                {/* Simulated Authenticator Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white border border-slate-200 flex items-center justify-center rounded-lg shadow-inner mb-3">
                    {/* Simulated elegant QR */}
                    <div className="grid grid-cols-6 gap-0.5 p-2 bg-slate-100 rounded w-20 h-20">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 ${((i * 7) % 3 === 0 || (i * 5) % 2 === 0) ? "bg-[#0b2b4a]" : "bg-transparent"}`}></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">SINERGY-DESA ({currentUser?.email})</p>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <label className="block text-left text-xs font-bold text-slate-600 mb-1">Masukkan 6-Digit Kode OTP</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-[0.5em] text-lg font-bold py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a7faa]"
                      required
                      id="input-2fa-otp"
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-600 font-medium">{otpError}</p>
                  )}

                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-left mb-4">
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      💡 <strong>Petunjuk Simulasi:</strong> Masukkan kode default <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono font-bold">123456</code> untuk bypass validasi 2FA.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch(Role.KAUR_UMUM)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                    >
                      Verifikasi
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden no-print"
        />
      )}

      {/* ASIDE (SIDEBAR) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0b2b4a] z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col shadow-xl shrink-0 no-print`}>
        
        {/* Sidebar brand header */}
        <div className="p-6 border-b border-[#2a7faa]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeTab === "portal" ? (
                <>
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-sm">
                    🏛️
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-extrabold tracking-tight text-sm leading-none">SID SINERGI</span>
                    <span className="text-red-300 text-[9px] font-bold uppercase tracking-widest mt-1">Portal Resmi Desa</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-sm">
                    S
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-extrabold tracking-tight text-sm leading-none">KANTOR DESA</span>
                    <span className="text-orange-400 text-[9px] font-bold uppercase tracking-widest mt-1">Dashboard Peran</span>
                  </div>
                </>
              )}
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation menus */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {activeTab === "portal" ? (
            /* PUBLIC SID CHANNELS */
            <>
              <div className="px-4 py-2 text-[9px] font-bold text-sky-300 uppercase tracking-widest block mb-1">
                SISTEM INFORMASI DESA (SID)
              </div>
              {[
                { id: "home", label: "Beranda & Profil", icon: Home, desc: "UU No. 6/2014 Pasal 86" },
                { id: "surat", label: "Layanan Surat", icon: Mail, desc: "Permendagri 47/2016" },
                { id: "transparansi", label: "Transparansi APBDes", icon: Landmark, desc: "Permendagri 20/2018" },
                { id: "aset", label: "Aset Desa Terbuka", icon: Briefcase, desc: "Katalog Kekayaan Desa" },
                { id: "aspirasi", label: "Aspirasi & Pengaduan", icon: MessageSquare, desc: "Komunikasi Publik" },
                { id: "perdes", label: "Regulasi & Perdes", icon: BookOpen, desc: "Produk Hukum Desa" }
              ].map(tab => {
                const IconComponent = tab.icon;
                const isActive = publicActiveSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setPublicActiveSection(tab.id as any);
                      setShowPublicSuccessAlert(false);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex flex-col px-4 py-2.5 rounded-xl transition-all duration-150 text-left ${
                      isActive 
                        ? "bg-white text-[#0b2b4a] shadow-md font-bold" 
                        : "hover:bg-white/10 text-slate-300"
                    }`}
                    id={`btn-nav-public-${tab.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isActive ? "text-[#0b2b4a]" : "text-sky-300"}`} />
                      <span className="text-xs uppercase tracking-wider font-semibold">{tab.label}</span>
                    </div>
                    <span className={`text-[9px] block pl-7 ${isActive ? "text-[#0b2b4a]/75 font-medium" : "text-slate-400 font-normal"}`}>
                      {tab.desc}
                    </span>
                  </button>
                );
              })}
            </>
          ) : (
            /* INTERNAL OFFICE ADMIN CHANNELS */
            <>
              <div className="px-4 py-2 text-[9px] font-bold text-orange-400 uppercase tracking-widest block mb-1">
                KANTOR DESA DIGITAL (INTERNAL)
              </div>
              {[
                { id: "dashboard", label: "Dashboard Utama", icon: Layers },
                { id: "workflows", label: "Alur Persetujuan", icon: FileCheck, badge: pendingActionWorkflows.length },
                { id: "dms", label: "DMS & Persuratan", icon: FileText },
                { id: "assets", label: "Manajemen Aset", icon: Briefcase },
                { id: "reports", label: "Laporan Otomatis", icon: Download },
                { id: "rbac", label: "Perangkat Desa (RBAC)", icon: UserCheck },
                { id: "audits", label: "Audit Trail", icon: History },
                { id: "docs", label: "Tech-Portal & Docs", icon: Shield }
              ].map(tab => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-150 text-left ${
                      isActive 
                        ? "bg-[#2a7faa] text-white shadow-md font-bold" 
                        : "hover:bg-[#2a7faa]/20 text-slate-300 font-semibold"
                    }`}
                    id={`btn-nav-sidebar-${tab.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="text-xs uppercase tracking-wider">{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full inline-flex items-center justify-center shadow-sm">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* Sidebar footer swapper */}
        <div className="p-4 bg-[#081e35] border-t border-[#2a7faa]/10 space-y-3">
          {activeTab === "portal" ? (
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs tracking-wider transition-all shadow-md uppercase"
              id="btn-sidebar-login-admin"
            >
              <Shield className="h-4 w-4" />
              Portal Perangkat Desa 🔐
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab("portal");
                setPublicActiveSection("home");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-[#2a7faa] hover:from-blue-700 hover:to-blue-600 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs tracking-wider transition-all shadow-md uppercase"
              id="btn-sidebar-back-portal"
            >
              <Globe className="h-4 w-4" />
              Ke Portal Publik (SID) 🏛️
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Active SID
            </span>
            <span>v2.4.1</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER SECTION */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 no-print" id="main-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden"
              id="btn-hamburger"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col text-left">
              <h1 className="text-xs md:text-sm font-extrabold text-[#0b2b4a] uppercase tracking-wider">
                {activeTab === "portal" ? (
                  publicActiveSection === "home" ? "SID • Beranda & Pengumuman" :
                  publicActiveSection === "surat" ? "SID • Pelayanan Surat Online" :
                  publicActiveSection === "transparansi" ? "SID • Transparansi APBDes" :
                  publicActiveSection === "aset" ? "SID • Katalog Aset Terbuka" :
                  publicActiveSection === "aspirasi" ? "SID • Aspirasi & Pengaduan" :
                  "SID • Regulasi & Produk Hukum"
                ) : (
                  activeTab === "dashboard" ? "Dashboard Kerja Utama" :
                  activeTab === "workflows" ? "Alur Kerja Digital (Persetujuan)" :
                  activeTab === "dms" ? "DMS & Tata Kearsipan" :
                  activeTab === "assets" ? "Manajemen Inventaris Aset" :
                  activeTab === "reports" ? "Laporan Semesteran & LPJ" :
                  activeTab === "rbac" ? "Struktur Peran Perangkat (RBAC)" :
                  activeTab === "audits" ? "Jejak Audit Keamanan" :
                  "Tech-Portal & Dokumentasi"
                )}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold">
                {activeTab === "portal" ? (
                  "Sistem Informasi Desa Sinar Jaya • Sesuai Regulasi Kemendagri & UU Desa"
                ) : (
                  `Desa Sinar Jaya • Peran Aktif: ${getRoleLabel(currentUser?.role || Role.KADES)}`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Quick Simulation Role Swapper / Public Badge */}
            {activeTab !== "portal" ? (
              <div className="hidden md:flex items-center gap-3 bg-slate-50 p-1.5 border border-slate-200 rounded-2xl shadow-inner">
                <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-600">
                  <Shield className="h-3.5 w-3.5 text-[#2a7faa]" />
                  Role:
                </div>
                <select 
                  value={currentUser?.role || ""}
                  onChange={(e) => handleRoleSwitch(e.target.value as Role)}
                  className="bg-white border border-slate-200 rounded-lg text-xs font-semibold py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-slate-700"
                  id="select-role-switcher"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.role}>
                      {getRoleLabel(u.role)} ({u.name}) {u.status === "NONAKTIF" ? "❌ NONAKTIF" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-red-700 text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                🇮🇩 Portal Resmi SID (Kemendagri)
              </div>
            )}

            {/* Notification bell - Only show for internal officers */}
            {activeTab !== "portal" && (
              <div className="relative group">
                <button 
                  onClick={handleMarkNotificationsRead}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative"
                  title="Tandai semua notifikasi terbaca"
                  id="btn-bell"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {/* Notification hover dropdown */}
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-150 z-40">
                  <div className="flex justify-between items-center px-2 py-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Notifikasi</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 text-slate-500 rounded font-medium">{unreadNotifications.length} Baru</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1 space-y-1 mt-1">
                    {notifications.filter(n => !currentUser || n.user_id === currentUser.id || n.user_id === "all").length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">Tidak ada notifikasi baru</p>
                    ) : (
                      notifications
                        .filter(n => !currentUser || n.user_id === currentUser.id || n.user_id === "all")
                        .map(n => (
                          <div key={n.id} className={`p-2 rounded-lg text-left text-xs transition-colors ${n.is_read ? "bg-white" : "bg-sky-50/70"}`}>
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{n.title}</span>
                              <span className="text-[9px] text-slate-400 font-normal">{new Date(n.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Profile card / Public Action */}
            {activeTab === "portal" ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 text-[10px] font-extrabold rounded-full border border-sky-200">
                  <Globe className="h-3.5 w-3.5" />
                  Warga Publik
                </span>
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                  }}
                  className="bg-[#0b2b4a] hover:bg-[#12416f] text-white font-extrabold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Portal Perangkat
                </button>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-full object-cover border-2 border-[#2a7faa]" 
                />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
                    {currentUser.has2FA && currentUser.is2FAVerified && (
                      <span className="bg-emerald-50 text-emerald-700 p-0.5 rounded-full" title="Telah terverifikasi 2FA">
                        <CheckCircle2 className="h-3 w-3 fill-emerald-100" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] bg-orange-500 text-white px-1 py-0.5 rounded font-bold uppercase tracking-wider leading-none">
                      {currentUser.role}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{currentUser.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 animate-pulse">
                <div className="h-9 w-9 bg-slate-200 rounded-full"></div>
                <div className="text-left hidden sm:block space-y-1">
                  <div className="h-3.5 bg-slate-200 rounded w-20"></div>
                  <div className="h-2.5 bg-slate-100 rounded w-12"></div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Role Simulator bar */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between no-print shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulasi Jabatan:</span>
          <select 
            value={currentUser?.role || ""}
            onChange={(e) => handleRoleSwitch(e.target.value as Role)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-slate-700"
            id="select-role-switcher-mobile"
          >
            {users.map(u => (
              <option key={u.id} value={u.role}>
                {getRoleLabel(u.role)} ({u.name}) {u.status === "NONAKTIF" ? "❌ NONAKTIF" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* VERIFICATION WARNING (IF ACCOUNT NON-ACTIVE) */}
        {currentUser && currentUser.status === "NONAKTIF" && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-center text-xs font-bold text-rose-800 flex items-center justify-center gap-2 no-print shrink-0" id="non-active-bar">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Status Jabatan Anda dinonaktifkan sementara oleh Kepala Desa. Segala aktivitas tulis & persetujuan ditangguhkan.</span>
          </div>
        )}

        {/* MAIN WORKSPACE AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f0f2f5]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {loading ? (
                renderSkeletonContent()
              ) : (
                <>
            
            {/* ==================== PORTAL PUBLIK WARGA TAB ==================== */}
            {activeTab === "portal" && (
              <div className="space-y-6 text-left" id="portal-tab-content">
                {/* Portal Header Card */}
                <div className="bg-[#0b2b4a] text-white rounded-2xl shadow-lg overflow-hidden relative border border-slate-700/30">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-orange-500/15 pointer-events-none" />
                  <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="inline-flex items-center gap-2 bg-[#2a7faa]/30 border border-[#2a7faa]/40 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-sky-200">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        PORTAL RESMI SISTEM INFORMASI DESA (SID)
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Situs Resmi Pelayanan Mandiri & Transparansi Desa Sinar Jaya</h2>
                      <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
                        Diselenggarakan berdasarkan amanat <strong className="text-white">Undang-Undang Nomor 6 Tahun 2014 tentang Desa (Pasal 86)</strong> serta regulasi Kemendagri tentang keterbukaan informasi publik dan akuntabilitas keuangan desa.
                      </p>
                    </div>
                    {/* Switch role to admin helper indicator */}
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 shrink-0 text-left w-full md:w-auto max-w-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pintu Masuk Admin</span>
                      <p className="text-[11px] text-slate-300 mb-2 leading-normal">Bagi Perangkat Desa, gunakan tombol peran untuk masuk ke dashboard kerja internal.</p>
                      <button 
                        onClick={() => setActiveTab("dashboard")} 
                        className="w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Masuk Dashboard Kerja
                      </button>
                    </div>
                  </div>

                  {/* Sub navigation menus for Public Portal */}
                  <div className="bg-[#081e35] px-4 md:px-6 py-2.5 border-t border-slate-800 flex flex-wrap gap-2">
                    {[
                      { id: "home", label: "Beranda & Profil", icon: Home },
                      { id: "surat", label: "Layanan Surat", icon: Mail },
                      { id: "transparansi", label: "Transparansi APBDes", icon: Landmark },
                      { id: "aset", label: "Katalog Aset Publik", icon: Briefcase },
                      { id: "aspirasi", label: "Aspirasi & Pengaduan", icon: MessageSquare },
                      { id: "perdes", label: "Regulasi & Perdes", icon: BookOpen }
                    ].map(sec => {
                      const SecIcon = sec.icon;
                      const isSecActive = publicActiveSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => {
                            setPublicActiveSection(sec.id as any);
                            setShowPublicSuccessAlert(false);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isSecActive 
                              ? "bg-white text-[#0b2b4a] shadow-md font-bold" 
                              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                          }`}
                          id={`btn-portal-sec-${sec.id}`}
                        >
                          <SecIcon className="h-4 w-4" />
                          {sec.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Success Alert Banner for citizens submissions */}
                {showPublicSuccessAlert && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm"
                  >
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="text-base font-bold text-emerald-950">
                        {publicSubmitType === "LETTER" 
                          ? "Permohonan Surat Berhasil Dikirim! 🎉" 
                          : "Aspirasi Anda Berhasil Terkirim! 🕊️"
                        }
                      </h3>
                      <p className="text-emerald-800 text-xs leading-relaxed">
                        {publicSubmitType === "LETTER" 
                          ? `Berkas Anda telah terdaftar dan masuk antrean persuratan digital. Salin kode registrasi di bawah untuk memantau proses verifikasi secara berkala.`
                          : `Terima kasih atas partisipasi aktif Anda. Pengaduan/aspirasi Anda telah langsung terkirim ke sistem notifikasi Kepala Desa dan tercatat di Jejak Audit desa untuk menjamin akuntabilitas.`
                        }
                      </p>
                      
                      {publicSubmitType === "LETTER" && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 bg-white/80 p-3 rounded-xl border border-emerald-200">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Kode Pelacakan Dokumen</span>
                            <span className="text-sm font-mono font-bold text-[#0b2b4a]">{publicSubmitResultCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPublicSearchQuery(publicSubmitResultCode);
                              setPublicActiveSection("home");
                              // Trigger search simulation
                              setSearchAttempted(true);
                              const found = dbState?.documents.find(d => d.reference_number === publicSubmitResultCode);
                              if (found) setTrackedDoc(found);
                              setShowPublicSuccessAlert(false);
                            }}
                            className="bg-[#0b2b4a] hover:bg-[#12416f] text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 self-stretch sm:self-auto text-center justify-center"
                          >
                            <Search className="h-3.5 w-3.5" />
                            Lacak Sekarang
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowPublicSuccessAlert(false)} 
                      className="p-1 text-emerald-400 hover:text-emerald-600 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}

                {/* 1. SECTION: HOME / BERANDA */}
                {publicActiveSection === "home" && (
                  <div className="space-y-6">
                    {/* Search & Track Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                      <div className="text-left space-y-1">
                        <h3 className="text-base font-bold text-[#0b2b4a] flex items-center gap-2">
                          <Search className="h-5 w-5 text-orange-500" />
                          Sistem Pelacakan Dokumen & Surat Mandiri
                        </h3>
                        <p className="text-slate-500 text-xs">
                          Ketikkan kode registrasi pengajuan atau judul surat untuk melacak status verifikasi real-time oleh Sekretaris Desa & Kepala Desa.
                        </p>
                      </div>

                      <form onSubmit={handlePublicSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Contoh: REQ-SURAT-102543, SKU - Budi Santoso, atau SPP"
                            value={publicSearchQuery}
                            onChange={(e) => {
                              setPublicSearchQuery(e.target.value);
                              if (!e.target.value) {
                                setSearchAttempted(false);
                                setTrackedDoc(null);
                                setTrackedWorkflow(null);
                              }
                            }}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2a7faa] focus:border-transparent bg-slate-50/50 text-slate-800 text-sm font-semibold transition-all"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-[#0b2b4a] hover:bg-[#12416f] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          Cari Dokumen
                        </button>
                      </form>

                      {/* Search Results Visualizer (High Fidelity Tracker) */}
                      {searchAttempted && (
                        <div className="pt-4 border-t border-slate-100">
                          {trackedDoc ? (
                            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dokumen Ditemukan</span>
                                  <h4 className="text-sm font-bold text-[#0b2b4a]">{trackedDoc.title}</h4>
                                  <p className="text-xs text-slate-500">Nomor Registrasi: <span className="font-mono font-semibold text-slate-700">{trackedDoc.reference_number}</span></p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                  trackedDoc.type === "SURAT_MASUK" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                  <FileText className="h-3.5 w-3.5" />
                                  {trackedDoc.category === "Layanan Mandiri Warga" ? "Layanan Mandiri Warga" : `Arsip ${trackedDoc.type}`}
                                </span>
                              </div>

                              <div className="bg-white border border-slate-100 p-4 rounded-xl text-xs space-y-2">
                                <p className="text-slate-600"><strong className="text-slate-800">Nama Pengaju (Warga):</strong> {trackedDoc.sender_or_receiver}</p>
                                <p className="text-slate-600"><strong className="text-slate-800">Detail Keterangan:</strong> {trackedDoc.description}</p>
                                <p className="text-slate-600"><strong className="text-slate-800">Tanggal Pengajuan:</strong> {new Date(trackedDoc.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB</p>
                              </div>

                              {/* Document Progress Step Indicators */}
                              <div className="space-y-3">
                                <span className="text-[10px] font-bold text-[#0b2b4a] uppercase tracking-wider block">Alur Proses Pelayanan Mandiri</span>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative pt-2">
                                  {/* Step 1 */}
                                  <div className="flex items-center sm:flex-col items-start gap-3 sm:gap-2 text-left sm:text-center">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                                      ✓
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold text-slate-800 block">Diajukan</span>
                                      <span className="text-[10px] text-slate-400">Oleh Warga secara online</span>
                                    </div>
                                  </div>

                                  {/* Step 2 */}
                                  <div className="flex items-center sm:flex-col items-start gap-3 sm:gap-2 text-left sm:text-center">
                                    <div className="h-8 w-8 rounded-full bg-[#2a7faa] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                                      2
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold text-slate-800 block">Verifikasi Kelayakan</span>
                                      <span className="text-[10px] text-slate-500">Oleh KAUR Umum</span>
                                    </div>
                                  </div>

                                  {/* Step 3 */}
                                  <div className="flex items-center sm:flex-col items-start gap-3 sm:gap-2 text-left sm:text-center">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                                      3
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-slate-500 block">Pemberian Paraf</span>
                                      <span className="text-[10px] text-slate-400">Oleh Sekretaris Desa</span>
                                    </div>
                                  </div>

                                  {/* Step 4 */}
                                  <div className="flex items-center sm:flex-col items-start gap-3 sm:gap-2 text-left sm:text-center">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                                      4
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-slate-500 block">Persetujuan & TTE</span>
                                      <span className="text-[10px] text-slate-400">Oleh Kepala Desa</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5 mt-2">
                                  <Clock className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                                    <strong>Status Pelacakan:</strong> Dokumen Anda telah terdaftar dan masuk database kearsipan desa. Sedang berada di antrean pemeriksaan administrasi oleh KAUR Umum. Pastikan nomor HP Anda aktif jika diperlukan kelengkapan data fisik tambahan.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : trackedWorkflow ? (
                            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alur Kerja (Workflow) Ditemukan</span>
                                  <h4 className="text-sm font-bold text-[#0b2b4a]">{trackedWorkflow.title}</h4>
                                  <p className="text-xs text-slate-500">ID Pengajuan: <span className="font-mono font-semibold text-slate-700">{trackedWorkflow.id}</span></p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  trackedWorkflow.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                                  trackedWorkflow.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                                  "bg-amber-100 text-amber-800"
                                }`}>
                                  {trackedWorkflow.status === "APPROVED" ? "DISETUJUI PENUH" :
                                   trackedWorkflow.status === "REJECTED" ? "DITOLAK" :
                                   "PROSES VERIFIKASI"}
                                </span>
                              </div>

                              <div className="bg-white border border-slate-100 p-4 rounded-xl text-xs space-y-2">
                                <p className="text-slate-600"><strong className="text-slate-800">Diajukan Oleh:</strong> {trackedWorkflow.creator_name} ({getRoleLabel(trackedWorkflow.creator_role)})</p>
                                <p className="text-slate-600"><strong className="text-slate-800">Jenis Berkas:</strong> {trackedWorkflow.type}</p>
                                {trackedWorkflow.amount !== undefined && (
                                  <p className="text-slate-600"><strong className="text-slate-800">Nominal Anggaran:</strong> Rp{trackedWorkflow.amount.toLocaleString("id-ID")}</p>
                                )}
                                <p className="text-slate-600"><strong className="text-slate-800">Deskripsi/Kebutuhan:</strong> {trackedWorkflow.description}</p>
                              </div>

                              {/* Workflow Steps Details */}
                              <div className="space-y-3">
                                <span className="text-[10px] font-bold text-[#0b2b4a] uppercase tracking-wider block">Langkah Verifikasi Intern Perangkat Desa</span>
                                <div className="space-y-2.5">
                                  {trackedWorkflow.steps.map((step, idx) => (
                                    <div key={step.id} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                      <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                        step.status === "APPROVED" ? "bg-emerald-500 text-white" :
                                        step.status === "REJECTED" ? "bg-rose-500 text-white" :
                                        step.status === "VERIFIED" ? "bg-sky-500 text-white" :
                                        idx === trackedWorkflow.current_step_index && trackedWorkflow.status === "PENDING" ? "bg-amber-500 text-white animate-pulse" :
                                        "bg-slate-200 text-slate-500"
                                      }`}>
                                        {step.status === "APPROVED" ? "✓" : step.status === "REJECTED" ? "✗" : idx + 1}
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-slate-800">{getRoleLabel(step.role)}</span>
                                          <span className={`text-[10px] font-bold uppercase ${
                                            step.status === "APPROVED" ? "text-emerald-600" :
                                            step.status === "REJECTED" ? "text-rose-600" :
                                            step.status === "VERIFIED" ? "text-sky-600" :
                                            idx === trackedWorkflow.current_step_index && trackedWorkflow.status === "PENDING" ? "text-amber-600 font-semibold" :
                                            "text-slate-400"
                                          }`}>
                                            {step.status === "APPROVED" ? "Disetujui" :
                                             step.status === "REJECTED" ? "Ditolak" :
                                             step.status === "VERIFIED" ? "Terverifikasi" :
                                             idx === trackedWorkflow.current_step_index && trackedWorkflow.status === "PENDING" ? "Menunggu Tindakan" :
                                             "Belum Dimulai"}
                                          </span>
                                        </div>
                                        {step.user_name && (
                                          <p className="text-[10px] text-slate-500 mt-0.5">Penindak: {step.user_name}</p>
                                        )}
                                        {step.comment && (
                                          <div className="bg-slate-50 p-1.5 rounded text-[10px] text-slate-600 mt-1 italic border-l-2 border-[#2a7faa]/60">
                                            "{step.comment}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-center space-y-2">
                              <AlertTriangle className="h-6 w-6 text-rose-500 mx-auto" />
                              <h4 className="text-sm font-bold text-rose-950">Dokumen atau Registrasi Tidak Ditemukan</h4>
                              <p className="text-xs text-rose-800 max-w-md mx-auto">
                                Kami tidak dapat menemukan surat dengan kata kunci "{publicSearchQuery}". Periksa kembali ejaan, kode registrasi, atau pastikan surat tersebut sudah diarsipkan oleh Perangkat Desa.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { title: "Status Desa", value: "Mandiri (Sangat Baik)", color: "bg-[#0b2b4a] text-sky-200", icon: Shield, desc: "Peringkat tertinggi Kemendesa" },
                        { title: "Sinergi Kearsipan (DMS)", value: `${dbState?.documents.length || 0} Terarsip`, color: "bg-sky-50 text-sky-700", icon: FileText, desc: "Surat & dokumen digital desa" },
                        { title: "Realisasi APBDes", value: "92.4% Tercapai", color: "bg-emerald-50 text-emerald-700", icon: TrendingUp, desc: "Efisiensi pemanfaatan anggaran" },
                        { title: "Aset Desa Publik", value: `${dbState?.assets.length || 0} Item Terbuka`, color: "bg-amber-50 text-amber-700", icon: Briefcase, desc: "Transparansi inventaris publik" }
                      ].map((stat, idx) => {
                        const StatIcon = stat.icon;
                        return (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-5 flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{stat.title}</span>
                              <span className="text-base font-extrabold text-[#0b2b4a] block">{stat.value}</span>
                              <span className="text-[10px] text-slate-500 font-medium block">{stat.desc}</span>
                            </div>
                            <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                              <StatIcon className="h-5 w-5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Announcement & Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Announcements list */}
                      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                            <Bell className="h-4.5 w-4.5 text-orange-500" />
                            Papan Pengumuman Resmi Desa Sinergi
                          </h3>
                          <span className="text-[10px] bg-blue-50 text-[#2a7faa] font-bold px-2 py-0.5 rounded-full uppercase">Update Hari Ini</span>
                        </div>

                        <div className="space-y-4 divide-y divide-slate-100">
                          {[
                            {
                              title: "Pendaftaran Bantuan Pangan Non-Tunai (BPNT) Mandiri Dibuka",
                              date: "03 Juli 2026",
                              cat: "BANSOS",
                              content: "Pemerintah Desa Sinergi menyosialisasikan pembukaan berkas kelayakan bagi warga yang berhak menerima BPNT. Syarat dokumen: KTP, KK asli, dan Surat Keterangan Tidak Mampu (SKTM). Pengajuan fisik dilayani di Balai Desa pukul 08:00 - 14:00 WIB."
                            },
                            {
                              title: "Penyusunan Rencana Kerja Pemerintah Desa (RKPDes) Tahun Anggaran 2027",
                              date: "28 Juni 2026",
                              cat: "MUSRENBANG",
                              content: "Seluruh elemen masyarakat, ketua RT/RW, dan perwakilan BPD diundang menghadiri musyawarah penentuan prioritas pembangunan fisik dan ekonomi desa di Balai Pertemuan Utama pada Rabu malam depan."
                            },
                            {
                              title: "Pemberitahuan Pembayaran Pajak Bumi dan Bangunan (PBB-P2) Sektor Pedesaan",
                              date: "15 Juni 2026",
                              cat: "PAJAK",
                              content: "Batas akhir penyetoran Surat Pemberitahuan Pajak Terutang (SPPT) PBB tahun berjalan adalah akhir Agustus. Warga dapat melakukan penyetoran langsung ke bendahara desa di loket pelayanan umum kantor desa."
                            }
                          ].map((ann, i) => (
                            <div key={i} className="pt-4 first:pt-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">{ann.cat}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{ann.date}</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-800 hover:text-[#2a7faa] cursor-pointer transition-colors leading-snug">{ann.title}</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed text-justify">{ann.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Village Profile Stats */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h3 className="text-base font-extrabold text-[#0b2b4a] pb-3 border-b border-slate-100 flex items-center gap-2">
                            <Info className="h-4.5 w-4.5 text-blue-500" />
                            Sekilas Profil Wilayah Sinergi
                          </h3>
                          <div className="space-y-3.5">
                            {[
                              { label: "Kecamatan / Kabupaten", value: "Baturraden / Banyumas" },
                              { label: "Total Luas Wilayah", value: "284,5 Hektar" },
                              { label: "Jumlah Penduduk Aktif", value: "4.821 Jiwa" },
                              { label: "Jumlah Kepala Keluarga", value: "1.245 KK" },
                              { label: "Batas Utara Desa", value: "Gunung Slamet / Hutan Negara" },
                              { label: "Mayoritas Mata Pencaharian", value: "Pertanian & Ekowisata" }
                            ].map((prof, i) => (
                              <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5">
                                <span className="text-slate-500 font-semibold">{prof.label}</span>
                                <span className="text-slate-800 font-bold">{prof.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#0b2b4a] to-blue-900 text-white p-4 rounded-xl space-y-1.5 text-center mt-4">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 block">Sertifikat Resmi</span>
                          <p className="text-xs font-bold leading-snug">Desa Berprestasi Nasional Mandiri 2026</p>
                          <p className="text-[10px] text-slate-300">Peringkat #2 Indeks Desa Membangun (IDM)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SECTION: ONLINE SERVICES FORM */}
                {publicActiveSection === "surat" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="text-left space-y-1 border-b border-slate-100 pb-4">
                      <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                        <Mail className="h-5 w-5 text-orange-500" />
                        Pengajuan Surat Online Mandiri (E-Service)
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Silakan lengkapi formulir pendaftaran di bawah ini secara cermat. Setelah terkirim, berkas akan otomatis masuk ke dalam sistem kearsipan desa dan Anda akan menerima kode registrasi pelacakan berkas.
                      </p>
                    </div>

                    <form onSubmit={handlePublicLetterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 block">Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="Ketikkan nama lengkap Anda..."
                          value={publicLetterForm.name}
                          onChange={(e) => setPublicLetterForm({ ...publicLetterForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 block">Nomor Induk Kependudukan (NIK) 16 Digit <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="Contoh: 330219xxxxxxxxxx"
                          value={publicLetterForm.nik}
                          onChange={(e) => setPublicLetterForm({ ...publicLetterForm, nik: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 block">Jenis Surat Permohonan <span className="text-rose-500">*</span></label>
                        <select
                          value={publicLetterForm.type}
                          onChange={(e) => setPublicLetterForm({ ...publicLetterForm, type: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold text-slate-700 bg-white"
                        >
                          <option value="Surat Keterangan Usaha (SKU)">Surat Keterangan Usaha (SKU)</option>
                          <option value="Surat Keterangan Tidak Mampu (SKTM)">Surat Keterangan Tidak Mampu (SKTM)</option>
                          <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
                          <option value="Surat Pengantar KTP">Surat Pengantar KTP / KK Baru</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 block">Keperluan Pengajuan Surat <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Syarat pengajuan kredit KUR BRI / pendaftaran beasiswa anak"
                          value={publicLetterForm.purpose}
                          onChange={(e) => setPublicLetterForm({ ...publicLetterForm, purpose: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 block">Keterangan Tambahan / Catatan Khusus (Opsional)</label>
                        <textarea
                          rows={3}
                          placeholder="Tambahkan catatan khusus, nomor HP aktif yang bisa dihubungi, atau kelengkapan data pendukung jika ada..."
                          value={publicLetterForm.notes}
                          onChange={(e) => setPublicLetterForm({ ...publicLetterForm, notes: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setPublicLetterForm({
                            name: "",
                            nik: "",
                            type: "Surat Keterangan Usaha (SKU)",
                            purpose: "",
                            notes: ""
                          })}
                          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Reset Form
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-[#0b2b4a] hover:bg-[#12416f] text-white font-bold text-xs transition-colors shadow-md flex items-center gap-1.5"
                        >
                          <Send className="h-4 w-4" />
                          Kirim Pengajuan Surat
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 3. SECTION: BUDGET TRANSPARENCY (APBDes) */}
                {publicActiveSection === "transparansi" && (
                  <div className="space-y-6">
                    {/* Visual Charts of APBDes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                      <div className="text-left space-y-1 border-b border-slate-100 pb-3">
                        <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                          <Landmark className="h-5 w-5 text-orange-500" />
                          APBDes 2026: Transparansi Anggaran & Belanja Desa
                        </h3>
                        <p className="text-slate-500 text-xs">
                          Masyarakat berhak tahu pemanfaatan kas anggaran desa. Berikut adalah visualisasi alokasi pendapatan dan belanja tahun anggaran berjalan.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Revenues Card */}
                        <div className="space-y-4 text-left">
                          <div className="flex justify-between items-center bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                            <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">Total Pendapatan Desa</span>
                            <span className="text-sm font-extrabold text-sky-800">Rp 1.650.000.000</span>
                          </div>

                          <div className="space-y-3 pt-2">
                            {[
                              { label: "Dana Desa (Pemerintah Pusat)", amount: 980000000, percentage: 60, color: "bg-sky-500" },
                              { label: "Alokasi Dana Desa (Kabupaten)", amount: 420000000, percentage: 25, color: "bg-[#2a7faa]" },
                              { label: "Pendapatan Asli Desa (PADes)", amount: 250000000, percentage: 15, color: "bg-orange-500" }
                            ].map((rev, i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-700 font-bold">{rev.label}</span>
                                  <span className="text-[#0b2b4a] font-extrabold">Rp{rev.amount.toLocaleString("id-ID")} ({rev.percentage}%)</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${rev.color} rounded-full`} style={{ width: `${rev.percentage}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Expenditures Card */}
                        <div className="space-y-4 text-left">
                          <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Total Belanja Desa</span>
                            <span className="text-sm font-extrabold text-emerald-800">Rp 1.580.000.000</span>
                          </div>

                          <div className="space-y-3 pt-2">
                            {[
                              { label: "Penyelenggaraan Pemerintahan Desa", amount: 580000000, percentage: 37, color: "bg-[#0b2b4a]" },
                              { label: "Pembangunan Fisik & Infrastruktur Desa", amount: 650000000, percentage: 41, color: "bg-emerald-500" },
                              { label: "Pemberdayaan & Pembinaan Masyarakat", amount: 220000000, percentage: 14, color: "bg-amber-500" },
                              { label: "Penanggulangan Bencana / Darurat", amount: 130000000, percentage: 8, color: "bg-rose-500" }
                            ].map((exp, i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-700 font-bold">{exp.label}</span>
                                  <span className="text-[#0b2b4a] font-extrabold">Rp{exp.amount.toLocaleString("id-ID")} ({exp.percentage}%)</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${exp.color} rounded-full`} style={{ width: `${exp.percentage}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Transparency Quote Banner */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 text-left">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-[#0b2b4a]">Sesuai UU No. 6 Tahun 2014 Tentang Desa</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                            Pemerintah Desa Sinergi berkomitmen menyajikan transparansi penuh atas realisasi keuangan desa. Laporan pertanggungjawaban di atas dikoordinasikan oleh Kepala Urusan Keuangan dan diparaf sah oleh Sekretaris Desa serta disetujui Kepala Desa secara berkala setiap semester.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SECTION: PUBLIC ASSETS */}
                {publicActiveSection === "aset" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                      <div className="text-left space-y-1 border-b border-slate-100 pb-4">
                        <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-orange-500" />
                          Daftar Inventaris & Aset Publik Desa Sinergi
                        </h3>
                        <p className="text-slate-500 text-xs">
                          Data inventarisasi kekayaan fisik milik desa yang dikelola secara terbuka demi pemanfaatan hajat hidup masyarakat banyak.
                        </p>
                      </div>

                      {/* Assets Cards Grid synchronized with dbState.assets */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {dbState?.assets.map((asset) => (
                          <div key={asset.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-3 text-left hover:shadow-xs transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-bold text-[#0b2b4a] line-clamp-1">{asset.name}</h4>
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  asset.condition === "BAIK" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  asset.condition === "RUSAK_RINGAN" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                  "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  {asset.condition === "BAIK" ? "BAIK" : asset.condition === "RUSAK_RINGAN" ? "RUSAK RINGAN" : "RUSAK BERAT"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">Kode Inventaris: <span className="font-mono font-semibold">{asset.code}</span></p>
                              
                              <div className="bg-white border border-slate-100 p-3 rounded-lg text-[11px] space-y-1.5">
                                <p className="text-slate-600"><strong>Kategori:</strong> {asset.category}</p>
                                <p className="text-slate-600"><strong>Lokasi:</strong> {asset.location}</p>
                                <p className="text-slate-600"><strong>Penanggung Jawab:</strong> {asset.managed_by}</p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center mt-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nilai Aset</span>
                              <span className="text-xs font-extrabold text-[#0b2b4a]">Rp{asset.value.toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SECTION: CITIZEN ASPIRATIONS & COMPLAINTS FORM */}
                {publicActiveSection === "aspirasi" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="text-left space-y-1 border-b border-slate-100 pb-4">
                      <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-orange-500" />
                        Kotak Aspirasi & Layanan Pengaduan Masyarakat
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Sampaikan kritik konstruktif, pengaduan infrastruktur, sosial, atau aspirasi pembangunan demi kemajuan Sinergi. Setiap pesan akan masuk langsung ke antrean audit dan notifikasi Kepala Desa.
                      </p>
                    </div>

                    <form onSubmit={handlePublicAspirasiSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-700 block">Nama Lengkap Pengadu <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="Ketik nama Anda..."
                            value={publicAspirasiForm.name}
                            onChange={(e) => setPublicAspirasiForm({ ...publicAspirasiForm, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-700 block">Kategori Laporan / Aspirasi <span className="text-rose-500">*</span></label>
                          <select
                            value={publicAspirasiForm.category}
                            onChange={(e) => setPublicAspirasiForm({ ...publicAspirasiForm, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold text-slate-700 bg-white"
                          >
                            <option value="Infrastruktur">Infrastruktur & Jalanan</option>
                            <option value="Kesehatan & Sanitasi">Kesehatan & Sanitasi</option>
                            <option value="Bantuan Sosial">Bantuan Sosial / Sembako</option>
                            <option value="Keamanan & Ketertiban">Keamanan & Ketertiban Desa</option>
                            <option value="Lain-lain">Kategori Lainnya</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-700 block">Kontak WA / Telepon Aktif (Opsional)</label>
                          <input
                            type="text"
                            placeholder="Contoh: 0812xxxxxxxx"
                            value={publicAspirasiForm.contact}
                            onChange={(e) => setPublicAspirasiForm({ ...publicAspirasiForm, contact: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 block">Isi Aspirasi / Deskripsi Masalah <span className="text-rose-500">*</span></label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Jelaskan secara mendetail laporan Anda (Sebutkan lokasi kejadian, usulan perbaikan, dll)..."
                          value={publicAspirasiForm.complaint}
                          onChange={(e) => setPublicAspirasiForm({ ...publicAspirasiForm, complaint: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] text-xs font-semibold"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setPublicAspirasiForm({
                            name: "",
                            category: "Infrastruktur",
                            complaint: "",
                            contact: ""
                          })}
                          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Reset Form
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-[#0b2b4a] hover:bg-[#12416f] text-white font-bold text-xs transition-colors shadow-md flex items-center gap-1.5"
                        >
                          <Send className="h-4 w-4" />
                          Kirim Pengaduan / Aspirasi
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 6. SECTION: PUBLIC REGULATIONS (PERDES) */}
                {publicActiveSection === "perdes" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="text-left space-y-1 border-b border-slate-100 pb-4">
                      <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-orange-500" />
                        Lembaran Desa & Regulasi Resmi Sinar Jaya
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Sesuai dengan ketentuan <strong className="text-slate-800">Undang-Undang Republik Indonesia Nomor 6 Tahun 2014 tentang Desa (Pasal 86)</strong> dan <strong className="text-slate-800">Permendagri Nomor 20 Tahun 2018 tentang Keuangan Desa</strong>, Pemerintah Desa wajib menyediakan akses terbuka terhadap Peraturan Desa (Perdes), Peraturan Kepala Desa (Perkades), serta Keputusan Kepala Desa yang telah disahkan bersama Badan Permusyawaratan Desa (BPD).
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Search regulations */}
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari regulasi atau peraturan desa (contoh: APBDes, RKPDes, BLT, Aset)..."
                            value={regSearch}
                            onChange={(e) => setRegSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                            id="search-regulations-input"
                          />
                        </div>
                        {regSearch && (
                          <button
                            onClick={() => setRegSearch("")}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Regulations Table / Card list */}
                      <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-inner animate-fade-in">
                        <table className="w-full text-xs text-left text-slate-600">
                          <thead className="bg-[#0b2b4a] text-white font-extrabold uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="p-4">Jenis & Nomor</th>
                              <th className="p-4">Judul Produk Hukum</th>
                              <th className="p-4">Tanggal Pengesahan</th>
                              <th className="p-4">Dasar Hukum Acuan</th>
                              <th className="p-4">Lembaran Negara/Desa</th>
                              <th className="p-4 text-center">Tindakan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold bg-white">
                            {[
                              {
                                type: "PERATURAN DESA",
                                number: "Perdes No. 01 Tahun 2026",
                                title: "Anggaran Pendapatan dan Belanja Desa (APBDes) Sinar Jaya Tahun Anggaran 2026",
                                date: "31 Desember 2025",
                                basis: "Pasal 8 UU No. 6/2014 & Permendagri No. 20/2018 tentang Keuangan Desa",
                                code: "LD-2026-001",
                                menimbang: "Bahwa untuk melaksanakan ketentuan Pasal 30 Perda Kabupaten tentang Keuangan Desa, perlu menetapkan Perdes tentang APBDes Sinar Jaya Tahun Anggaran 2026.",
                                mengingat: "Undang-Undang Nomor 6 Tahun 2014 tentang Desa; Peraturan Pemerintah Nomor 43 Tahun 2014 tentang Peraturan Pelaksanaan UU Desa; Permendagri Nomor 20 Tahun 2018 tentang Keuangan Desa.",
                                menetapkan: "Menyetujui Anggaran Pendapatan sebesar Rp1.620.000.000 dan Belanja sebesar Rp1.580.000.000 untuk pembangunan jalan pedesaan, irigasi, dan jaring pengaman sosial warga."
                              },
                              {
                                type: "PERATURAN DESA",
                                number: "Perdes No. 03 Tahun 2025",
                                title: "Rencana Kerja Pemerintah Desa (RKPDes) Sinar Jaya Tahun Anggaran 2026",
                                date: "15 September 2025",
                                basis: "Permendagri No. 114 Tahun 2014 tentang Pedoman Pembangunan Desa",
                                code: "LD-2025-003",
                                menimbang: "Bahwa untuk menjamin kesinambungan arah pembangunan desa tahunan, Pemerintah Desa menyusun Rencana Kerja Pemerintah Desa sebagai penjabaran RPJMDes.",
                                mengingat: "Undang-Undang Nomor 6 Tahun 2014 tentang Desa; Permendagri Nomor 114 Tahun 2014 tentang Pedoman Pembangunan Desa.",
                                menetapkan: "Prioritas pembangunan fisik tahun berjalan difokuskan pada pengaspalan jalan dusun, pembangunan posyandu terpadu, dan digitalisasi sistem administrasi desa."
                              },
                              {
                                type: "PERATURAN KEPALA DESA",
                                number: "Perkades No. 02 Tahun 2026",
                                title: "Rincian Teknis Penyaluran Bantuan Langsung Tunai (BLT) Desa Sinar Jaya 2026",
                                date: "12 Januari 2026",
                                basis: "Peraturan Menteri Keuangan No. 201/PMK.07/2022 tentang Pengelolaan Dana Desa",
                                code: "LKD-2026-002",
                                menimbang: "Bahwa dalam rangka meringankan beban ekonomi keluarga miskin ekstrim, perlu disalurkan Bantuan Langsung Tunai bersumber dari Dana Desa tahun anggaran berjalan.",
                                mengingat: "Undang-Undang Nomor 6 Tahun 2014 tentang Desa; Peraturan Menteri Keuangan terkait pengelolaan Dana Desa tahun anggaran 2026.",
                                menetapkan: "Penyaluran BLT diberikan kepada 45 Keluarga Penerima Manfaat (KPM) sebesar Rp300.000/bulan terhitung sejak Januari hingga Desember 2026."
                              },
                              {
                                type: "PERATURAN DESA",
                                number: "Perdes No. 04 Tahun 2024",
                                title: "Tata Cara Pengelolaan & Inventarisasi Aset Milik Desa Sinar Jaya",
                                date: "05 November 2024",
                                basis: "Permendagri No. 1 Tahun 2016 tentang Pengelolaan Aset Desa",
                                code: "LD-2024-004",
                                menimbang: "Bahwa untuk mengamankan kekayaan desa dan mendayagunakan aset pedesaan demi kemakmuran warga, perlu diatur tata cara sertifikasi dan sewa guna aset.",
                                mengingat: "Undang-Undang Nomor 6 Tahun 2014 tentang Desa; Permendagri Nomor 1 Tahun 2016 tentang Pengelolaan Aset Desa.",
                                menetapkan: "Seluruh aset tanah, bangunan kantor, mobil siaga, dan traktor tani wajib dicatatkan dalam sistem inventarisasi digital desa dan dilarang dipindah tangankan tanpa persetujuan BPD."
                              }
                            ]
                              .filter(reg => 
                                reg.number.toLowerCase().includes(regSearch.toLowerCase()) ||
                                reg.title.toLowerCase().includes(regSearch.toLowerCase()) ||
                                reg.basis.toLowerCase().includes(regSearch.toLowerCase())
                              )
                              .map((reg, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-[#2a7faa] font-extrabold uppercase tracking-wider">{reg.type}</span>
                                      <span className="font-bold text-[#0b2b4a] mt-0.5">{reg.number}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 max-w-xs">
                                    <p className="font-bold text-slate-800 leading-relaxed text-xs">{reg.title}</p>
                                  </td>
                                  <td className="p-4 text-slate-500 whitespace-nowrap">{reg.date}</td>
                                  <td className="p-4 text-slate-500 max-w-xs leading-normal">{reg.basis}</td>
                                  <td className="p-4 whitespace-nowrap">
                                    <span className="bg-sky-50 text-sky-800 px-2 py-1 rounded border border-sky-200 font-mono text-[10px] font-bold">
                                      {reg.code}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center whitespace-nowrap">
                                    <button
                                      onClick={() => setSelectedReg(reg)}
                                      className="bg-slate-100 hover:bg-[#2a7faa] hover:text-white text-[#0b2b4a] font-bold py-1.5 px-3.5 rounded-lg text-[11px] transition-all inline-flex items-center gap-1 shadow-xs"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      Lihat Salinan
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Certification seal */}
                      <div className="bg-[#f0f2f5] rounded-xl p-5 border border-slate-200 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[#0b2b4a] flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-red-600" />
                            Legalitas Hukum & Tanda Tangan Elektronik (TTE)
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Semua dokumen hukum yang tertera pada lembaran desa ini diproses dan disimpan menggunakan standar persuratan digital nasional yang mengacu pada <strong className="text-slate-700">UU ITE No. 11 Tahun 2008</strong> serta bersertifikasi elektronik sah dari BSrE.
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-extrabold text-slate-700 tracking-wider">BSrE VERIFIED TTE</span>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE REGULATION DETAIL MODAL */}
                    {selectedReg && (
                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col text-left"
                        >
                          {/* Modal Header */}
                          <div className="p-6 bg-[#0b2b4a] text-white rounded-t-3xl flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">{selectedReg.type}</span>
                              <h3 className="text-base font-extrabold tracking-tight mt-1">{selectedReg.number}</h3>
                              <p className="text-slate-300 text-xs font-semibold leading-relaxed mt-1">{selectedReg.title}</p>
                            </div>
                            <button
                              onClick={() => setSelectedReg(null)}
                              className="text-slate-400 hover:text-white p-1 bg-white/10 rounded-full transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Modal Content - Preamble Layout */}
                          <div className="p-8 space-y-6 overflow-y-auto text-xs leading-relaxed text-slate-800 font-serif">
                            <div className="text-center font-bold tracking-wider text-slate-900 font-sans space-y-1">
                              <p className="uppercase text-sm">BUPATI BANYUMAS</p>
                              <p className="uppercase text-sm">PERATURAN DESA SINAR JAYA</p>
                              <p className="uppercase text-sm">{selectedReg.number}</p>
                              <p className="uppercase text-xs pt-1">TENTANG</p>
                              <p className="uppercase text-xs font-extrabold text-[#0b2b4a] font-sans max-w-md mx-auto">{selectedReg.title}</p>
                              <div className="h-0.5 bg-slate-300 w-24 mx-auto my-4" />
                            </div>

                            <div className="space-y-4 font-sans text-xs">
                              <div className="flex gap-4">
                                <span className="font-bold w-20 shrink-0 uppercase">MENIMBANG :</span>
                                <p className="text-justify">{selectedReg.menimbang}</p>
                              </div>

                              <div className="flex gap-4">
                                <span className="font-bold w-20 shrink-0 uppercase">MENGINGAT :</span>
                                <p className="text-justify">{selectedReg.mengingat}</p>
                              </div>

                              <div className="h-px bg-slate-100 my-4" />

                              <div className="flex gap-4 text-slate-950 font-bold">
                                <span className="w-20 shrink-0 uppercase">MEMUTUSKAN :</span>
                                <span className="uppercase">MENETAPKAN PERATURAN DESA TENTANG {selectedReg.title.toUpperCase()}</span>
                              </div>

                              <div className="flex gap-4">
                                <span className="font-bold w-20 shrink-0 uppercase">PASAL SATU :</span>
                                <p className="text-justify">{selectedReg.menetapkan}</p>
                              </div>
                            </div>

                            {/* Digital Sign-off Section */}
                            <div className="pt-6 border-t border-slate-100 font-sans flex justify-between items-end gap-6">
                              <div className="text-[10px] text-slate-500 space-y-1 leading-normal max-w-xs">
                                <p><strong>Lembaran Desa No:</strong> {selectedReg.code}</p>
                                <p><strong>Dicatatkan Oleh:</strong> Sekretaris Desa Sinar Jaya</p>
                                <p className="text-[#2a7faa] font-semibold flex items-center gap-1 mt-1">
                                  <Shield className="h-3.5 w-3.5" />
                                  Tanda Tangan Elektronik (TTE) Sah
                                </p>
                              </div>

                              <div className="text-center p-3 border border-slate-200 rounded-2xl bg-slate-50 flex items-center gap-3 w-48 shrink-0 shadow-inner">
                                <div className="p-1.5 bg-white border border-slate-200 rounded-lg shrink-0">
                                  {/* Minimalist QR Code simulation */}
                                  <div className="w-10 h-10 bg-slate-900 flex flex-wrap p-0.5 gap-0.5">
                                    <div className="w-4 h-4 bg-white" />
                                    <div className="w-4 h-4 bg-slate-900" />
                                    <div className="w-4 h-4 bg-slate-900" />
                                    <div className="w-4 h-4 bg-white" />
                                  </div>
                                </div>
                                <div className="text-[9px] text-left leading-snug">
                                  <p className="font-extrabold text-slate-800">KADES SINAR JAYA</p>
                                  <p className="text-slate-400 font-bold">SUWARDI, S.IP</p>
                                  <span className="text-emerald-600 font-extrabold tracking-widest text-[8px] uppercase block">TERVERIFIKASI</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="p-4 bg-slate-50 rounded-b-3xl border-t border-slate-200 flex justify-end gap-2 font-sans">
                            <button
                              onClick={() => setSelectedReg(null)}
                              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                            >
                              Tutup Pratinjau
                            </button>
                            <button
                              onClick={() => {
                                alert(`Mengunduh dokumen PDF sah dari Lembaran Desa ${selectedReg.code}.`);
                              }}
                              className="px-4 py-2 rounded-xl bg-[#0b2b4a] hover:bg-[#12416f] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Unduh Dokumen PDF
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==================== DASHBOARD TAB ==================== */}
            {activeTab === "dashboard" && (
              <div className="space-y-6" id="dashboard-tab-content">
                {/* Greeting & Tupoksi Banner */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-left space-y-1">
                    <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Selamat Datang di Ruang Kerja Digital Anda</h2>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                      Sistem mengonfigurasi wewenang Anda berdasarkan Tupoksi resmi sebagai <strong className="text-slate-800 font-bold">{getRoleLabel(currentUser?.role || Role.KADES)}</strong>. Kelola tugas, telusuri laporan, dan tindak lanjuti alur kerja secara berintegritas.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-left max-w-sm">
                    <p className="text-[11px] text-blue-900 leading-relaxed font-semibold">
                      📌 <strong>Tupoksi Anda:</strong> {
                        currentUser?.role === Role.KADES ? "Mengambil kebijakan tertinggi, menetapkan Perdes & APBDes, mengangkat & memberhentikan perangkat, dan mengesahkan laporan pertanggungjawaban." :
                        currentUser?.role === Role.SEKDES ? "Mengkoordinasikan administrasi umum, kearsipan (DMS), menyusun RAPBDes/RPJMDes, memverifikasi SPP/SPJ, dan menyiapkan laporan semesteran." :
                        currentUser?.role === Role.KAUR_UMUM ? "Mengelola naskah dinas, penatausahaan surat menyurat (DMS), pengelolaan inventaris aset desa, penyediaan sarpras kantor, dan pelayanan umum." :
                        currentUser?.role === Role.KAUR_KEUANGAN ? "Penyusunan & pengendalian APBDes, verifikasi kelayakan bukti kas penerimaan/pengeluaran, verifikasi kesesuaian nominal SPP & SPJ bendahara." :
                        currentUser?.role === Role.KAUR_PERENCANAAN ? "Mengkoordinasikan perencanaan desa (RPJMDes, RKPDes), inventarisasi data pembangunan, menyusun draf program RAPBDes, dan memonitor program kerja." :
                        currentUser?.role === Role.KASI_PEMERINTAHAN ? "Tata praja pemerintahan desa, rancangan regulasi, pertanahan, ketertiban umum, pembinaan kependudukan, serta pengelolaan profil desa." :
                        currentUser?.role === Role.KASI_KESEJAHTERAAN ? "Sosialisasi bidang sosial budaya, ekonomi, pembinaan pemuda, Karang Taruna, olahraga, motivasi gotong royong, dan pemberdayaan keluarga." :
                        currentUser?.role === Role.KASI_PELAYANAN ? "Penyuluhan hak/kewajiban warga, pelayanan nikah/rujuk, pencatatan kelahiran/kematian, pembinaan sarpras pendidikan, kesehatan, dan keagamaan." :
                        "Pembinaan ketentraman wilayah dusun, perlindungan masyarakat, pengawasan pembangunan, mobilitas warga, serta pelaporan berkala program kerja wilayah."
                      }
                    </p>
                  </div>
                </div>

                {/* Dashboard Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">Pagu Anggaran APBDes</p>
                      <h3 className="text-xl font-extrabold text-[#0b2b4a] mt-1">Rp2,400,000,000</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Target Anggaran Pendapatan & Belanja</p>
                    </div>
                    <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
                      <Coins className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">Realisasi Belanja</p>
                      <h3 className="text-xl font-extrabold text-emerald-600 mt-1">Rp1,150,000,000</h3>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="font-bold text-emerald-600">47.9% Terbantu</span>
                      </div>
                    </div>
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">Aset Inventaris Desa</p>
                      <h3 className="text-xl font-extrabold text-[#0b2b4a] mt-1">Rp{totalAssetsValue.toLocaleString("id-ID")}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Total {assets.length} item aset bersertifikat</p>
                    </div>
                    <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                      <Building2 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">Alur Tertunda</p>
                      <h3 className="text-xl font-extrabold text-orange-600 mt-1">{activeWorkflowsCount} Berkas</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Sertifikat persetujuan belum final</p>
                    </div>
                    <div className="p-3.5 bg-orange-50 text-orange-600 rounded-xl">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Grafik Realisasi vs Pagu Anggaran APBDes */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left space-y-5" id="budget-chart-section">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[#0b2b4a] flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        Laporan Grafik Realisasi vs Pagu Anggaran APBDes 2026
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Perbandingan serapan dana program desa secara transparan per bidang pelayanan dan pembangunan infrastruktur.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Rata-rata Penyerapan: 47.9%</span>
                    </div>
                  </div>

                  {/* Recharts Bar Chart Container */}
                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={budgetComparisonData}
                        margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={(value) => `Rp${value / 1000000}Jt`}
                          tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <Tooltip content={<BudgetTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                        <Legend 
                          verticalAlign="top" 
                          height={40} 
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}
                        />
                        <Bar 
                          name="Pagu Anggaran" 
                          dataKey="pagu" 
                          fill="#cbd5e1" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={45}
                        />
                        <Bar 
                          name="Realisasi Belanja" 
                          dataKey="realisasi" 
                          fill="#2a7faa" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Program Cards Grid underneath the Chart */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
                    {budgetComparisonData.map((item, idx) => {
                      const pct = Math.round((item.realisasi / item.pagu) * 100);
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-200 transition-all">
                          <span className="text-[11px] text-slate-500 font-extrabold tracking-tight uppercase line-clamp-1">{item.name}</span>
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-extrabold text-[#0b2b4a]">{pct}%</span>
                              <span className="text-[9px] text-slate-400 font-bold">Serapan</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-[#2a7faa]" : "bg-amber-500"
                                }`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                          <div className="mt-3 text-[10px] space-y-0.5 border-t border-slate-100 pt-2 font-mono">
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>Pagu:</span>
                              <span className="text-slate-600">{(item.pagu / 1000000)}Jt</span>
                            </div>
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>Real:</span>
                              <span className="text-emerald-600 font-bold">{(item.realisasi / 1000000)}Jt</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Action Workflow Tasks Box (Requiring Immediate Action) */}
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-[#2a7faa]" />
                        <h3 className="text-sm font-bold text-slate-800">Dokumen Membutuhkan Persetujuan Anda</h3>
                      </div>
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                        {pendingActionWorkflows.length} Menunggu
                      </span>
                    </div>

                    <div className="p-6 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[360px]">
                      {pendingActionWorkflows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                          <CheckCircle2 className="h-10 w-10 text-slate-300" />
                          <p className="text-xs font-semibold">Bagus! Semua dokumen pengajuan wewenang Anda telah tuntas disetujui.</p>
                        </div>
                      ) : (
                        pendingActionWorkflows.map(w => (
                          <div key={w.id} className="py-4 first:pt-0 last:pb-0 text-left space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold uppercase mr-2">
                                  {w.type}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 inline-block">{w.title}</h4>
                                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{w.description}</p>
                                {w.amount && (
                                  <p className="text-xs font-semibold text-[#0b2b4a] mt-1.5">
                                    Nilai Pengajuan: <span className="text-orange-600 font-bold">Rp{w.amount.toLocaleString("id-ID")}</span>
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono italic shrink-0">
                                Diajukan oleh: {w.creator_name} ({w.creator_role})
                              </span>
                            </div>

                            {/* Direct Quick Approve form */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                              <input 
                                type="text" 
                                placeholder="Tuliskan catatan/komentar persetujuan..." 
                                value={approvalComment}
                                onChange={(e) => setApprovalComment(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                                id={`input-comment-${w.id}`}
                              />
                              <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => handleWorkflowAction(w.id, "REJECT")}
                                  disabled={currentUser?.status === "NONAKTIF"}
                                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                  id={`btn-reject-${w.id}`}
                                >
                                  Tolak
                                </button>
                                <button
                                  onClick={() => handleWorkflowAction(w.id, "APPROVE")}
                                  disabled={currentUser?.status === "NONAKTIF"}
                                  className="px-4 py-2 bg-[#0b2b4a] text-white hover:bg-[#154673] rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                  id={`btn-approve-${w.id}`}
                                >
                                  Setujui & Teruskan
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Task Manager (Tugas Saya) & Task Delegation */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#2a7faa]" />
                        <h3 className="text-sm font-bold text-slate-800">Tugas & Instruksi Jabatan</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {currentUser?.role === Role.KADES && (
                          <button
                            onClick={() => setShowAddTaskModal(true)}
                            className="bg-[#0b2b4a] hover:bg-[#154673] text-white p-1 rounded-lg transition-colors"
                            title="Delegasikan Tugas Baru"
                            id="btn-add-task-trigger"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                        <span className="text-[10px] bg-[#2a7faa]/10 text-[#2a7faa] px-2 py-0.5 rounded-full font-bold">
                          {myTasks.length} Aktif
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[360px]">
                      {myTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-1.5 text-center">
                          <CheckCircle2 className="h-9 w-9 text-slate-300" />
                          <p className="text-xs font-semibold">Tidak ada tugas dinas aktif.</p>
                          <p className="text-[10px] text-slate-400">Hubungi Kades atau Sekdes untuk pendelegasian baru.</p>
                        </div>
                      ) : (
                        myTasks.map(task => (
                          <div key={task.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 text-left space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                task.status === "SELESAI" ? "bg-emerald-100 text-emerald-800" :
                                task.status === "PROSES" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] leading-relaxed">{task.description}</p>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                              <span>Batas: <strong className="text-slate-600 font-bold">{task.due_date}</strong></span>
                              <div className="flex gap-1.5">
                                {task.status !== "PROSES" && task.status !== "SELESAI" && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task.id, "PROSES")}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-semibold text-[9px] transition-colors"
                                    id={`btn-task-process-${task.id}`}
                                  >
                                    Mulai Kerja
                                  </button>
                                )}
                                {task.status !== "SELESAI" && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task.id, "SELESAI")}
                                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[9px] transition-colors"
                                    id={`btn-task-done-${task.id}`}
                                  >
                                    Selesai
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ==================== WORKFLOWS (ALUR PERSETUJUAN) TAB ==================== */}
            {activeTab === "workflows" && (
              <div className="space-y-6" id="workflows-tab-content">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Manajemen Alur Kerja Digital (Approval Workflow)</h2>
                      <p className="text-slate-500 text-xs">Penyusunan pengajuan terstruktur: SPP, SPJ, Perjalanan Dinas, Peraturan Desa, dan draf APBDes.</p>
                    </div>
                    <button
                      onClick={() => setShowAddWorkflowModal(true)}
                      disabled={currentUser?.status === "NONAKTIF"}
                      className="inline-flex items-center gap-1.5 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2 px-4 rounded-xl text-xs font-semibold transition-colors shadow-sm self-start disabled:opacity-50"
                      id="btn-add-workflow-trigger"
                    >
                      <Plus className="h-4 w-4" />
                      Buat Pengajuan Baru
                    </button>
                  </div>
                </div>

                {/* Grid Lists of All Workflows */}
                <div className="space-y-4">
                  {workflows.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                      Tidak ada alur kerja yang terdaftar.
                    </div>
                  ) : (
                    workflows.map(w => {
                      const isActiveStepRole = currentUser && w.steps[w.current_step_index]?.role === currentUser.role && w.status === "PENDING";
                      return (
                        <div key={w.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-left">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#0b2b4a] text-white font-bold px-2 py-0.5 rounded uppercase">
                                  {w.type}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900">{w.title}</h3>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Pengaju: <strong className="text-slate-600 font-bold">{w.creator_name} ({w.creator_role})</strong> • ID: {w.id} • Dibuat: {new Date(w.created_at).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {w.amount && (
                                <span className="text-xs font-extrabold text-[#0b2b4a]">
                                  Rp{w.amount.toLocaleString("id-ID")}
                                </span>
                              )}
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                w.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                                w.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {w.status === "APPROVED" ? "Disetujui Penuh" : w.status === "REJECTED" ? "Ditolak" : "Berjalan"}
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            <p className="text-slate-600 text-xs mb-6 max-w-4xl">{w.description}</p>
                            
                            {/* Visual Timeline of Steps */}
                            <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-4">Langkah Verifikasi Berantai (Sinergy Chain)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                              {w.steps.map((step, idx) => {
                                const isCurrent = w.current_step_index === idx && w.status === "PENDING";
                                const isDone = step.status === "APPROVED";
                                const isFailed = step.status === "REJECTED";
                                
                                return (
                                  <div key={step.id} className={`p-4 rounded-xl border transition-all ${
                                    isCurrent ? "bg-amber-50/50 border-amber-300 shadow-sm" :
                                    isDone ? "bg-emerald-50/20 border-slate-200" :
                                    isFailed ? "bg-rose-50/40 border-rose-300" : "bg-slate-50 border-slate-100"
                                  }`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Langkah {idx + 1}</span>
                                      {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50" />}
                                      {isFailed && <XCircle className="h-4 w-4 text-rose-600 fill-rose-50" />}
                                      {isCurrent && <Clock className="h-4 w-4 text-amber-600 animate-pulse" />}
                                    </div>
                                    
                                    <div className="mt-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                                      {getRoleLabel(step.role)}
                                    </div>

                                    {step.user_name && (
                                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Verifikator: {step.user_name}</p>
                                    )}

                                    <div className="mt-2 text-[10px]">
                                      {step.status === "APPROVED" ? (
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Berhasil Diverifikasi</span>
                                      ) : step.status === "REJECTED" ? (
                                        <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">Ditolak</span>
                                      ) : isCurrent ? (
                                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Sedang Berlangsung</span>
                                      ) : (
                                        <span className="text-slate-400 font-medium">Antrean</span>
                                      )}
                                    </div>

                                    {step.comment && (
                                      <p className="text-[11px] text-slate-500 mt-2 bg-white/70 p-1.5 rounded border border-slate-100 italic leading-normal">
                                        "{step.comment}"
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Inline Approval Action for other views */}
                            {isActiveStepRole && (
                              <div className="bg-amber-50/30 border border-amber-200 rounded-xl p-4 mt-6 text-left">
                                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                  Perhatian: Tindakan Diperlukan
                                </h4>
                                <p className="text-[11px] text-slate-600 mb-3">
                                  Dokumen pengajuan di atas saat ini menunggu pemeriksaan oleh Anda sebagai <strong className="text-slate-900 font-bold">{getRoleLabel(currentUser.role)}</strong>. Silakan periksa berkas lalu berikan keputusan persetujuan.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                  <input 
                                    type="text" 
                                    placeholder="Tulis alasan jika menolak, atau catatan jika setuju..." 
                                    value={approvalComment}
                                    onChange={(e) => setApprovalComment(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                                    id={`input-tab-comment-${w.id}`}
                                  />
                                  <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                                    <button
                                      onClick={() => handleWorkflowAction(w.id, "REJECT")}
                                      disabled={currentUser?.status === "NONAKTIF"}
                                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                      id={`btn-tab-reject-${w.id}`}
                                    >
                                      Tolak
                                    </button>
                                    <button
                                      onClick={() => handleWorkflowAction(w.id, "APPROVE")}
                                      disabled={currentUser?.status === "NONAKTIF"}
                                      className="px-5 py-2 bg-[#0b2b4a] text-white hover:bg-[#154673] rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                      id={`btn-tab-approve-${w.id}`}
                                    >
                                      Setujui & Teruskan
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ==================== DMS (DOCUMENT MANAGEMENT SYSTEM) TAB ==================== */}
            {activeTab === "dms" && (
              <div className="space-y-6" id="dms-tab-content">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Document Management System (DMS)</h2>
                    <p className="text-slate-500 text-xs">Arsip terpusat untuk Surat Masuk, Surat Keluar, Arsip Kegiatan, dan Buku Ekspedisi Desa.</p>
                  </div>
                  <button
                    onClick={() => setShowAddDocModal(true)}
                    disabled={currentUser?.status === "NONAKTIF"}
                    className="inline-flex items-center gap-1.5 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2 px-4 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    id="btn-add-doc-trigger"
                  >
                    <Plus className="h-4 w-4" />
                    Arsip Dokumen Baru
                  </button>
                </div>

                {/* Filters Row */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {[
                      { id: "ALL", label: "Semua Arsip" },
                      { id: "SURAT_MASUK", label: "Surat Masuk" },
                      { id: "SURAT_KELUAR", label: "Surat Keluar" },
                      { id: "ARSIP", label: "Arsip Kegiatan" },
                      { id: "EKSPEDISI", label: "Ekspedisi" }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => setFilterCategory(btn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          filterCategory === btn.id 
                            ? "bg-[#2a7faa] text-white" 
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                        id={`btn-filter-dms-${btn.id}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Search box */}
                  <div className="relative w-full md:w-72">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari perihal atau No. Surat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      id="input-search-dms"
                    />
                  </div>
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Nama Dokumen & Kategori</th>
                          <th className="py-3 px-4">Jenis</th>
                          <th className="py-3 px-4">Instansi Asal/Tujuan</th>
                          <th className="py-3 px-4">Nomor Surat</th>
                          <th className="py-3 px-4">Tanggal Arsip</th>
                          <th className="py-3 px-4">Diarsipkan Oleh</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredDocs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              Tidak ada dokumen arsip yang cocok.
                            </td>
                          </tr>
                        ) : (
                          filteredDocs.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800">{doc.title}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{doc.category}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  doc.type === "SURAT_MASUK" ? "bg-blue-100 text-blue-800" :
                                  doc.type === "SURAT_KELUAR" ? "bg-purple-100 text-purple-800" :
                                  doc.type === "ARSIP" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
                                }`}>
                                  {doc.type.replace("_", " ")}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-700">{doc.sender_or_receiver}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{doc.reference_number}</td>
                              <td className="py-3.5 px-4 text-slate-500">{new Date(doc.created_at).toLocaleDateString("id-ID")}</td>
                              <td className="py-3.5 px-4 text-slate-500">{doc.uploaded_by}</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  disabled={currentUser?.status === "NONAKTIF"}
                                  className="text-rose-600 hover:text-rose-800 font-bold disabled:opacity-50"
                                  title="Hapus Dokumen"
                                  id={`btn-delete-doc-${doc.id}`}
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ASSETS TAB ==================== */}
            {activeTab === "assets" && (
              <div className="space-y-6" id="assets-tab-content">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Manajemen Aset & Inventaris Desa</h2>
                    <p className="text-slate-500 text-xs">Pencatatan aset milik desa (Tanah, Bangunan, Kendaraan, dan Peralatan Kantor) secara transparan.</p>
                  </div>
                  <button
                    onClick={() => setShowAddAssetModal(true)}
                    disabled={currentUser?.status === "NONAKTIF"}
                    className="inline-flex items-center gap-1.5 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2 px-4 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    id="btn-add-asset-trigger"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Registrasi Aset
                  </button>
                </div>

                {/* Search & Categories */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {[
                      { id: "ALL", label: "Semua Kategori" },
                      { id: "TANAH", label: "Tanah" },
                      { id: "BANGUNAN", label: "Bangunan" },
                      { id: "KENDARAAN", label: "Kendaraan" },
                      { id: "PERALATAN", label: "Peralatan" }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => setFilterCategory(btn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          filterCategory === btn.id 
                            ? "bg-[#2a7faa] text-white" 
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                        id={`btn-filter-asset-${btn.id}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari nama atau kode aset..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      id="input-search-asset"
                    />
                  </div>
                </div>

                {/* Assets Grid Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Nama Aset</th>
                          <th className="py-3 px-4">Kode Register</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Kondisi</th>
                          <th className="py-3 px-4">Estimasi Nilai</th>
                          <th className="py-3 px-4">Tanggal Akuisisi</th>
                          <th className="py-3 px-4">Lokasi Fisik</th>
                          <th className="py-3 px-4">Penanggung Jawab</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredAssets.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              Tidak ada data aset inventaris.
                            </td>
                          </tr>
                        ) : (
                          filteredAssets.map(asset => (
                            <tr key={asset.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-[#0b2b4a]">{asset.name}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{asset.code}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">{asset.category}</td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  asset.condition === "BAIK" ? "bg-emerald-100 text-emerald-800" :
                                  asset.condition === "RUSAK_RINGAN" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                }`}>
                                  {asset.condition.replace("_", " ")}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">
                                Rp{asset.value.toLocaleString("id-ID")}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">{new Date(asset.acquisition_date).toLocaleDateString("id-ID")}</td>
                              <td className="py-3.5 px-4 text-slate-500 font-medium">{asset.location}</td>
                              <td className="py-3.5 px-4 text-slate-500">{asset.managed_by}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== REPORTS (LAPORAN) TAB ==================== */}
            {activeTab === "reports" && (
              <div className="space-y-6" id="reports-tab-content">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Pusat Laporan Otomatis APBDes & Pemerintahan</h2>
                    <p className="text-slate-500 text-xs">Pilih format pertanggungjawaban di bawah ini untuk mengompilasi laporan dan mengekspor ke format PDF/Excel secara instan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Select Report Column */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 h-fit text-left">
                    <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase px-2 mb-3">Jenis Laporan</h3>
                    {[
                      { id: "semester1", label: "Laporan Semester I APBDes" },
                      { id: "semester2", label: "Laporan Semester II APBDes" },
                      { id: "bupati", label: "Laporan Akhir Tahun ke Bupati" },
                      { id: "bpd", label: "Laporan Kinerja ke BPD" },
                      { id: "masyarakat", label: "Keterangan Publik Masyarakat" }
                    ].map(rep => (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedReport(rep.id as any)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          selectedReport === rep.id 
                            ? "bg-[#0b2b4a] text-white" 
                            : "bg-transparent text-slate-600 hover:bg-slate-50"
                        }`}
                        id={`btn-report-${rep.id}`}
                      >
                        <FileText className="h-4 w-4" />
                        {rep.label}
                      </button>
                    ))}
                  </div>

                  {/* Report View Column */}
                  <div className="lg:col-span-3 space-y-4">
                    
                    {/* Header Action bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
                      <span className="text-xs font-bold text-slate-500">Format Preview Dokumen Resmi</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExportCSV(selectedReport, ["Kode Rekening", "Kategori Program", "Pagu Anggaran (IDR)", "Realisasi Belanja (IDR)", "Persentase (%)"], [
                            ["4.1.00", "Pendapatan Asli Desa", "150000000", "125000000", "83.3%"],
                            ["4.2.00", "Dana Desa (Transfer APBN)", "1200000000", "750000000", "62.5%"],
                            ["4.3.00", "Alokasi Dana Desa (ADD)", "950000000", "450000000", "47.3%"],
                            ["5.1.00", "Penyelenggaraan Pemerintahan", "850000000", "420000000", "49.4%"],
                            ["5.2.00", "Pelaksanaan Pembangunan", "1100000000", "550000000", "50.0%"],
                            ["5.3.00", "Pembinaan Kemasyarakatan", "250000000", "110000000", "44.0%"]
                          ])}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 py-2 px-4 rounded-xl text-xs font-bold transition-colors"
                          id="btn-export-excel"
                        >
                          <Download className="h-4 w-4" />
                          Unduh format Excel
                        </button>
                        <button
                          onClick={handlePrint}
                          className="inline-flex items-center gap-1.5 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2 px-4 rounded-xl text-xs font-bold transition-colors shadow-sm"
                          id="btn-export-pdf"
                        >
                          <Printer className="h-4 w-4" />
                          Cetak Laporan (PDF)
                        </button>
                      </div>
                    </div>

                    {/* Highly Realistic Printable Document Sheet */}
                    <div className="bg-white rounded-2xl border border-slate-300 p-8 md:p-12 shadow-sm text-left font-serif space-y-6 relative" id="official-report-sheet">
                      
                      {/* Kop Surat Garuda */}
                      <div className="flex flex-col items-center justify-center border-b-4 border-double border-slate-800 pb-4 text-center space-y-1">
                        <h1 className="text-sm font-bold uppercase tracking-widest text-slate-900 font-sans">Pemerintah Kabupaten Sinergy</h1>
                        <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-900 font-sans">Kecamatan Pancoran • Pemerintah Desa Sinergy</h2>
                        <p className="text-[10px] text-slate-500 font-mono font-sans italic">Sekretariat: Jl. Raya Sinergy No. 1, Desa Sinergy, Kab. Sinergy, POS 12760</p>
                      </div>

                      {/* Title */}
                      <div className="text-center space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-wider underline">
                          {selectedReport === "semester1" && "Laporan Realisasi Anggaran APBDes (Semester I)"}
                          {selectedReport === "semester2" && "Laporan Realisasi Anggaran APBDes (Semester II)"}
                          {selectedReport === "bupati" && "Laporan Penyelenggaraan Pemerintahan Desa Akhir Tahun Kepada Bupati"}
                          {selectedReport === "bpd" && "Laporan Keterangan Penyelenggaraan Pemerintahan (LKPPD) kepada BPD"}
                          {selectedReport === "masyarakat" && "Laporan Informasi Penyelenggaraan Pemerintahan Desa Kepada Masyarakat"}
                        </h3>
                        <p className="text-xs text-slate-500 font-sans">Nomor: 141 / {Math.floor(Math.random() * 200 + 50)} / LPR-Srg / {new Date().getFullYear()}</p>
                      </div>

                      {/* Opening Statement */}
                      <p className="text-xs leading-relaxed indent-8">
                        Dengan memanjatkan puji syukur kehadirat Tuhan Yang Maha Esa, Pemerintah Desa Sinergy bersama Badan Permusyawaratan Desa (BPD) dengan ini mengompilasi dan mempublikasikan data pertanggungjawaban realisasi APBDes Desa Sinergy, Kecamatan Pancoran untuk periode tahun berjalan secara akuntabel, transparan, dan berlandaskan asas keterbukaan informasi publik.
                      </p>

                      {/* Financial Summary Table */}
                      <div className="space-y-2 font-sans">
                        <h4 className="text-xs font-bold text-slate-800">I. Rincian Realisasi Pendapatan & Belanja Desa Sinergy</h4>
                        <div className="border border-slate-300 rounded-xl overflow-hidden">
                          <table className="w-full text-[11px] text-left">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-700">
                                <th className="py-2.5 px-3">Kode</th>
                                <th className="py-2.5 px-3">Uraian Klasifikasi Anggaran</th>
                                <th className="py-2.5 px-3 text-right">Pagu Target (IDR)</th>
                                <th className="py-2.5 px-3 text-right">Realisasi (IDR)</th>
                                <th className="py-2.5 px-3 text-right">Sisa / Lebih (IDR)</th>
                                <th className="py-2.5 px-3 text-right">%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              <tr>
                                <td className="py-2 px-3 font-mono">4.1.00</td>
                                <td className="py-2 px-3 font-bold">Pendapatan Asli Desa (PADes)</td>
                                <td className="py-2 px-3 text-right">150,000,000</td>
                                <td className="py-2 px-3 text-right text-emerald-700">125,000,000</td>
                                <td className="py-2 px-3 text-right">25,000,000</td>
                                <td className="py-2 px-3 text-right font-bold">83.3%</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 font-mono">4.2.00</td>
                                <td className="py-2 px-3 font-bold">Dana Desa (Transfer APBN)</td>
                                <td className="py-2 px-3 text-right">1,200,000,000</td>
                                <td className="py-2 px-3 text-right text-emerald-700">750,000,000</td>
                                <td className="py-2 px-3 text-right">450,000,000</td>
                                <td className="py-2 px-3 text-right font-bold">62.5%</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 font-mono">4.3.00</td>
                                <td className="py-2 px-3 font-bold">Alokasi Dana Desa (ADD)</td>
                                <td className="py-2 px-3 text-right">950,000,000</td>
                                <td className="py-2 px-3 text-right text-emerald-700">450,000,000</td>
                                <td className="py-2 px-3 text-right">500,000,000</td>
                                <td className="py-2 px-3 text-right font-bold">47.3%</td>
                              </tr>
                              <tr className="bg-slate-50 font-bold border-t border-slate-300">
                                <td className="py-2 px-3"></td>
                                <td className="py-2 px-3">TOTAL PENDAPATAN</td>
                                <td className="py-2 px-3 text-right">2,400,000,000</td>
                                <td className="py-2 px-3 text-right">1,325,000,000</td>
                                <td className="py-2 px-3 text-right">1,075,000,000</td>
                                <td className="py-2 px-3 text-right">55.2%</td>
                              </tr>
                              <tr className="border-t border-slate-300">
                                <td className="py-2 px-3 font-mono">5.1.00</td>
                                <td className="py-2 px-3 font-bold">Penyelenggaraan Pemerintahan Desa</td>
                                <td className="py-2 px-3 text-right">850,000,000</td>
                                <td className="py-2 px-3 text-right text-orange-700">420,000,000</td>
                                <td className="py-2 px-3 text-right">430,000,000</td>
                                <td className="py-2 px-3 text-right font-bold">49.4%</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 font-mono">5.2.00</td>
                                <td className="py-2 px-3 font-bold">Pembangunan Prasarana Fisik Desa</td>
                                <td className="py-2 px-3 text-right">1,100,000,000</td>
                                <td className="py-2 px-3 text-right text-orange-700">550,000,000</td>
                                <td className="py-2 px-3 text-right">550,000,000</td>
                                <td className="py-2 px-3 text-right font-bold">50.0%</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 font-mono">5.3.00</td>
                                <td className="py-2 px-3 font-bold">Pembinaan & Pemberdayaan Masyarakat</td>
                                <td className="py-2 px-3 text-right">450,000,000</td>
                                <td className="py-2 px-3 text-right text-orange-700">180,000,000</td>
                                <td className="py-2 px-3 text-right">270,000,000</td>
                                <td className="py-2 px-3 text-right font-bold">40.0%</td>
                              </tr>
                              <tr className="bg-slate-50 font-bold border-t border-slate-300">
                                <td className="py-2 px-3"></td>
                                <td className="py-2 px-3">TOTAL BELANJA</td>
                                <td className="py-2 px-3 text-right">2,400,000,000</td>
                                <td className="py-2 px-3 text-right">1,150,000,000</td>
                                <td className="py-2 px-3 text-right">1,250,000,000</td>
                                <td className="py-2 px-3 text-right">47.9%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Program Realization Detail */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-800 font-sans">II. Catatan Program Prioritas Sinergy</h4>
                        <p className="text-xs leading-relaxed text-slate-700">
                          Realisasi pembangunan fisik terbesar difokuskan pada pengaspalan jalan dusun, pembangunan sumur bor pertanian di Dusun Krajan, dan perbaikan sanitasi lingkungan pemukiman warga. Bidang pemberdayaan mencakup pemberian stimulan modal usaha BUMDes Sinergy Makmur dan insentif guru PAUD / kader Posyandu.
                        </p>
                      </div>

                      {/* Official Signature Section */}
                      <div className="grid grid-cols-2 pt-8 text-xs font-sans">
                        <div className="text-center space-y-12">
                          <div>
                            <p className="font-semibold">Mengesahkan,</p>
                            <p className="font-extrabold uppercase">Badan Permusyawaratan Desa</p>
                          </div>
                          <div>
                            <p className="font-bold underline">H. Mulyadi, S.H.</p>
                            <p className="text-[10px] text-slate-400">Ketua BPD Sinergy</p>
                          </div>
                        </div>

                        <div className="text-center space-y-12">
                          <div>
                            <p className="font-semibold">Sinergy, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                            <p className="font-extrabold uppercase">Kepala Desa Sinergy</p>
                          </div>
                          <div>
                            <p className="font-bold underline">Bambang Wijaya, S.IP</p>
                            <p className="text-[10px] text-slate-400">Kades Sinergy</p>
                          </div>
                        </div>
                      </div>

                      {/* PT FAS Watermark footer */}
                      <div className="pt-6 border-t border-slate-100 text-center text-[9px] text-slate-400 font-mono font-sans">
                        Dokumen ini digenerate secara otomatis oleh modul Sinergy ERP. Pengembang: PT Fas Technology Solutions.
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ==================== PERANGKAT DESA (RBAC) TAB ==================== */}
            {activeTab === "rbac" && (
              <div className="space-y-6" id="rbac-tab-content">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
                  <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Perangkat Desa & Struktur Peran (RBAC)</h2>
                  <p className="text-slate-500 text-xs">Informasi lengkap seluruh pemegang jabatan di Desa Sinergy. Khusus Kepala Desa memiliki wewenang untuk mengangkat atau memberhentikan (menonaktifkan sementara) perangkat.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(u => (
                    <div key={u.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left flex flex-col justify-between">
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={u.avatar} 
                            alt={u.name} 
                            referrerPolicy="no-referrer"
                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-100 shadow-sm" 
                          />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-50">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Jabatan Wewenang:</span>
                            <span className="font-bold text-[#0b2b4a]">{getRoleLabel(u.role)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Kode Peran:</span>
                            <span className="font-mono font-bold text-slate-500">{u.role}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Status Aktif Jabatan:</span>
                            <span className={`font-bold ${u.status === "AKTIF" ? "text-emerald-600" : "text-rose-600"}`}>{u.status}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Pengamanan 2-Faktor:</span>
                            <span className="font-bold text-slate-500">{u.has2FA ? "🔐 Wajib 2FA" : "🔓 Standar"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kades-only administrative buttons */}
                      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end gap-2">
                        {currentUser?.role === "KADES" && u.role !== "KADES" ? (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                              u.status === "AKTIF" 
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100" 
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            id={`btn-toggle-status-${u.id}`}
                          >
                            {u.status === "AKTIF" ? (
                              <>
                                <UserMinus className="h-3.5 w-3.5" />
                                Berhentikan Sementara
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Angkat Jabatan Kembali
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 py-1.5 italic font-medium">Hanya Kades yang memiliki wewenang struktural</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== AUDIT TRAILS TAB ==================== */}
            {activeTab === "audits" && (
              <div className="space-y-6" id="audits-tab-content">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
                  <h2 className="text-lg font-bold text-[#0b2b4a] tracking-tight">Audit Trail & Log Aktivitas Keamanan</h2>
                  <p className="text-slate-500 text-xs font-medium">Log aktivitas transparan untuk audit sistem, mencatat nama, peran, aksi, alamat IP, dan agen pengguna secara real-time.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Waktu Kejadian</th>
                          <th className="py-3 px-4">Nama Perangkat</th>
                          <th className="py-3 px-4">Peran (Role)</th>
                          <th className="py-3 px-4">Tindakan Aktivitas</th>
                          <th className="py-3 px-4">Alamat IP</th>
                          <th className="py-3 px-4">Browser/User Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-slate-500 font-mono">
                              {new Date(log.created_at).toLocaleString("id-ID")}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{log.user_name}</td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                {log.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">{log.action}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{log.ip_address}</td>
                            <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={log.user_agent}>
                              {log.user_agent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TECH PORTAL (LARAVEL DOCS) TAB ==================== */}
            {activeTab === "docs" && (
              <div id="docs-tab-content">
                <LaravelDocs />
              </div>
            )}
                </>
              )}

          </motion.div>
        </AnimatePresence>

        {/* FOOTER */}
        <footer className="py-6 text-center text-slate-400 text-xs mt-12 no-print" id="main-footer">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-bold text-slate-500">SINERGY Pemerintahan Desa v2.1 • Dikembangkan oleh PT Fas Technology Solutions</p>
            <p className="text-[11px] font-medium text-slate-400">Sistem ini memenuhi standar audit transparansi dana desa & UU Keterbukaan Informasi Publik.</p>
          </div>
        </footer>
      </main>

      </div> {/* Close Right Content Container */}

      {/* MODAL WORKFLOW FORM */}
      <AnimatePresence>
        {showAddWorkflowModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full text-left"
            >
              <h3 className="text-base font-bold text-slate-900 mb-2">Buat Pengajuan Alur Kerja Baru</h3>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Dokumen Pengajuan</label>
                  <select
                    value={newWorkflowData.type}
                    onChange={(e) => setNewWorkflowData({ ...newWorkflowData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    id="select-workflow-type"
                  >
                    <option value="SPP">SPP (Surat Permintaan Pembayaran)</option>
                    <option value="SPJ">SPJ (Surat Pertanggungjawaban)</option>
                    <option value="PERJALANAN_DINAS">Perjalanan Dinas</option>
                    <option value="PERATURAN_DESA">Rancangan Peraturan Desa</option>
                    <option value="APB_DES">Rancangan APBDes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Judul / Perihal Pengajuan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: SPP Pembangunan Sumur Bor Dusun Krajan"
                    value={newWorkflowData.title}
                    onChange={(e) => setNewWorkflowData({ ...newWorkflowData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-workflow-title"
                  />
                </div>

                {(newWorkflowData.type === "SPP" || newWorkflowData.type === "SPJ" || newWorkflowData.type === "APB_DES" || newWorkflowData.type === "PERJALANAN_DINAS") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nominal Anggaran (Rupiah)</label>
                    <input 
                      type="number" 
                      placeholder="Masukkan nominal angka saja, misal: 15000000"
                      value={newWorkflowData.amount}
                      onChange={(e) => setNewWorkflowData({ ...newWorkflowData, amount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-workflow-amount"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Keterangan / Deskripsi Rinci</label>
                  <textarea 
                    placeholder="Tulis penjelasan lengkap mengenai program pembangunan, regulasi, atau alasan perjalanan dinas..."
                    value={newWorkflowData.description}
                    onChange={(e) => setNewWorkflowData({ ...newWorkflowData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] h-24"
                    required
                    id="input-workflow-desc"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWorkflowModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                  >
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DMS FORM */}
      <AnimatePresence>
        {showAddDocModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full text-left"
            >
              <h3 className="text-base font-bold text-slate-900 mb-2">Arsip Dokumen DMS Baru</h3>
              <form onSubmit={handleAddDoc} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Klasifikasi Berkas</label>
                  <select
                    value={newDocData.type}
                    onChange={(e) => setNewDocData({ ...newDocData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    id="select-doc-type"
                  >
                    <option value="SURAT_MASUK">Surat Masuk</option>
                    <option value="SURAT_KELUAR">Surat Keluar</option>
                    <option value="ARSIP">Arsip Kegiatan Desa</option>
                    <option value="EKSPEDISI">Buku Ekspedisi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Judul / Perihal</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Surat Edaran Vaksinasi Booster"
                    value={newDocData.title}
                    onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-doc-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nomor Surat</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 005/12/DS-Srg"
                      value={newDocData.reference_number}
                      onChange={(e) => setNewDocData({ ...newDocData, reference_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-doc-ref"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kategori / Sifat</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Penting / Segera"
                      value={newDocData.category}
                      onChange={(e) => setNewDocData({ ...newDocData, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-doc-cat"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Instansi Asal / Tujuan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Kantor Camat Pancoran"
                    value={newDocData.sender_or_receiver}
                    onChange={(e) => setNewDocData({ ...newDocData, sender_or_receiver: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-doc-sender"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ringkasan Isi Berkas</label>
                  <textarea 
                    placeholder="Tulis intisari isi surat atau keterangan arsip secara singkat..."
                    value={newDocData.description}
                    onChange={(e) => setNewDocData({ ...newDocData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] h-16"
                    id="input-doc-desc"
                  />
                </div>

                {/* Simulated file upload */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Unggah File PDF / Hasil Scan (Maks 10MB)</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Seret dokumen ke sini atau klik untuk memilih file dari komputer</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDocModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                  >
                    Simpan Arsip
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ASSET FORM */}
      <AnimatePresence>
        {showAddAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full text-left"
            >
              <h3 className="text-base font-bold text-slate-900 mb-2">Registrasi Aset Desa Baru</h3>
              <form onSubmit={handleAddAsset} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kategori Aset</label>
                    <select
                      value={newAssetData.category}
                      onChange={(e) => setNewAssetData({ ...newAssetData, category: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      id="select-asset-cat"
                    >
                      <option value="TANAH">Tanah</option>
                      <option value="BANGUNAN">Bangunan</option>
                      <option value="KENDARAAN">Kendaraan</option>
                      <option value="PERALATAN">Peralatan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kondisi Fisik</label>
                    <select
                      value={newAssetData.condition}
                      onChange={(e) => setNewAssetData({ ...newAssetData, condition: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      id="select-asset-cond"
                    >
                      <option value="BAIK">Baik</option>
                      <option value="RUSAK_RINGAN">Rusak Ringan</option>
                      <option value="RUSAK_BERAT">Rusak Berat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Aset</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Ambulans Desa"
                      value={newAssetData.name}
                      onChange={(e) => setNewAssetData({ ...newAssetData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-asset-name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kode Register Aset</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: ASD-005"
                      value={newAssetData.code}
                      onChange={(e) => setNewAssetData({ ...newAssetData, code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-asset-code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nilai Taksiran (Rupiah)</label>
                    <input 
                      type="number" 
                      placeholder="Contoh: 180000000"
                      value={newAssetData.value}
                      onChange={(e) => setNewAssetData({ ...newAssetData, value: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-asset-value"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Pembelian</label>
                    <input 
                      type="date" 
                      value={newAssetData.acquisition_date}
                      onChange={(e) => setNewAssetData({ ...newAssetData, acquisition_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                      required
                      id="input-asset-date"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Lokasi Keberadaan Aset</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Balai Pertemuan Dusun Krajan"
                    value={newAssetData.location}
                    onChange={(e) => setNewAssetData({ ...newAssetData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-asset-loc"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Penanggung Jawab / Pengelola</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Kepala Dusun Krajan"
                    value={newAssetData.managed_by}
                    onChange={(e) => setNewAssetData({ ...newAssetData, managed_by: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-asset-manager"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAssetModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                  >
                    Simpan Registrasi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TASK FORM */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full text-left"
            >
              <h3 className="text-base font-bold text-slate-900 mb-2">Delegasikan Tugas Baru (Kades Only)</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jabatan Penerima Delegasi</label>
                  <select
                    value={newTaskData.assigned_to}
                    onChange={(e) => setNewTaskData({ ...newTaskData, assigned_to: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    id="select-task-assignee"
                  >
                    <option value="SEKDES">Sekretaris Desa</option>
                    <option value="KAUR_UMUM">Kaur Umum</option>
                    <option value="KAUR_KEUANGAN">Kaur Keuangan</option>
                    <option value="KAUR_PERENCANAAN">Kaur Perencanaan</option>
                    <option value="KASI_PEMERINTAHAN">Kasi Pemerintahan</option>
                    <option value="KASI_KESEJAHTERAAN">Kasi Kesejahteraan</option>
                    <option value="KASI_PELAYANAN">Kasi Pelayanan</option>
                    <option value="KADUS">Kepala Dusun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Perihal Tugas / Judul</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Susun RKPDes Tahun 2027"
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-task-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Instruksi & Deskripsi Lengkap</label>
                  <textarea 
                    placeholder="Tulis detail pekerjaan yang harus dilakukan serta luaran yang diharapkan..."
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa] h-20"
                    required
                    id="input-task-desc"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Batas Waktu Penyerahan</label>
                  <input 
                    type="date" 
                    value={newTaskData.due_date}
                    onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2a7faa]"
                    required
                    id="input-task-date"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0b2b4a] hover:bg-[#154673] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                  >
                    Delegasikan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
