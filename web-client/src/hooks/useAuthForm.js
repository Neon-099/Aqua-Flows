import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { toast } from 'react-toastify';

const INITIAL_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  address: ''
};

const STRONG_PASSWORD = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const useAuthForm = () => {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    const rootElements = ['html', 'body', '#root'];
    rootElements.forEach((selector) => {
      const el = document.querySelector(selector);
      if (el) {
        el.style.margin = '0';
        el.style.padding = '0';
        el.style.width = '100vw';
        el.style.overflowX = 'hidden';
      }
    });
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        if (activeTab === 'signup') {
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
          }
          if (!STRONG_PASSWORD.test(formData.password)) {
            setError(
              'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.'
            );
            setLoading(false);
            return;
          }
          if (formData.phone.length !== 11) {
            setError('Phone number must be exactly 11 digits.');
            setLoading(false);
            return;
          }
          const res = await register(formData);
          if (res.success) {
            setActiveTab('signin');
          } else {
            setError(res.error || 'Registration failed');
          }
        } else {
          const res = await login(formData.email, formData.password);
          if (res.success) {
            toast.success("Logged in successfully")
            if (res.role === 'customer') {

              navigate('/home');
            } else if (res.role === 'staff') {
              navigate('/staff/orders');
            } else if (res.role === 'rider') {
              navigate('/rider/orders');
            } else {
              setError('Login succeeded, but role is missing.');
            }
          } else {
            setError(res.error || 'Login failed');
          }
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, formData, login, navigate, register]
  );

  const openResetModal = useCallback(() => {
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
  }, [formData.email]);

  const closeResetModal = useCallback(() => {
    if (!closeWarning) {
      setCloseWarning(true);
      return;
    }
    setShowResetModal(false);
    setCloseWarning(false);
    setResetCooldown(0);
  }, [closeWarning]);

  const handleRequestReset = useCallback(
    async (e) => {
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
    },
    [forgotPassword, resetEmail]
  );

  const handleResetPassword = useCallback(
    async (e) => {
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
          setShowResetModal(false);
        } else {
          setResetError(res.error || 'Reset failed.');
        }
      } finally {
        setResetLoading(false);
      }
    },
    [resetConfirm, resetPassword, resetPasswordValue, resetToken]
  );

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  return {
    error,
    loading,
    activeTab,
    showPassword,
    rememberMe,
    showResetModal,
    resetStep,
    resetEmail,
    resetToken,
    resetPasswordValue,
    resetConfirm,
    resetLoading,
    resetError,
    resetMessage,
    showResetPassword,
    closeWarning,
    resetCooldown,
    formData,
    setActiveTab,
    setShowPassword,
    setRememberMe,
    setResetEmail,
    setResetToken,
    setResetPasswordValue,
    setResetConfirm,
    setShowResetPassword,
    handleInputChange,
    handleSubmit,
    openResetModal,
    closeResetModal,
    handleRequestReset,
    handleResetPassword
  };
};

export default useAuthForm;
