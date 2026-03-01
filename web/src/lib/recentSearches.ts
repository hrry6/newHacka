const KEY = "transtrack_recent_searches";
const MAX = 5;

export interface RecentSearch {
  userId: string;
  name: string;
  time: string; // ISO string
}

export function getRecentSearches(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRecentSearch(userId: string, name: string) {
  const searches = getRecentSearches().filter((s) => s.userId !== userId);
  searches.unshift({ userId, name, time: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(searches.slice(0, MAX)));
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}
