import React, { useState, useCallback } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { WeightChart } from '../components/weight/WeightChart'
import { SideEffectInsightCard } from '../components/insight/SideEffectInsightCard'
import { PostInjectionCheckInBanner, findPendingCheckIn } from '../components/insight/PostInjectionCheckInBanner'
import type { DoseRecord, WeightLog, UserProfile, SideEffectEntry, NutritionEntry } from '../types'
import { MEDICATIONS, INJECTION_SITE_LABELS } from '../lib/medications'
import { computeProteinGoal, getTodayEntries, getNutritionTotals } from '../lib/nutrition'
import { Syringe, TrendingDown, Calendar, ChevronRight } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface HomePageProps {
  profile: UserProfile
  doseRecords: DoseRecord[]
  weightLogs: WeightLog[]
  nutritionEntries: NutritionEntry[]
  onAction: (tab: string) => void
  onUpdateSideEffects?: (id: string, sideEffects: SideEffectEntry[]) => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return '早安'
  if (h < 18) return '午安'
  return '晚安'
}

export const HomePage: React.FC<HomePageProps> = ({
  profile, doseRecords, weightLogs, nutritionEntries, onAction, onUpdateSideEffects
}) => {
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const pendingRecord = (() => {
    const found = findPendingCheckIn(doseRecords)
    if (!found || found.id === dismissedId) return null
    return found
  })()

  const handleCheckInComplete = useCallback((id: string, sideEffects: SideEffectEntry[]) => {
    onUpdateSideEffects?.(id, sideEffects)
    setDismissedId(id)
  }, [onUpdateSideEffects])

  const lastInjection = doseRecords.length > 0
    ? [...doseRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null

  const lastWeight = weightLogs.length > 0
    ? [...weightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null

  const med = MEDICATIONS[profile.medicationType]

  const daysSince = lastInjection
    ? differenceInDays(new Date(), parseISO(lastInjection.date))
    : null

  const nextInjectionDays = daysSince !== null
    ? (med.frequency === 'weekly' ? 7 - daysSince : 1 - daysSince)
    : 0

  const totalDays = differenceInDays(new Date(), parseISO(profile.startDate))

  return (
    <div className="space-y-6 pb-6">
      {/* Post-injection check-in banner — shown 12–72h after injection */}
      {pendingRecord && (
        <PostInjectionCheckInBanner
          record={pendingRecord}
          onComplete={handleCheckInComplete}
          onDismiss={() => setDismissedId(pendingRecord.id)}
        />
      )}

      {/* Greeting */}
      <div>
        <h2 className="text-3xl font-serif italic text-[var(--color-deep)]">
          {getGreeting()}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          今天是你的第 {totalDays} 天
        </p>
      </div>

      {/* Status Card — Hero */}
      <Card variant="hero">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/60 text-sm mb-1">目前進度</p>
            <h2 className="text-2xl font-semibold">{med.name} {profile.currentDose}{med.unit}</h2>
          </div>
          <Badge variant="sage" className="!bg-white/15 !text-white">
            {med.frequency === 'weekly' ? '每週一次' : '每日一次'}
          </Badge>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <p className="text-white/50 text-xs mb-1">下次注射</p>
            <p className="stat-number text-xl text-white">
              {nextInjectionDays <= 0 ? '今天' : `${nextInjectionDays} 天後`}
            </p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <p className="text-white/50 text-xs mb-1">已持續</p>
            <p className="stat-number text-xl text-white">{totalDays} 天</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions — card-like */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer flex flex-col items-center justify-center py-5 gap-2 transition-all active:scale-[0.97]"
          onClick={() => onAction('log')}
        >
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-sage)]">
            <Syringe size={20} />
          </div>
          <span className="text-sm font-medium text-[var(--color-deep)]">記錄注射</span>
        </Card>
        <Card
          className="cursor-pointer flex flex-col items-center justify-center py-5 gap-2 transition-all active:scale-[0.97]"
          onClick={() => onAction('weight')}
        >
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-sage)]">
            <TrendingDown size={20} />
          </div>
          <span className="text-sm font-medium text-[var(--color-deep)]">記錄體重</span>
        </Card>
      </div>

      {/* Weight Chart Preview */}
      <section>
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-serif text-lg text-[var(--color-deep)]">體重趨勢</h3>
          <button onClick={() => onAction('weight')} className="text-[var(--color-sage)] text-sm flex items-center">
            完整數據 <ChevronRight size={16} />
          </button>
        </div>
        <Card className="p-2">
          <WeightChart logs={weightLogs.slice(-8)} height={180} />
          {lastWeight && (
            <div className="mt-2 text-center text-sm text-[var(--color-muted)]">
              目前體重：<span className="stat-number text-lg text-[var(--color-deep)]">{lastWeight.weight}</span> kg
              {profile.startWeight > lastWeight.weight && (
                <span className="ml-2 text-[var(--color-sage)] font-medium">
                  ↓ {(profile.startWeight - lastWeight.weight).toFixed(1)} kg
                </span>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* 蛋白質摘要卡 */}
      {(() => {
        const todayNutrition = getTodayEntries(nutritionEntries)
        const totals = getNutritionTotals(todayNutrition)
        const goal = computeProteinGoal(profile, weightLogs)
        const pct = Math.min(100, Math.round(totals.protein / goal.grams * 100))
        return (
          <div
            className="bg-[var(--color-surface)] rounded-3xl px-4 py-3 border border-[var(--color-border)] cursor-pointer active:opacity-80"
            onClick={() => onAction('nutrition')}
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-[var(--color-muted)]">今日蛋白質</p>
              <ChevronRight size={14} className="text-[var(--color-muted)]" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="stat-number text-lg text-[var(--color-sage)]">
                {Math.round(totals.protein)}g
              </span>
              <span className="text-xs text-[var(--color-muted)]">/ {goal.grams}g 目標</span>
              {todayNutrition.length === 0 && (
                <span className="text-xs text-[var(--color-muted)] ml-auto">點擊記錄飲食</span>
              )}
            </div>
            <div className="h-1.5 bg-[var(--color-sage-light)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-sage)] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })()}

      {/* Side Effect Insight — inline, not a separate section */}
      {doseRecords.length >= 1 && (
        <div className="bg-[var(--color-surface)] rounded-3xl px-4 py-3 border border-[var(--color-border)]">
          <p className="text-xs font-medium text-[var(--color-muted)] mb-2">副作用觀察</p>
          <SideEffectInsightCard doseRecords={doseRecords} />
        </div>
      )}

      {/* Last Injection Preview */}
      <section>
        <h3 className="font-serif text-lg text-[var(--color-deep)] mb-3">最近一次注射</h3>
        {lastInjection ? (
          <Card>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[var(--color-sage-light)] rounded-2xl flex items-center justify-center text-[var(--color-sage)]">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-semibold">{format(parseISO(lastInjection.date), 'yyyy/MM/dd (eee)', { locale: zhTW })}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {INJECTION_SITE_LABELS[lastInjection.injectionSite!]} · {lastInjection.dose}{med.unit}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8 text-[var(--color-muted)]">
            還沒有記錄，今天是個好的開始
          </Card>
        )}
      </section>
    </div>
  )
}
