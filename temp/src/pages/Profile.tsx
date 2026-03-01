import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { generateShareId, deleteShareId, loadUserProfile } from "@/services/api";
import {
  User, Mail, Shield, Calendar,
  Edit3, Save, X, Camera, Check, Globe, Lock, Copy, RefreshCw
} from "lucide-react";

export default function Profile() {
  const { user, setUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const defaultUser = {
    name: "John Doe",
    email: "john.doe@perusahaan.com",
    role: "Administrator",
    phone: "+62 812-3456-7890",
    joinDate: "Januari 2024",
    isPublic: false,
    monitoringId: undefined as string | undefined,
  };

  // currentUser selalu up-to-date dari context (reaktif)
  const currentUser = user ?? defaultUser;

  const [form, setForm] = useState({ ...currentUser });
  const [editing, setEditing] = useState(false);

  // Load profil dari database saat pertama kali
  useEffect(() => {
    loadUserProfile().then((profile) => {
      if (profile) {
        const updated = { ...currentUser, isPublic: profile.isPublic, monitoringId: profile.monitoringId };
        setForm(updated);
        setUser(updated);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Toggle public/private
  const handleTogglePublic = async (pub: boolean) => {
    setShareError(null);

    if (!pub) {
      // Jalankan DELETE /api/user/share/delete
      setShareLoading(true);
      const result = await deleteShareId();
      setShareLoading(false);
      if (!result.success) {
        setShareError(result.error || "Gagal mengubah ke mode privat.");
        return;
      }
      const updated = { ...currentUser, ...form, isPublic: false, monitoringId: undefined };
      setForm(updated);
      setUser(updated);
      return;
    }

    // Sudah publik & sudah punya ID — tidak perlu generate ulang
    if (currentUser.monitoringId) {
      const updated = { ...currentUser, ...form, isPublic: true };
      setForm(updated);
      setUser(updated);
      return;
    }

    // Jalankan POST /api/user/share/generate
    setShareLoading(true);
    const result = await generateShareId();
    setShareLoading(false);

    if (!result.success || !result.monitoringId) {
      setShareError(result.error || "Gagal generate ID monitoring.");
      return;
    }

    const updated = { ...currentUser, ...form, isPublic: true, monitoringId: result.monitoringId };
    setForm(updated);
    setUser(updated);
  };

  const handleSave = () => {
    setUser({ ...form });
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  const handleCancel = () => { setForm({ ...currentUser }); setEditing(false); };

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleCopy = () => {
    if (currentUser.monitoringId) {
      navigator.clipboard.writeText(currentUser.monitoringId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-in-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Profil Saya</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola informasi akun Anda</p>
        </div>

        {/* Avatar card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl gradient-accent flex items-center justify-center shadow-glow overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-primary-foreground">{initials}</span>
                }
              </div>
              <button
                onClick={handlePhotoClick}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
                title="Ganti foto profil"
              >
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-sm text-muted-foreground">{currentUser.role}</p>
              <p className="text-xs text-muted-foreground mt-1">Bergabung sejak {currentUser.joinDate}</p>
              {/* Visibility badge */}
              <div className="mt-2 flex items-center gap-2">
                {currentUser.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-teal/10 text-teal border border-teal/20 font-medium">
                    <Globe className="w-3 h-3" /> Publik
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border font-medium">
                    <Lock className="w-3 h-3" /> Privat
                  </span>
                )}
                {currentUser.isPublic && currentUser.monitoringId && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-teal/20 bg-teal/5 text-teal font-mono hover:bg-teal/10 transition-colors"
                  >
                    <span className="tracking-wider">{currentUser.monitoringId}</span>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            {saveSuccess && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                <Check className="w-4 h-4" /> Perubahan disimpan
              </div>
            )}
          </div>
        </div>

        {/* Info form */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Informasi Pribadi</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary hover:border-primary/40 transition-colors text-sm">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:border-destructive/40 transition-colors">
                  <X className="w-4 h-4" /> Batal
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  <Save className="w-4 h-4" /> Simpan
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: User, label: "Nama / Nama Perusahaan", key: "name", type: "text" },
              { icon: Mail, label: "Email", key: "email", type: "email" },
              { icon: Shield, label: "Role", key: "role", type: "text" },
              { icon: Calendar, label: "Bergabung Sejak", key: "joinDate", type: "text" },
            ].map(({ icon: Icon, label, key, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </label>
                {editing && key !== "joinDate" && key !== "role" ? (
                  <input
                    type={type}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-secondary text-sm text-foreground">
                    {form[key as keyof typeof form] as string}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visibilitas Akun */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold">Visibilitas Akun</h3>
            <p className="text-sm text-muted-foreground mt-1">Atur apakah akun Anda bisa ditemukan dan dipantau publik.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setEditing(false); handleTogglePublic(false); }}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border text-left transition-all ${
                !currentUser.isPublic
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-border/80"
              }`}
            >
              <Lock className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Privat</p>
                <p className="text-xs opacity-70 mt-0.5">Tidak bisa dicari pengguna lain</p>
              </div>
            </button>
            <button
              disabled={shareLoading}
              onClick={() => { setEditing(false); handleTogglePublic(true); }}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border text-left transition-all ${
                currentUser.isPublic
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-border bg-secondary text-muted-foreground hover:border-border/80"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {shareLoading
                ? <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin" />
                : <Globe className="w-5 h-5 flex-shrink-0" />}
              <div>
                <p className="font-semibold text-sm">Publik</p>
                <p className="text-xs opacity-70 mt-0.5">{shareLoading ? "Memproses..." : "Generate ID monitoring"}</p>
              </div>
            </button>
          </div>

          {shareError && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
              {shareError}
            </div>
          )}

          {currentUser.isPublic && currentUser.monitoringId && (
            <div className="p-4 rounded-xl border border-teal/30 bg-teal/5 animate-fade-in">
              <p className="text-xs text-muted-foreground mb-2">ID Monitoring kamu:</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-teal text-lg tracking-widest">{currentUser.monitoringId}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-teal/30 bg-teal/10 text-teal hover:bg-teal/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Tersalin!" : "Salin ID"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bagikan ID ini agar transaksi kamu bisa dipantau oleh pengguna lain melalui fitur pencarian.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
