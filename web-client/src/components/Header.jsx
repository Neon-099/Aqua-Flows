
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MessageSquare, 
  MapPin, 
  Droplet 
} from 'lucide-react';
const Header = ( {image, name} ) => {
    return (
        <>
        <nav 
        className="flex items-center justify-between px-12 py-4 border-b border-slate-100 shrink-0 w-full"
        style={{ backgroundColor: '#E9F1F9' }}
      >
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>
        
        <div className="hidden md:flex gap-4">
          <Link to="/home">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <LayoutDashboard size={18} /> Home
            </button>
          </Link>
          <Link to="/orders">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/messages">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
          <Link to="/delivery">
            <button className="flex items-center gap-2 bg-white text-slate-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <MapPin size={18} /> Track Delivery
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">{name || 'Customer'}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Household Account</p>
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
        </>
    )
}

export default Header;