import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bot, Send, RefreshCw, Sparkles, User, Hash,
  CreditCard, Calendar, Package, Building2, MessageSquare,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock,
  Trash2
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { fetchTransactions } from "@/services/api";
import type { Transaction } from "@/types/transaction";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const statusConfig = {
  success: { label: "Berhasil", class: "text-teal bg-teal/10 border-teal/30", icon: CheckCircle },
  pending: { label: "Pending", class: "text-gold bg-gold/10 border-gold/30", icon: Clock },
  failed: { label: "Gagal", class: "text-destructive bg-destructive/10 border-destructive/30", icon: AlertTriangle },
};

const QUICK_PROMPTS = [
  "Apakah ada transaksi yang mencurigakan atau circular?",
  "Rangkum status semua transaksi yang ada",
  "Transaksi mana yang nilainya paling besar?",
  "Analisis distribusi metode pembayaran yang digunakan",
  "Ada transaksi gagal yang perlu ditindaklanjuti?",
];

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    });
  } catch { return ts; }
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-foreground mt-2">{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={i} className="font-bold text-foreground text-base mt-2">{line.slice(3)}</h2>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="flex gap-1.5"><span className="text-teal mt-1">•</span><span>{line.slice(2)}</span></p>;
        if (line.match(/^\d+\. /)) return <p key={i} className="flex gap-1.5"><span className="text-teal font-mono text-xs mt-0.5">{line.match(/^\d+/)![0]}.</span><span>{line.replace(/^\d+\. /, "")}</span></p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        // Bold inline **text**
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

export default function TransactionAI() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("id") || "";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txCollapsed, setTxCollapsed] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load transactions
  const loadTransactions = async () => {
    setTxLoading(true);
    try {
      const result = await fetchTransactions({ merchantId: companyId, perPage: 20, page: 1 });
      setTransactions(result.data);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, [companyId]);
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

    let assistantContent = "";

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/transaction-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          transactions: transactions.slice(0, 20),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) throw new Error("Rate limit tercapai, coba lagi beberapa saat.");
        if (resp.status === 402) throw new Error("Kredit AI habis. Tambah kredit di pengaturan workspace.");
        throw new Error(errData.error ?? "Gagal menghubungi AI");
      }

      if (!resp.body) throw new Error("Tidak ada response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "") continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setError(msg);
      setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && m.content === "")));
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setError(null); };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                AI Analisis Transaksi
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-medium">
                  <Sparkles className="w-3 h-3" /> Powered by AI
                </span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Merchant: <span className="text-teal">{companyId}</span> · {transactions.length} transaksi dimuat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTransactions}
              disabled={txLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface hover:border-teal/40 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${txLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Transaction List Panel */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          <button
            onClick={() => setTxCollapsed((c) => !c)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-surface hover:bg-surface/80 transition-colors border-b border-border"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal" />
              <span className="font-semibold text-sm">List Data Transaksi</span>
              <span className="px-2 py-0.5 rounded-full bg-teal/10 text-teal text-xs font-mono">{transactions.length}</span>
            </div>
            {txCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          </button>

          {!txCollapsed && (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              {txLoading ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-teal" />
                  Memuat transaksi...
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface border-b border-border">
                    <tr>
                      {[
                        { label: "Trade No.", icon: Hash },
                        { label: "Request ID", icon: Hash },
                        { label: "Timestamp", icon: Calendar },
                        { label: "Produk", icon: Package },
                        { label: "Tipe", icon: CreditCard },
                        { label: "Nominal" },
                        { label: "Status" },
                      ].map((col) => (
                        <th key={col.label} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            {col.icon && <col.icon className="w-3 h-3" />}
                            {col.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {transactions.map((t) => {
                      const sc = statusConfig[t.status];
                      const Icon = sc.icon;
                      return (
                        <tr key={t.merchantTradeNo} className="hover:bg-surface/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs text-teal">{t.merchantTradeNo}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground">{t.requestId}</span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs text-foreground">
                            {formatTimestamp(t.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground max-w-[140px] truncate">{t.message}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">{t.paymentType}</span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold whitespace-nowrap">
                            Rp {t.amountNum.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.class}`}>
                              <Icon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* AI Chatbot Panel */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-sm">AI Analis Transaksi</span>
                <p className="text-xs text-muted-foreground">Tanya apa saja tentang data transaksi kamu</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="min-h-[360px] max-h-[480px] overflow-y-auto p-5 space-y-4 bg-background/40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-5">
                <div className="w-16 h-16 rounded-2xl gradient-accent/20 border border-teal/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-teal" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Halo! Saya AI Analis Transaksi</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Saya bisa membantu menganalisis pola transaksi, deteksi anomali, dan memberikan insight dari data Paylabs kamu.
                  </p>
                </div>
                {/* Quick prompts */}
                <div className="w-full max-w-lg grid grid-cols-1 gap-2">
                  <p className="text-xs text-muted-foreground text-center mb-1">Coba tanya:</p>
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-left px-3.5 py-2.5 rounded-xl border border-border bg-card hover:border-teal/40 hover:bg-teal/5 transition-all text-xs text-foreground/80"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : msg.content === "" && aiLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Menganalisis...
                      </div>
                    ) : (
                      <MarkdownText text={msg.content} />
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt chips (when chat has messages) */}
          {messages.length > 0 && (
            <div className="px-5 py-2 border-t border-border/50 flex gap-2 overflow-x-auto">
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
          <div className="p-4 border-t border-border bg-surface">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanya tentang transaksi... (Enter untuk kirim, Shift+Enter baris baru)"
                  rows={2}
                  disabled={aiLoading}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm resize-none disabled:opacity-60"
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || aiLoading}
                className="flex-shrink-0 w-11 h-11 rounded-xl gradient-accent text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {aiLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              AI memiliki akses ke {transactions.length} transaksi · Didukung Qwen 3.5 AI
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
