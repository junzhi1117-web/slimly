import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/layout/Header'
import { WeightChart } from '../components/weight/WeightChart'
import { WeightForm } from '../components/weight/WeightForm'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import type { WeightLog, UserProfile } from '../types'
import { Plus, TrendingDown, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface WeightPageProps {
  logs: WeightLog[]
  profile: UserProfile
  onAddLog: (log: Omit<WeightLog, 'id'>) => void
  onRemoveLog: (id: string) => void
}

export const WeightPage: React.FC<WeightPageProps> = ({ logs, profile, onAddLog, onRemoveLog }) => {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const currentWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : profile.startWeight
  const weightDiff = profile.startWeight - currentWeight
  const percentDiff = (weightDiff / profile.startWeight) * 100

  const handleSave = (newLog: Omit<WeightLog, 'id'>) => {
    onAddLog(newLog)
    setIsAdding(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title={isAdding ? t('weight.log_weight') : t('weight.title')} />

      <main className="p-4 space-y-6">
        {isAdding ? (
          <WeightForm
            initialWeight={currentWeight}
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card variant="sage" className="flex flex-col items-center justify-center py-6">
                <p className="text-[var(--color-muted)] text-xs mb-1">{t('weight.total_lost')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="stat-number text-3xl text-[var(--color-sage)]">{weightDiff.toFixed(1)}</span>
                  <span className="text-sm font-medium text-[var(--color-muted)]">kg</span>
                </div>
                <Badge variant="sage" className="mt-2">-{percentDiff.toFixed(1)}%</Badge>
              </Card>
              <Card variant="rose" className="flex flex-col items-center justify-center py-6">
                <p className="text-[var(--color-muted)] text-xs mb-1">{t('weight.to_goal')}</p>
                {profile.targetWeight ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="stat-number text-3xl text-[var(--color-rose)]">
                        {Math.max(0, currentWeight - profile.targetWeight).toFixed(1)}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-muted)]">kg</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-muted)] mt-2">{t('weight.goal_label', { value: profile.targetWeight })}</p>
                  </>
                ) : (
                  <button className="text-sm text-[var(--color-sage)] font-medium">{t('weight.set_goal')}</button>
                )}
              </Card>
            </div>

            <Button
              fullWidth
              className="h-14 gap-2 text-lg"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={24} />
              {t('weight.log_today')}
            </Button>

            {/* Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-lg">{t('weight.change')}</h3>
                <TrendingDown size={18} className="text-[var(--color-sage)]" />
              </div>
              <WeightChart logs={logs} />
            </Card>

            {/* History List */}
            <section>
              <h3 className="font-serif text-[var(--color-muted)] text-sm mb-3 px-1">{t('weight.history')}</h3>
              {sortedLogs.length === 0 ? (
                <Card className="text-center py-8 text-[var(--color-muted)]">
                  {t('weight.empty')}
                </Card>
              ) : (
                <div className="space-y-2">
                  {sortedLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center card-monet p-4">
                      <div>
                        <p className="font-semibold">{format(parseISO(log.date), 'MM/dd')}</p>
                        {log.waist && <p className="text-xs text-[var(--color-muted)]">{t('weight.waist_label', { value: log.waist })}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="stat-number text-lg">{log.weight} <span className="text-xs font-normal text-[var(--color-muted)]">kg</span></p>
                        <button
                          onClick={() => onRemoveLog(log.id)}
                          className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-rose)] transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
