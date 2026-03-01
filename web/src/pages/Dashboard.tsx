import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, History, User, ArrowRight, TrendingUp, CheckCircle, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { getRecentSearches, formatRelativeTime, type RecentSearch } from "@/lib/recentSearches";

const quickStats = [
  { label: "Total Transaksi Hari Ini", value: "12,483", change: "+8.2%", up: true, icon: TrendingUp },
  { label: "Akun Aktif", value: "984", change: "+7 hari ini", up: true, icon: CheckCircle },
  { label: "Akun Publik Terdaftar", value: "1,247", change: "+12 baru", up: true, icon: CheckCircle },
  { label: "Status Sistem", value: "Normal", change: "Uptime 99.9%", up: true, icon: CheckCircle },
];

export default function Dashboard() {
  const [searchId, setSearchId] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/monitoring?id=${encodeURIComponent(searchId.trim())}`);
    }
  };

  const handleQuickSearch = (userId: string) => {
    navigate(`/monitoring?id=${encodeURIComponent(userId)}`);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Welcome */}
        <div className="mb-10 animate-slide-in-up">
          <p className="text-muted-foreground text-sm mb-1">Selamat datang kembali!</p>
          <h1 className="text-3xl font-bold">Dashboard Monitoring</h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {quickStats.map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border bg-card hover:border-teal/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                <stat.icon className={`w-4 h-4 flex-shrink-0 ${stat.up ? "text-teal" : "text-gold"}`} />
              </div>
              <p className="text-xl font-bold font-mono">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.up ? "text-teal" : "text-gold"}`}>{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="p-8 rounded-2xl border border-border bg-card mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-teal" />
            <h2 className="text-lg font-semibold">Cari Akun Publik</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Masukkan <span className="font-medium text-foreground">User ID</span> akun publik untuk
            melihat riwayat transaksinya
          </p>
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Masukkan User ID... {ex: ce466....} atau ketik 'my_data' untuk cari data pribadi"
                  className="w-full pl-11 pr-4 py-4 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 rounded-xl gradient-accent text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-glow whitespace-nowrap"
              >
                Cari
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Hanya akun dengan visibilitas <span className="text-teal font-medium">Publik</span> yang dapat ditemukan.
            Akun privat tidak dapat dicari.
          </p>
        </div>

        {/* Recent Searches */}
        <div className="p-6 rounded-2xl border border-border bg-card animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Pencarian Terakhir</h2>
          </div>
          {recentSearches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada riwayat pencarian.
            </p>
          )}
          <div className="space-y-2">
            {recentSearches.map((item, i) => (
              <button
                key={i}
                onClick={() => handleQuickSearch(item.userId)}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface transition-colors group border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground group-hover:text-teal transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.userId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatRelativeTime(item.time)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-teal transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
