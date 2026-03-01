// ============================================================
// Transaction Types
// ============================================================

export type PaymentType =
  | "CreditCard"
  | "DebitCard"
  | "VirtualAccount"
  | "QRIS"
  | "Ewallet"
  | "BankTransfer";

export type TransactionStatus = "success" | "pending" | "failed";

/** Raw shape from backend API response */


/** Raw shape from new backend response (transactions/user) */
/** Raw shape from new backend response (transactions/user) */
export interface NewBackendTransaction {
  id: string;
  pengirim: string;
  penerima: string;
  tanggal: string;
  nominal: number;
  pesan: string;
  tipe_pembayaran: string;
  invoice_no?: string;
  verified_status?: string;
  // ✅ TAMBAHKAN STRUKTUR BUKTI_DIGITAL
  bukti_digital?: {
    cid: string;
    tx_hash: string;
    url_ipfs?: string;
    url_polygonscan?: string;
  };
}

/** Raw shape coming from Paylabs webhook / API response */
export interface PaylabsTransaction {
  merchantTradeNo: string;
  requestId: string;
  paymentType: PaymentType;
  /** Amount in IDR as string e.g. "10000.00" */
  amount: string;
  /** ISO-8601 timestamp from X-TIMESTAMP header */
  timestamp: string;
  status: TransactionStatus;
  merchantId: string;
  /** Nama pengirim transaksi */
  sender: string;
  /** Nama penerima transaksi */
  receiver: string;
  /** Pesan / keterangan transaksi */
  message: string;
}

/** Extended display model used in the UI */
export interface Transaction extends PaylabsTransaction {
  amountNum: number;
  backendId?: string;
  txHash?: string;
  cid?: string;
  verifiedStatus?: string;
  invoiceNo?: string;
  // ✅ PASTIKAN BUKTI_DIGITAL ADA (bisa dengan default value)
  bukti_digital: {
    cid: string;
    tx_hash: string;
    url_ipfs: string;
    url_polygonscan: string;
  };
}