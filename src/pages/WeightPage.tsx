import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { WeightChart } from '../components/weight/WeightChart'
import { WeightForm } from '../components/weight/WeightForm'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import type { WeightLog, UserProfile } from '../types'
import { Plus, TrendingDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface WeightPageProps {
  logs: WeightLog[]
  profile: UserProfile
  onAddLog: (log: Omit<WeightLog, 'id'>) => void
}

export const WeightPage: React.FC<WeightPageProps> = ({ logs, profile, onAddLog }) => {
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
      <Header title={isAdding ? '記錄體重' : '體重趨勢'} />

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
                <p className="text-[var(--color-muted)] text-xs mb-1">累計減輕</p>
                <div className="flex items-baseline gap-1">
                  <span className="stat-number text-3xl text-[var(--color-sage)]">{weightDiff.toFixed(1)}</span>
                  <span className="text-sm font-medium text-[var(--color-muted)]">kg</span>
                </div>
                <Badge variant="sage" className="mt-2">-{percentDiff.toFixed(1)}%</Badge>
              </Card>
              <Card variant="rose" className="flex flex-col items-center justify-center py-6">
                <p className="text-[var(--color-muted)] text-xs mb-1">距離目標</p>
                {profile.targetWeight ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="stat-number text-3xl text-[var(--color-rose)]">
                        {Math.max(0, currentWeight - profile.targetWeight).toFixed(1)}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-muted)]">kg</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-muted)] mt-2">目標: {profile.targetWeight}kg</p>
                  </>
                ) : (
                  <button className="text-sm text-[var(--color-sage)] font-medium">設定目標</button>
                )}
              </Card>
            </div>

            {/* Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-lg">體重變化</h3>
                <TrendingDown size={18} className="text-[var(--color-sage)]" />
              </div>
              <WeightChart logs={logs} />
            </Card>

            <Button
              fullWidth
              className="h-14 gap-2 text-lg"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={24} />
              記錄今日體重
            </Button>

            {/* History List */}
            <section>
              <h3 className="font-serif text-[var(--color-muted)] text-sm mb-3 px-1">歷史記錄</h3>
              {sortedLogs.length === 0 ? (
                <Card className="text-center py-8 text-[var(--color-muted)]">
                  還沒有體重記錄，踏出第一步吧
                </Card>
              ) : (
                <div className="space-y-2">
                  {sortedLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center card-monet p-4">
                      <div>
                        <p className="font-semibold">{format(parseISO(log.date), 'MM/dd')}</p>
                        {log.waist && <p className="text-xs text-[var(--color-muted)]">腰圍: {log.waist}cm</p>}
                      </div>
                      <div className="text-right">
                        <p className="stat-number text-lg">{log.weight} <span className="text-xs font-normal text-[var(--color-muted)]">kg</span></p>
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
