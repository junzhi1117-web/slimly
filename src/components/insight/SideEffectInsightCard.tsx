import React from 'react'
import type { DoseRecord } from '../../types'

interface SideEffectInsightCardProps {
  doseRecords: DoseRecord[]
}

type EmojiMood = '😊' | '😐' | '🤢'

function recordMood(record: DoseRecord): EmojiMood | null {
  const ses = record.sideEffects ?? []
  if (ses.length === 0) return null
  const avg = ses.reduce((s, e) => s + e.severity, 0) / ses.length
  if (avg <= 1) return '😊'
  if (avg <= 2) return '😐'
  return '🤢'
}

export const SideEffectInsightCard: React.FC<SideEffectInsightCardProps> = ({ doseRecords }) => {
  const sorted = [...doseRecords]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Only records with side effect data
  const withData = sorted.filter(r => (r.sideEffects ?? []).length > 0)

  // Not enough data
  if (withData.length < 2) {
    const needed = Math.max(0, 2 - withData.length)
    return (
      <div className="flex items-center gap-3 px-1 py-2">
        <span className="text-lg">🌱</span>
        <p className="text-sm text-[var(--color-muted)]">
          {needed > 0
            ? `再記錄 ${needed} 次注射後的感受，我就能告訴你身體的適應狀況`
            : '副作用資料收集中...'}
        </p>
      </div>
    )
  }

  // Emoji history row — last 5
  const recentFive = withData.slice(-5)
  const moodHistory = recentFive.map(r => recordMood(r) ?? '😊')

  // Compare first half vs recent half
  const half = Math.max(1, Math.floor(withData.length / 2))
  const earlyAvg = withData.slice(0, half)
    .flatMap(r => r.sideEffects ?? [])
    .reduce((acc, e, _, arr) => acc + e.severity / arr.length, 0)
  const recentAvg = withData.slice(-half)
    .flatMap(r => r.sideEffects ?? [])
    .reduce((acc, e, _, arr) => acc + e.severity / arr.length, 0)

  const improved = earlyAvg > 0 && recentAvg < earlyAvg - 0.15
  const worsened = recentAvg > earlyAvg + 0.3
  const pct = earlyAvg > 0
    ? Math.round(Math.abs(earlyAvg - recentAvg) / earlyAvg * 100)
    : 0

  const getMessage = (): { emoji: string; text: string } => {
    if (improved && pct >= 20) return {
      emoji: '🎉',
      text: `副作用比用藥初期改善了 ${pct}%，身體正在適應中`,
    }
    if (improved) return {
      emoji: '🌱',
      text: '副作用有輕微改善的趨勢，繼續觀察',
    }
    if (worsened) return {
      emoji: '💡',
      text: '近期副作用有些加重，可能是劑量調整期，記得告訴醫師',
    }
    return {
      emoji: '✨',
      text: '副作用維持穩定，身體慢慢適應中',
    }
  }

  const { emoji, text } = getMessage()

  return (
    <div className="space-y-2 px-1">
      {/* Emoji history row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-muted)]">近期</span>
        <div className="flex gap-1.5">
          {moodHistory.map((mood, i) => (
            <span key={i} className="text-lg leading-none">{mood}</span>
          ))}
        </div>
      </div>
      {/* One-line insight */}
      <p className="text-sm text-[var(--color-deep)]">
        <span className="mr-1">{emoji}</span>
        {text}
      </p>
    </div>
  )
}
