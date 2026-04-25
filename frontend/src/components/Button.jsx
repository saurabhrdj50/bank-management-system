import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  icon = null,
  fullWidth = false
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
    secondary: 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border border-slate-700/50 hover:border-slate-600/50',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/30 hover:border-slate-600/50',
    outline: 'bg-transparent border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400',
    glass: 'glass text-slate-200 hover:bg-slate-700/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-semibold
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center
        relative overflow-hidden
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v0a8 8 0 100 16v0a8 8 0 01-8-8z" />
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export const IconButton = ({ icon, onClick, className = '', title = '', variant = 'ghost' }) => {
  const variants = {
    ghost: 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200',
    primary: 'hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300',
    danger: 'hover:bg-red-500/20 text-red-400 hover:text-red-300',
  };

  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        p-2.5 rounded-xl
        transition-all duration-200
        ${variants[variant]}
        ${className}
      `}
    >
      {icon}
    </motion.button>
  );
};

export const GradientButton = ({ children, onClick, className = '', gradient = 'from-indigo-600 via-purple-600 to-pink-500' }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}
    whileTap={{ scale: 0.98 }}
    className={`
      bg-gradient-to-r ${gradient}
      text-white font-semibold px-6 py-3 rounded-xl
      shadow-lg transition-all duration-300
      ${className}
    `}
  >
    {children}
  </motion.button>
);
