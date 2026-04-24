import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AUTH_STORAGE_KEY = "sga-sales-intelligence-auth";
const AuthContext = createContext(null);

function toTitleCase(value) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildProfileFromEmail(email, managerNameOverride) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const emailLocalPart = normalizedEmail.split("@")[0] || "gestionnaire";
  const managerMatch = emailLocalPart.match(/ges\d+/i);
  const managerName =
    String(managerNameOverride || "").trim() ||
    (managerMatch ? managerMatch[0].replace(/^ges/i, "Ges") : toTitleCase(emailLocalPart));

  return {
    agency: "Agence Corporate Alger Centre",
    email: normalizedEmail,
    managerName,
    name: managerMatch ? `Gestionnaire ${managerName}` : toTitleCase(emailLocalPart),
  };
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!session) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      login(email, options = {}) {
        const profile = buildProfileFromEmail(email, options.managerName);
        const nextSession = {
          ...profile,
          token: `demo-${Date.now()}`,
          authenticatedAt: new Date().toISOString(),
        };
        setSession(nextSession);
        return nextSession;
      },
      logout() {
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}
