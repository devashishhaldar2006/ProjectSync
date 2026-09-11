import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'overdue' | 'active-users';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
}) => {
  return (
    <div className={`glass-card stat-card ${variant}`}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-val">{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color:
            variant === 'overdue'
              ? '#c94b4b'
              : variant === 'active-users'
              ? '#38a178'
              : '#2d8a66',
        }}
      >
        <Icon size={22} />
      </div>
    </div>
  );
};
