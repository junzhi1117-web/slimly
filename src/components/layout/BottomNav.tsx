import React from 'react'
import { Home, Syringe, Scale, Apple, User } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  maintenanceMode?: boolean
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, maintenanceMode }) => {
  // 維持期：隱藏注射日記，飲食置前
  const tabs = maintenanceMode
    ? [
        { id: 'home',      label: '首頁', icon: Home },
        { id: 'nutrition', label: '飲食', icon: Apple },
        { id: 'weight',    label: '體重', icon: Scale },
        { id: 'profile',   label: '我',   icon: User },
      ]
    : [
        { id: 'home',      label: '首頁', icon: Home },
        { id: 'log',       label: '注射', icon: Syringe },
        { id: 'weight',    label: '體重', icon: Scale },
        { id: 'nutrition', label: '飲食', icon: Apple },
        { id: 'profile',   label: '我',   icon: User },
      ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-[var(--color-border)]/40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-[60px] max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-[var(--color-sage)]' : 'text-[var(--color-muted)] opacity-60'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium" style={{ letterSpacing: '0.05em' }}>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-[var(--color-sage)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
