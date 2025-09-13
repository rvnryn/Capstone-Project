/* eslint-disable @typescript-eslint/no-explicit-any */
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
import axios from "@/app/lib/axios";

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

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  console.log("AuthProvider mounted");

  const refreshSession = async () => {
    if (refreshing) return;
    setRefreshing(true);
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
      }
      setRefreshing(false);
      return;
    }

    const supabaseUser = session.user;
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      ...supabaseUser.user_metadata,
    });

    try {
      const res = await axios.get("/api/auth/session", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setRole(res.data.role);
      setUser((prev) => ({
        ...prev,
        ...res.data.user,
      }));
    } catch (err) {

      setUser(null);
      setRole(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#facc15", fontSize: 24 }}>Loading...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export {};
