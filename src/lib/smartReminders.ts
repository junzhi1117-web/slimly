import { differenceInDays, parseISO } from 'date-fns'
import type { DoseRecord, UserProfile } from '../types'
import { MEDICATIONS } from './medications'

export type ReminderLevel = 'info' | 'warning' | 'alert'

export interface SmartReminder {
  id: string
  level: ReminderLevel
  title: string
  body: string
  cta?: string
  actionTab?: string
}

function sortByDateDesc(records: DoseRecord[]) {
  return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function hasModerateSideEffect(record: DoseRecord) {
  return (record.sideEffects ?? []).some(effect => effect.severity >= 2)
}

export function getSmartReminders(profile: UserProfile, doseRecords: DoseRecord[]): SmartReminder[] {
  if (profile.maintenanceMode) return []

  const reminders: SmartReminder[] = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const med = MEDICATIONS[profile.medicationType]
  const sorted = sortByDateDesc(doseRecords)
  const latest = sorted[0]
  const hasTodayLog = doseRecords.some(record => record.date === todayStr)

  // 1) 注射日提醒
  if (med.frequency === 'weekly') {
    if (profile.injectionDay === undefined) {
      reminders.push({
        id: 'set-injection-day',
        level: 'info',
        title: '設定固定注射日',
        body: '固定注射日後，我會更準確提醒你何時該打針，也能避免漏打。',
        cta: '前往個人設定',
        actionTab: 'profile',
      })
    } else {
      const todayWeekday = today.getDay()
      const daysUntilInjection = (profile.injectionDay - todayWeekday + 7) % 7

      if (daysUntilInjection === 0 && !hasTodayLog) {
        reminders.push({
          id: 'today-injection',
          level: 'warning',
          title: '今天是注射日',
          body: '記得完成今天的注射與記錄，讓趨勢分析更準。',
          cta: '去記錄注射',
          actionTab: 'log',
        })
      } else if (daysUntilInjection === 1) {
        reminders.push({
          id: 'tomorrow-injection',
          level: 'info',
          title: '明天是注射日',
          body: '今晚可以先把藥物與針具準備好，明天會更順手。',
          cta: '查看注射頁',
          actionTab: 'log',
        })
      }

      if (latest) {
        const daysSinceLast = differenceInDays(today, parseISO(latest.date))
        if (daysSinceLast >= 8 && !hasTodayLog) {
          reminders.push({
            id: 'missed-injection-window',
            level: 'alert',
            title: '可能已超過注射間隔',
            body: `距離上次注射已 ${daysSinceLast} 天，建議今天先確認補打安排。`,
            cta: '立即補記錄',
            actionTab: 'log',
          })
        }
      }
    }
  } else if (med.frequency === 'daily' && !hasTodayLog) {
    reminders.push({
      id: 'daily-injection',
      level: 'warning',
      title: '今天尚未注射',
      body: '善纖達是每日注射，記得今天完成並記錄。',
      cta: '去記錄注射',
      actionTab: 'log',
    })
  }

  // 2) 劑量切換提醒（週針為主）
  if (latest && med.frequency === 'weekly') {
    const sameDoseCount = sorted.filter(record => record.dose === latest.dose).length
    const hasHigherDoseHistory = sorted.some(record => record.dose > latest.dose)
    const maxDose = Math.max(...med.doses)

    if (
      sameDoseCount >= 4 &&
      latest.dose < maxDose &&
      !hasHigherDoseHistory
    ) {
      reminders.push({
        id: 'dose-review',
        level: 'info',
        title: '可以評估是否進入下一劑量',
        body: `你已連續 ${sameDoseCount} 次使用 ${latest.dose}${med.unit}，下次回診可和醫師討論是否調整。`,
        cta: '查看劑量歷程',
        actionTab: 'report',
      })
    }
  }

  // 3) 異常症狀追蹤提醒（連續 3 次中度以上）
  const recentThree = sorted.slice(0, 3)
  if (
    recentThree.length === 3 &&
    recentThree.every(hasModerateSideEffect)
  ) {
    reminders.push({
      id: 'side-effect-followup',
      level: 'alert',
      title: '近期副作用偏明顯',
      body: '你最近連續 3 次記錄到中度以上不適，建議盡快回診確認是否需要調整治療計畫。',
      cta: '查看注射日記',
      actionTab: 'log',
    })
  }

  const levelWeight: Record<ReminderLevel, number> = { alert: 3, warning: 2, info: 1 }

  return reminders
    .sort((a, b) => levelWeight[b.level] - levelWeight[a.level])
    .slice(0, 2)
}
