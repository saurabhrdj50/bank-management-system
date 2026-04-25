import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Button, Input, useToast, ToastContainer } from '../components';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiShield } from 'react-icons/fi';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '',
  });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const response = await authAPI.login({ email: formData.email, password: formData.password });
        const { token, user } = response.data;
        login(user, token);
        addToast('Welcome back!', 'success');
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          addToast('Please fill all required fields', 'error');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          addToast('Passwords do not match', 'error');
          setLoading(false);
          return;
        }
        const response = await authAPI.register(formData);
        const { token, user } = response.data;
        login(user, token);
        addToast('Account created successfully!', 'success');
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 relative overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <span className="text-white font-bold text-4xl">₹</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-3 border-surface-900 flex items-center justify-center">
                <FiShield size={10} className="text-surface-900" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-display font-bold text-slate-100 mb-2">FinBank</h1>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Sign in to your premium account' : 'Create your premium account'}
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <Input
                      name="email"
                      type="email"
                      label="Email Address"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      icon={<FiMail size={18} />}
                      required
                    />
                    <Input
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      icon={<FiLock size={18} />}
                      required
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        name="firstName"
                        label="First Name"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        icon={<FiUser size={16} />}
                        required
                      />
                      <Input
                        name="lastName"
                        label="Last Name"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <Input
                      name="phone"
                      type="tel"
                      label="Phone Number"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      icon={<FiPhone size={18} />}
                      required
                    />
                    <Input
                      name="email"
                      type="email"
                      label="Email Address"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      icon={<FiMail size={18} />}
                      required
                    />
                    <Input
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      icon={<FiLock size={18} />}
                      required
                    />
                    <Input
                      name="confirmPassword"
                      type="password"
                      label="Confirm Password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      icon={<FiLock size={18} />}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                className="mt-6"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={resetForm}
                  className="ml-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10"
            >
              <p className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
                <FiEye size={12} /> Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-400">
                  <span className="text-slate-300 font-medium">Admin:</span><br />
                  admin@bank.com / password
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-300 font-medium">User:</span><br />
                  user@bank.com / password
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs"
          >
            <FiShield size={14} />
            <span>256-bit SSL encrypted &bull; Bank-grade security</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
