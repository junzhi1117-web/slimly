import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'sage' | 'rose' | 'hero'
}

const variantClasses = {
  default: 'card-monet',
  sage: 'card-sage',
  rose: 'card-rose',
  hero: 'card-hero',
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, variant = 'default' }) => {
  return (
    <div
      className={`${variantClasses[variant]} p-4 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
