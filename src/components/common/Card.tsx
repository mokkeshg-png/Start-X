import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'academic' | 'ai' | 'flat';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'academic',
  className = '',
  onClick,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200 shadow-2xs',
    academic: 'bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-smooth',
    ai: 'bg-white border border-slate-200 shadow-2xs',
    flat: 'bg-slate-50 border border-slate-200'
  };

  const clickableStyles = onClick ? 'cursor-pointer hover:border-[#0B1E36]/30' : '';

  return (
    <div
      onClick={onClick}
      className={`rounded p-5 sm:p-6 ${variantStyles[variant]} ${clickableStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  label?: string;
  trend?: string;
  trendPositive?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'ai';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  label,
  trend,
  trendPositive = true,
  icon,
  onClick,
  variant = 'default'
}) => {
  return (
    <Card variant={variant} onClick={onClick} className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        <div className="p-2 rounded bg-slate-100 text-[#0B1E36] border border-slate-200">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="font-serif-academic text-2xl sm:text-3xl font-bold text-[#0B1E36] tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded border ${
              trendPositive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {label && <p className="mt-1 text-xs text-slate-500">{label}</p>}
    </Card>
  );
};
