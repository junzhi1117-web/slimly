import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { WeightChart } from '../components/weight/WeightChart'
import { SideEffectInsightCard } from '../components/insight/SideEffectInsightCard'
import { PostInjectionCheckInBanner } from '../components/insight/PostInjectionCheckInBanner'
import { findPendingCheckIn } from '../components/insight/findPendingCheckIn'
import { TimelineMessageCard } from '../components/insight/TimelineMessageCard'
import { getCurrentTimelineMessage, dismissTimelineMessage } from '../lib/timelineEngine'
import { getMaintenanceMessage } from '../lib/maintenanceMessages'
import { getSmartReminders } from '../lib/smartReminders'
import { SmartRemindersCard } from '../components/insight/SmartRemindersCard'
import type { DoseRecord, WeightLog, UserProfile, SideEffectEntry, NutritionEntry } from '../types'
import { MEDICATIONS } from '../lib/medications'
import { computeProteinGoal, getTodayEntries, getNutritionTotals } from '../lib/nutrition'
import { Syringe, TrendingDown, Calendar, ChevronRight, Leaf } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { zhTW, enUS } from 'date-fns/locale'

interface HomePageProps {
  profile: UserProfile
  doseRecords: DoseRecord[]
  weightLogs: WeightLog[]
  nutritionEntries: NutritionEntry[]
  onAction: (tab: string) => void
  onUpdateSideEffects?: (id: string, sideEffects: SideEffectEntry[]) => void
}

function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours()
  if (h < 12) return t('greeting.morning')
  if (h < 18) return t('greeting.afternoon')
  return t('greeting.evening')
}

export const HomePage: React.FC<HomePageProps> = ({
  profile, doseRecords, weightLogs, nutritionEntries, onAction, onUpdateSideEffects
}) => {
  const { t, i18n } = useTranslation()
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [timelineDismissed, setTimelineDismissed] = useState(false)

  const isMaintenanceMode = !!profile.maintenanceMode

  // Active treatment: contextual timeline message
  const timelineMessage = (!isMaintenanceMode && !timelineDismissed)
    ? getCurrentTimelineMessage(profile, doseRecords, weightLogs)
    : null

  // Maintenance mode: maintenance message
  const maintenanceMessage = (isMaintenanceMode && profile.maintenanceStartDate)
    ? getMaintenanceMessage(profile.maintenanceStartDate)
    : null

  const handleTimelineDismiss = useCallback((id: string) => {
    dismissTimelineMessage(id)
    setTimelineDismissed(true)
  }, [])

  const pendingRecord = (() => {
    if (isMaintenanceMode) return null  // 維持期不顯示注射 check-in
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
  const smartReminders = getSmartReminders(profile, doseRecords)

  const daysSince = lastInjection
    ? differenceInDays(new Date(), parseISO(lastInjection.date))
    : null

  const nextInjectionDays = daysSince !== null
    ? (med.frequency === 'weekly' ? 7 - daysSince : 1 - daysSince)
    : 0

  const totalDays = differenceInDays(new Date(), parseISO(profile.startDate))

  const maintenanceDays = isMaintenanceMode && profile.maintenanceStartDate
    ? differenceInDays(new Date(), parseISO(profile.maintenanceStartDate))
    : 0

  const locale = i18n.resolvedLanguage === 'en' ? enUS : zhTW

  // ── Maintenance Mode View ─────────────────────────────────────────────────
  if (isMaintenanceMode) {
    return (
      <div className="space-y-6 pb-6">
        {/* Greeting */}
        <div>
          <h2 className="text-3xl font-serif italic tracking-tight text-[var(--color-deep)]">
            {getGreeting(t)}
          </h2>
          <p className="text-label text-[var(--color-muted)] mt-1 flex items-center gap-1">
            <Leaf size={13} className="text-[#24342F]" />
            {t('home.maintenance_day', { count: maintenanceDays + 1 })}
          </p>
        </div>

        {/* Maintenance Hero Card */}
        <div className="rounded-3xl p-5" style={{ backgroundColor: '#24342F' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 text-sm mb-1">{t('profile.maintenance_mode')}</p>
              <h2 className="text-2xl font-semibold text-white">
                {t('home.maintenance_days', { count: maintenanceDays })}
              </h2>
            </div>
            <Badge variant="sage" className="!bg-white/15 !text-white !border-transparent">
              {t('home.maintenance_status')}
            </Badge>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <p className="text-white/50 text-xs mb-1">{t('home.maintenance_start_weight')}</p>
              <p className="stat-number text-2xl text-white">{profile.startWeight} kg</p>
            </div>
            {lastWeight && (
              <div className="flex-1 bg-white/10 rounded-2xl p-3">
                <p className="text-white/50 text-xs mb-1">{t('home.maintenance_current_weight')}</p>
                <p className="stat-number text-2xl text-white">{lastWeight.weight} kg</p>
              </div>
            )}
          </div>
        </div>

        {/* Single CTA — 記錄體重 */}
        <button
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl transition-all active:scale-[0.97] shadow-sm"
          style={{ backgroundColor: '#8FBCB0' }}
          onClick={() => onAction('weight')}
        >
          <TrendingDown size={20} className="text-white" />
          <span className="text-sm font-semibold text-white">{t('home.log_weight_today')}</span>
        </button>

        <SmartRemindersCard reminders={smartReminders} onAction={onAction} />

        {/* Maintenance contextual message */}
        {maintenanceMessage && (
          <div className="bg-[var(--color-surface)] rounded-3xl px-4 py-4 border border-[#C4DDD8]">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{maintenanceMessage.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--color-deep)] mb-1">
                  {maintenanceMessage.title}
                </p>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {maintenanceMessage.body}
                </p>
                <details className="mt-2">
                  <summary className="text-xs text-[var(--color-sage)] cursor-pointer select-none">
                    {t('home.see_more')}
                  </summary>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-2">
                    {maintenanceMessage.expandedBody}
                  </p>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Weight Chart */}
        <section>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-editorial text-2xl text-[var(--color-deep)] !mb-0">{t('home.weight_trend')}</h3>
            <button onClick={() => onAction('weight')} className="text-[var(--color-sage)] text-sm flex items-center">
              {t('home.full_data')} <ChevronRight size={16} />
            </button>
          </div>
          <Card className="p-2">
            <WeightChart logs={weightLogs.slice(-8)} height={180} />
            {lastWeight && (
              <div className="mt-2 text-center text-sm text-[var(--color-muted)]">
                {t('home.current_weight_label')}：<span className="stat-number text-lg text-[var(--color-deep)]">{lastWeight.weight}</span> kg
                {profile.startWeight > lastWeight.weight && (
                  <span className="ml-2 text-[var(--color-sage)] font-medium">
                    ↓ {(profile.startWeight - lastWeight.weight).toFixed(1)} kg
                  </span>
                )}
              </div>
            )}
          </Card>
        </section>

        {/* Nutrition 摘要 */}
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
                <p className="text-xs font-medium text-[var(--color-muted)]">{t('home.protein_today')}</p>
                <ChevronRight size={14} className="text-[var(--color-muted)]" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="stat-number text-lg text-[var(--color-sage)]">
                  {Math.round(totals.protein)}g
                </span>
                <span className="text-xs text-[var(--color-muted)]">{t('home.protein_goal', { grams: goal.grams })}</span>
                {todayNutrition.length === 0 && (
                  <span className="text-xs text-[var(--color-muted)] ml-auto">{t('home.log_food_prompt')}</span>
                )}
              </div>
              <div className="h-1 bg-[var(--color-sage-light)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-sage)] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  // ── Active Treatment View ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-6">
      {/* Post-injection check-in banner */}
      {pendingRecord && (
        <PostInjectionCheckInBanner
          record={pendingRecord}
          onComplete={handleCheckInComplete}
          onDismiss={() => setDismissedId(pendingRecord.id)}
        />
      )}

      <SmartRemindersCard reminders={smartReminders} onAction={onAction} />

      {/* Greeting */}
      <div>
        <h2 className="text-editorial text-[72px] leading-none text-[var(--color-deep)]">
          {getGreeting(t)}
        </h2>
        <p className="text-eyebrow mt-3">
          {t('home.day_label', { count: totalDays })} · {format(new Date(), t('home.date_format'), { locale })}
        </p>
      </div>

      {/* Status Card — Elegant */}
      <div className="card-elegant p-5">
        <p className="text-eyebrow mb-3">{t(`med.${profile.medicationType}`)}</p>
        <p className="stat-display text-[64px] text-[var(--color-deep)]">
          {profile.currentDose}<span className="text-3xl ml-1">{med.unit}</span>
        </p>
        <div className="divider-monet my-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-eyebrow mb-1">{t('home.next_injection_label')}</p>
            <p className="stat-display text-3xl text-[var(--color-deep)]">
              {nextInjectionDays <= 0 ? t('home.next_injection_today') : t('home.next_injection_days', { count: nextInjectionDays })}
            </p>
          </div>
          <div>
            <p className="text-eyebrow mb-1">{t('home.duration_label')}</p>
            <p className="stat-display text-3xl text-[var(--color-deep)]">{t('home.duration_days', { count: totalDays })}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="flex flex-col items-start justify-end p-4 min-h-[96px] rounded-2xl border border-[var(--color-deep)] bg-transparent transition-all active:bg-[var(--color-deep)] active:text-white group"
          onClick={() => onAction('log')}
        >
          <Syringe size={20} className="mb-3 text-[var(--color-deep)] group-active:text-white" />
          <span className="text-sm font-medium tracking-wide text-[var(--color-deep)] group-active:!text-white">{t('home.log_injection')}</span>
        </button>
        <button
          className="flex flex-col items-start justify-end p-4 min-h-[96px] rounded-2xl border border-[var(--color-sage)] bg-transparent transition-all active:bg-[var(--color-sage)] active:text-white group"
          onClick={() => onAction('weight')}
        >
          <TrendingDown size={20} className="mb-3 text-[var(--color-sage)] group-active:text-white" />
          <span className="text-sm font-medium tracking-wide text-[var(--color-sage)] group-active:!text-white">{t('home.log_weight')}</span>
        </button>
      </div>

      {/* Timeline contextual message */}
      {timelineMessage && (
        <TimelineMessageCard
          message={timelineMessage}
          onDismiss={handleTimelineDismiss}
        />
      )}

      {/* Weight Chart Preview */}
      <section>
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-editorial text-2xl text-[var(--color-deep)] !mb-0">{t('home.weight_trend')}</h3>
          <button onClick={() => onAction('weight')} className="text-[var(--color-sage)] text-sm flex items-center">
            {t('home.full_data')} <ChevronRight size={16} />
          </button>
        </div>
        <Card className="p-2">
          <WeightChart logs={weightLogs.slice(-8)} height={180} />
          {lastWeight && (
            <div className="mt-2 text-center text-sm text-[var(--color-muted)]">
              {t('home.current_weight_label')}：<span className="stat-number text-lg text-[var(--color-deep)]">{lastWeight.weight}</span> kg
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
              <p className="text-xs font-medium text-[var(--color-muted)]">{t('home.protein_today')}</p>
              <ChevronRight size={14} className="text-[var(--color-muted)]" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="stat-display text-3xl text-[var(--color-sage)]">
                {Math.round(totals.protein)}g
              </span>
              <span className="text-xs text-[var(--color-muted)]">{t('home.protein_goal', { grams: goal.grams })}</span>
              {todayNutrition.length === 0 && (
                <span className="text-xs text-[var(--color-muted)] ml-auto">{t('home.log_food_prompt')}</span>
              )}
            </div>
            <div className="h-1 bg-[var(--color-sage-light)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-sage)] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })()}

      {/* Side Effect Insight */}
      {doseRecords.length >= 1 && (
        <div
          className="bg-[var(--color-surface)] rounded-3xl px-4 py-3 border border-[var(--color-border)] cursor-pointer"
          onClick={() => onAction('log')}
        >
          <p className="text-xs font-medium text-[var(--color-muted)] mb-2">{t('home.side_effect_observation')}</p>
          <SideEffectInsightCard doseRecords={doseRecords} />
          <p className="text-[10px] text-[var(--color-sage)] mt-2 text-right">{t('home.view_injection_diary')}</p>
        </div>
      )}

      {/* Last Injection Preview */}
      <section>
        <h3 className="section-title">{t('home.last_injection')}</h3>
        {lastInjection ? (
          <Card>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[var(--color-sage-light)] rounded-2xl flex items-center justify-center text-[var(--color-sage)]">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-semibold">{format(parseISO(lastInjection.date), 'yyyy/MM/dd (eee)', { locale })}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {t(`injection_site.${lastInjection.injectionSite}`)} · {lastInjection.dose}{med.unit}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8 text-[var(--color-muted)]">
            {t('home.no_records')}
          </Card>
        )}
      </section>
    </div>
  )
}
