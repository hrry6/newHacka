// ============================================================
// API Service Layer
// Set VITE_API_BASE_URL in .env to point to backend.
// ============================================================

import type { Transaction, TransactionStatus, NewBackendTransaction } from "@/types/transaction";
import { supabase } from "@/integrations/supabase/client";

// Saat dev lokal, proxy Vite meneruskan /api/* ke localhost:5000 secara otomatis.
// const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/** Raw shape from new backend response (transactions/user) */

/** Normalize payment type string from backend → UI paymentType */
function normalizePaymentType(raw: string): Transaction["paymentType"] {
  const map: Record<string, Transaction["paymentType"]> = {
    "CREDIT": "CreditCard",
    "DEBIT": "DebitCard",
    "VA": "VirtualAccount",
    "VIRTUALACCOUNT": "VirtualAccount",
    "VIRTUAL_ACCOUNT": "VirtualAccount",
    "QRIS": "QRIS",
    "E_WALLET": "Ewallet",
    "EWALLET": "Ewallet",
    "BANK TRANSFER": "BankTransfer",
    "BANK_TRANSFER": "BankTransfer",
    "BANKTRANSFER": "BankTransfer",
  };
  return map[raw.toUpperCase()] ?? "BankTransfer";
}

/** Convert new backend transaction → Transaction (UI model) */
function mapNewBackendTransaction(t: NewBackendTransaction, merchantId: string): Transaction {
  // Pastikan selalu ada nilai unik untuk key
  const uniqueId = t.id || t.invoice_no || `temp-${Date.now()}-${Math.random()}`;
  
  return {
    merchantTradeNo: uniqueId,  // Gunakan uniqueId
    requestId: t.id || t.invoice_no || "",
    paymentType: normalizePaymentType(t.tipe_pembayaran),
    amount: String(t.nominal),
    amountNum: t.nominal,
    timestamp: t.tanggal,
    status: t.verified_status === "VERIFIED" ? "success" : t.verified_status === "UNVERIFIED" ? "failed" : "pending",
    merchantId,
    sender: t.pengirim,
    receiver: t.penerima,
    message: t.pesan,
    invoiceNo: t.invoice_no,
    txHash: t.bukti_digital?.tx_hash,
    cid: t.bukti_digital?.cid,
    verifiedStatus: t.verified_status,
    bukti_digital: t.bukti_digital ? {
      cid: t.bukti_digital.cid,
      tx_hash: t.bukti_digital.tx_hash,
      url_ipfs: t.bukti_digital.url_ipfs || `https://gateway.pinata.cloud/ipfs/${t.bukti_digital.cid}`,
      url_polygonscan: t.bukti_digital.url_polygonscan || `https://amoy.polygonscan.com/tx/${t.bukti_digital.tx_hash}`
    } : {
      cid: "",
      tx_hash: "",
      url_ipfs: "",
      url_polygonscan: ""
    }
  };
}

async function fetchTransactionsFromBackend(userId: string): Promise<Transaction[] | null> {
  try {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`/api/transactions/user`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    // New backend format: { success, data: { transactions: [...] } }
    const list: NewBackendTransaction[] =
      Array.isArray(json?.data?.transactions) ? json.data.transactions :
      Array.isArray(json?.transactions) ? json.transactions :
      Array.isArray(json) ? json : null;
    if (!list) return null;
    return list.map((t) => mapNewBackendTransaction(t, userId));
  } catch {
    return null;
  }
}

export interface FetchTransactionsParams {
  merchantId: string;
  search?: string;
  status?: TransactionStatus | "all";
  paymentType?: string;
  page?: number;
  perPage?: number;
  sortField?: keyof Transaction;
  sortDir?: "asc" | "desc";
}

export interface FetchTransactionsResult {
  data: Transaction[];
  total: number;
  totalPages: number;
}

export async function fetchTransactions(
  params: FetchTransactionsParams,
): Promise<FetchTransactionsResult> {
  const {
    merchantId,
    search = "",
    status = "all",
    paymentType,
    page = 1,
    perPage = 10,
    sortField = "timestamp",
    sortDir = "desc",
  } = params;

  const backendData = await fetchTransactionsFromBackend(merchantId);
  let data = backendData ?? [];

  data = data.filter((t) => {
    const matchSearch =
      t.merchantTradeNo.toLowerCase().includes(search.toLowerCase()) ||
      t.requestId.toLowerCase().includes(search.toLowerCase()) ||
      t.sender.toLowerCase().includes(search.toLowerCase()) ||
      t.receiver.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase()) ||
      t.paymentType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || t.status === status;
    const matchPayment = !paymentType || t.paymentType === paymentType;
    return matchSearch && matchStatus && matchPayment;
  });

  data = [...data].sort((a, b) => {
    const av = a[sortField as keyof Transaction];
    const bv = b[sortField as keyof Transaction];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = data.length;
  const totalPages = Math.ceil(total / perPage);
  const paginated = data.slice((page - 1) * perPage, page * perPage);

  return { data: paginated, total, totalPages };
}

export interface DashboardStats {
  totalToday: number;
  successRate: number;
  anomalies: number;
  companiesMonitored: number;
  systemStatus: "normal" | "degraded" | "down";
  totalAmount: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return {
    totalToday: 12_483,
    successRate: 96.7,
    anomalies: 3,
    companiesMonitored: 1_247,
    systemStatus: "normal",
    totalAmount: 8_234_560_000,
  };
}

export interface TransactionSummary {
  total: number;
  success: number;
  pending: number;
  failed: number;
  totalAmount: number;
}

export async function fetchTransactionSummary(
  merchantId: string,
): Promise<TransactionSummary> {
  const backendData = await fetchTransactionsFromBackend(merchantId);
  const all = backendData ?? [];
  return {
    total: all.length,
    success: all.filter((t) => t.status === "success").length,
    pending: all.filter((t) => t.status === "pending").length,
    failed: all.filter((t) => t.status === "failed").length,
    totalAmount: all.reduce((s, t) => s + t.amountNum, 0),
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    name: string;
    email: string;
    role: string;
    phone: string;
    joinDate: string;
    isPublic: boolean;
    monitoringId?: string;
    userId?: string;
  };
  error?: string;
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const base = "";
  try {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json?.message || json?.error || "Email atau password salah.",
      };
    }

    // Sukses — petakan response backend ke model user
    // Response: { token, user: { id, company_name, email, ... } }
    const token = json.token;
    const u = json.user || json.data || json;
    return {
      success: true,
      token,
      user: {
        name: u.name || u.company_name || credentials.email.split("@")[0],
        email: u.email || credentials.email,
        role: u.role || "User",
        phone: u.phone || "-",
        joinDate: u.created_at
          ? new Date(u.created_at).toLocaleString("id-ID", { month: "long", year: "numeric" })
          : new Date().toLocaleString("id-ID", { month: "long", year: "numeric" }),
        isPublic: false,
        userId: u.id || u.user_id,
      },
    };
  } catch {
    return { success: false, error: "Tidak dapat terhubung ke server. Coba lagi nanti." };
  }
}

/** Ambil userId dari JWT yang tersimpan di localStorage */
function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id || payload?.sub || payload?.userId || null;
  } catch {
    return null;
  }
}

export async function loadUserProfile(): Promise<{ isPublic: boolean; monitoringId?: string } | null> {
  const userId = getUserIdFromToken();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("is_public, monitoring_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { isPublic: data.is_public, monitoringId: data.monitoring_id ?? undefined };
}

export async function deleteShareId(): Promise<{ success: boolean; error?: string }> {
  const base = "";
  try {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}/api/user/share/delete`, { method: "DELETE", headers });
    if (!res.ok) return { success: false, error: "Gagal menghapus ID monitoring." };

    // Simpan ke database
    const userId = getUserIdFromToken();
    if (userId) {
      await supabase.from("user_profiles").upsert(
        { user_id: userId, is_public: false, monitoring_id: null },
        { onConflict: "user_id" }
      );
    }
    return { success: true };
  } catch {
    return { success: false, error: "Tidak dapat terhubung ke server." };
  }
}

export async function generateShareId(): Promise<{ success: boolean; monitoringId?: string; error?: string }> {
  const base = "";
  try {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}/api/user/share/generate`, { method: "POST", headers });
    if (!res.ok) return { success: false, error: "Gagal generate ID monitoring." };
    const json = await res.json();
    console.log("[generateShareId] response:", JSON.stringify(json));
    const data = json?.data || json;
    const id =
      data?.share_id || data?.shareId || data?.id || data?.monitoringId ||
      data?.monitoring_id || data?.uuid || data?.user_id ||
      json?.share_id || json?.shareId || json?.id || json?.monitoringId || json?.monitoring_id;
    console.log("[generateShareId] parsed id:", id);
    if (!id) return { success: false, error: `Gagal parse ID dari response. Response: ${JSON.stringify(json)}` };

    // Simpan ke database
    const userId = getUserIdFromToken();
    if (userId) {
      await supabase.from("user_profiles").upsert(
        { user_id: userId, is_public: true, monitoring_id: id },
        { onConflict: "user_id" }
      );
    }
    return { success: true, monitoringId: id };
  } catch {
    return { success: false, error: "Tidak dapat terhubung ke server." };
  }
}

export async function changePassword(
  _currentPassword: string,
  _newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export interface PublicUserInfo {
  userId: string;
  name: string;
  isPublic: boolean;
}

export interface PublicUserTransactionsResult {
  user: PublicUserInfo | null;
  transactions: Transaction[];
  total: number;
  totalAmount: number;
  error?: string;
  notFound?: boolean;
  requiresAuth?: boolean;
}

export async function fetchPublicUserData(userId: string): Promise<PublicUserTransactionsResult> {
  const base = "";
  
  try {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${base}/api/public/share/${userId}`;
    console.log('🌐 Fetching:', url);
    
    const res = await fetch(url, { method: 'GET', headers });
    const json = await res.json();
    
    // ✅ LOG RESPONSE UNTUK DEBUG
    console.log('📦 Raw response:', json);
    
    const data = json.data || json;
    console.log('📦 Data transactions:', data.transactions?.[0]); // Log transaksi pertama
    
    const rawTx: NewBackendTransaction[] = Array.isArray(data.transactions) ? data.transactions : [];
    
    const transactions = rawTx.map((t) => {
      // ✅ LOG SETIAP TRANSAKSI SAAT MAPPING
      console.log('Mapping transaction:', {
        id: t.id,
        hasBuktiDigital: !!t.bukti_digital,
        cid: t.bukti_digital?.cid,
        tx_hash: t.bukti_digital?.tx_hash
      });
      
      return mapNewBackendTransaction(t, userId);
    });
    
    const totalAmount = transactions.reduce((s, t) => s + t.amountNum, 0);
    
    const userData = data.user || {};
    const user: PublicUserInfo = {
      userId: userData.id || userId,
      name: userData.company_name || userData.name || data.name || data.company_name || userId,
      isPublic: false,
    };
    
    console.log('✅ Final transactions:', transactions.length);
    console.log('🔍 Sample transaction:', transactions[0]); // Log sample
    
    return { 
      user, 
      transactions, 
      total: transactions.length, 
      totalAmount,
      notFound: false
    };
    
  } catch (error) {
    console.error("🔥 Error:", error);
    return { 
      user: null, 
      transactions: [], 
      total: 0, 
      totalAmount: 0, 
      error: "Tidak dapat terhubung ke server." 
    };
  }
}