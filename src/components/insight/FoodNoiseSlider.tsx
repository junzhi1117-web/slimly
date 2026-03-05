import React, { useState } from 'react'
import type { FoodNoiseLog } from '../../types'

interface FoodNoiseSliderProps {
  logs: FoodNoiseLog[]
  onSave: (date: string, level: number) => void
}

const LEVEL_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1:  { emoji: '😌', label: '完全安靜', color: '#24342F' },
  2:  { emoji: '😌', label: '幾乎沒有', color: '#24342F' },
  3:  { emoji: '🙂', label: '偶爾浮現', color: '#8FBCB0' },
  4:  { emoji: '🙂', label: '偶爾浮現', color: '#8FBCB0' },
  5:  { emoji: '😐', label: '有些想法', color: '#B0A090' },
  6:  { emoji: '😐', label: '有些想法', color: '#B0A090' },
  7:  { emoji: '😰', label: '常常在想', color: '#C9A0A8' },
  8:  { emoji: '😰', label: '很難忽略', color: '#C9A0A8' },
  9:  { emoji: '😵', label: '幾乎停不下來', color: '#C4867A' },
  10: { emoji: '😵', label: '無法停止想食物', color: '#C4867A' },
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

/** 取最近 N 筆的平均值（排除 today） */
function getRecentAvg(logs: FoodNoiseLog[], today: string, n = 7): number | null {
  const past = logs.filter(l => l.date < today).slice(0, n)
  if (past.length === 0) return null
  return past.reduce((sum, l) => sum + l.level, 0) / past.length
}

export const FoodNoiseSlider: React.FC<FoodNoiseSliderProps> = ({ logs, onSave }) => {
  const today = getTodayDate()
  const todayLog = logs.find(l => l.date === today)
  const recentAvg = getRecentAvg(logs, today)

  const [level, setLevel] = useState<number>(todayLog?.level ?? 5)
  const [saved, setSaved] = useState<boolean>(!!todayLog)
  const [showSaveHint, setShowSaveHint] = useState(false)

  const handleSave = () => {
    onSave(today, level)
    setSaved(true)
    setShowSaveHint(true)
    setTimeout(() => setShowSaveHint(false), 2000)
  }

  const meta = LEVEL_LABELS[level]
  const diff = (recentAvg !== null && saved) ? +(recentAvg - level).toFixed(1) : null

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl px-4 py-4 border border-[var(--color-border)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-xs font-medium text-[var(--color-muted)]">食慾雜音</p>
          <p className="text-[10px] text-[var(--color-muted)] opacity-70 mt-0.5">大腦對食物的執念強度</p>
        </div>
        {saved && diff !== null && diff > 0.5 && (
          <span className="text-xs font-medium text-[#24342F] bg-[#EFF6F4] rounded-full px-2 py-0.5">
            ↓ 比上週低 {diff} 分
          </span>
        )}
        {saved && diff !== null && diff < -0.5 && (
          <span className="text-xs font-medium text-[#C9A0A8] bg-[#FAF3F4] rounded-full px-2 py-0.5">
            ↑ 比上週高 {Math.abs(diff)} 分
          </span>
        )}
      </div>

      {/* Emoji + label */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl leading-none">{meta.emoji}</span>
        <div>
          <p className="text-base font-semibold" style={{ color: meta.color }}>{meta.label}</p>
          <p className="text-xs text-[var(--color-muted)]">今日 {level} / 10</p>
        </div>
        {showSaveHint && (
          <span className="ml-auto text-xs text-[#24342F] animate-pulse">已記錄 ✓</span>
        )}
      </div>

      {/* Slider */}
      <div className="relative mb-3">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={level}
          onChange={e => {
            setLevel(Number(e.target.value))
            setSaved(false)
          }}
          className="w-full h-2 rounded-full appearance-none cursor-pointer food-noise-slider"
          style={{
            background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${(level - 1) / 9 * 100}%, #E8E0D8 ${(level - 1) / 9 * 100}%, #E8E0D8 100%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1 px-0.5">
          <span>安靜</span>
          <span>吵鬧</span>
        </div>
      </div>

      {/* Save button */}
      {!saved && (
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-2xl text-sm font-medium text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#8FBCB0' }}
        >
          記錄今天
        </button>
      )}

      {saved && !showSaveHint && (
        <button
          onClick={() => setSaved(false)}
          className="w-full py-1.5 rounded-2xl text-xs font-medium text-[var(--color-muted)] border border-[var(--color-border)] transition-all active:scale-[0.98]"
        >
          修改
        </button>
      )}
    </div>
  )
}
