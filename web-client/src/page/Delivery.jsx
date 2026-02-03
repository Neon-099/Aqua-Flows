import { Link } from 'react-router-dom';
import { 
  Search, Send, Package, Smile, Info, CheckCheck, 
  LayoutDashboard, ClipboardList, MessageSquare, MapPin 
} from 'lucide-react';

const Delivery = () => {
  return (
    // w-screen and h-screen ensures it occupies 100% of the browser window
    // overflow-x-hidden prevents unwanted horizontal scrolling
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      
      {/* --- PREFERRED HEADER NAVIGATION --- */}
      <nav 
        className="flex items-center justify-between px-12 py-4 border-b border-slate-100 shrink-0 w-full"
        style={{ backgroundColor: '#E9F1F9' }}
      >
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Package size={28} />
          <span>AquaFlow</span>
        </div>
        
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
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
          <Link to="/track">
            {/* Active state for Track Delivery */}
            <button className="flex items-center gap-2 bg-white text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <MapPin size={18} /> Track Delivery
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Sarah Johnson</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Household Account</p>
          </div>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
            alt="profile" 
          />
        </div>
      </nav>

      {/* Main Content Area - px-10 keeps items from touching the extreme edges of the glass */}
      <div className="flex-1 w-full px-10 py-8">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Good afternoon, Sarah!</h1>
          <p className="text-slate-500 text-lg">Your water refill is on its way. Stay hydrated!</p>
        </header>

        {/* Grid System: 12-column layout for better wide-screen control */}
        <div className="grid grid-cols-12 gap-10">
          
          {/* Main Column (Spans 8 of 12 columns) */}
          <div className="col-span-8 space-y-10">
            
            {/* Status Card */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="font-bold text-2xl">Order #WF-2938</h3>
                  <p className="text-slate-400 font-medium">Placed today at 10:30 AM</p>
                </div>
                <span className="bg-emerald-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg shadow-emerald-100">In Transit</span>
              </div>

              {/* Progress Bar with Labels */}
              <div className="relative mb-24 px-4">
                <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-100 z-0 rounded-full"></div>
                <div className="absolute top-5 left-0 w-3/4 h-1.5 bg-blue-500 z-0 rounded-full"></div>
                
                <div className="relative flex justify-between items-start">
                  {[
                    { label: "Confirmed", icon: "✓", active: true },
                    { label: "Gallon Pickup", icon: "✓", active: true },
                    { label: "Refilling in Progress", icon: "✓", active: true },
                    { label: "Delivery in Progress", icon: "🚚", active: true },
                    { label: "Delivered", icon: "🏠", active: false },
                  ].map((step, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className={`z-10 w-11 h-11 rounded-full flex items-center justify-center mb-4 transition-all shadow-md ${
                        step.active ? 'bg-blue-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-300'
                      }`}>
                        <span className="font-bold">{step.icon}</span>
                      </div>
                      <span className={`text-xs font-bold text-center w-28 leading-tight ${
                        step.active ? 'text-blue-600' : 'text-slate-300'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Contact */}
              <div className="bg-blue-50/50 p-6 rounded-3xl flex items-center justify-between border border-blue-100/50 mt-16">
                <div className="flex items-center gap-6">
                  <img src="https://i.pravatar.cc/150?u=driver" className="w-16 h-16 rounded-full border-4 border-white shadow-md" alt="driver" />
                  <div>
                    <p className="font-extrabold text-slate-800 text-xl">Michael Chen</p>
                    <p className="text-blue-500 font-semibold tracking-wide">Honda Click • Plate ABC 123</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-white border border-blue-200 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition">📞 Call</button>
                  <button className="px-8 py-3 bg-blue-600 rounded-2xl text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">💬 Message</button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="font-bold text-xl">Recent Activity</h3>
                 <button className="text-blue-600 font-bold hover:underline">View All</button>
              </div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition">
                    <div className="flex gap-6">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-bold">📦</div>
                      <div>
                        <p className="text-lg font-bold text-slate-800">Order Delivered</p>
                        <p className="text-slate-400 font-medium">Yesterday, 2:00 PM • 3 Gallons</p>
                      </div>
                    </div>
                    <p className="font-black text-2xl text-slate-700">$4.50</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar (Spans 4 of 12 columns) */}
          <div className="col-span-4 space-y-10">
            {/* Reorder Card */}
            <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-blue-200">
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-4 leading-tight">Running Low?</h3>
                <p className="text-blue-100 text-lg mb-10 opacity-90">Reorder your usual 5-gallon refill with one tap.</p>
                <button className="w-full bg-white text-blue-600 py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] transition-transform">
                  + Order Water
                </button>
              </div>
              <div className="absolute -top-10 -right-10 text-white/10 text-[12rem] rotate-12">💧</div>
            </div>

            {/* Order Summary */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-8">Order Summary</h3>
              <div className="flex gap-6 mb-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl">💧</div>
                <div>
                  <p className="font-bold text-xl text-slate-800">5 Gallon Round</p>
                  <p className="text-slate-400 font-bold">Quantity: 2</p>
                </div>
              </div>
              <div className="space-y-4 border-t border-slate-50 pt-8">
                <div className="flex justify-between text-slate-500 text-lg"><span>Subtotal</span><span>$3.00</span></div>
                <div className="flex justify-between text-slate-500 text-lg"><span>Delivery Fee</span><span>$1.50</span></div>
                <div className="flex justify-between font-black text-3xl pt-6 text-slate-800"><span>Total</span><span>$4.50</span></div>
              </div>
              <div className="mt-8 p-5 bg-blue-50 text-blue-600 rounded-2xl font-black text-center border border-blue-100">
                💳 Cash on Delivery
              </div>
            </div>

            {/* Mini Messages */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-xl">Messages</h3>
                <MessageSquare size={20} className="text-blue-600" />
              </div>
              <div className="flex gap-4 mb-8">
                <img src="https://i.pravatar.cc/150?u=driver" className="w-12 h-12 rounded-full shadow-sm" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-slate-800">Michael [Rider]</p>
                    <span className="text-[10px] font-bold text-slate-400">1m ago</span>
                  </div>
                  <p className="text-sm text-slate-500 italic truncate">"I'm at the gate, waiting for guard."</p>
                </div>
              </div>
              <button className="w-full py-4 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-400 hover:text-blue-600 hover:border-blue-50 transition">Open Message Station</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Delivery;