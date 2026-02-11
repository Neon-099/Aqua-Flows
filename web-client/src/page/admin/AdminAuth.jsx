import { useEffect, useState } from "react";
import { Droplet, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";

const AdminAuth = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  useEffect(() => { 
    if (!user) return;
    if (user.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }
    setError("This account does not have admin access.");
    logout();
  }, [user, navigate, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res?.success) {
        setError(res?.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900">
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-b from-blue-50 via-white to-blue-50 p-12">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-2xl">
            <Droplet size={28} className="text-blue-600" />
            <span>AquaFlow</span>
          </div>

          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin Access</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900">
              Manage operations with confidence.
            </h1>
            <p className="mt-4 text-slate-600">
              Secure access for administrators to oversee users, orders, and service health.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-700">Security Notice</div>
            <p className="mt-2 text-sm text-slate-500">
              This portal is restricted to authorized AquaFlow administrators only.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Droplet size={22} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Admin Sign In</h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your administrator credentials to continue.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aquaflow.com"
                  className="w-full rounded-lg border-2 border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-lg border-2 border-slate-200 py-3 pl-11 pr-12 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <Link to="/auth" className="text-blue-600 hover:text-blue-700">
                Return to customer login
              </Link>
              <span>Need help? Contact support.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
