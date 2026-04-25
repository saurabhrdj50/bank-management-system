import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = true, onClick, glow = false, gradient = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
    onClick={onClick}
    className={`
      glass-card p-6
      ${glow ? 'shadow-neon' : ''}
      ${gradient ? `bg-gradient-to-br ${gradient}` : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </motion.div>
);

export const CardHeader = ({ title, subtitle, icon, action, gradient = false }) => (
  <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-700/30">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
          {icon}
        </div>
      )}
      <div>
        <h3 className={`text-lg font-bold ${gradient ? 'text-gradient' : 'text-slate-100'}`}>{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`text-slate-300 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-slate-700/30 pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

export const StatCard = ({ icon, label, value, subValue, trend, trendUp, color = 'indigo', delay = 0 }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20 text-rose-400',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
  };

  const iconColorMap = {
    indigo: 'bg-indigo-500/15 text-indigo-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    purple: 'bg-purple-500/15 text-purple-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`stat-card bg-gradient-to-br ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconColorMap[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            trendUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </motion.div>
  );
};

export const GlassPanel = ({ children, className = '' }) => (
  <div className={`glass-light rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);
