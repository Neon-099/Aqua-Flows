import { useState, useEffect } from 'react';
import { Droplet, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen w-screen font-sans text-slate-900 bg-white m-0 p-0 flex">
      
      {/* Left Section - Informational Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-blue-50 to-white flex-col p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl mb-12">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>

        {/* Main Content - Centered Vertically */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Reliable Water<br />Delivery,<br />Made Simple
          </h1>
          
          <p className="text-lg text-slate-600 leading-relaxed max-w-md">
            Order, track, and manage water refills with ease. The cleanest water delivered right to your doorstep.
          </p>
        </div>

        {/* Image Card at Bottom */}
        <div className="mt-auto">
          <div className="bg-white rounded-xl p-6 shadow-lg overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Placeholder for water pouring image - replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Droplet size={64} className="text-blue-300" />
                </div>
              </div>
              {/* Water effect placeholder */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-400/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Sign In/Sign Up Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 text-blue-600 font-bold text-2xl mb-8">
            <Droplet fill="currentColor" size={28} />
            <span>AquaFlow</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome Back.
          </h2>
          
          <p className="text-slate-600 mb-8">
            Please enter your details to sign in.
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'signin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'signup'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field for Sign Up */}
            {activeTab === 'signup' && (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                  required={activeTab === 'signup'}
                />
              </div>
            )}

            {/* Email or Mobile Number */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={20} />
              </div>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@email.com or 09XX-XXX-XXXX"
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password for Sign Up */}
            {activeTab === 'signup' && (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                  required={activeTab === 'signup'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>
              {activeTab === 'signin' && (
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Forgot Password?
                </a>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              {activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>

            {/* Security Message */}
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Your data is encrypted and secure</span>
            </div>
          </form>

          {/* Help/Support */}
          <div className="mt-8 text-center text-slate-400 text-sm">
            Need help?{' '}
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;