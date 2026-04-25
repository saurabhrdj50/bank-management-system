import React from 'react';
import { motion } from 'framer-motion';

export const Loading = ({ fullscreen = false, message = 'Loading...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-3 border-transparent border-b-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <div className="text-center">
        <p className="text-slate-300 font-medium">{message}</p>
        <div className="loading-dots flex gap-1 justify-center mt-2">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-surface-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      {content}
    </div>
  );
};

export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return (
    <div className={`skeleton ${variants[variant]} ${className}`} />
  );
};

export const SkeletonCard = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10" variant="circle" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 pb-3 border-b border-slate-700/30">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

export const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-surface-900 z-[100] flex items-center justify-center"
  >
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-indigo-500/30 border-t-indigo-500"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-slate-400 font-medium"
      >
        Loading FinBank...
      </motion.p>
    </div>
  </motion.div>
);
