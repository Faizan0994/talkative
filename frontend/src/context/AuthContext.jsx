/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const baseUrl = import.meta.env.VITE_SERVER_URL;
const TOKEN_KEY = "talkative_access_token";

function parseJwt(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && !isTokenExpired(storedToken)) {
        const payload = parseJwt(storedToken);
        setToken(storedToken);
        setUser(payload.user);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const payload = parseJwt(data.token);
          if (payload) {
            localStorage.setItem(TOKEN_KEY, data.token);
            setToken(data.token);
            setUser(payload.user);
          }
        }
      } catch (e) {
        console.log(e);
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    setError("");
    let res;
    try {
      res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
    } catch {
      const msg = "Unable to connect to server. Please check your connection.";
      setError(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    if (!res.ok) {
      const msg = data.errors?.[0] || "Login failed";
      setError(msg);
      throw new Error(msg);
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    const payload = parseJwt(data.token);
    setToken(data.token);
    setUser(payload.user);
  }, []);

  const signup = useCallback(async (userData) => {
    setError("");
    let res;
    try {
      res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
    } catch {
      const msg = "Unable to connect to server. Please check your connection.";
      setError(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    if (!res.ok) {
      const msg = data.errors?.[0] || "Signup failed";
      setError(msg);
      throw new Error(msg);
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.log(e);
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError("");
  }, [token]);

  const clearError = useCallback(() => setError(""), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
