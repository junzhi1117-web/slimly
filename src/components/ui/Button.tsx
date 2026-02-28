import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'rose' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]'

  const variants = {
    primary: 'bg-[var(--color-sage)] text-white hover:brightness-95',
    secondary: 'bg-[var(--color-gold)] text-[var(--color-deep)] hover:brightness-95',
    rose: 'bg-[var(--color-rose)] text-white hover:brightness-95',
    outline: 'border border-[var(--color-border)] text-[var(--color-deep)] hover:bg-[var(--color-sage-light)]',
    ghost: 'text-[var(--color-muted)] hover:bg-[var(--color-sage-light)] hover:text-[var(--color-deep)]'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
