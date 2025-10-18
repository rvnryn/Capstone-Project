"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  JSX,
} from "react";
import { supabase } from "@/app/utils/Server/supabaseClient";

// --- Types ---
export type UserRole =
  | "Owner"
  | "General Manager"
  | "Store Manager"
  | "Assistant Store Manager"
  | null;

export interface AuthUser {
  id: string;
  user_id?: number;
  email?: string;
  name?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

// --- Context ---
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  refreshSession: async () => {
    throw new Error("Function not implemented.");
  },
});
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Persistent session: load from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUser = localStorage.getItem("cachedUser");
      const cachedRole = localStorage.getItem("cachedRole");
      if (cachedUser && cachedRole) {
        setUser(JSON.parse(cachedUser));
        setRole(cachedRole as UserRole);
      }
    }
  }, []);
  console.log("AuthProvider mounted");

  const refreshSession = async () => {
    if (refreshing) return;
    setRefreshing(true);
    // If offline, try to load from cache
    if (typeof window !== "undefined" && !navigator.onLine) {
      const cachedUser = localStorage.getItem("cachedUser");
      const cachedRole = localStorage.getItem("cachedRole");
      if (cachedUser && cachedRole) {
        setUser(JSON.parse(cachedUser));
        setRole(cachedRole as UserRole);
        setLoading(false);
        setRefreshing(false);
        return;
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }
    const { data, error } = await supabase.auth.getSession();
    console.log("Supabase session:", data.session, "Error:", error);

    const session = data.session;
    if (
      error ||
      !session ||
      !session.user ||
      !session.access_token ||
      (session.expires_at && session.expires_at * 1000 < Date.now())
    ) {
      setUser(null);
      setRole(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("cachedUser");
        localStorage.removeItem("cachedRole");
      }
      setRefreshing(false);
      return;
    }

    const supabaseUser = session.user;
    // Always set auth_id for robust identity checks
    const newUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      ...supabaseUser.user_metadata,
      auth_id: supabaseUser.user_metadata?.auth_id || supabaseUser.id,
    };
    setUser(newUser);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRole(data.role);
      setUser((prev) => ({
        ...prev,
        ...data.user,
        auth_id: data.user?.auth_id || prev?.auth_id || prev?.id,
      }));
      // Cache user and role for offline login
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "cachedUser",
          JSON.stringify({ ...newUser, ...data.user })
        );
        localStorage.setItem("cachedRole", data.role);
      }
    } catch (err) {
      // Patch: If offline and cached user exists, do NOT force logout
      if (typeof window !== "undefined" && !navigator.onLine) {
        const cachedUser = localStorage.getItem("cachedUser");
        const cachedRole = localStorage.getItem("cachedRole");
        if (cachedUser && cachedRole) {
          setUser(JSON.parse(cachedUser));
          setRole(cachedRole as UserRole);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
      setUser(null);
      setRole(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("cachedUser");
        localStorage.removeItem("cachedRole");
      }
      await supabase.auth.signOut();
      setRefreshing(false);
      return;
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (
          session &&
          session.user &&
          session.access_token &&
          (!session.expires_at || session.expires_at * 1000 > Date.now())
        ) {
          refreshSession();
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
        }
      }
    );
    refreshSession();
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, refreshSession }}>
      {loading ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#facc15", fontSize: 24 }}>Loading...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export {};
