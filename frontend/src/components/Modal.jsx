import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export const Modal = ({ isOpen, title, children, onClose, footer, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className={`relative glass-card ${sizes[size]} w-full mx-4 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
              <h2 className="text-xl font-bold text-slate-100">{title}</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                ✕
              </motion.button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700/30 bg-slate-900/20">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AlertModal = ({ isOpen, title, message, onClose, type = 'info' }) => {
  const icons = {
    success: (
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          className="w-8 h-8 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </motion.svg>
      </div>
    ),
    error: (
      <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
        <span className="text-3xl text-red-400">✕</span>
      </div>
    ),
    warning: (
      <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
        <span className="text-3xl text-amber-400">!</span>
      </div>
    ),
    info: (
      <div className="w-16 h-16 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
        <span className="text-3xl text-indigo-400">i</span>
      </div>
    ),
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={<Button onClick={onClose}>Got it</Button>}
    >
      <div className="flex flex-col items-center text-center gap-4 py-4">
        {icons[type]}
        <p className="text-slate-300 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};

export const SuccessModal = ({ isOpen, onClose, amount, type = 'deposit' }) => (
  <Modal isOpen={isOpen} title="" onClose={onClose} size="sm">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
      className="flex flex-col items-center text-center py-6"
    >
      <div className="checkmark-circle mb-6">
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </div>
      <h3 className="text-2xl font-bold text-slate-100 mb-2">
        {type === 'transfer' ? 'Transfer Successful!' : type === 'withdraw' ? 'Withdrawal Successful!' : 'Deposit Successful!'}
      </h3>
      {amount && (
        <p className="text-3xl font-bold text-gradient mb-2">₹{parseFloat(amount).toLocaleString()}</p>
      )}
      <p className="text-slate-400 text-sm">Transaction has been processed successfully</p>
      <Button onClick={onClose} className="mt-6" fullWidth>
        Done
      </Button>
    </motion.div>
  </Modal>
);
