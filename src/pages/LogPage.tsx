import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { InjectionList } from '../components/injection/InjectionList'
import { InjectionForm } from '../components/injection/InjectionForm'
import { PostInjectionCheckIn } from '../components/injection/PostInjectionCheckIn'
import { Button } from '../components/ui/Button'
import type { DoseRecord, UserProfile, InjectionSite, SideEffectEntry } from '../types'
import { Plus } from 'lucide-react'

type LogState = 'list' | 'form' | 'checkin'

interface LogPageProps {
  logs: DoseRecord[]
  profile: UserProfile
  onAddLog: (log: Omit<DoseRecord, 'id'>) => void
  onUpdateSideEffects?: (id: string, sideEffects: SideEffectEntry[]) => void
}

export const LogPage: React.FC<LogPageProps> = ({
  logs,
  profile,
  onAddLog,
  onUpdateSideEffects,
}) => {
  const [state, setState] = useState<LogState>('list')
  const [pendingRecord, setPendingRecord] = useState<DoseRecord | null>(null)

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

  // Step 1: save core injection data → move to check-in
  const handleFormSave = (log: Omit<DoseRecord, 'id'>) => {
    const saved: DoseRecord = { ...log, id: Date.now().toString() }
    onAddLog(log)
    setPendingRecord(saved)
    setState('checkin')
  }

  // Step 2: check-in complete → attach side effects + back to list
  const handleCheckInComplete = (sideEffects: SideEffectEntry[]) => {
    if (pendingRecord && sideEffects.length > 0 && onUpdateSideEffects) {
      onUpdateSideEffects(pendingRecord.id, sideEffects)
    }
    setPendingRecord(null)
    setState('list')
  }

  const handleSkip = () => {
    setPendingRecord(null)
    setState('list')
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header
        title={
          state === 'form'    ? '新增注射記錄' :
          state === 'checkin' ? '注射後感受'   :
          '注射日記'
        }
        onBack={state !== 'list' ? () => setState('list') : undefined}
      />

      <main className="p-4">
        {state === 'form' && (
          <InjectionForm
            medicationType={profile.medicationType}
            currentDose={profile.currentDose}
            suggestedSite={suggestedSite}
            onSave={handleFormSave}
            onCancel={() => setState('list')}
          />
        )}

        {state === 'checkin' && pendingRecord && (
          <PostInjectionCheckIn
            record={pendingRecord}
            onComplete={handleCheckInComplete}
            onSkip={handleSkip}
          />
        )}

        {state === 'list' && (
          <div className="space-y-6">
            <Button
              fullWidth
              className="h-14 gap-2 text-lg"
              onClick={() => setState('form')}
            >
              <Plus size={24} />
              紀錄本次注射
            </Button>

            <section>
              <h3 className="font-medium text-[var(--color-muted)] text-sm mb-3 px-1">
                歷史記錄
              </h3>
              <InjectionList logs={logs} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
