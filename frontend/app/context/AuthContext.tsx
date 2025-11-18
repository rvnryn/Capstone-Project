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
  const [tokenRefreshInterval, setTokenRefreshInterval] =
    useState<NodeJS.Timeout | null>(null);
  // Persistent session: load from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUserRaw = localStorage.getItem("cachedUser");
      const cachedRole = localStorage.getItem("cachedRole");
      const token = localStorage.getItem("token");
      console.log("[AuthProvider] Initial localStorage:", {
        cachedUser: cachedUserRaw,
        cachedRole,
        token,
      });
      if (cachedUserRaw && cachedRole && token) {
        const cachedUser = JSON.parse(cachedUserRaw);
        // Ensure user object always has 'id'
        setUser({
          ...cachedUser,
          id: cachedUser.id || cachedUser.user_id || null,
          user_id:
            typeof cachedUser.user_id === "number"
              ? cachedUser.user_id
              : typeof cachedUser.id === "string"
              ? parseInt(cachedUser.id, 10)
              : cachedUser.id,
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
          // Silently fall back to Supabase user data if backend is unavailable
          // This is normal during initial page load or backend restart
          console.log(
            "[AuthProvider] Backend unavailable, using Supabase session"
          );
        }
        // Merge backend user, cached user, and Supabase user
        let mergedUser = session.data.session.user;
        if (backendUser) {
          mergedUser = {
            ...session.data.session.user,
            ...backendUser,
            id:
              backendUser.id ||
              backendUser.user_id ||
              session.data.session.user.id ||
              null,
            user_id:
              typeof backendUser.user_id === "number"
                ? backendUser.user_id
                : typeof backendUser.id === "string"
                ? parseInt(backendUser.id, 10)
                : backendUser.id,
          };
        } else if (typeof window !== "undefined") {
          const cachedUserRaw = localStorage.getItem("cachedUser");
          if (cachedUserRaw) {
            const cachedUser = JSON.parse(cachedUserRaw);
            mergedUser = {
              ...session.data.session.user,
              ...cachedUser,
              id:
                cachedUser.id ||
                cachedUser.user_id ||
                session.data.session.user.id ||
                null,
              user_id:
                typeof cachedUser.user_id === "number"
                  ? cachedUser.user_id
                  : typeof cachedUser.id === "string"
                  ? parseInt(cachedUser.id, 10)
                  : cachedUser.id,
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
            const fallbackRole =
              (mergedUser as any)?.user_role ||
              (mergedUser as any)?.role ||
              localStorage.getItem("cachedRole") ||
              null;
            if (fallbackRole) {
              setRole(fallbackRole as UserRole);
              localStorage.setItem("cachedRole", fallbackRole);
            }
          }
        }
        setLoading(false);
        if (typeof window !== "undefined") {
          console.log(
            "[AuthProvider] Loaded user from Supabase+backend+cache:",
            mergedUser
          );
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
            user_id:
              typeof cachedUser.user_id === "number"
                ? cachedUser.user_id
                : typeof cachedUser.id === "string"
                ? parseInt(cachedUser.id, 10)
                : cachedUser.id,
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
        // Check if user is in password reset flow FIRST
        if (typeof window !== "undefined") {
          const isResetting = localStorage.getItem("isResettingPassword");
          if (isResetting === "true") {
            console.log(
              "[AuthContext] Skipping auth state change during password reset"
            );
            return; // Completely skip all auth processing during password reset
          }
        }

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
          // No session - check if we should load from cache
          if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            const cachedUserRaw = localStorage.getItem("cachedUser");
            const cachedRole = localStorage.getItem("cachedRole");

            // Only load from cache if ALL three exist (token must exist)
            if (token && cachedUserRaw && cachedRole) {
              const cachedUser = JSON.parse(cachedUserRaw);
              setUser({
                ...cachedUser,
                id: cachedUser.id || cachedUser.user_id || null,
                user_id:
                  typeof cachedUser.user_id === "number"
                    ? cachedUser.user_id
                    : typeof cachedUser.id === "string"
                    ? parseInt(cachedUser.id, 10)
                    : cachedUser.id,
              });
              setRole(cachedRole as UserRole);
              setLoading(false);
              return;
            } else {
              // No token means user logged out - clear everything
              setUser(null);
              setRole(null);
              setLoading(false);
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
        (session.data.session.expires_at &&
          session.data.session.expires_at * 1000 < Date.now())
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
              user_id:
                typeof cachedUser.user_id === "number"
                  ? cachedUser.user_id
                  : typeof cachedUser.id === "string"
                  ? parseInt(cachedUser.id, 10)
                  : cachedUser.id,
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

  // Automatic Token Refresh - runs every 45 minutes
  useEffect(() => {
    // Clear any existing interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    // Only set up auto-refresh if user is logged in
    if (user && !loading) {
      console.log(
        "[AuthProvider] Setting up automatic token refresh (every 45 minutes)"
      );

      // Refresh token every 45 minutes (before the 1-hour expiry)
      const interval = setInterval(async () => {
        console.log("[AuthProvider] Auto-refreshing token...");
        try {
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error("[AuthProvider] Auto-refresh failed:", error);
            // If refresh fails, try to get session
            await refreshSession();
            return;
          }

          if (data.session) {
            console.log("[AuthProvider] Token auto-refreshed successfully");
            // Update token in localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("token", data.session.access_token);
            }
            // Update user state with new session
            await refreshSession();
          }
        } catch (err) {
          console.error("[AuthProvider] Auto-refresh error:", err);
          // Fallback: try manual refresh
          await refreshSession();
        }
      }, 45 * 60 * 1000); // 45 minutes in milliseconds

      setTokenRefreshInterval(interval);

      // Cleanup on unmount or when user logs out
      return () => {
        if (interval) {
          clearInterval(interval);
          console.log("[AuthProvider] Cleared automatic token refresh");
        }
      };
    }

    // Cleanup function
    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [user, loading]); // Re-run when user or loading state changes

  // Refresh token when user returns to the tab (window focus)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && user && !loading) {
        console.log("[AuthProvider] Tab focused - checking token validity...");

        // Check if token is close to expiry or already expired
        const session = await supabase.auth.getSession();

        if (session.data.session?.expires_at) {
          const expiresAt = session.data.session.expires_at * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;

          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log("[AuthProvider] Token expiring soon, refreshing...");
            try {
              const { data, error } = await supabase.auth.refreshSession();

              if (error) {
                console.error("[AuthProvider] Focus refresh failed:", error);
                await refreshSession();
                return;
              }

              if (data.session) {
                console.log("[AuthProvider] Token refreshed on focus");
                if (typeof window !== "undefined") {
                  localStorage.setItem("token", data.session.access_token);
                }
                await refreshSession();
              }
            } catch (err) {
              console.error("[AuthProvider] Focus refresh error:", err);
            }
          }
        }
      }
    };

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, loading]);

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
