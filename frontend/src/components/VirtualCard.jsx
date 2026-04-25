import React from 'react';
import { motion } from 'framer-motion';

const VirtualCard = ({ cardNumber = '4532 •••• •••• 7891', cardHolder = 'JOHN DOE', expiryDate = '12/28', cvv = '•••' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -30 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.8, type: 'spring' }}
      whileHover={{ scale: 1.02, rotateY: 5, transition: { duration: 0.3 } }}
      className="virtual-card cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      {/* Chip and Contactless */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80 flex items-center justify-center">
          <div className="w-8 h-6 rounded-sm border border-yellow-600/30 grid grid-cols-3 grid-rows-2 gap-px p-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-yellow-600/20 rounded-[1px]" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 opacity-60">
          <div className="w-6 h-0.5 bg-white rounded" />
          <div className="w-5 h-0.5 bg-white rounded" />
          <div className="w-4 h-0.5 bg-white rounded" />
        </div>
      </div>

      {/* Card Number */}
      <div className="relative z-10 mb-6">
        <p className="font-mono text-xl tracking-[0.2em] text-white/90 font-medium">
          {cardNumber}
        </p>
      </div>

      {/* Card Details */}
      <div className="flex items-end justify-between relative z-10">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Card Holder</p>
          <p className="font-mono text-sm tracking-wider text-white/80 font-medium">{cardHolder}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Expires</p>
          <p className="font-mono text-sm text-white/80 font-medium">{expiryDate}</p>
        </div>
      </div>

      {/* FinBank Logo */}
      <div className="absolute top-4 right-5 opacity-20 text-white font-display font-bold text-lg tracking-wider">
        FinBank
      </div>

      {/* Decorative Circles */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-white/5" />
    </motion.div>
  );
};

export default VirtualCard;
