// components/ui/Button.tsx
import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'w-full text-center font-semibold py-3 px-4 rounded-lg transition-colors duration-200';

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;