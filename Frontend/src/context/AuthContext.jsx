import React, { createContext, useContext, useMemo, useState } from "react";
import { getToken, getUser, saveAuth, clearAuth } from "../auth";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());

  const login = (payload) => {
    saveAuth(payload);
    setToken(payload.token);
    setUser(payload.user);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "auth_user",
        newValue: JSON.stringify(payload.user),
      })
    );
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "auth_user", newValue: null })
    );
  };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
