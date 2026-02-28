import React from 'react'
import { ChevronLeft } from 'lucide-react'

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]/50 px-4 flex items-center h-16">
      {showBack && (
        <button onClick={onBack} className="mr-2 p-1 text-[var(--color-deep)]">
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-serif italic text-[var(--color-deep)]">{title}</h1>
    </header>
  )
}
