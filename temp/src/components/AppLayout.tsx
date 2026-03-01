// AppLayout v2 - uses TransTrack logo
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, LogOut,
  Bell, Menu, X, Settings, User, CheckCircle,
  AlertTriangle, Clock, ChevronRight
} from "lucide-react";
import transtrackLogo from "@/assets/transtrack-logo.png";
import { useUser } from "@/context/UserContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Settings, label: "Pengaturan", path: "/settings" },
];

type NotifItem = {
  id: number;
  type: "success" | "warning" | "info";
  title: string;
  desc: string;
  time: string;
  read: boolean;
};

const INITIAL_NOTIFS: NotifItem[] = [
  { id: 1, type: "success", title: "Transaksi Berhasil", desc: "TRX-100001 sebesar Rp 5.000.000 berhasil diproses", time: "2 menit lalu", read: false },
  { id: 2, type: "warning", title: "Transaksi Pending", desc: "TRX-100008 masih menunggu konfirmasi bank", time: "15 menit lalu", read: false },
  { id: 3, type: "warning", title: "Anomali Terdeteksi", desc: "Aktivitas tidak biasa pada PYL-284710", time: "1 jam lalu", read: false },
  { id: 4, type: "info", title: "Laporan Mingguan Siap", desc: "Laporan periode 9–15 Jan 2025 tersedia", time: "3 jam lalu", read: true },
  { id: 5, type: "success", title: "Login Baru", desc: "Login dari Safari · iPhone 15 di Surabaya", time: "2 jam lalu", read: true },
];

const notifIcon = {
  success: <CheckCircle className="w-4 h-4 text-teal" />,
  warning: <AlertTriangle className="w-4 h-4 text-gold" />,
  info: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>(INITIAL_NOTIFS);
  const bellRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const unreadCount = notifs.filter((n) => !n.read).length;

  const displayName = user?.name ?? "John Doe";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => { setUser(null); navigate("/"); };

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={transtrackLogo} alt="TransTrack Logo" className="w-10 h-10 object-contain flex-shrink-0" />
            <div>
              <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
                Trans<span className="text-teal">Track</span>
              </span>
              <p className="text-xs text-muted-foreground -mt-0.5">Monitoring Platform</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">Menu</p>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-primary/10 text-teal border border-teal/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
                <item.icon className={`w-4 h-4 ${active ? "text-teal" : "group-hover:text-teal transition-colors"}`} />
                {item.label}
                {active && <ChevronRight className="ml-auto w-4 h-4 text-teal" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user */}
        <div className="p-4 border-t border-sidebar-border">
          <Link to="/profile" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent mb-2 hover:border hover:border-teal/20 transition-all">
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? "john.doe@perusahaan.com"}</p>
            </div>
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-4 px-6 py-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* Bell with dropdown */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  className="relative p-2 rounded-xl hover:bg-surface transition-colors"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center text-[9px] font-bold text-background">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-card shadow-[0_8px_40px_-12px_hsl(196_50%_4%/0.9)] z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-teal" />
                        <span className="font-semibold text-sm">Notifikasi</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-bold">{unreadCount}</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-teal hover:text-primary transition-colors">
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                      {notifs.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-surface transition-colors flex gap-3 ${!n.read ? "bg-primary/3" : ""}`}
                        >
                          <div className="flex-shrink-0 mt-0.5">{notifIcon[n.type]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-semibold truncate ${!n.read ? "text-foreground" : "text-foreground/70"}`}>{n.title}</p>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.desc}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-border bg-surface">
                      <Link to="/settings" onClick={() => setBellOpen(false)}
                        className="text-xs text-teal hover:text-primary transition-colors">
                        Kelola preferensi notifikasi →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile avatar */}
              <Link to="/profile"
                className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Profil Saya">
                <span className="text-xs font-bold text-primary-foreground">{initials}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
