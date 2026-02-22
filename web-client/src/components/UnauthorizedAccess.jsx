import { useEffect, useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedAccess = ({ redirectTo = '/auth', seconds = 3 }) => {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(redirectTo, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, redirectTo]);

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
          <Lock size={24} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Unauthorized Access</h1>
        <p className="mt-3 text-sm text-slate-600">
          You need to be logged in to access this page. Redirecting to login in {remaining} seconds...
        </p>
        <button
          type="button"
          onClick={() => navigate(redirectTo, { replace: true })}
          className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-md font-semibold text-sm inline-flex items-center justify-center gap-2"
        >
          <LogIn size={16} />
          Go to Login Now
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
