

const Header = () => {
    return (
        <>
        <div className="hidden md:flex gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </Link>
          <Link to="/orders">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/messages">
            <button className="flex items-center gap-2 bg-white text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
          <Link to="/delivery">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MapPin size={18} /> Track Delivery
            </button>
          </Link>
        </div>
        </>
    )
}

export default Header;