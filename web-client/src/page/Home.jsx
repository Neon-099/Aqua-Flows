import {Link }from 'react-router-dom'
import { 
  LayoutDashboard, 
  ClipboardList, 
  MessageSquare, 
  MapPin, 
  Phone, 
  Droplet 
} from 'lucide-react';

const Home = () => {
  return (
    // 'w-full' and 'h-screen' ensure the gray background fills the entire laptop display
    <div className="h-screen w-full bg-slate-50 font-sans text-slate-700 overflow-hidden flex flex-col">
      
      {/* Navigation - Stretches full width with px-12 for edge breathing room */}
      <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
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

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Sarah Johnson</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Household Account</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden">
             <img src="/api/placeholder/40/40" alt="Sarah" />
          </div>
        </div>
      </nav>

      {/* Main Container - No max-width, grid spans the entire screen width */}
      <main className="flex-1 overflow-y-auto p-12 grid grid-cols-12 gap-10 w-full">
        
        {/* Left Column (8 of 12 columns) - Occupies the bulk of the left space */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Good afternoon, Sarah!</h1>
            <p className="text-slate-500 text-xl mt-2 font-medium">Your water refill is on its way. Stay hydrated!</p>
          </div>

          {/* Delivery Details Card */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                <MapPin size={24} />
              </div>
              <h2 className="font-black text-2xl text-slate-800">Delivery Details</h2>
            </div>

            {/* Arrival Time - Scaled up to fill the wide card */}
            <div className="bg-blue-50/50 rounded-[2rem] py-20 flex flex-col items-center justify-center border border-blue-100 mb-10">
              <span className="text-8xl font-black text-blue-600">15-20 min</span>
              <span className="text-slate-400 font-bold text-lg mt-3 uppercase tracking-[0.2em]">Estimated Arrival Time</span>
            </div>

            <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-300 overflow-hidden shadow-inner">
                   <img src="/api/placeholder/64/64" alt="Michael" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-black text-2xl text-slate-800">Michael Chen</p>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Honda Click • Plate ABC 123</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform">
                  <Phone size={20} fill="currentColor" /> Call
                </button>
                <button className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform">
                  <MessageSquare size={20} /> Message
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-2xl text-slate-800">Recent Activity</h2>
              <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 border border-slate-50">
                      <ClipboardList size={28} />
                    </div>
                    <div>
                      <p className="font-black text-xl text-slate-800">Order Delivered</p>
                      <p className="text-slate-400 text-sm font-bold mt-1">Yesterday, 2:00 PM • 3 Gallons</p>
                    </div>
                  </div>
                  <span className="font-black text-3xl text-slate-800">$4.50</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 of 12 columns) - Occupies the right sidebar space */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <h3 className="font-black text-3xl mb-3">Running Low?</h3>
            <p className="text-blue-100 text-base leading-relaxed mb-10 font-medium">Reorder your usual 5-gallon refill with just one tap.</p>
            <button className="w-full bg-slate-900 text-blue-500 py-5 rounded-[1.5rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/20">
              + Order Water
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <h3 className="font-black text-xl text-slate-800 mb-8 uppercase tracking-widest text-center">Order Summary</h3>
            <div className="flex gap-6 mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner shrink-0">
                <Droplet fill="currentColor" size={32} />
              </div>
              <div className="flex-1">
                <p className="font-black text-xl text-slate-800">5 Gallon Round (Refill)</p>
                <p className="text-slate-400 text-sm font-bold mt-1">Quantity: 2</p>
              </div>
            </div>
            <div className="space-y-4 text-sm pt-8 border-t border-slate-100">
              <div className="flex justify-between text-slate-400 font-bold text-lg">
                <span>Subtotal</span>
                <span className="text-slate-800">$3.00</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-5xl pt-4">
                <span>Total</span>
                <span>$4.50</span>
              </div>
            </div>
            <div className="mt-10 p-4 bg-blue-50 rounded-2xl text-blue-600 text-xs font-black text-center border border-blue-100 uppercase tracking-widest">
              Payment: Cash on Delivery
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl text-slate-800">Messages</h3>
              <div className="p-2 bg-slate-50 rounded-lg text-slate-300">
                <MessageSquare size={20} />
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Michael (Rider)</p>
              <p className="text-sm text-slate-500 italic mt-2 leading-relaxed font-medium">"I'm at the gate, waiting for guard to let me in..."</p>
            </div>
            <button className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">
              Open Message Station
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;