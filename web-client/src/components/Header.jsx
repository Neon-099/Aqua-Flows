import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  MapPin,
  Droplet,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/delivery', label: 'Track Delivery', icon: MapPin },
];

const Header = ({ image, name }) => {
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
        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden">
          <img
            src={image || 'user'}
            className="w-full h-full object-cover"
            alt={name || 'profile'}
          />
        </div>
      </div>
    </nav>
  );
};

export default Header;
