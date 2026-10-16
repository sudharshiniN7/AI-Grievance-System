import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check whether a valid session cookie already exists
  // (e.g. the passenger refreshed the page while logged in).
  useEffect(() => {
    let isMounted = true;
    fetchCurrentUser()
      .then((res) => {
        if (isMounted) setUser(res.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await loginUser({ identifier, password });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async ({ fullName, email, password, phone }) => {
    const res = await registerUser({ fullName, email, password, phone });
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}