import { 
  Droplet 
} from 'lucide-react';

const FAQ_DATA = [
  { id: 1, q: "How can I order water?", a: "Customers can order by visiting the water refilling station directly or by contacting the station through sms or email for delivery." },
  { id: 2, q: "What types of water do you offer?", a: "We offer purified drinking water such as Reverse Osmosis (RO) and Mineral Water." },
  { id: 3, q: "How long does the refilling process take?", a: "The refilling process usually takes a few minutes, depending on the number of orders." },
  { id: 4, q: "Is the water safe for daily drinking?", a: "Yes. Our water is filtered and purified to ensure it is safe for daily consumption." },
  { id: 5, q: "Do you offer water delivery?", a: "Yes. We offer water delivery within nearby areas. Delivery fees may vary depending on the location." },
  { id: 6, q: "What container sizes are available?", a: "We usually offer 5-gallon containers. Customers may bring their own containers or purchase one from the station." },
  { id: 7, q: "Can I return my empty container?", a: "Yes! You can return empty containers to the station. This helps keep the environment clean and allows the container to be refilled again." },
  { id: 8, q: "How do I make sure my container is clean?", a: "Containers should be washed regularly with clean water and mild soap before refilling." },
];

const FAQItem = ({ question, answer, index }) => (
  <div className="flex flex-col h-full">
    <h3 className="font-bold text-lg text-slate-900 mb-2">
      {index + 1}. {question}
    </h3>
    <div className="bg-blue-50 p-6 rounded-2xl text-slate-700 leading-relaxed border border-blue-100 shadow-sm flex-1">
      {answer}
    </div>
  </div>
);

const FAQ = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-700 flex flex-col">
      
      {/* Navigation - Background color changed to E9F1F9 */}
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
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm">
            FAQs
          </button>
          <button className="bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all border border-slate-200/50">
            Contact Us
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Sarah Johnson</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Household Account</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-[#E9F1F9] shadow-md overflow-hidden">
             <img src="/api/placeholder/40/40" alt="Sarah" />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-12 w-full"> 
        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
            <span className="text-yellow-400">💡</span> Frequently Asked Questions
          </h1>
          <p className="text-slate-500 text-xl mt-3 font-medium">Find answers to common questions about our water services.</p>
        </div>

        {/* Grid for Uniform Heights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full">
          {FAQ_DATA.map((item, index) => (
            <div key={item.id}>
              <FAQItem question={item.q} answer={item.a} index={index} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default FAQ;