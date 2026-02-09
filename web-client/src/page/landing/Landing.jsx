import { useEffect } from 'react';
import { 
  Droplet, 
  MapPin, 
  Smartphone, 
  Truck, 
  Wallet, 
  CheckCircle,
  Map,
  RefreshCw,
  Bell,
  Shield,
  Users,
  Bike,
  ClipboardList,
  Settings,
  DollarSign,
  Zap,
  Phone,
  Mail,
  Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
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
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#1f1b22]/70 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>
        
        <a href="#" className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors">
          Staff Login
        </a>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-white py-16 px-12">
        <div className="max-w-6xl mx-auto">
          {/* Location Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold">
              <MapPin size={16} />
              <span>Serving your local area.</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-blue-600 text-center mb-6 leading-tight">
            Order. Track. Refill. Delivered to your door.
          </h1>

          {/* Description */}
          <p className="text-xl text-slate-600 text-center max-w-2xl mx-auto mb-8 leading-relaxed">
            The simplest way to manage your home water supply. Real-time tracking, easy payments, and reliable local delivery.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Link to="/auth">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md">
                Order Water
                </button>
            </Link>
                <button className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
                Track Order
                </button>
          </div>

          {/* Admin Login Link */}
          <div className="flex justify-center mb-12">
            <a href="#" className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-1 transition-colors">
              Admin / Staff Login <span>→</span>
            </a>
          </div>

          {/* Product Image Section */}
          <div className="w-full rounded-xl overflow-hidden shadow-lg ">
            <div className="bg-white rounded-lg flex items-center justify-center">
              {/* Placeholder for product image - replace with actual image */}
                <img src="/Landing.png" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full bg-white py-16 px-12 bg-[#f1f5f9] rounded-xl">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Place Order</h3>
              <p className="text-slate-600">Select quantity and type in the app.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Truck className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pickup & Delivery</h3>
              <p className="text-slate-600">Rider picks up empties and drops off refills.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Wallet className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Easy Payment</h3>
              <p className="text-slate-600">Pay via Cash on Delivery or GCash.</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Completed</h3>
              <p className="text-slate-600">Enjoy clean water delivered to your door.</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Features Section */}
      <section className="w-full bg-white py-16 px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
            System Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 flex gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                <Map className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Order Tracking</h3>
                <p className="text-slate-600">Know exactly where your rider is and when your water will arrive.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 flex gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                <RefreshCw className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Gallon Pickup & Replacement</h3>
                <p className="text-slate-600">Seamless exchange process for your empty containers.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 flex gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                <Bell className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Notifications</h3>
                <p className="text-slate-600">Get SMS and in-app updates for every step of your order.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 flex gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Reliable & Secure</h3>
                <p className="text-slate-600">Trusted local service with secure payment handling.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Use the System Section */}
      <section className="w-full bg-[#E9F1F9] py-16 px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
            Who Can Use the System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Customers Card */}
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-blue-600 mb-2">Customers</h3>
              <p className="text-slate-600 text-sm">Easily order water refills and track deliveries from home.</p>
            </div>

            {/* Riders Card */}
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-blue-600 mb-2">Riders</h3>
              <p className="text-slate-600 text-sm">View assigned deliveries and update order statuses.</p>
            </div>

            {/* Staff Card */}
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-blue-600 mb-2">Staff</h3>
              <p className="text-slate-600 text-sm">Assign riders, monitor inventory, and manage daily orders.</p>
            </div>

            {/* Admin Card */}
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-blue-600 mb-2">Admin</h3>
              <p className="text-slate-600 text-sm">Full system control, user management, and sales reports.</p>
            </div>
          </div>

          {/* Business Features Badges */}
          <div className="flex justify-center gap-6 flex-wrap">
            <div className="bg-white rounded-lg px-6 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <span className="font-bold text-blue-600">Cash on Delivery</span>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="text-blue-600" size={20} />
              </div>
              <span className="font-bold text-blue-600">GCash Accepted</span>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="text-blue-600" size={20} />
              </div>
              <span className="font-bold text-blue-600">Verified Local Business</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-blue-900 text-white py-12 px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* AquaFlow Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Droplet fill="currentColor" size={24} className="text-blue-300" />
                <span className="font-bold text-xl">AquaFlow</span>
              </div>
              <p className="text-blue-200 text-sm leading-relaxed">
                Your trusted partner for clean, safe, and reliable water delivery. Serving the community since 2024.
              </p>
            </div>

            {/* System Column */}
            <div>
              <h4 className="font-bold text-lg mb-4">System</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Order Water</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Staff Login</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Admin Portal</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>+123 456 7890</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>team@aquaflow.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <Navigation size={16} className="mt-1" />
                  <div>
                    <div>123 Main Street</div>
                    <div>City Center, 1000</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-blue-800 pt-8 text-center">
            <p className="text-blue-200 text-sm">
              © 2025 AquaFlow Water Station. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;