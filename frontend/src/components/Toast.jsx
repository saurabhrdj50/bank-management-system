import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: '✓' },
    error: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: '✕' },
    warning: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', icon: '!' },
    info: { bg: 'bg-indigo-500/15 border-indigo-500/30', text: 'text-indigo-400', icon: 'i' },
  };

  const c = config[type] || config.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`${c.bg} border backdrop-blur-xl rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-black/20 min-w-[300px] max-w-[400px]`}
    >
      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center text-lg font-bold ${c.text} flex-shrink-0`}>
        {c.icon}
      </div>
      <span className={`text-sm font-medium ${c.text} flex-1`}>{message}</span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
      >
        ✕
      </motion.button>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-20 right-4 z-[60] space-y-3">
    <AnimatePresence>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  </div>
);

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
