import React from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { WeightChart } from '../components/weight/WeightChart'
import type { InjectionLog, WeightLog, UserProfile } from '../types'
import { MEDICATIONS, INJECTION_SITE_LABELS } from '../lib/medications'
import { Syringe, Scale, Calendar, ChevronRight } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface HomePageProps {
  profile: UserProfile
  injectionLogs: InjectionLog[]
  weightLogs: WeightLog[]
  onAction: (tab: string) => void
}

export const HomePage: React.FC<HomePageProps> = ({ profile, injectionLogs, weightLogs, onAction }) => {
  const lastInjection = injectionLogs.length > 0 
    ? [...injectionLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null

  const lastWeight = weightLogs.length > 0
    ? [...weightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null

  const med = MEDICATIONS[profile.medicationType]
  
  // Calculate days since last injection
  const daysSince = lastInjection 
    ? differenceInDays(new Date(), parseISO(lastInjection.date))
    : null
  
  const nextInjectionDays = daysSince !== null 
    ? (med.frequency === 'weekly' ? 7 - daysSince : 1 - daysSince)
    : 0

  return (
    <div className="space-y-6 pb-6">
      {/* Status Card */}
      <Card className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white border-none shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 text-sm mb-1">目前進度</p>
            <h2 className="text-2xl font-bold">{med.name} {profile.currentDose}{med.unit}</h2>
          </div>
          <Badge variant="accent" className="bg-white/20 text-white border-none">
            {med.frequency === 'weekly' ? '每週一次' : '每日一次'}
          </Badge>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-white/70 text-xs mb-1">下次注射</p>
            <p className="text-xl font-bold">
              {nextInjectionDays <= 0 ? '今天' : `${nextInjectionDays} 天後`}
            </p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-white/70 text-xs mb-1">已持續</p>
            <p className="text-xl font-bold">
              {differenceInDays(new Date(), parseISO(profile.startDate))} 天
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="h-16 flex flex-col gap-1 border-2" 
          onClick={() => onAction('log')}
        >
          <Syringe size={20} />
          <span className="text-xs">記錄注射</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex flex-col gap-1 border-2" 
          onClick={() => onAction('weight')}
        >
          <Scale size={20} />
          <span className="text-xs">記錄體重</span>
        </Button>
      </div>

      {/* Weight Chart Preview */}
      <section>
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-bold text-lg">體重趨勢</h3>
          <button onClick={() => onAction('weight')} className="text-[var(--color-primary)] text-sm flex items-center">
            完整數據 <ChevronRight size={16} />
          </button>
        </div>
        <Card className="p-2">
          <WeightChart logs={weightLogs.slice(-8)} height={180} />
          {lastWeight && (
            <div className="mt-2 text-center text-sm">
              目前體重：<span className="font-bold text-lg">{lastWeight.weight}</span> kg
              {profile.startWeight > lastWeight.weight && (
                <span className="ml-2 text-green-600 font-medium">
                  ↓ {(profile.startWeight - lastWeight.weight).toFixed(1)} kg
                </span>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Last Injection Preview */}
      <section>
        <h3 className="font-bold text-lg mb-3">最近一次注射</h3>
        {lastInjection ? (
          <Card>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary-light)] rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-bold">{format(parseISO(lastInjection.date), 'yyyy/MM/dd (eee)', { locale: zhTW })}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {INJECTION_SITE_LABELS[lastInjection.site]} · {lastInjection.dose}{med.unit}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6 text-[var(--color-text-muted)] border-dashed">
            尚無注射記錄，點擊上方按鈕開始
          </Card>
        )}
      </section>
    </div>
  )
}
