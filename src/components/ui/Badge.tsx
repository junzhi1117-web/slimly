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
    sage: 'bg-[var(--color-sage-light)] text-[var(--color-deep)] border border-[rgba(143,188,176,0.4)]',
    rose: 'bg-[var(--color-rose-light)] text-[var(--color-rose)] border border-[rgba(201,160,168,0.3)]',
    gold: 'bg-[var(--color-gold-light)] text-[var(--color-deep)]',
    muted: 'bg-[var(--color-bg)] text-[var(--color-muted)]'
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${variants[variant]} ${className}`}
      style={{ letterSpacing: '0.03em' }}
    >
      {children}
    </span>
  )
}
