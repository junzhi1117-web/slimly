import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { WeightChart } from '../components/weight/WeightChart'
import { WeightForm } from '../components/weight/WeightForm'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import type { WeightLog, UserProfile } from '../types'
import { Plus, Scale } from 'lucide-react'
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
      <Header title={isAdding ? "記錄體重" : "體重趨勢"} />
      
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
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center justify-center py-6">
                <p className="text-[var(--color-text-muted)] text-xs mb-1">累計減輕</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[var(--color-primary)]">{weightDiff.toFixed(1)}</span>
                  <span className="text-sm font-medium">kg</span>
                </div>
                <Badge variant="primary" className="mt-2">-{percentDiff.toFixed(1)}%</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center py-6">
                <p className="text-[var(--color-text-muted)] text-xs mb-1">距離目標</p>
                {profile.targetWeight ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--color-accent)]">
                        {Math.max(0, currentWeight - profile.targetWeight).toFixed(1)}
                      </span>
                      <span className="text-sm font-medium">kg</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-2">目標: {profile.targetWeight}kg</p>
                  </>
                ) : (
                  <button onClick={() => {}} className="text-sm text-[var(--color-primary)] font-medium">設定目標</button>
                )}
              </Card>
            </div>

            {/* Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">體重變化</h3>
                <Scale size={18} className="text-[var(--color-primary)]" />
              </div>
              <WeightChart logs={logs} />
            </Card>

            <Button 
              fullWidth 
              className="h-14 gap-2 text-lg shadow-md"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={24} />
              記錄今日體重
            </Button>

            {/* History List */}
            <section>
              <h3 className="font-bold text-gray-400 text-sm mb-3 px-1 uppercase tracking-wider">歷史記錄</h3>
              <div className="space-y-2">
                {sortedLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-[var(--color-border)]">
                    <div>
                      <p className="font-bold">{format(parseISO(log.date), 'MM/dd')}</p>
                      {log.waist && <p className="text-xs text-[var(--color-text-muted)]">腰圍: {log.waist}cm</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{log.weight} <span className="text-xs font-normal">kg</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
