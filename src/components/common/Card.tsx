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
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs',
    academic: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-smooth',
    ai: 'bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/60 dark:border-indigo-900/50 shadow-sm ai-glow-border',
    flat: 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60'
  };

  const clickableStyles = onClick ? 'cursor-pointer hover:-translate-y-0.5' : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 ${variantStyles[variant]} ${clickableStyles} ${className}`}
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
    <Card variant={variant} onClick={onClick} className="relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:scale-105 transition-transform">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {label && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>}
    </Card>
  );
};
