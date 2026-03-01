import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CheckCircle, Globe, Lock, Copy, Check } from "lucide-react";
import logoImg from "@/assets/transtrack-logo.png";
import { generateMonitoringId } from "@/context/UserContext";

const benefits = ["Akses monitoring real-time", "Deteksi anomali otomatis", "Laporan AI komprehensif"];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isPublic, setIsPublic] = useState(false);
  const [monitoringId] = useState(() => generateMonitoringId());
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.message || json?.error || "Registrasi gagal, coba lagi.");
        return;
      }

      navigate("/login");
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(monitoringId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center animate-slide-in-up">
        {/* Left side info */}
        <div className="hidden md:block">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <img src={logoImg} alt="TransTrack" className="h-14 w-auto" />
          </Link>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Mulai monitoring<br />
            <span className="text-teal">transaksi Anda</span><br />
            hari ini
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Platform terpercaya untuk transparansi dan akuntabilitas keuangan berbasis blockchain.
          </p>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-teal flex-shrink-0" />
                <span className="text-foreground/80">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 rounded-xl border border-teal/20 bg-teal/5">
            <p className="text-xs text-muted-foreground">
              💡 Bergabunglah dengan <span className="text-teal font-medium">1,200+ pengguna</span> yang sudah menggunakan TransTrack untuk memastikan transparansi keuangan mereka.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          <div className="md:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logoImg} alt="TransTrack" className="h-10 w-auto" />
            </Link>
          </div>
          <div className="p-8 rounded-2xl border border-border bg-card">
            <h1 className="text-xl font-bold mb-1">Buat Akun Baru</h1>
            <p className="text-muted-foreground text-sm mb-6">Daftar gratis, mulai monitoring sekarang</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-2">Nama / Nama Perusahaan</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe / PT. Contoh Perusahaan"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm pr-12"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Visibilitas Akun */}
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-2">Visibilitas Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      !isPublic
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-xs">Privat</p>
                      <p className="text-xs opacity-70 font-normal">Tidak bisa dicari</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isPublic
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-border bg-secondary text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-xs">Publik</p>
                      <p className="text-xs opacity-70 font-normal">Generate ID monitoring</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Monitoring ID preview */}
              {isPublic && (
                <div className="p-3 rounded-xl border border-teal/30 bg-teal/5 animate-fade-in">
                  <p className="text-xs text-muted-foreground mb-1.5">ID Monitoring kamu:</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-teal text-base tracking-widest">{monitoringId}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-teal transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Bagikan ID ini agar transaksimu bisa dipantau publik.</p>
                </div>
              )}

              <div className="flex items-start gap-2 pt-1">
                <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded border-border accent-primary" />
                <p className="text-xs text-muted-foreground">
                  Saya menyetujui <a href="#" className="text-teal hover:underline">Syarat & Ketentuan</a> dan{" "}
                  <a href="#" className="text-teal hover:underline">Kebijakan Privasi</a>
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl gradient-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Mendaftar..." : "Buat Akun"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link to="/login" className="text-teal hover:text-primary font-medium transition-colors">
                  Masuk sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
