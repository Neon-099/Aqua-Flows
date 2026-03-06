import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await apiRequest("/auth/me", "GET");
        setUser(res?.user || null);
      } catch {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiRequest("/auth/signin", "POST", { email, password });
      if (res?.token) localStorage.setItem("authToken", res.token);
      setUser(res?.user || null);
      return { success: true, role: res?.user?.role, user: res?.user };
    } catch (error) {
      if (error?.status === 429) {
        return { success: false, error: "Too many attempts. Please try again later after 15 minutes." };
      }
      return { success: false, error: error?.message || "Login failed" };
    }
  };

  const register = async (userData) => {
    try {
      const res = await apiRequest("/auth/signup", "POST", userData);
      if (res?.token) localStorage.setItem("authToken", res.token);
      setUser(res?.user || null);
      return { success: true, role: res?.user?.role, user: res?.user };
    } catch (error) {
      return { success: false, error: error?.message || "Signup failed" };
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", "POST");
    } catch {}
    localStorage.removeItem("authToken");
    setUser(null);
  };

  const updateProfile = async (payload) => {
    try {
      const res = await apiRequest("/auth/profile", "PUT", payload);
      if (res?.user) setUser(res.user);
      return { success: true, user: res?.user };
    } catch (error) {
      return { success: false, error: error?.message || "Failed to update profile" };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await apiRequest("/auth/forgotpassword", "POST", { email });
      return { success: true, message: res?.message };
    } catch (error) {
      return { success: false, error: error?.message || "Could not find email" };
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      const res = await apiRequest(`/auth/resetpassword/${resetToken}`, "PUT", { password });
      return { success: true, message: res?.message };
    } catch (error) {
      return { success: false, error: error?.message || "Reset failed" };
    }
  };

  const value = {
    user,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    updateProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
