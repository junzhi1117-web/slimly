import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'sage' | 'rose' | 'gold' | 'muted'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'sage',
  className = ''
}) => {
  const variants = {
    sage: 'bg-[var(--color-sage-light)] text-[var(--color-deep)]',
    rose: 'bg-[var(--color-rose-light)] text-[var(--color-rose)]',
    gold: 'bg-[var(--color-gold-light)] text-[var(--color-deep)]',
    muted: 'bg-[var(--color-bg)] text-[var(--color-muted)]'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
