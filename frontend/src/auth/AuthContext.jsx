import { createContext, useContext, useEffect, useState } from "react";
import {
  clearStoredAuthToken,
  getCurrentUser,
  getStoredAuthToken,
  loginUser,
  storeAuthToken,
  updateCurrentUserProfile,
} from "../api/client";

const AuthContext = createContext(null);

export function getDefaultRouteForRole(role) {
  switch (role) {
    case "viewer":
      return "/report";
    case "admin":
    case "superadmin":
      return "/admin";
    default:
      return "/";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        clearStoredAuthToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (employeeId, password) => {
    const session = await loginUser({ employee_id: employeeId, password });
    storeAuthToken(session.token);
    setUser(session.user);
    return session.user;
  };

  const logout = () => {
    clearStoredAuthToken();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const nextUser = await updateCurrentUserProfile(payload);
    setUser(nextUser);
    return nextUser;
  };

  const hasRole = (...roles) => Boolean(user && roles.includes(user.role));

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateProfile, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
