import { useAuth } from '../../contexts/AuthProvider';
import UnauthorizedAccess from '../UnauthorizedAccess';

const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  if (!user || (user.role !== 'customer' && user.role !== 'user' && user.role !== 'admin')) {
    return <UnauthorizedAccess redirectTo="/auth" seconds={3} />;
  }

  return children;
};

export default CustomerRoute;
