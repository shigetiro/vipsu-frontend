/**
 * Modern Design Component Patterns
 * Demonstrates consistent modern design implementations
 */

import React from 'react';
import { cn } from '../utils/cn';

// ==========================================
// 1. MODERN CARD PATTERN - Standardized shadows, borders, and hover effects
// ==========================================

export interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'ghost';
  className?: string;
  children: React.ReactNode;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        // Base card styling with modern glassmorphism
        'rounded-2xl transition-all duration-300',
        'bg-card',
        'border border-card',
        'shadow-md',
        // Hover effects vary by variant
        variant === 'glow' && (
          'hover:bg-card-hover hover:border-accent hover:shadow-glow'
        ),
        variant === 'ghost' && (
          'hover:bg-card-hover'
        ),
        variant === 'default' && (
          'hover:bg-card-hover hover:shadow-lg'
        ),
        'transform hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 2. MODERN BUTTON PATTERN - Consistent button architecture
// ==========================================

export interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        // Base button styles
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Size variants
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        // Color variants
        variant === 'primary' && (
          'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700',
          'shadow-md hover:shadow-lg'
        ),
        variant === 'secondary' && (
          'bg-surface-2 text-text-primary hover:bg-surface-3',
          'border border-card hover:border-border-accent'
        ),
        variant === 'ghost' && (
          'bg-transparent text-text-primary hover:bg-surface-2'
        ),
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
};

// ==========================================
// 3. STAT CARD PATTERN - Clean stat display with modern typography
// ==========================================

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  trend?: { value: number; isPositive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend
}) => {
  const colorStyles = {
    primary: {
      bg: 'from-primary-500/20 to-primary-600/10',
      border: 'border-primary-500/30',
      text: 'text-primary-400',
      icon: 'bg-primary-500/20 text-primary-400'
    },
    success: {
      bg: 'from-success/20 to-success/10',
      border: 'border-success/30',
      text: 'text-success',
      icon: 'bg-success/20 text-success'
    },
    warning: {
      bg: 'from-warning/20 to-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      icon: 'bg-warning/20 text-warning'
    },
    error: {
      bg: 'from-error/20 to-error/10',
      border: 'border-error/30',
      text: 'text-error',
      icon: 'bg-error/20 text-error'
    }
  }[color];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border',
        'bg-gradient-to-br',
        colorStyles.bg,
        colorStyles.border,
        'backdrop-blur-md transition-all duration-300',
        'hover:-translate-y-1 hover:scale-[1.01] transform-gpu',
        'shadow-lg hover:shadow-2xl'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {title}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {value}
            </div>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-error'
              )}>
                <span className="animate-bounce">
                  {trend.isPositive ? '↑' : '↓'}
                </span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'rounded-xl p-3 backdrop-blur-sm transition-all duration-300',
              colorStyles.icon,
              'group-hover:scale-110 group-hover:rotate-3 transform-gpu'
            )}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Usage Example:
/**
 *
import { ProfileHeaderModernized } from './User/ProfileHeaderModernized';
import { ModernCard, ModernButton, StatCard } from './UI/DesignPatterns';
 *
 * // Modern Stat Card usage:
 * <StatCard
 *   title="Total Users"
 *   value="12,345"
 *   icon={<UsersIcon />}
 *   color="primary"
 *   trend={{ value: 15, isPositive: true }}
 * />
 *
 * // Modern Card usage:
 * <ModernCard variant="glow" className="p-6">
 *   <h2 className="text-heading-3 mb-4">Section Title</h2>
 *   <p className="text-body-lg">Card content with modern styling</p>
 * </ModernCard>
 *
 * // Modern Button usage:
 * <ModernButton
 *   variant="primary"
 *   size="md"
 *   loading={isLoading}
 *   onClick={handleAction}
 * >
 *   Click Me
 * </ModernButton>
 */

export default {
  ModernCard,
  ModernButton,
  StatCard
};
