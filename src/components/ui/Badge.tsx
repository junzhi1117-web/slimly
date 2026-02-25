import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'muted'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  className = ''
}) => {
  const variants = {
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
    accent: 'bg-orange-100 text-[var(--color-accent)]',
    muted: 'bg-gray-100 text-[var(--color-text-muted)]'
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
