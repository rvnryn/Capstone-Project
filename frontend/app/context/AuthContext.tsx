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
import { supabase } from "@/app/utils/Server/supabaseClient"; // Import your Supabase client
import axios from "@/app/lib/axios";

// --- Types ---
export type UserRole =
  | "Owner"
  | "General Manager"
  | "Store Manager"
  | "Assistant Store Manager"
  | null;

export interface AuthUser {
  id: string; // Supabase auth_id
  user_id?: number; // Integer PK from users table
  email?: string;
  name?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  refreshSession: () => Promise<void>;
}

// --- Context ---
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  refreshSession: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
});

export const useAuth = () => useContext(AuthContext);

// --- Provider ---
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  console.log("AuthProvider mounted");

  // Hybrid session refresh: get Supabase session, then backend info
  const refreshSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    console.log("Supabase session:", data.session, "Error:", error);

    // Only proceed if session and user exist and token is not expired
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
      // If backend returns 401, clear session
      setUser(null);
      setRole(null);
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    console.log("useEffect running");
    // Listen for Supabase auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshSession();
    });
    // Initial session fetch
    refreshSession();
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export {};
