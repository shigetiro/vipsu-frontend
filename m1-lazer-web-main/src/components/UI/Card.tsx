import { cn } from '../../utils/cn';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'glow' | 'elevated';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'default',
    hover = true,
    className,
    children,
    ...props
  }: CardProps, ref) => {
    const baseStyles = 'rounded-2xl border border-default bg-card transition-all duration-400';

    const variants = {
      default: 'shadow-md hover:shadow-xl',
      glass: 'glass-card backdrop-blur-xl',
      glow: 'card-glow relative',
      elevated: 'shadow-lg shadow-black/10 hover:shadow-2xl',
    };

    const hoverStyles = hover
      ? 'group hover:glass-card-hover hover:shadow-glow cursor-pointer active:scale-[0.98]'
      : 'hover:shadow-lg';

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        whileHover={hover ? { y: -4, scale: 1.02 } : { y: -1 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
