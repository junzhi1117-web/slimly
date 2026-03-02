import { differenceInWeeks, differenceInDays, parseISO } from 'date-fns'
import { TIMELINE_MESSAGES } from './timelineMessages'
import type { TimelineMessage } from './timelineMessages'
import type { DoseRecord, UserProfile, WeightLog } from '../types'

const DISMISSED_KEY = 'slimly_dismissed_timeline'

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
  } catch {
    return []
  }
}

export function dismissTimelineMessage(id: string): void {
  const dismissed = getDismissed()
  if (!dismissed.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, id]))
  }
}

// 判斷 7 天內是否有劑量調升
function hasRecentDoseIncrease(doseRecords: DoseRecord[]): boolean {
  if (doseRecords.length < 2) return false
  const sorted = [...doseRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const latest = sorted[0]
  const daysSinceLatest = differenceInDays(new Date(), parseISO(latest.date))
  if (daysSinceLatest > 7) return false
  const prevHigher = sorted.slice(1).find(r => r.dose < latest.dose)
  return !!prevHigher
}

// 判斷體重是否停滯 N 週（最近 N 週下降 < 0.5kg 視為停滯）
function isWeightPlateau(weightLogs: WeightLog[], minWeeks: number): boolean {
  if (weightLogs.length < 2) return false
  const sorted = [...weightLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - minWeeks * 7)
  const recent = sorted.filter(w => new Date(w.date) >= cutoff)
  const older = sorted.filter(w => new Date(w.date) < cutoff)
  if (recent.length === 0 || older.length === 0) return false
  const recentAvg = recent.reduce((s, w) => s + w.weight, 0) / recent.length
  const olderAvg = older.reduce((s, w) => s + w.weight, 0) / older.length
  return olderAvg - recentAvg < 0.5
}

export function getCurrentTimelineMessage(
  profile: UserProfile,
  doseRecords: DoseRecord[],
  weightLogs: WeightLog[]
): TimelineMessage | null {
  const currentWeek = differenceInWeeks(new Date(), parseISO(profile.startDate))
  const dismissed = getDismissed()

  for (const msg of TIMELINE_MESSAGES) {
    if (dismissed.includes(msg.id)) continue
    const { trigger } = msg

    if (trigger.type === 'after_dose_increase' && hasRecentDoseIncrease(doseRecords)) {
      return msg
    }
    if (trigger.type === 'week_range') {
      const inRange =
        currentWeek >= trigger.minWeek &&
        (trigger.maxWeek === undefined || currentWeek <= trigger.maxWeek)
      if (inRange) return msg
    }
    if (trigger.type === 'weight_plateau' && isWeightPlateau(weightLogs, trigger.minWeeks)) {
      return msg
    }
  }

  return null
}
