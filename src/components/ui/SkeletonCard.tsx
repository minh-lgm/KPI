'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { skeletonPulseAnimation } from '@/lib/animations';

interface SkeletonCardProps {
  variant?: 'default' | 'stats' | 'chart' | 'table';
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'default', 
  className = '' 
}) => {
  const baseClass = 'rounded-lg overflow-hidden';
  
  if (variant === 'stats') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${baseClass} bg-white border border-gray-200 p-6 ${className}`}
      >
        <div 
          className="h-4 w-24 bg-gray-200 rounded mb-4"
          style={skeletonPulseAnimation}
        />
        <div 
          className="h-10 w-32 bg-gray-200 rounded mb-2"
          style={skeletonPulseAnimation}
        />
        <div 
          className="h-3 w-20 bg-gray-200 rounded"
          style={skeletonPulseAnimation}
        />
      </motion.div>
    );
  }
  
  if (variant === 'chart') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${baseClass} bg-white border border-gray-200 p-6 ${className}`}
      >
        <div 
          className="h-6 w-48 bg-gray-200 rounded mb-4"
          style={skeletonPulseAnimation}
        />
        <div 
          className="h-64 w-full bg-gray-200 rounded"
          style={skeletonPulseAnimation}
        />
      </motion.div>
    );
  }
  
  if (variant === 'table') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${baseClass} bg-white border border-gray-200 ${className}`}
      >
        {/* Table header */}
        <div className="border-b border-gray-200 p-4 flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="h-4 bg-gray-200 rounded flex-1"
              style={skeletonPulseAnimation}
            />
          ))}
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map(row => (
          <div key={row} className="border-b border-gray-100 p-4 flex gap-4">
            {[1, 2, 3, 4].map(col => (
              <div 
                key={col}
                className="h-4 bg-gray-200 rounded flex-1"
                style={skeletonPulseAnimation}
              />
            ))}
          </div>
        ))}
      </motion.div>
    );
  }
  
  // Default card skeleton
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${baseClass} bg-white border border-gray-200 p-6 ${className}`}
    >
      <div 
        className="h-6 w-3/4 bg-gray-200 rounded mb-4"
        style={skeletonPulseAnimation}
      />
      <div className="space-y-3">
        <div 
          className="h-4 w-full bg-gray-200 rounded"
          style={skeletonPulseAnimation}
        />
        <div 
          className="h-4 w-5/6 bg-gray-200 rounded"
          style={skeletonPulseAnimation}
        />
        <div 
          className="h-4 w-4/6 bg-gray-200 rounded"
          style={skeletonPulseAnimation}
        />
      </div>
    </motion.div>
  );
};

export default SkeletonCard;