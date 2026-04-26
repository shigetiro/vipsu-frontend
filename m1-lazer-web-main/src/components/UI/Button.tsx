import { cn } from '../../utils/cn';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    className,
    children,
    ...props
  }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:brightness-105',
      secondary: 'bg-white text-primary border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40',
      ghost: 'bg-transparent text-secondary hover:bg-secondary/10',
      danger: 'bg-error text-white hover:bg-error/90',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        whileFocus={{ scale: 1.05 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 shadow-md',
          'focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary/30 focus:ring-offset-transparent',
          variants[variant],
          sizes[size],
          loading && 'opacity-70 cursor-not-allowed',
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <motion.span 
            className="spinner spinner-sm"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : icon}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
