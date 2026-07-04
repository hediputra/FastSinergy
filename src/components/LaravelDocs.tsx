/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FileCode, Database, Terminal, ShieldAlert, Layers, BookOpen, Check, Copy } from "lucide-react";

export default function LaravelDocs() {
  const [activeTab, setActiveTab] = useState<"migrations" | "models" | "middleware" | "controllers" | "guide">("migrations");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const migrationsCode = `<?php
// database/migrations/2026_07_04_000001_create_roles_and_users_tables.php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

class CreateRolesAndUsersTables extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->enum('role', [
                'KADES', 'SEKDES', 'KAUR_UMUM', 'KAUR_KEUANGAN', 
                'KAUR_PERENCANAAN', 'KASI_PEMERINTAHAN', 
                'KASI_KESEJAHTERAAN', 'KASI_PELAYANAN', 'KADUS'
            ]);
            $table->enum('status', ['AKTIF', 'NONAKTIF'])->default('AKTIF');
            $table->boolean('has_2fa')->default(false);
            $table->string('two_factor_secret')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
}

// database/migrations/2026_07_04_000002_create_workflows_table.php
class CreateWorkflowsTable extends Migration
{
    public function up()
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('type', ['SPP', 'SPJ', 'PERJALANAN_DINAS', 'PERATURAN_DESA', 'APB_DES']);
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 15, 2)->nullable();
            $table->text('description');
            $table->integer('current_step_index')->default(0);
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->string('document_url')->nullable();
            $table->timestamps();
        });

        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('workflows')->onDelete('cascade');
            $table->string('role_required');
            $table->foreignId('action_by')->nullable()->constrained('users');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->text('comment')->nullable();
            $table->timestamp('action_at')->nullable();
            $table->timestamps();
        });
    }
}
`;

  const modelsCode = `<?php
// app/Models/User.php
namespace App\\Models;

use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Notifications\\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = ['name', 'email', 'role', 'status', 'has_2fa', 'two_factor_secret', 'password'];

    public function workflows() {
        return $this->hasMany(Workflow::class, 'creator_id');
    }

    public function tasks() {
        return $this->hasMany(Task::class, 'assigned_to_user_id');
    }
}

// app/Models/Workflow.php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Workflow extends Model
{
    protected $fillable = ['title', 'type', 'creator_id', 'amount', 'description', 'current_step_index', 'status', 'document_url'];

    public function creator() {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function steps() {
        return $this->hasMany(WorkflowStep::class)->orderBy('id', 'asc');
    }
}

// app/Models/WorkflowStep.php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class WorkflowStep extends Model
{
    protected $fillable = ['workflow_id', 'role_required', 'action_by', 'status', 'comment', 'action_at'];

    public function workflow() {
        return $this->belongsTo(Workflow::class);
    }

    public function user() {
        return $this->belongsTo(User::class, 'action_by');
    }
}
`;

  const middlewareCode = `<?php
// app/Http/Middleware/RoleBasedAccessControl.php
namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;

class RoleBasedAccessControl
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$allowedRoles)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        if ($user->status !== 'AKTIF') {
            return response()->json(['error' => 'Akun dinonaktifkan oleh Kepala Desa.'], 403);
        }

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json([
                'error' => 'Wewenang tidak mencukupi.',
                'required_roles' => $allowedRoles,
                'your_role' => $user->role
            ], 403);
        }

        // Khusus Kades & Sekdes: Validasi 2FA
        if (in_array($user->role, ['KADES', 'SEKDES'])) {
            if ($user->has_2fa && !$request->session()->get('2fa_verified', false)) {
                return response()->json(['error' => '2FA verification required.'], 403);
            }
        }

        return $next($request);
    }
}
`;

  const controllersCode = `<?php
// app/Http/Controllers/Api/WorkflowController.php
namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Workflow;
use App\\Models\\WorkflowStep;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

class WorkflowController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:SPP,SPJ,PERJALANAN_DINAS,PERATURAN_DESA,APB_DES',
            'amount' => 'nullable|numeric',
            'description' => 'required|string',
        ]);

        return DB::transaction(function () use ($request) {
            $user = auth()->user();
            
            $workflow = Workflow::create([
                'title' => $request->title,
                'type' => $request->type,
                'creator_id' => $user->id,
                'amount' => $request->amount,
                'description' => $request->description,
                'status' => 'PENDING',
                'current_step_index' => 0
            ]);

            // Buat steps berdasarkan Tupoksi
            $steps = $this->getStepsForType($request->type);
            foreach ($steps as $stepRole) {
                WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'role_required' => $stepRole,
                    'status' => 'PENDING'
                ]);
            }

            // Log Audit & Kirim Notifikasi (Sinergy Event)
            $this->logAudit($user, "Membuat pengajuan alur " . $request->type . ": " . $request->title);

            return response()->json($workflow->load('steps'), 201);
        });
    }

    public function approve(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:APPROVE,REJECT',
            'comment' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request, $id) {
            $user = auth()->user();
            $workflow = Workflow::findOrFail($id);
            $steps = $workflow->steps;
            $currentStep = $steps[$workflow->current_step_index];

            if ($currentStep->role_required !== $user->role) {
                return response()->json(['error' => 'Bukan wewenang Anda.'], 403);
            }

            if ($request->action === 'REJECT') {
                $currentStep->update([
                    'status' => 'REJECTED',
                    'comment' => $request->comment,
                    'action_by' => $user->id,
                    'action_at' => now()
                ]);
                $workflow->update(['status' => 'REJECTED']);

                $this->logAudit($user, "Menolak pengajuan " . $workflow->type . " (" . $workflow->title . ")");
            } else {
                $currentStep->update([
                    'status' => 'APPROVED',
                    'comment' => $request->comment,
                    'action_by' => $user->id,
                    'action_at' => now()
                ]);

                if ($workflow->current_step_index < count($steps) - 1) {
                    $workflow->increment('current_step_index');
                } else {
                    $workflow->update(['status' => 'APPROVED']);
                }

                $this->logAudit($user, "Menyetujui langkah pengajuan " . $workflow->type . " (" . $workflow->title . ")");
            }

            return response()->json($workflow->load('steps'));
        });
    }

    private function getStepsForType($type) {
        switch($type) {
            case 'SPP':
            case 'SPJ':
                return ['KAUR_KEUANGAN', 'SEKDES', 'KADES'];
            case 'PERJALANAN_DINAS':
                return ['KAUR_UMUM', 'KADES'];
            case 'PERATURAN_DESA':
                return ['SEKDES', 'KADES'];
            case 'APB_DES':
                return ['KAUR_PERENCANAAN', 'KAUR_KEUANGAN', 'SEKDES', 'KADES'];
            default:
                return ['KADES'];
        }
    }
}
`;

  const installGuideText = `# Panduan Instalasi & Deploy Website Desa SINERGY
Dikembangkan oleh: **PT Fas Technology Solutions**

## Arsitektur & Teknologi
- **Backend**: Laravel 10 / 11 dengan REST API + Sanctum Auth + RBAC Middleware.
- **Frontend**: React 19 (atau Vue 3) + Tailwind CSS v4.
- **Database**: PostgreSQL / MySQL.
- **Keamanan**: Hash Sandi Argon2id, CSRF Protection, XSS sanitizer, Token-based Auth, Multi-level Role verification, 2FA dengan OTP Google Authenticator.

## Langkah-Langkah Deploy Backend (Laravel)
1. Clone repositori ke server cloud Anda:
   \`\`\`bash
   git clone https://github.com/fas-technology/sinergy-desa.git
   cd sinergy-desa/backend
   \`\`\`
2. Install dependensi composer:
   \`\`\`bash
   composer install --no-dev --optimize-autoloader
   \`\`\`
3. Salin konfirugasi env:
   \`\`\`bash
   cp .env.example .env
   nano .env # Konfigurasi DB_DATABASE, DB_USERNAME, DB_PASSWORD, MAIL_*
   \`\`\`
4. Generate key enkripsi & link storage:
   \`\`\`bash
   php artisan key:generate
   php artisan storage:link
   \`\`\`
5. Jalankan migrasi & database seeding (membuat data perangkat desa awal):
   \`\`\`bash
   php artisan migrate:fresh --seed
   \`\`\`
6. Jalankan queue listener untuk notifikasi email background:
   \`\`\`bash
   php artisan queue:work --daemon
   \`\`\`

## Langkah-Langkah Deploy Frontend (React/Vite)
1. Pindah ke direktori frontend:
   \`\`\`bash
   cd ../frontend
   \`\`\`
2. Install npm packages:
   \`\`\`bash
   npm install
   \`\`\`
3. Jalankan build produksi:
   \`\`\`bash
   npm run build
   \`\`\`
4. Salin isi folder \`dist\` ke direktori public web server (Nginx/Apache) Anda.
`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="dev-docs-container">
      <div className="bg-gradient-to-r from-[#0b2b4a] to-[#154673] p-6 text-white">
        <div className="flex items-center gap-3">
          <FileCode className="h-7 w-7 text-[#2a7faa]" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">Sinergy Tech-Portal</h2>
            <p className="text-slate-300 text-xs mt-0.5">PT Fas Technology Solutions • Backend Laravel Blueprints & Panduan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("migrations")}
          className={`flex items-center justify-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "migrations"
              ? "border-[#2a7faa] text-[#0b2b4a] bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
          }`}
          id="btn-doc-migrations"
        >
          <Database className="h-4 w-4" />
          Database Migrations
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`flex items-center justify-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "models"
              ? "border-[#2a7faa] text-[#0b2b4a] bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
          }`}
          id="btn-doc-models"
        >
          <Layers className="h-4 w-4" />
          Laravel Models
        </button>
        <button
          onClick={() => setActiveTab("middleware")}
          className={`flex items-center justify-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "middleware"
              ? "border-[#2a7faa] text-[#0b2b4a] bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
          }`}
          id="btn-doc-middleware"
        >
          <ShieldAlert className="h-4 w-4" />
          RBAC Middleware
        </button>
        <button
          onClick={() => setActiveTab("controllers")}
          className={`flex items-center justify-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "controllers"
              ? "border-[#2a7faa] text-[#0b2b4a] bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
          }`}
          id="btn-doc-controllers"
        >
          <Terminal className="h-4 w-4" />
          Controllers API
        </button>
        <button
          onClick={() => setActiveTab("guide")}
          className={`flex items-center justify-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "guide"
              ? "border-[#2a7faa] text-[#0b2b4a] bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
          }`}
          id="btn-doc-guide"
        >
          <BookOpen className="h-4 w-4" />
          Panduan Instalasi
        </button>
      </div>

      <div className="p-6">
        {activeTab === "migrations" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Skema Migrasi Database (Laravel)</h3>
                <p className="text-slate-500 text-xs">Arsitektur tabel relational untuk RBAC, Users, dan Alur Approval multi-level.</p>
              </div>
              <button
                onClick={() => triggerCopy(migrationsCode, "mig")}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copiedId === "mig" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === "mig" ? "Disalin!" : "Salin Kode"}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
              <code>{migrationsCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "models" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Relasi Model Eloquent</h3>
                <p className="text-slate-500 text-xs">Model User, Workflow, dan WorkflowStep dengan hubungan 1-to-many & inverse.</p>
              </div>
              <button
                onClick={() => triggerCopy(modelsCode, "mod")}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copiedId === "mod" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === "mod" ? "Disalin!" : "Salin Kode"}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
              <code>{modelsCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "middleware" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Laravel Middleware - Role-Based Access Control</h3>
                <p className="text-slate-500 text-xs">Mencegah perangkat nonaktif mengakses rute, memvalidasi role spesifik, dan memverifikasi status 2FA.</p>
              </div>
              <button
                onClick={() => triggerCopy(middlewareCode, "mid")}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copiedId === "mid" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === "mid" ? "Disalin!" : "Salin Kode"}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
              <code>{middlewareCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "controllers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">API Controller Workflow</h3>
                <p className="text-slate-500 text-xs">Memproses pembuatan alur kerja baru sesuai Tupoksi, verifikasi berantai, dan approval penolakan.</p>
              </div>
              <button
                onClick={() => triggerCopy(controllersCode, "ctrl")}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copiedId === "ctrl" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === "ctrl" ? "Disalin!" : "Salin Kode"}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
              <code>{controllersCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "guide" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Panduan Instalasi Server</h3>
                <p className="text-slate-500 text-xs">Instruksi deployment langkah demi langkah untuk arsitektur produksi Sinergy.</p>
              </div>
              <button
                onClick={() => triggerCopy(installGuideText, "guide")}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copiedId === "guide" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === "guide" ? "Disalin!" : "Salin Kode"}
              </button>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl text-sm leading-relaxed border border-slate-200 text-slate-700 font-sans max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-xs">{installGuideText}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Kepatuhan Standar: PSR-12, SOLID, DRY, OWASP Security</span>
        <span>PT Fas Technology Solutions • © 2026</span>
      </div>
    </div>
  );
}
