import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline,
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg font-bold'
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size].split(' ')[0]} ${sizeMap[size].split(' ')[1]} rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-slate-800 text-slate-100 dark:bg-slate-700 dark:text-slate-200 font-medium flex items-center justify-center border border-slate-300 dark:border-slate-600 shadow-xs`}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          } ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`}
        />
      )}
    </div>
  );
};
