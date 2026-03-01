import React from 'react'
import { Card } from '../ui/Card'
import type { DoseRecord, SideEffectEntry } from '../../types'
import { TrendingDown, Sparkles, Clock } from 'lucide-react'

interface SideEffectInsightCardProps {
  doseRecords: DoseRecord[]
}

// Calculate average severity score from side effect entries
function avgSeverity(entries: SideEffectEntry[]): number {
  if (entries.length === 0) return 0
  return entries.reduce((sum, e) => sum + e.severity, 0) / entries.length
}

// Get top side effect types across records
function topSideEffects(records: DoseRecord[]): Record<string, { total: number; count: number }> {
  const map: Record<string, { total: number; count: number }> = {}
  for (const r of records) {
    for (const se of r.sideEffects || []) {
      if (!map[se.type]) map[se.type] = { total: 0, count: 0 }
      map[se.type].total += se.severity
      map[se.type].count += 1
    }
  }
  return map
}

const SIDE_EFFECT_LABELS: Record<string, string> = {
  nausea: '噁心',
  vomiting: '嘔吐',
  diarrhea: '腹瀉',
  constipation: '便秘',
  fatigue: '疲倦',
  headache: '頭痛',
  abdominal_pain: '腹痛',
  decreased_appetite: '食慾下降',
  injection_site_reaction: '注射部位反應',
}

export const SideEffectInsightCard: React.FC<SideEffectInsightCardProps> = ({ doseRecords }) => {
  // Sort by date, oldest first
  const sorted = [...doseRecords]
    .filter(r => r.sideEffects && r.sideEffects.length >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const total = sorted.length

  // Need at least 2 records to show anything meaningful
  if (total < 2) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-[var(--color-sage-light)] flex items-center justify-center">
            <Sparkles size={18} className="text-[var(--color-sage)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-deep)] text-sm">副作用適應分析</h3>
            <p className="text-xs text-[var(--color-muted)]">每次注射後記錄，我來幫你追蹤</p>
          </div>
        </div>
        <div className="bg-[var(--color-bg)] rounded-2xl p-4 text-center">
          <Clock size={28} className="mx-auto text-[var(--color-muted)] mb-2" />
          <p className="text-sm text-[var(--color-muted)]">
            再記錄 {2 - total} 次注射後，我就能分析你的副作用趨勢
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < total ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  // Split into first half and recent half
  const half = Math.max(1, Math.floor(total / 2))
  const early = sorted.slice(0, half)
  const recent = sorted.slice(-half)

  const earlyAvg = avgSeverity(early.flatMap(r => r.sideEffects || []))
  const recentAvg = avgSeverity(recent.flatMap(r => r.sideEffects || []))

  const hasEarlySideEffects = early.some(r => (r.sideEffects || []).length > 0)
  const hasRecentSideEffects = recent.some(r => (r.sideEffects || []).length > 0)

  // No side effects recorded at all
  if (!hasEarlySideEffects && !hasRecentSideEffects) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-[var(--color-sage-light)] flex items-center justify-center">
            <Sparkles size={18} className="text-[var(--color-sage)]" />
          </div>
          <h3 className="font-semibold text-[var(--color-deep)] text-sm">副作用適應分析</h3>
        </div>
        <div className="bg-[var(--color-sage-light)] rounded-2xl p-4">
          <p className="text-sm text-[var(--color-deep)] font-medium">🌟 你完全沒有副作用記錄</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            每次注射後可以記錄副作用，幫助你和醫師評估藥物耐受性
          </p>
        </div>
      </Card>
    )
  }

  // Calculate improvement percentage
  const improved = earlyAvg > 0 && recentAvg < earlyAvg
  const improvementPct = earlyAvg > 0
    ? Math.round(((earlyAvg - recentAvg) / earlyAvg) * 100)
    : 0
  const worsened = recentAvg > earlyAvg + 0.3

  // Top current side effects
  const recentSEMap = topSideEffects(recent)
  const topCurrentSE = Object.entries(recentSEMap)
    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
    .slice(0, 3)

  // Severity bar width
  const severityToWidth = (score: number) => Math.min(100, Math.round((score / 3) * 100))

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
          improved ? 'bg-[var(--color-sage-light)]' : 'bg-[var(--color-rose-light)]'
        }`}>
          <TrendingDown size={18} className={improved ? 'text-[var(--color-sage)]' : 'text-[var(--color-rose)]'} />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-deep)] text-sm">副作用適應分析</h3>
          <p className="text-xs text-[var(--color-muted)]">共 {total} 次注射的趨勢</p>
        </div>
      </div>

      {/* Trend Summary */}
      {earlyAvg > 0 && (
        <div className={`rounded-2xl p-4 mb-4 ${
          improved
            ? 'bg-[var(--color-sage-light)]'
            : worsened
            ? 'bg-[var(--color-rose-light)]'
            : 'bg-[var(--color-bg)]'
        }`}>
          {improved ? (
            <>
              <p className="text-sm font-semibold text-[var(--color-deep)]">
                🎉 副作用改善了 {improvementPct}%
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                跟用藥初期相比，你的身體正在適應中。繼續加油！
              </p>
            </>
          ) : worsened ? (
            <>
              <p className="text-sm font-semibold text-[var(--color-deep)]">
                ⚠️ 副作用近期有些加重
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                可能是最近劑量調整的正常反應。若持續不適，記得告訴醫師。
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--color-deep)]">
                ✨ 副作用維持穩定
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                跟用藥初期差不多。持續觀察，身體慢慢適應中。
              </p>
            </>
          )}
        </div>
      )}

      {/* Before vs After Comparison */}
      {earlyAvg > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[var(--color-bg)] rounded-2xl p-3">
            <p className="text-xs text-[var(--color-muted)] mb-1">用藥初期</p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-[var(--color-deep)] stat-number">
                {earlyAvg.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--color-muted)] mb-0.5">/ 3</span>
            </div>
            <div className="mt-2 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-rose)] rounded-full transition-all"
                style={{ width: `${severityToWidth(earlyAvg)}%` }}
              />
            </div>
          </div>
          <div className="bg-[var(--color-bg)] rounded-2xl p-3">
            <p className="text-xs text-[var(--color-muted)] mb-1">近期注射</p>
            <div className="flex items-end gap-1">
              <span className={`text-lg font-bold stat-number ${
                improved ? 'text-[var(--color-sage)]' : 'text-[var(--color-deep)]'
              }`}>
                {recentAvg.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--color-muted)] mb-0.5">/ 3</span>
            </div>
            <div className="mt-2 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  improved ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-rose)]'
                }`}
                style={{ width: `${severityToWidth(recentAvg)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top current side effects */}
      {topCurrentSE.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-muted)] mb-2">近期主要副作用</p>
          <div className="space-y-1.5">
            {topCurrentSE.map(([type, stats]) => {
              const avg = stats.total / stats.count
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-deep)] w-20 shrink-0">
                    {SIDE_EFFECT_LABELS[type] ?? type}
                  </span>
                  <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-rose)] rounded-full transition-all"
                      style={{ width: `${severityToWidth(avg)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-muted)] w-6 text-right">
                    {avg <= 1 ? '輕' : avg <= 2 ? '中' : '重'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
