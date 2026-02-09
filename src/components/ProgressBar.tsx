'use client';

import { motion } from 'framer-motion';
import { progressBarVariants } from '@/lib/animations';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  animated?: boolean;
  delay?: number;
}

export default function ProgressBar({ 
  value, 
  showLabel = false, 
  animated = false,
  delay = 0 
}: ProgressBarProps) {
  const getVariant = (val: number) => {
    if (val >= 80) return 'success';
    if (val >= 50) return 'warning';
    return 'danger';
  };

  const variant = getVariant(value);
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="progress" style={{ flex: 1 }}>
        {animated ? (
          <motion.div
            className={`progress__bar progress__bar--${variant}`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay }}
          />
        ) : (
          <div
            className={`progress__bar progress__bar--${variant}`}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.875rem', fontWeight: 500, minWidth: '45px' }}>
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
