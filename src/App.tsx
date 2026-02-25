import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { LogPage } from './pages/LogPage'
import { WeightPage } from './pages/WeightPage'
import { ProfilePage } from './pages/ProfilePage'
import { BottomNav } from './components/layout/BottomNav'
import { Header } from './components/layout/Header'
import { useLocalStorage } from './lib/supabase'
import type { InjectionLog, WeightLog, UserProfile } from './types'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  
  const [profile, setProfile] = useLocalStorage<UserProfile>('slimly_profile', {
    medicationType: 'mounjaro',
    currentDose: 2.5,
    startDate: new Date().toISOString().split('T')[0],
    startWeight: 80,
    targetWeight: 70,
    height: 175
  })

  const [injectionLogs, setInjectionLogs] = useLocalStorage<InjectionLog[]>('slimly_injection_logs', [])
  const [weightLogs, setWeightLogs] = useLocalStorage<WeightLog[]>('slimly_weight_logs', [])

  const handleAddInjection = (log: Omit<InjectionLog, 'id'>) => {
    const newLog = { ...log, id: crypto.randomUUID() }
    setInjectionLogs([newLog, ...injectionLogs])
  }

  const handleAddWeight = (log: Omit<WeightLog, 'id'>) => {
    const newLog = { ...log, id: crypto.randomUUID() }
    setWeightLogs([newLog, ...weightLogs])
  }

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setProfile({ ...profile, ...updates })
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="p-4">
            <Header title="纖記 Slimly" />
            <HomePage 
              profile={profile} 
              injectionLogs={injectionLogs} 
              weightLogs={weightLogs} 
              onAction={setActiveTab}
            />
          </div>
        )
      case 'log':
        return (
          <LogPage 
            logs={injectionLogs} 
            profile={profile} 
            onAddLog={handleAddInjection} 
          />
        )
      case 'weight':
        return (
          <WeightPage 
            logs={weightLogs} 
            profile={profile} 
            onAddLog={handleAddWeight} 
          />
        )
      case 'profile':
        return (
          <ProfilePage 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-md mx-auto bg-[var(--color-bg)] min-h-screen pb-20">
      {renderPage()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
