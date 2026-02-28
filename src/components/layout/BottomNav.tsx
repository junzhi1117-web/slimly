import React from 'react'
import { Home, BookOpen, TrendingDown, User } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: '首頁', icon: Home },
    { id: 'log', label: '日記', icon: BookOpen },
    { id: 'weight', label: '體重', icon: TrendingDown },
    { id: 'profile', label: '我', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-[var(--color-border)]/40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-[var(--color-sage)]' : 'text-[var(--color-muted)]'
              }`}
            >
              {isActive && (
                <span className="absolute top-1.5 w-5 h-[3px] rounded-full bg-[var(--color-sage)]" />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
