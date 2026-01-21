interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  suffix?: string;
}

export default function StatCard({ label, value, variant = 'default', suffix }: StatCardProps) {
  const valueClass = variant !== 'default' ? `stat-card__value--${variant}` : '';

  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className={`stat-card__value ${valueClass}`}>
        {value}{suffix}
      </div>
    </div>
  );
}
