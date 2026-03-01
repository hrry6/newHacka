import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { changePassword } from "@/services/api";
import { useUser } from "@/context/UserContext";
import {
  Key, Bell, Globe, Lock,
  Monitor, Smartphone, Laptop, Eye, EyeOff, Check,
  LogOut, AlertTriangle, Settings2
} from "lucide-react";

type Tab = "password" | "notifikasi" | "bahasa" | "sesi";

export default function Settings() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("notifikasi");

  // --- Password ---
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    if (!pw.current) { setPwError("Password saat ini harus diisi."); return; }
    if (pw.newPw.length < 8) { setPwError("Password baru minimal 8 karakter."); return; }
    if (pw.newPw !== pw.confirm) { setPwError("Konfirmasi password tidak cocok."); return; }
    setPwLoading(true);
    try {
      const result = await changePassword(pw.current, pw.newPw);
      if (result.success) {
        setPw({ current: "", newPw: "", confirm: "" });
        setPwSuccess(true);
        setTimeout(() => setPwSuccess(false), 3000);
      } else {
        setPwError(result.error ?? "Gagal mengubah password.");
      }
    } catch {
      setPwError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setPwLoading(false);
    }
  };

  // --- Notifications ---
  const [notif, setNotif] = useState({
    email_transaksi: true,
    email_laporan: true,
    email_keamanan: true,
    push_transaksi: false,
    push_alert: true,
    push_update: false,
  });

  // --- Language ---
  const [lang, setLang] = useState("id");
  const [tz, setTz] = useState("Asia/Jakarta");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [langSaved, setLangSaved] = useState(false);
  const handleLangSave = () => {
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 3000);
  };

  // --- Sessions ---
  const sessions = [
    { id: 1, device: "Chrome · Windows 11", icon: Monitor, location: "Jakarta, Indonesia", time: "Sekarang", current: true },
    { id: 2, device: "Safari · iPhone 15", icon: Smartphone, location: "Surabaya, Indonesia", time: "2 jam lalu", current: false },
    { id: 3, device: "Chrome · MacBook Pro", icon: Laptop, location: "Bandung, Indonesia", time: "1 hari lalu", current: false },
  ];
  const [activeSessions, setActiveSessions] = useState(sessions);
  const revokeSession = (id: number) =>
    setActiveSessions((prev) => prev.filter((s) => s.id === 1 || s.id !== id));

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "notifikasi", label: "Notifikasi", icon: Bell },
    { key: "bahasa", label: "Bahasa & Wilayah", icon: Globe },
    { key: "sesi", label: "Sesi Aktif", icon: Lock },
    { key: "password", label: "Ubah Password", icon: Key },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-in-up">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pengaturan</h1>
              <p className="text-muted-foreground text-sm">Kelola preferensi notifikasi, keamanan, dan tampilan</p>
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Tab list */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === key
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
              <div className="lg:border-t lg:border-border/50 lg:pt-4 lg:mt-4">
                <button
                  onClick={() => { setUser(null); navigate("/"); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all whitespace-nowrap w-full"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Keluar
                </button>
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1">

            {/* ---- NOTIFIKASI ---- */}
            {activeTab === "notifikasi" && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="font-semibold">Preferensi Notifikasi</h3>
                  <p className="text-xs text-muted-foreground mt-1">Atur bagaimana Anda ingin menerima pemberitahuan.</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notifikasi Email</p>
                  {[
                    { key: "email_transaksi" as const, label: "Transaksi Baru", desc: "Notifikasi setiap ada transaksi masuk atau keluar" },
                    { key: "email_keamanan" as const, label: "Keamanan Akun", desc: "Login baru, perubahan password, dan aktivitas mencurigakan" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotif({ ...notif, [key]: !notif[key] })}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notif[key] ? "bg-primary" : "bg-border"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notif[key] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notifikasi Push</p>
                  {[
                    { key: "push_alert" as const, label: "Alert Sistem", desc: "Peringatan penting dari sistem monitoring" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotif({ ...notif, [key]: !notif[key] })}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notif[key] ? "bg-primary" : "bg-border"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notif[key] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- BAHASA ---- */}
            {activeTab === "bahasa" && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div>
                  <h3 className="font-semibold">Bahasa & Wilayah</h3>
                  <p className="text-xs text-muted-foreground mt-1">Sesuaikan bahasa tampilan dan zona waktu Anda.</p>
                </div>
                {langSaved && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                    <Check className="w-4 h-4" /> Pengaturan disimpan!
                  </div>
                )}
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-2">Bahasa Tampilan</label>
                    <select value={lang} onChange={(e) => setLang(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm focus:outline-none focus:border-primary transition-colors">
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-2">Zona Waktu</label>
                    <select value={tz} onChange={(e) => setTz(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm focus:outline-none focus:border-primary transition-colors">
                      <option value="Asia/Jakarta">WIB – Waktu Indonesia Barat (UTC+7)</option>
                      <option value="Asia/Makassar">WITA – Waktu Indonesia Tengah (UTC+8)</option>
                      <option value="Asia/Jayapura">WIT – Waktu Indonesia Timur (UTC+9)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-2">Format Tanggal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((fmt) => (
                        <button key={fmt} onClick={() => setDateFormat(fmt)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-mono transition-colors ${dateFormat === fmt ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary hover:border-primary/40"}`}>
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleLangSave}
                    className="w-full py-2.5 rounded-xl gradient-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {/* ---- SESI AKTIF ---- */}
            {activeTab === "sesi" && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div>
                  <h3 className="font-semibold">Sesi Aktif</h3>
                  <p className="text-xs text-muted-foreground mt-1">Kelola perangkat yang sedang login ke akun Anda.</p>
                </div>
                <div className="space-y-3">
                  {activeSessions.map((s) => (
                    <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border ${s.current ? "border-primary/30 bg-primary/5" : "border-border/50 bg-secondary"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.current ? "bg-primary/15 border border-primary/20" : "bg-border/30"}`}>
                        <s.icon className={`w-5 h-5 ${s.current ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{s.device}</p>
                          {s.current && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 flex-shrink-0">Perangkat ini</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.location} · {s.time}</p>
                      </div>
                      {!s.current && (
                        <button onClick={() => revokeSession(s.id)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10 transition-colors">
                          Cabut Akses
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {activeSessions.length > 1 && (
                  <button onClick={() => setActiveSessions(sessions.filter((s) => s.current))}
                    className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-colors">
                    Cabut Semua Sesi Lain
                  </button>
                )}
                <div className="border-t border-border/50 pt-5">
                  <p className="text-sm font-semibold text-destructive mb-1">Zona Berbahaya</p>
                  <p className="text-xs text-muted-foreground mb-3">Tindakan ini tidak dapat dibatalkan.</p>
                  <button onClick={() => { setUser(null); navigate("/"); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-colors">
                    <AlertTriangle className="w-4 h-4" /> Logout dari Semua Perangkat
                  </button>
                </div>
              </div>
            )}

            {/* ---- PASSWORD ---- */}
            {activeTab === "password" && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div>
                  <h3 className="font-semibold">Ubah Password</h3>
                  <p className="text-xs text-muted-foreground mt-1">Pastikan password baru minimal 8 karakter dan mengandung kombinasi huruf & angka.</p>
                </div>
                {pwSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                    <Check className="w-4 h-4" /> Password berhasil diubah!
                  </div>
                )}
                {pwError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" /> {pwError}
                  </div>
                )}
                <div className="space-y-4 max-w-md">
                  {([
                    { label: "Password Saat Ini", field: "current" as const },
                    { label: "Password Baru", field: "newPw" as const },
                    { label: "Konfirmasi Password Baru", field: "confirm" as const },
                  ] as const).map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-sm font-medium text-foreground/80 block mb-2">{label}</label>
                      <div className="relative">
                        <input
                          type={showPw[field] ? "text" : "password"}
                          value={pw[field]}
                          onChange={(e) => setPw({ ...pw, [field]: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-input text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        />
                        <button type="button"
                          onClick={() => setShowPw({ ...showPw, [field]: !showPw[field] })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleChangePassword} disabled={pwLoading}
                    className="w-full py-2.5 rounded-xl gradient-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {pwLoading ? "Menyimpan..." : "Simpan Password Baru"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
