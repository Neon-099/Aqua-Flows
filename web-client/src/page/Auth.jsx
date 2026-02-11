import { useState, useEffect } from 'react';
import { Droplet, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, LocationEdit, PhoneCallIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {useAuth } from '../contexts/AuthProvider'

const Auth = () => {

  const { login, register, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [error, setError ] = useState('');
  const [loading, setLoading ] = useState(false);
  
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [closeWarning, setCloseWarning] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if(activeTab === 'signup'){
        if(formData.password !== formData.confirmPassword){
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await register(formData);
        if(res.success){
          setActiveTab('signin')
        }
        else {
          setError(res.error || 'Registration failed');
        }
      }
      //LOGIN
      else {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          if (res.role === 'customer') {
            navigate('/home');
          } else if (res.role === 'staff') {
            navigate('/staff/orders');
          } else if (res.role === 'rider') {
            navigate('/rider/orders');
          }  else {
            setError('Login succeeded, but role is missing.');
          }
        } else {
          setError(res.error || 'Login failed');
        }
      }
    }
    catch (error){
      setError('An unexpected error occurred');
    }
    finally {
      setLoading(false);
    }
  };

  const openResetModal = () => {
    setResetStep('request');
    setResetEmail(formData.email || '');
    setResetToken('');
    setResetPasswordValue('');
    setResetConfirm('');
    setResetError('');
    setResetMessage('');
    setShowResetPassword(false);
    setCloseWarning(false);
    setResetCooldown(0);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    if (!closeWarning) {
      setCloseWarning(true);
      return;
    }
    setShowResetModal(false);
    setCloseWarning(false);
    setResetCooldown(0);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setResetLoading(true);
    try {
      const res = await forgotPassword(resetEmail);
      if (res.success) {
        setResetMessage(res.message || 'Reset instructions sent. Check your email for the code.');
        setResetStep('reset');
        setResetCooldown(10 * 60);
      } else {
        setResetError(res.error || 'Could not send reset email.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    if (resetPasswordValue !== resetConfirm) {
      setResetError('Passwords do not match');
      return;
    }
    setResetLoading(true);
    try {
      const res = await resetPassword(resetToken, resetPasswordValue);
      if (res.success) {
        setResetMessage(res.message || 'Password reset successful. You can now sign in.');
        setResetStep('request');
        setResetToken('');
        setResetPasswordValue('');
        setResetConfirm('');
        setResetCooldown(0);
        setShowResetModal(false)
      } else {
        setResetError(res.error || 'Reset failed.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  console.log('Data: ',formData)

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
             {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )} 

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
                placeholder="name@email.com"
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
                <div className="absolute left-4 top-6 -translate-y-1/2 text-slate-400">
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
                  className="absolute right-4 top-6 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                {/*PHONE NUMBER & ADDRESS*/}
                <div className="relative mt-4">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <PhoneCallIcon size={20} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                    required={activeTab === 'signup'}
                  />
                </div>

                <div className="relative mt-4">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <LocationEdit size={20} />
                  </div>
                  <select
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                    required={activeTab === 'signup'}
                  >
                    <option value="">Select delivery area</option>
                    <option value="Downtown">Downtown</option>
                    <option value="Uptown">Uptown</option>
                    <option value="Riverside">Riverside</option>
                    <option value="West End">West End</option>
                    <option value="Campus">Campus</option>
                  </select>
                </div>
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
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              {loading ? 'Please wait...' : (activeTab === 'signin' ? 'Sign In' : 'Sign Up')}
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

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
              <button
                type="button"
                onClick={closeResetModal}
                className="text-slate-400 hover:text-slate-600"
              >
                x
              </button>
            </div>

            <div className="px-6 py-5">
              {resetError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {resetError}
                </div>
              )}
              {resetMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {resetMessage}
                </div>
              )}
              {closeWarning && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
                  You cant change your password once you close this form.
                </div>
              )}

              {resetStep === 'request' && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Enter your email and we will send you a reset code.
                  </p>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading || resetCooldown > 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                  >
                    {resetLoading ? 'Sending...' : resetCooldown > 0 ? 'Please wait...' : 'Send Reset Code'}
                  </button>
                  {resetCooldown > 0 && (
                    <p className="text-xs text-slate-500 text-center">
                      You can request a new code in {String(Math.floor(resetCooldown / 60)).padStart(2, '0')}:
                      {String(resetCooldown % 60).padStart(2, '0')}
                    </p>
                  )}
                </form>
              )}

              {resetStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Paste the reset code from your email and choose a new password.
                  </p>
                  {resetCooldown > 0 && (
                    <p className="text-xs text-slate-500 text-center">
                      You can request a new code in {String(Math.floor(resetCooldown / 60)).padStart(2, '0')}:
                      {String(resetCooldown % 60).padStart(2, '0')}
                    </p>
                  )}
                  <input
                    type="type"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Reset code"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      placeholder="New password"
                      className="w-full pr-12 px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pr-12 px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-6 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button
                    type="submit"
                    disabled={resetLoading || resetCooldown > 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                  >
                    {resetLoading ? 'Sending...' : resetCooldown > 0 ? 'Please wait...' : 'Send Reset Code'}
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
