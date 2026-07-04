/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  KADES = "KADES", // Kepala Desa
  SEKDES = "SEKDES", // Sekretaris Desa
  KAUR_UMUM = "KAUR_UMUM", // Kepala Urusan Umum
  KAUR_KEUANGAN = "KAUR_KEUANGAN", // Kepala Urusan Keuangan
  KAUR_PERENCANAAN = "KAUR_PERENCANAAN", // Kepala Urusan Perencanaan
  KASI_PEMERINTAHAN = "KASI_PEMERINTAHAN", // Kepala Seksi Pemerintahan
  KASI_KESEJAHTERAAN = "KASI_KESEJAHTERAAN", // Kepala Seksi Kesejahteraan
  KASI_PELAYANAN = "KASI_PELAYANAN", // Kepala Seksi Pelayanan
  KADUS = "KADUS", // Kepala Dusun
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar: string;
  status: "AKTIF" | "NONAKTIF";
  has2FA: boolean;
  is2FAVerified: boolean;
}

export type WorkflowType = "SPP" | "SPJ" | "PERJALANAN_DINAS" | "PERATURAN_DESA" | "APB_DES";

export type ApprovalStatus = "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED";

export interface ApprovalStep {
  id: string;
  role: Role;
  user_name?: string;
  status: ApprovalStatus;
  comment?: string;
  updated_at?: string;
}

export interface ApprovalWorkflow {
  id: string;
  title: string;
  type: WorkflowType;
  creator_id: string;
  creator_name: string;
  creator_role: Role;
  amount?: number; // for SPP/SPJ/APB_DES
  description: string;
  current_step_index: number;
  steps: ApprovalStep[];
  status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  document_url?: string;
}

export interface Document {
  id: string;
  title: string;
  type: "SURAT_MASUK" | "SURAT_KELUAR" | "ARSIP" | "EKSPEDISI";
  sender_or_receiver: string;
  reference_number: string; // Nomor Surat
  category: string;
  description: string;
  created_at: string;
  uploaded_by: string;
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  category: "TANAH" | "BANGUNAN" | "KENDARAAN" | "PERALATAN" | "KAS_DESA";
  condition: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT";
  value: number;
  acquisition_date: string;
  location: string;
  managed_by: string;
}

export interface Notification {
  id: string;
  user_id: string; // or Role
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  role: Role;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: Role;
  assigned_by: string;
  status: "PENDING" | "PROSES" | "SELESAI";
  due_date: string;
  created_at: string;
}

export interface BudgetReport {
  year: number;
  total_income: number;
  total_outcome: number;
  items: {
    code: string;
    category: string;
    budget: number;
    realization: number;
    percentage: number;
  }[];
}
