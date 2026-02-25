import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  MapPin,
  Droplet,
  User,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthProvider';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
];

const Header = ({name }) => {

  const { user } = useAuth();

  const profileName = user?.name || 'Customer';

const initials = useMemo(() => {
    if (!profileName) return 'CF';
    return profileName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profileName]);

  const location = useLocation();

  const navButtonClass = (isActive) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
      isActive
        ? 'bg-white text-slate-800 shadow-sm'
        : 'bg-white/50 text-slate-600 hover:bg-white/80'
    }`;

  return (
    <nav
      className="flex items-center justify-between px-12 py-4 border-b border-slate-100 shrink-0 w-full"
      style={{ backgroundColor: '#E9F1F9' }}
    >
      <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
        <Droplet fill="currentColor" size={28} />
        <span>AquaFlow</span>
      </div>

      <div className="hidden md:flex gap-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link key={item.to} to={item.to}>
              <button className={navButtonClass(isActive)}>
                <Icon size={18} /> {item.label}
              </button>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-black text-slate-900 leading-none">{name || 'Customer'}</p>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
            Household Account
          </p>
        </div>
        <div className="w-15 h-15 rounded-[1.6rem] bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
          {initials}
        </div>
      </div>
    </nav>
  );
};

export default Header;
