/**
 * @file Button.tsx
 * Phase 6B — Enhanced button component with animations and micro-interactions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { buttonVariants } from '../utils/animations';

// ─── Button Types ──────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// ─── Button Component ──────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-semibold',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-primary',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0',
  ];

  const variantClasses: Record<ButtonVariant, string> = {
    primary: [
      'bg-accent text-white shadow-lg shadow-accent/20',
      'hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30',
      'active:translate-y-0 active:shadow-lg',
    ].join(' '),
    secondary: [
      'bg-bg-card border border-white/10 text-text-primary',
      'hover:bg-bg-secondary hover:border-white/20 hover:-translate-y-0.5 hover:shadow-md',
      'active:translate-y-0',
    ].join(' '),
    outline: [
      'bg-transparent border border-white/10 text-text-primary',
      'hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-0.5',
      'active:translate-y-0',
    ].join(' '),
    ghost: [
      'bg-transparent text-text-secondary',
      'hover:bg-white/5 hover:text-text-primary',
      'active:bg-white/10',
    ].join(' '),
    danger: [
      'bg-danger text-white shadow-lg shadow-danger/20',
      'hover:bg-danger/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-danger/30',
      'active:translate-y-0 active:shadow-lg',
    ].join(' '),
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-7 py-3.5 text-base rounded-xl',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || loading;

  return (
    <motion.button
      disabled={isDisabled}
      className={[
        ...baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClasses,
        className,
      ].join(' ')}
      variants={buttonVariants}
      initial="rest"
      whileHover={!isDisabled ? 'hover' : undefined}
      whileTap={!isDisabled ? 'tap' : undefined}
      type={props.type}
      onClick={props.onClick}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      aria-label={props['aria-label']}
      style={props.style}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
}

// ─── Icon Button ───────────────────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  'aria-label': string;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-primary',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ];

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-white hover:bg-accent/90',
    secondary: 'bg-bg-card border border-white/10 text-text-primary hover:bg-bg-secondary',
    outline: 'bg-transparent border border-white/10 text-text-primary hover:border-accent/50',
    ghost: 'bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-7 w-7 rounded-lg text-sm',
    md: 'h-9 w-9 rounded-xl text-base',
    lg: 'h-11 w-11 rounded-xl text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      disabled={isDisabled}
      className={[
        ...baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      variants={buttonVariants}
      initial="rest"
      whileHover={!isDisabled ? 'hover' : undefined}
      whileTap={!isDisabled ? 'tap' : undefined}
      type={props.type}
      onClick={props.onClick}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      aria-label={props['aria-label']}
      style={props.style}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
      ) : (
        icon
      )}
    </motion.button>
  );
}

// ─── Button Group ──────────────────────────────────────────────────────────────

export function ButtonGroup({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}
