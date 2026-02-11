import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";

const RiderRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  if (!user || (user.role !== "rider" && user.role !== "admin")) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default RiderRoute;
