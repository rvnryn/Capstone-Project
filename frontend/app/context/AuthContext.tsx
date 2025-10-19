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
      const cachedUserRaw = localStorage.getItem("cachedUser");
      const cachedRole = localStorage.getItem("cachedRole");
      const token = localStorage.getItem("token");
      console.log("[AuthProvider] Initial localStorage:", { cachedUser: cachedUserRaw, cachedRole, token });
      if (cachedUserRaw && cachedRole && token) {
        const cachedUser = JSON.parse(cachedUserRaw);
        // Ensure user object always has 'id'
        setUser({
          ...cachedUser,
          id: cachedUser.id || cachedUser.user_id || null,
          user_id: typeof cachedUser.user_id === 'number' ? cachedUser.user_id : (typeof cachedUser.id === 'string' ? parseInt(cachedUser.id, 10) : cachedUser.id),
        });
        setRole(cachedRole as UserRole);
      }
    }
  }, []);
  console.log("AuthProvider mounted");

  const refreshSession = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (
        session.data.session &&
        session.data.session.user &&
        session.data.session.access_token &&
        (!session.data.session.expires_at ||
          session.data.session.expires_at * 1000 > Date.now())
      ) {
        // Always update token in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", session.data.session.access_token);
        }
        // Fetch backend user info
        let backendUser = null;
        let backendRole = null;
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.data.session.access_token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            backendUser = data.user;
            backendRole = data.role;
          }
        } catch (err) {
          console.error("[AuthProvider] Failed to fetch /api/auth/session:", err);
        }
        // Merge backend user, cached user, and Supabase user
        let mergedUser = session.data.session.user;
        if (backendUser) {
          mergedUser = {
            ...session.data.session.user,
            ...backendUser,
            id: backendUser.id || backendUser.user_id || session.data.session.user.id || null,
            user_id: typeof backendUser.user_id === 'number' ? backendUser.user_id : (typeof backendUser.id === 'string' ? parseInt(backendUser.id, 10) : backendUser.id),
          };
        } else if (typeof window !== "undefined") {
          const cachedUserRaw = localStorage.getItem("cachedUser");
          if (cachedUserRaw) {
            const cachedUser = JSON.parse(cachedUserRaw);
            mergedUser = {
              ...session.data.session.user,
              ...cachedUser,
              id: cachedUser.id || cachedUser.user_id || session.data.session.user.id || null,
              user_id: typeof cachedUser.user_id === 'number' ? cachedUser.user_id : (typeof cachedUser.id === 'string' ? parseInt(cachedUser.id, 10) : cachedUser.id),
            };
          }
        }
        setUser(mergedUser);
        if (typeof window !== "undefined") {
          // Persist merged user and role to localStorage
          localStorage.setItem("cachedUser", JSON.stringify(mergedUser));
          if (backendRole) {
            setRole(backendRole as UserRole);
            localStorage.setItem("cachedRole", backendRole);
          } else {
            // Fallback: if backendRole is missing, use cachedRole or role from mergedUser
            const fallbackRole = (mergedUser as any)?.user_role || (mergedUser as any)?.role || localStorage.getItem("cachedRole") || null;
            if (fallbackRole) {
              setRole(fallbackRole as UserRole);
              localStorage.setItem("cachedRole", fallbackRole);
            }
          }
        }
        setLoading(false);
        if (typeof window !== "undefined") {
          console.log("[AuthProvider] Loaded user from Supabase+backend+cache:", mergedUser);
        }
        return;
      }
      // If no valid session, fallback to cache
      if (typeof window !== "undefined") {
        const cachedUserRaw = localStorage.getItem("cachedUser");
        const cachedRole = localStorage.getItem("cachedRole");
        const token = localStorage.getItem("token");
        if (cachedUserRaw && cachedRole && token) {
          const cachedUser = JSON.parse(cachedUserRaw);
          setUser({
            ...cachedUser,
            id: cachedUser.id || cachedUser.user_id || null,
            user_id: typeof cachedUser.user_id === 'number' ? cachedUser.user_id : (typeof cachedUser.id === 'string' ? parseInt(cachedUser.id, 10) : cachedUser.id),
          });
          setRole(cachedRole as UserRole);
          setLoading(false);
          return;
        }
      }
      setUser(null);
      setRole(null);
      setLoading(false);
    } catch (error) {
      setUser(null);
      setRole(null);
      setLoading(false);
    }
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
          // Always update token in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", session.access_token);
          }
          refreshSession();
        } else {
          // Fallback to cache if available, but do NOT remove credentials
          if (typeof window !== "undefined") {
            const cachedUserRaw = localStorage.getItem("cachedUser");
            const cachedRole = localStorage.getItem("cachedRole");
            const token = localStorage.getItem("token");
            if (cachedUserRaw && cachedRole && token) {
              const cachedUser = JSON.parse(cachedUserRaw);
              setUser({
                ...cachedUser,
                id: cachedUser.id || cachedUser.user_id || null,
                user_id: typeof cachedUser.user_id === 'number' ? cachedUser.user_id : (typeof cachedUser.id === 'string' ? parseInt(cachedUser.id, 10) : cachedUser.id),
              });
              setRole(cachedRole as UserRole);
              setLoading(false);
              return;
            } else {
              setUser(null);
              setRole(null);
              setLoading(false);
              // Do NOT remove credentials here
            }
          } else {
            setUser(null);
            setRole(null);
            setLoading(false);
          }
        }
      }
    );
    // On initial mount, always load cached credentials if no session
    (async () => {
      const session = await supabase.auth.getSession();
      if (
        !session.data.session ||
        !session.data.session.user ||
        !session.data.session.access_token ||
        (session.data.session.expires_at && session.data.session.expires_at * 1000 < Date.now())
      ) {
        if (typeof window !== "undefined") {
          const cachedUserRaw = localStorage.getItem("cachedUser");
          const cachedRole = localStorage.getItem("cachedRole");
          const token = localStorage.getItem("token");
          if (cachedUserRaw && cachedRole && token) {
            const cachedUser = JSON.parse(cachedUserRaw);
            const userObj = {
              ...cachedUser,
              id: cachedUser.id || cachedUser.user_id || null,
              user_id: typeof cachedUser.user_id === 'number' ? cachedUser.user_id : (typeof cachedUser.id === 'string' ? parseInt(cachedUser.id, 10) : cachedUser.id),
            };
            setUser(userObj);
            setRole(cachedRole as UserRole);
            setLoading(false);
            if (typeof window !== "undefined") {
              console.log("[AuthProvider] Loaded user from cache:", userObj);
            }
            return; // Do NOT call refreshSession if loaded from cache
          }
        }
        // If no cache, call refreshSession to try to get from API
        refreshSession();
        return;
      }
      // If session is valid, call refreshSession
      refreshSession();
    })();
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