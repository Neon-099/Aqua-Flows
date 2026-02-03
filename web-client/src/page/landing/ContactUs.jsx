import { useEffect } from 'react';
import { Droplet } from 'lucide-react';

const ContactUs = () => {
  useEffect(() => {
    const rootElements = ['html', 'body', '#root'];
    rootElements.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        el.style.margin = '0';
        el.style.padding = '0';
        el.style.width = '100vw';
        el.style.overflowX = 'hidden';
      }
    });
  }, []);

  return (
    <div className="min-h-screen w-screen font-sans text-slate-900 bg-white m-0 p-0 flex flex-col">
      
      {/* --- Navbar (Styled like FAQ Page) --- */}
      <nav className="flex items-center justify-between px-12 py-4 bg-[#E9F1F9] border-b border-slate-200 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>
        
        <div className="hidden md:flex gap-4">
          <button className="bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all border border-slate-200/50">
            Home
          </button>
          <button className="bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all border border-slate-200/50">
            About Us
          </button>
          <button className="bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all border border-slate-200/50">
            FAQs
          </button>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm">
            Contact Us
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Sarah Johnson</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Household Account</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-[#E9F1F9] shadow-md overflow-hidden">
             <img src="https://i.pravatar.cc/150?u=sarah" alt="Sarah" />
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <div className="flex flex-col md:flex-row w-full flex-grow min-h-0">
        
        {/* LEFT SIDE: Info Grid */}
        <div className="md:w-1/2 flex flex-col bg-[#CBE4FF] border-r-4 border-white">
          <div className="w-full bg-[#A7D1FF] py-8 border-b-4 border-white shrink-0">
             <h2 className="text-3xl font-black text-center text-black uppercase tracking-tight">Get In Touch with Us Now!</h2>
          </div>
          
          <div className="relative flex-grow grid grid-cols-2 grid-rows-2">
            {/* The Cross Lines */}
            <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-black -translate-y-1/2 z-30"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[4px] bg-black -translate-x-1/2 z-30"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-[#CBE4FF] -translate-x-1/2 -translate-y-1/2 z-40"></div>

            <div className="flex flex-col items-center justify-center p-6 relative z-10">
              <svg className="w-14 h-14 mb-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.72 11.72 0 003.7.59 1 1 0 011 1V20a1 1 0 01-1 1A16 16 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.7 1 1 0 01-.27 1.11l-2.2 2.2z"/></svg>
              <p className="font-black text-2xl">Phone Number</p>
              <p className="font-bold text-gray-800">+63 923 456 7891</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 relative z-10">
              <svg className="w-14 h-14 mb-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              <p className="font-black text-2xl">Email</p>
              <p className="font-bold text-gray-800 text-sm">pogi@Aquaflow.gmail.com</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 relative z-10">
              <svg className="w-14 h-14 mb-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              <p className="font-black text-2xl">Location</p>
              <p className="font-bold text-gray-800 text-sm text-center">#123damipangit St.<br/>Dagupan City Pangasinan</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 relative z-10">
              <svg className="w-14 h-14 mb-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
              <p className="font-black text-2xl">Opening Hours</p>
              <p className="font-bold text-gray-800 text-sm uppercase leading-tight text-center">Monday-Saturday<br/>9:00AM-6:00PM</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="md:w-1/2 flex flex-col bg-[#D7EAFF]">
          <div className="w-full bg-[#A7D1FF] py-8 border-b-4 border-white shrink-0">
            <h2 className="text-3xl font-black text-center text-black uppercase tracking-tight">Contact Us</h2>
          </div>
          
          <div className="flex-grow flex items-center justify-center p-8">
            <form className="w-full max-w-xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl flex items-center p-1 shadow-sm overflow-hidden">
                  <span className="pl-3 text-slate-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </span>
                  <input type="text" placeholder="First Name" className="w-full p-3 pl-2 outline-none font-bold placeholder:text-slate-300" />
                  <span className="pr-3 text-red-600 font-bold text-xl">*</span>
                </div>
                <div className="bg-white rounded-xl flex items-center p-1 shadow-sm overflow-hidden">
                  <span className="pl-3 text-slate-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </span>
                  <input type="text" placeholder="Last Name" className="w-full p-3 pl-2 outline-none font-bold placeholder:text-slate-300" />
                  <span className="pr-3 text-red-600 font-bold text-xl">*</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl flex items-center p-1 shadow-sm overflow-hidden">
                  <span className="pl-3 text-slate-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.72 11.72 0 003.7.59 1 1 0 011 1V20a1 1 0 01-1 1A16 16 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.7 1 1 0 01-.27 1.11l-2.2 2.2z"/></svg>
                  </span>
                  <input type="text" placeholder="Mobile No." className="w-full p-3 pl-2 outline-none font-bold placeholder:text-slate-300" />
                  <span className="pr-3 text-red-600 font-bold text-xl">*</span>
                </div>
                <div className="bg-white rounded-xl flex items-center p-1 shadow-sm overflow-hidden">
                  <span className="pl-3 text-slate-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </span>
                  <input type="email" placeholder="Email ID" className="w-full p-3 pl-2 outline-none font-bold placeholder:text-slate-300" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm relative overflow-hidden border border-blue-50">
                <label className="absolute top-2 left-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Message</label>
                <textarea rows="6" className="w-full p-4 pt-8 outline-none font-bold resize-none placeholder:text-slate-300"></textarea>
              </div>

              <div className="flex justify-center">
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-16 rounded-xl shadow-md flex items-center gap-3 transition-all">
                  Submit 
                  <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 transform rotate-45">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;