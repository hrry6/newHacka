import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Filter, ChevronUp, ChevronDown,
  RefreshCw, Building2, CreditCard,
  Package, Calendar, Bot, X, Send, Sparkles, User, Trash2, MessageSquare, AlertTriangle
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { fetchPublicUserData } from "@/services/api";
import type { Transaction } from "@/types/transaction";

const paymentTypeColors: Record<string, string> = {
  CreditCard: "text-teal border-teal/30 bg-teal/10",
  DebitCard: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  VirtualAccount: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  QRIS: "text-gold border-gold/30 bg-gold/10",
  Ewallet: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  BankTransfer: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  Refund: "text-muted-foreground border-border bg-secondary",
};

/** Format Paylabs X-TIMESTAMP to a readable local date-time */
function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  } catch { return ts; }
}

type SortField = keyof Transaction;

// ─── AI Chat Types ───────────────────────────────────────────────
type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Apakah ada transaksi mencurigakan atau circular?",
  "Rangkum status semua transaksi",
  "Transaksi dengan nilai terbesar?",
  "Analisis distribusi metode pembayaran",
  "Ada transaksi gagal yang perlu ditindaklanjuti?",
];

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-foreground mt-2">{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={i} className="font-bold text-base mt-2">{line.slice(3)}</h2>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="flex gap-1.5"><span className="text-teal mt-0.5">•</span><span>{line.slice(2)}</span></p>;
        if (line.match(/^\d+\. /)) return <p key={i} className="flex gap-1.5"><span className="text-teal font-mono text-xs mt-0.5">{line.match(/^\d+/)![0]}.</span><span>{line.replace(/^\d+\. /, "")}</span></p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                : <span key={j}>{part}</span>
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── AI Chatbot Popup ─────────────────────────────────────────────
function AIChatPopup({
  companyId,
  transactions,
  onClose,
}: {
  companyId: string;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || aiLoading) return;
    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setAiLoading(true);

    try {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const resp = await fetch(`${base}/api/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question: userText }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message ?? errData.error ?? "Gagal menghubungi AI");
      }

      const json = await resp.json();
      const analisis = json?.data?.analisis ?? json?.analisis ?? json?.answer ?? "Tidak ada jawaban dari AI.";

      setMessages((prev) => [...prev, { role: "assistant", content: analisis }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed inset-x-4 bottom-4 top-16 z-50 max-w-2xl mx-auto flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-in sm:inset-x-auto sm:right-6 sm:left-auto sm:w-[520px] sm:top-auto sm:bottom-6 sm:max-h-[680px]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">AI Analis Transaksi</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-[10px] font-medium">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Merchant: <span className="text-teal">{companyId}</span> · {transactions.length} transaksi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Hapus chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-teal" />
              </div>
              <div className="text-center px-4">
                <p className="font-semibold text-foreground text-sm">Tanya tentang transaksi {companyId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saya bisa mendeteksi anomali, circular transaction, pola pembayaran, dan memberikan insight dari data transaksi.
                </p>
              </div>
              <div className="w-full space-y-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl border border-border bg-card hover:border-teal/40 hover:bg-teal/5 transition-all text-xs text-foreground/80"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : msg.content === "" && aiLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Menganalisis...
                    </div>
                  ) : (
                    <MarkdownText text={msg.content} />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips (when chat active) */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-border/50 flex gap-2 overflow-x-auto flex-shrink-0 bg-surface/50">
            {QUICK_PROMPTS.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={aiLoading}
                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border bg-surface hover:border-teal/40 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-surface flex-shrink-0">
          <div className="flex gap-2.5 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya tentang transaksi... (Enter kirim)"
              rows={2}
              disabled={aiLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm resize-none disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || aiLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl gradient-accent text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiLoading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <MessageSquare className="w-2.5 h-2.5" />
            Menganalisis {transactions.length} transaksi · Didukung Qwen 3.5 AI
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main Monitoring Page ────────────────────────────────────────
export default function Monitoring() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("id") || "";

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [summary, setSummary] = useState({ total: 0, totalAmount: 0 });
  const [publicError, setPublicError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setPublicError(null);
    try {
      const result = await fetchPublicUserData(companyId);
      if (result.notFound || result.error) {
        setPublicError(result.error || "Pengguna tidak ditemukan.");
        setTransactions([]);
        setAllTransactions([]);
        setSummary({ total: 0, totalAmount: 0 });
        return;
      }

      const resolvedName = result.user?.name || companyId;
      setUserName(resolvedName);
      setAllTransactions(result.transactions);

      // Simpan ke riwayat pencarian
      import("@/lib/recentSearches").then(({ addRecentSearch }) => {
        addRecentSearch(companyId, resolvedName);
      });

      // Client-side filter
      let filtered = result.transactions.filter((t) => {
        const matchSearch =
          !search ||
          t.sender.toLowerCase().includes(search.toLowerCase()) ||
          t.receiver.toLowerCase().includes(search.toLowerCase()) ||
          t.message?.toLowerCase().includes(search.toLowerCase()) ||
          t.paymentType.toLowerCase().includes(search.toLowerCase());
        const matchPayment = paymentFilter === "all" || t.paymentType === paymentFilter;
        return matchSearch && matchPayment;
      });

      // Sort
      filtered = [...filtered].sort((a, b) => {
        const av = a[sortField as keyof Transaction];
        const bv = b[sortField as keyof Transaction];
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });

      const total = filtered.length;
      const totalAmount = filtered.reduce((s, t) => s + t.amountNum, 0);
      setTotalFiltered(total);
      setTotalPages(Math.max(1, Math.ceil(total / PER_PAGE)));
      setSummary({ total, totalAmount });
      setTransactions(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, paymentFilter, companyId]);
  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search, page, sortField, sortDir, companyId, paymentFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 ${sortField === field && sortDir === "asc" ? "text-teal" : "text-muted-foreground/40"}`} />
      <ChevronDown className={`w-2.5 h-2.5 ${sortField === field && sortDir === "desc" ? "text-teal" : "text-muted-foreground/40"}`} />
    </span>
  );

  const columns: { label: string; field: SortField; icon?: React.ElementType }[] = [
    { label: "Pengirim", field: "sender", icon: User },
    { label: "Penerima", field: "receiver", icon: User },
    { label: "Tanggal/Waktu", field: "timestamp", icon: Calendar },
    { label: "Pesan", field: "message", icon: Package },
    { label: "Tipe Pembayaran", field: "paymentType", icon: CreditCard },
    { label: "CID", field: "cid" },
    { label: "TX Hash", field: "txHash" },
    { label: "Nominal", field: "amountNum" },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Monitoring Transaksi</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                User Share ID: <span className="text-teal">{companyId}</span>
                {userName && <span className="ml-2 text-foreground/70">· {userName}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Button */}
            <button
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal/30 bg-teal/5 hover:bg-teal/10 hover:border-teal/50 transition-all text-sm font-medium text-teal"
            >
              <Bot className="w-4 h-4" />
              <span>Analisis AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface hover:border-teal/40 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {publicError && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {publicError}
          </div>
        )}

        {/* Summary Cards */}
        {!publicError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Total Transaksi</p>
              <p className="text-xl font-bold font-mono">{summary.total}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Nilai Transaksi</p>
                <p className="text-xl font-bold font-mono text-teal">
                  Rp {summary.totalAmount.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Format: <span className="font-mono text-foreground/80">IDR</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setPage(1); 
                  loadData(); 
                }
              }}
              placeholder="Masukkan User ID... {ex: ce466....} atau ketik 'my_data' untuk cari data pribadi"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">Semua Tipe</option>
              <option value="CreditCard">Credit Card</option>
              <option value="DebitCard">Debit Card</option>
              <option value="VirtualAccount">Virtual Account</option>
              <option value="QRIS">QRIS</option>
              <option value="Ewallet">E-Wallet</option>
              <option value="BankTransfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {columns.map((col) => (
                    <th
                      key={String(col.field)}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                      onClick={() => toggleSort(col.field)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.icon && <col.icon className="w-3 h-3" />}
                        {col.label}
                      </span>
                      <SortIcon field={col.field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal" />
                      Mengambil data dari blockchain...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                     const ptColor = paymentTypeColors[t.paymentType] ?? "text-muted-foreground border-border bg-secondary";
                    return (
                      <tr key={t.merchantTradeNo} className="hover:bg-surface/50 transition-colors">
                         <td className="px-4 py-3.5 text-xs text-foreground">{t.sender}</td>
                         <td className="px-4 py-3.5 text-xs text-foreground">{t.receiver}</td>
                         <td className="px-4 py-3.5 whitespace-nowrap">
                           <div className="text-xs text-foreground">{formatTimestamp(t.timestamp)}</div>
                         </td>
                         <td className="px-4 py-3.5 text-xs text-foreground max-w-[160px] truncate">{t.message}</td>
                         <td className="px-4 py-3.5">
                           <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${ptColor}`}>
                             <CreditCard className="w-3 h-3" />
                             {t.paymentType}
                           </span>
                         </td>

                          <td className="px-4 py-3.5 font-mono max-w-[120px]">
                            {t.bukti_digital?.cid ? (
                              <a 
                                href={t.bukti_digital.url_ipfs}  // Ganti dengan link tujuan nanti
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate block text-teal hover:text-teal/80 hover:underline text-xs"  // Teal untuk CID
                                title={t.bukti_digital.cid}
                              >
                                {t.bukti_digital.cid}
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-mono max-w-[120px]">
                            {t.bukti_digital?.tx_hash ? (
                              <a 
                                href={t.bukti_digital.url_polygonscan}  // Ganti dengan link tujuan nanti
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate block text-purple-400 hover:text-purple-300 hover:underline text-xs"  // Ungu untuk TX Hash
                                title={t.bukti_digital.tx_hash}
                              >
                                {t.bukti_digital.tx_hash}
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </td>
                         
                         <td className="px-4 py-3.5 font-mono text-xs font-semibold whitespace-nowrap text-right">
                           <div className="text-foreground">Rp {t.amountNum.toLocaleString("id-ID")}</div>
                         </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-surface flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Menampilkan {Math.min((page - 1) * PER_PAGE + 1, totalFiltered)}–{Math.min(page * PER_PAGE, totalFiltered)} dari {totalFiltered} transaksi
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs disabled:opacity-40 hover:border-teal/40 transition-colors"
              >
                Sebelumnya
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs border transition-colors ${
                      page === p ? "gradient-accent text-primary-foreground border-transparent" : "border-border hover:border-teal/40"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs disabled:opacity-40 hover:border-teal/40 transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* AI Chat Popup */}
      {aiOpen && (
        <AIChatPopup
          companyId={companyId}
          transactions={allTransactions}
          onClose={() => setAiOpen(false)}
        />
      )}
    </AppLayout>
  );
}
