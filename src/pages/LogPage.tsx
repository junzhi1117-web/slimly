import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { InjectionList } from '../components/injection/InjectionList'
import { InjectionForm } from '../components/injection/InjectionForm'
import { Button } from '../components/ui/Button'
import type { InjectionLog, UserProfile, InjectionSite } from '../types'
import { Plus } from 'lucide-react'

interface LogPageProps {
  logs: InjectionLog[]
  profile: UserProfile
  onAddLog: (log: Omit<InjectionLog, 'id'>) => void
}

export const LogPage: React.FC<LogPageProps> = ({ logs, profile, onAddLog }) => {
  const [isAdding, setIsAdding] = useState(false)

  // Suggest next site (simple rotation)
  const sites: InjectionSite[] = ['abdomen-left', 'abdomen-right', 'thigh-left', 'thigh-right', 'arm-left', 'arm-right']
  let suggestedSite: InjectionSite = sites[0]
  
  if (logs.length > 0) {
    const lastLog = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    const lastIndex = sites.indexOf(lastLog.site)
    suggestedSite = sites[(lastIndex + 1) % sites.length]
  }

  const handleSave = (newLog: Omit<InjectionLog, 'id'>) => {
    onAddLog(newLog)
    setIsAdding(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title={isAdding ? "新增注射記錄" : "注射日記"} />
      
      <main className="p-4">
        {isAdding ? (
          <InjectionForm 
            medicationType={profile.medicationType}
            currentDose={profile.currentDose}
            suggestedSite={suggestedSite}
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <div className="space-y-6">
            <Button 
              fullWidth 
              className="h-14 gap-2 text-lg shadow-md"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={24} />
              紀錄本次注射
            </Button>
            
            <section>
              <h3 className="font-bold text-gray-400 text-sm mb-3 px-1 uppercase tracking-wider">歷史記錄</h3>
              <InjectionList logs={logs} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
