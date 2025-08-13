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
}

// --- Context ---
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
});

export const useAuth = () => useContext(AuthContext);

// --- Helper to fetch user role from DB ---
async function fetchUserRole(authId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_role")
      .eq("auth_id", authId)
      .single();
    console.log("fetchUserRole result:", { data, error, authId });
    if (error || !data) return null;
    return (data.user_role as UserRole) || null;
  } catch (e) {
    console.error("fetchUserRole exception", e);
    return null;
  }
}

// --- Provider ---
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    const updateAuthState = async (sessionUser: AuthUser | null) => {
      if (sessionUser) {
        // Fetch user_id and name from users table
        const { data } = await supabase
          .from("users")
          .select("user_id, name")
          .eq("auth_id", sessionUser.id)
          .single();
        const user_id = data?.user_id;
        const name = data?.name || undefined;
        const userWithDetails = { ...sessionUser, user_id, name };
        setUser(userWithDetails);
        console.log(
          "[AuthContext] user_id set:",
          user_id,
          "user:",
          userWithDetails
        );
        const fetchedRole = await fetchUserRole(sessionUser.id);
        setRole(fetchedRole);
      } else {
        setUser(null);
        setRole(null);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log("[AuthContext] getSession result:", session);
        updateAuthState((session?.user as AuthUser) || null);
      })
      .catch((err) => {
        setUser(null);
        setRole(null);
        console.error("[AuthContext] getSession error:", err);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("[AuthContext] onAuthStateChange:", session);
        updateAuthState((session?.user as AuthUser) || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Always return valid JSX
  return (
    <AuthContext.Provider value={{ user, role }}>
      <>{children}</>
    </AuthContext.Provider>
  );
}

export {};
