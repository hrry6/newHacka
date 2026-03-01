import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Shield, BarChart3, Search, Zap, CheckCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/transtrack-logo.png";

const features = [
  { icon: Shield, title: "Anti Pencucian Uang", desc: "Deteksi otomatis pola transaksi mencurigakan dengan AI berbasis blockchain." },
  { icon: BarChart3, title: "Analisis Keuangan AI", desc: "Summarisasi laporan keuangan perusahaan secara real-time dan akurat." },
  { icon: Search, title: "Pelacakan Transaksi", desc: "Lacak setiap transaksi Paylabs dengan ID unik perusahaan yang terverifikasi." },
  { icon: Zap, title: "Monitoring Real-time", desc: "Data transaksi diperbarui secara langsung, tanpa delay." },
];

const stats = [
  { value: "500K+", label: "Transaksi Dipantau" },
  { value: "1,200+", label: "Perusahaan Terdaftar" },
  { value: "99.9%", label: "Uptime Sistem" },
  { value: "< 100ms", label: "Response Time" },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="TransTrack" className="h-9 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="hover:text-foreground transition-colors">Fitur</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Statistik</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/testing" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testing
            </Link>
            <Link to="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm rounded-lg gradient-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Daftar Gratis
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border/50 bg-card p-4 flex flex-col gap-3">
            <a href="#features" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Fitur</a>
            <Link to="/login" className="text-sm text-muted-foreground">Masuk</Link>
            <Link to="/register" className="px-4 py-2 text-sm text-center rounded-lg gradient-accent text-primary-foreground font-medium">Daftar Gratis</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroBg} alt="hero" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-slide-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal/40 bg-teal/10 text-teal text-xs font-medium mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            Powered by Paylabs & Blockchain Technology
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Monitor Transaksi<br />
            <span className="text-teal">Secara Real-time</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform monitoring transaksi payment gateway yang transparan, aman, dan berbasis AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-accent text-primary-foreground font-semibold text-base hover:opacity-90 transition-all shadow-glow"
            >
              Mulai Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border bg-surface hover:border-teal/50 transition-colors text-base font-medium"
            >
              Masuk ke Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 border-y border-border/50 bg-surface">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i} className="animate-counter-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-3xl md:text-4xl font-bold text-teal font-mono mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitur Unggulan</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dirancang khusus untuk memenuhi kebutuhan monitoring keuangan perusahaan modern.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl border border-border bg-card hover:border-teal/40 hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface border-t border-border/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap memulai monitoring<br />
            <span className="text-gold">yang transparan?</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Bergabunglah dengan lebih dari 1,200+ perusahaan yang sudah mempercayai TransTrack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/register")} className="px-8 py-4 rounded-xl gradient-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              Daftar Gratis Sekarang
            </button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {["Tidak perlu kartu kredit", "Setup dalam 5 menit", "Dukungan 24/7"].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="TransTrack" className="h-7 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © 2025 TransTrack. Platform monitoring transaksi berbasis blockchain & AI.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privasi</a>
            <a href="#" className="hover:text-foreground transition-colors">Syarat</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
