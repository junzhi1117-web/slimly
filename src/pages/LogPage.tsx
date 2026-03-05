import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/layout/Header'
import { InjectionList } from '../components/injection/InjectionList'
import { InjectionForm } from '../components/injection/InjectionForm'
import { Button } from '../components/ui/Button'
import type { DoseRecord, UserProfile, InjectionSite } from '../types'
import { Plus } from 'lucide-react'

interface LogPageProps {
  logs: DoseRecord[]
  profile: UserProfile
  onAddLog: (log: Omit<DoseRecord, 'id'>) => void
  onRemoveLog: (id: string) => void
}

export const LogPage: React.FC<LogPageProps> = ({ logs, profile, onAddLog, onRemoveLog }) => {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)

  const sites: InjectionSite[] = [
    'abdomen-left', 'abdomen-right',
    'thigh-left', 'thigh-right',
    'arm-left', 'arm-right',
  ]

  const suggestedSite: InjectionSite = (() => {
    if (logs.length === 0) return sites[0]
    const last = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    const lastIndex = sites.indexOf(last.injectionSite!)
    return sites[(lastIndex + 1) % sites.length]
  })()

  const handleSave = (log: Omit<DoseRecord, 'id'>) => {
    onAddLog(log)
    setIsAdding(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header
        title={isAdding ? t('log.add_title') : t('log.title')}
        onBack={isAdding ? () => setIsAdding(false) : undefined}
      />
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
            {(() => {
              const todayLog = logs.find(l => l.date === new Date().toISOString().split('T')[0])
              return todayLog ? (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--color-sage-light)] text-[var(--color-sage)]">
                  <span className="text-lg">✓</span>
                  <div>
                    <p className="text-sm font-medium">{t('log.today_logged', { dose: todayLog.dose })}</p>
                    <p className="text-xs text-[var(--color-muted)]">{t('log.today_site', { site: t('injection_site.' + todayLog.injectionSite) })}</p>
                  </div>
                </div>
              ) : null
            })()}
            <Button fullWidth className="h-14 gap-2 text-lg" onClick={() => setIsAdding(true)}>
              <Plus size={24} />
              {logs.find(l => l.date === new Date().toISOString().split('T')[0]) ? t('log.add_extra') : t('log.add_record')}
            </Button>
            <section>
              <h3 className="font-medium text-[var(--color-muted)] text-sm mb-3 px-1">{t('log.history')}</h3>
              <InjectionList logs={logs} onRemove={onRemoveLog} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
