import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-border)] ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
