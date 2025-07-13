import React from 'react';
import { cn } from '~/lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
  location?: string;
  onAction?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  size = 'md',
  variant = 'primary',
  children,
  icon,
  onAction,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onAction) {
      onAction();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-2.5 px-6 text-sm',
    lg: 'py-3 px-8 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary hover:bg-dark-hover text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex cursor-pointer hover:scale-105 transition-all items-center gap-2 rounded-md font-semibold',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
