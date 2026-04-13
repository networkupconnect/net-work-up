import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // ✅ FIX: centralized logout — clears everything
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("returnPath");
    setUser(null);
    setHasUnreadMessages(false);
  }, []);

  const checkUnread = useCallback(async () => {
    try {
      const res = await api.get("/api/chat/conversations");
      setHasUnreadMessages(res.data.some((c) => c.unread));
    } catch {
      // silently fail — not critical
    }
  }, []);

  // ✅ Boot: verify token with server — never trust localStorage user blindly
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setReady(true);
      return;
    }

    api
      .get("/api/auth/me") // ✅ FIX: consistent route — auth/me not user/me
      .then((res) => {
        const freshUser = res.data;
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        checkUnread();
      })
      .catch((err) => {
        // ✅ FIX: handle expired tokens explicitly
        const code = err?.response?.data?.code;
        if (code === "TOKEN_EXPIRED" || err?.response?.status === 401) {
          logout();
        }
      })
      .finally(() => {
        setReady(true);
      });
  }, [logout, checkUnread]);

  // ✅ FIX: login sets user from server response directly — no extra fetch needed
  const login = useCallback(({ token, user: userData }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    checkUnread();
  }, [checkUnread]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        updateUser,
        hasUnreadMessages,
        setHasUnreadMessages,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};