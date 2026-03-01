import { createContext, useContext, useState, ReactNode } from "react";


export type User = {
  name: string;
  email: string;
  role: string;
  phone: string;
  joinDate: string;
  avatar?: string;
  isPublic: boolean;
  monitoringId?: string; // only set if isPublic = true
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export function generateMonitoringId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "TRK-";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function restoreUserFromToken(): User | null {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Check token expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("auth_token");
      return null;
    }
    const stored = localStorage.getItem("transtrack_user");
    if (stored) return JSON.parse(stored) as User;
    return null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => restoreUserFromToken());

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("transtrack_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("transtrack_user");
      localStorage.removeItem("auth_token");
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
