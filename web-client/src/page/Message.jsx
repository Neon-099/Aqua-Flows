
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Send, Package, Smile, Info, CheckCheck, 
  LayoutDashboard, ClipboardList, MessageSquare, MapPin 
} from 'lucide-react';

const Message = () => {
  const [message, setMessage] = useState('');

  const conversations = [
    { id: 1, name: "Mateo Garcia", role: "Rider", lastMsg: "I'm nearby! Just finishing a drop-off at the corner.", time: "10:32 AM", status: "Out for delivery", active: true, orderId: "#HF-8921" },
    { id: 2, name: "BlueSpring Station", role: "", lastMsg: "Your refill order has been confirmed. ...", time: "09:05 AM", status: "Confirmed", active: false, orderId: "#HF-8921" },
    { id: 3, name: "Alex Tan", role: "Rider", lastMsg: "Delivery completed. Thank you for choosing HydroFlow!", time: "Yesterday", status: "Delivered", active: false, orderId: "#HF-8814" },
    { id: 4, name: "BlueSpring Station", role: "Billing", lastMsg: "Your monthly invoice for GreenLeaf Café is ready.", time: "Mon", status: "Account: GL-Café", active: false, unread: 1 },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-white font-sans text-slate-700 overflow-hidden">
      
      {/* --- NEW HEADER NAVIGATION --- */}
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
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
            alt="profile" 
          />
        </div>
      </nav>

      {/* --- MAIN LAYOUT (UNTOUCHED) --- */}
      <main className="flex flex-1 overflow-hidden w-full">
        
        {/* --- LEFT SIDEBAR: CONVERSATIONS --- */}
        <div className="w-[420px] bg-white border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl text-slate-800">Conversations</h2>
              <span className="text-xs font-medium text-slate-400">3 unread</span>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">Select a chat to view details and reply.</p>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-3 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, order ID, or address" 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-100 outline-none transition-all"
              />
            </div>

            <div className="flex gap-2 mb-2">
              {['All', 'Station', 'Riders', 'Unread'].map((tab, i) => (
                <button key={tab} className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${i === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-4">
            {conversations.map((chat) => (
              <div key={chat.id} className={`p-5 mb-2 rounded-2xl cursor-pointer transition-all border ${chat.active ? 'bg-white border-blue-400 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 ${chat.active ? 'bg-slate-700' : 'bg-slate-400'} text-white rounded-lg flex items-center justify-center font-bold text-lg`}>
                      {chat.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-slate-800">{chat.name} • {chat.role || 'Station'}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{chat.time}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 italic mb-2">"{chat.lastMsg}"</p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {chat.active && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                  {chat.orderId} • {chat.status}
                </div>
              </div>
            ))}
            <div className="p-6 text-[11px] text-slate-400 font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                All conversations are linked to their orders for easy tracking.
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: CHAT WINDOW --- */}
        <div className="flex-1 bg-white flex flex-col min-w-0">
          
          {/* Chat Header */}
          <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-xl">M</div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Mateo Garcia • Rider</h3>
                <p className="text-xs text-slate-400 font-medium">Order #HF-8921 • 5-Gallon Purified Water (x3)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest">Out for delivery</span>
              <p className="text-[11px] text-slate-400 mt-2 font-bold">ETA: 10:45—11:15 AM</p>
              <p className="text-[10px] text-slate-300 font-medium">Last updated 3 min ago</p>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto px-12 py-8 space-y-8">
            <div className="flex items-center justify-center gap-6">
                <hr className="flex-1 border-slate-100"/>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">Today</span>
                <hr className="flex-1 border-slate-100"/>
            </div>

            <div className="bg-blue-50/50 text-blue-600 p-4 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-3">
                <Info size={18} />
                Order #HF-8921 is now out for delivery. You can reply here to reach your rider.
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-3">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none max-w-[500px] text-[14px] leading-relaxed shadow-sm">
                Hi Sarah! This is Mateo, your rider for today's delivery.
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none max-w-[500px] text-[14px] leading-relaxed shadow-sm">
                I'm on my way now. I'll send a message when I'm at your gate.
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="bg-blue-600 text-white p-5 rounded-3xl rounded-br-none max-w-[500px] text-[14px] leading-relaxed shadow-lg shadow-blue-100">
                Thanks, Mateo! Please use the side entrance. The front gate is under repair.
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                10:31 AM <CheckCheck size={14} className="text-blue-500" /> Read
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none max-w-[500px] text-[14px] leading-relaxed shadow-sm">
                Got it, I'll go through the side entrance. I'm just finishing a drop-off at the corner.
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none max-w-[500px] text-[14px] leading-relaxed shadow-sm">
                I should be there in around 5 minutes.
              </div>
            </div>
          </div>

          {/* Message Input Area */}
          <div className="p-8 bg-white border-t border-slate-50">
            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-2 focus-within:border-blue-400 focus-within:ring-4 ring-blue-50 transition-all">
              <button className="text-slate-400 hover:text-blue-600">
                <Smile size={24} />
              </button>
              <input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                type="text" 
                placeholder="Type a message to your rider..." 
                className="flex-1 py-4 text-[15px] outline-none bg-transparent"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all flex items-center gap-2 font-bold px-6">
                <Send size={18} />
                Send
              </button>
            </div>
            <div className="mt-4 flex flex-col items-start px-2">
              <p className="text-[11px] text-slate-400 font-medium">
                Linked to Order #HF-8921 b7 Messages are visible to your rider and station.
              </p>
              <span className="text-[11px] text-blue-400 font-extrabold hover:underline mt-1 cursor-pointer">
                View order details
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Message;