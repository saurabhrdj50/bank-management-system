import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

export const AnimatedCounter = ({ end, duration = 2, prefix = '', suffix = '', decimals = 0 }) => (
  <CountUp
    start={0}
    end={end}
    duration={duration}
    separator=","
    decimals={decimals}
    decimal="."
    prefix={prefix}
    suffix={suffix}
    useEasing
  >
    {({ countUpRef }) => (
      <span ref={countUpRef} className="number-flip" />
    )}
  </CountUp>
);

export const CurrencyCounter = ({ amount, currency = '₹' }) => (
  <AnimatedCounter end={amount} prefix={currency} duration={2} />
);

export const StaggerContainer = ({ children, className = '', staggerDelay = 0.1 }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: staggerDelay } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const PageTransition = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeIn = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const directions = {
    up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } },
    none: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={directions[direction]}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay, type: 'spring', bounce: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);
