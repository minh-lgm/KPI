'use client';

import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { cardHoverVariants } from '@/lib/animations';

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  suffix?: string;
  animated?: boolean;
}

export default function StatCard({ label, value, variant = 'default', suffix, animated = false }: StatCardProps) {
  const valueClass = variant !== 'default' ? `stat-card__value--${variant}` : '';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNumeric = !isNaN(numericValue);

  const cardContent = (
    <>
      <div className="stat-card__label">{label}</div>
      <div className={`stat-card__value ${valueClass}`}>
        {animated && isNumeric ? (
          <CountUp
            end={numericValue}
            duration={2}
            separator=","
            decimal="."
            decimals={suffix === '%' ? 1 : 0}
            suffix={suffix}
            enableScrollSpy
            scrollSpyOnce
          />
        ) : (
          <>{value}{suffix}</>
        )}
      </div>
    </>
  );

  if (animated) {
    return (
      <motion.div 
        className="stat-card"
        variants={cardHoverVariants}
        initial="initial"
        whileHover="hover"
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div className="stat-card">
      {cardContent}
    </div>
  );
}
