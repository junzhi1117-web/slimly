import { differenceInHours, parseISO } from 'date-fns'
import type { DoseRecord } from '../../types'

// 12–72 小時內、沒有副作用記錄的注射
export function findPendingCheckIn(logs: DoseRecord[]): DoseRecord | null {
  const now = new Date()
  return (
    [...logs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .find((r) => {
        const hours = differenceInHours(now, parseISO(r.date))
        const hasSE = (r.sideEffects ?? []).length > 0
        return hours >= 12 && hours <= 72 && !hasSE
      }) ?? null
  )
}
