import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, FlaskConical, CheckCircle2, Hash, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/transtrack-logo.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface TxResult {
  success: boolean;
  txUuid?: string;
  txHash?: string;
  cid?: string;
  verified_at?: string;
  error?: string;
}

const PAYMENT_TYPES = [
  { value: "CREDIT", label: "Credit Card" },
  { value: "DEBIT", label: "Debit Card" },
  { value: "VA", label: "Virtual Account" },
  { value: "QRIS", label: "QRIS" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

export default function Testing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    sender_id: "11b54320-319a-4113-8d9a-ff7faed98b06",
    receiver_id: "109dd170-7181-4dee-b0f3-1904a515a09a",
    amount: "",
    payment_type: "CREDIT",
    message: "",
    invoice_no: "",
    item: "",
    provider: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sender_id.trim() || !form.receiver_id.trim() || !form.amount) {
      toast({
        title: "Validasi Gagal",
        description: "ID Pengirim, ID Penerima, dan Nominal wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const body = {
        sender_id: '11b54320-319a-4113-8d9a-ff7faed98b06',
        receiver_id: '109dd170-7181-4dee-b0f3-1904a515a09a',
        amount: parseFloat(form.amount),
        payment_type: form.payment_type,
        message: form.message.trim(),
        payload: {
          invoice_no: form.invoice_no.trim() || undefined,
          item: form.item.trim() || undefined,
          provider: form.provider.trim() || undefined,
        },
      };

      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        setResult({ success: false, error: json?.message || json?.error || "Gagal mengirim transaksi." });
        toast({ title: "Gagal", description: json?.message || "Terjadi kesalahan.", variant: "destructive" });
      } else {
        setResult(json);
        toast({ title: "Transaksi Berhasil!", description: `TX UUID: ${json.txUuid}` });
      }
    } catch {
      const msg = "Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:5000.";
      setResult({ success: false, error: msg });
      toast({ title: "Koneksi Gagal", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali
        </button>
        <div className="h-5 w-px bg-border" />
        <img src={logoImg} alt="TransTrack" className="h-7 w-auto" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal/30 bg-teal/10">
          <FlaskConical className="w-3 h-3 text-teal" />
          <span className="text-xs font-medium text-teal">Demo Mode</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Testing Transaksi</h1>
            <p className="text-sm text-muted-foreground">
              Kirim transaksi ke endpoint <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">POST /api/transactions</code>. Tidak perlu akun.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ID Pengirim */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="sender_id">
                  ID Pengirim <span className="text-destructive">*</span>
                </label>
                <input
                  id="sender_id"
                  name="sender_id"
                  value="11b54320-319a-4113-8d9a-ff7faed98b06"
                  disabled
                  placeholder="Contoh: 11b54320-319a-4113-8d9a-ff7faed98b06"
                  className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all font-mono"
                />
              </div>

              {/* ID Penerima */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="receiver_id">
                  ID Penerima <span className="text-destructive">*</span>
                </label>
                <input
                  id="receiver_id"
                  name="receiver_id"
                  value="109dd170-7181-4dee-b0f3-1904a515a09a"
                  disabled
                  placeholder="Contoh: 109dd170-7181-4dee-b0f3-1904a515a09a"
                  className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all font-mono"
                />
              </div>

              {/* Nominal + Tipe Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="amount">
                    Nominal (IDR) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rp</span>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="payment_type">
                    Tipe Pembayaran
                  </label>
                  <select
                    id="payment_type"
                    name="payment_type"
                    value="CREDIT"
                    disabled
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all"
                  >
                    {PAYMENT_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pesan */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="message">
                  Pesan <span className="text-muted-foreground text-xs font-normal">(opsional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  placeholder="Keterangan transaksi..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all resize-none"
                />
              </div>

              {/* Payload */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payload (opsional)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="invoice_no">Invoice No</label>
                    <input
                      id="invoice_no"
                      name="invoice_no"
                      value="INV-010"
                      disabled
                      placeholder="INV-001"
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="item">Item</label>
                    <input
                      id="item"
                      name="item"
                      value="test"
                      disabled
                      placeholder="Design System"
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="provider">Provider</label>
                    <input
                      id="provider"
                      name="provider"
                      value="Paylabs"
                      disabled
                      placeholder="Paylabs"
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal/60 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl gradient-accent text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? "Mengirim..." : "Kirim Transaksi"}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl border p-6 space-y-4 ${result.success ? "border-teal/30 bg-teal/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-5 h-5 ${result.success ? "text-teal" : "text-destructive"}`} />
                <span className={`font-semibold text-sm ${result.success ? "text-teal" : "text-destructive"}`}>
                  {result.success ? "Transaksi Berhasil" : "Transaksi Gagal"}
                </span>
              </div>

              {result.success ? (
                <div className="space-y-2.5">
                  {[
                    { icon: FileText, label: "TX UUID", value: result.txUuid },
                    { icon: Hash, label: "TX Hash", value: result.txHash },
                    { icon: Hash, label: "CID (IPFS)", value: result.cid },
                    { icon: CheckCircle2, label: "Verified At", value: result.verified_at ? new Date(result.verified_at).toLocaleString("id-ID") : undefined },
                  ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
                    <div key={label} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {label}
                      </p>
                      <p className="text-xs font-mono text-foreground break-all bg-muted/50 rounded-lg px-3 py-2">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{result.error}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
