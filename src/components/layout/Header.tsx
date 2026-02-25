import React from 'react'

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3 flex items-center h-14">
      {showBack && (
        <button onClick={onBack} className="mr-2 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="text-xl font-bold text-[var(--color-primary)]">{title}</h1>
    </header>
  )
}
