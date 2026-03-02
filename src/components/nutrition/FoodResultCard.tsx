// AI 分析結果確認卡片，支援份量調整
import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Plus } from 'lucide-react'
import type { AiFoodAnalysis } from '../../types'

interface FoodResultCardProps {
  analysis: AiFoodAnalysis
  onConfirm: (items: AiFoodAnalysis['foods'], multiplier: number) => void
  onCancel: () => void
}

const MULTIPLIERS = [0.5, 1, 1.5, 2] as const

export const FoodResultCard: React.FC<FoodResultCardProps> = ({ analysis, onConfirm, onCancel }) => {
  const [multiplier, setMultiplier] = useState<number>(1)

  const adjusted = {
    calories: Math.round(analysis.totalCalories * multiplier),
    protein:  Math.round(analysis.totalProtein  * multiplier * 10) / 10,
    carbs:    Math.round(analysis.totalCarbs    * multiplier * 10) / 10,
    fat:      Math.round(analysis.totalFat      * multiplier * 10) / 10,
  }

  const portionLabel = multiplier === 0.5 ? '½ 份' : multiplier === 1 ? '1 份' : multiplier === 1.5 ? '1½ 份' : '2 份'

  return (
    <Card className="space-y-4">
      {/* 食物清單 */}
      <div>
        <p className="text-xs text-[var(--color-muted)] mb-2">AI 識別結果</p>
        <div className="space-y-1.5">
          {analysis.foods.map((food, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-deep)]">
                {food.name}
                <span className="text-[var(--color-muted)] ml-1">({food.portion})</span>
              </span>
              <span className="text-xs text-[var(--color-muted)]">{food.protein}g 蛋白</span>
            </div>
          ))}
        </div>
      </div>

      {/* 份量調整 */}
      <div>
        <p className="text-xs text-[var(--color-muted)] mb-2">調整份量</p>
        <div className="flex gap-2">
          {MULTIPLIERS.map(m => (
            <button
              key={m}
              onClick={() => setMultiplier(m)}
              className={`flex-1 py-2 rounded-2xl text-sm transition-all border ${
                multiplier === m
                  ? 'bg-[var(--color-sage)] text-white border-[var(--color-sage)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-deep)]'
              }`}
            >
              {m === 0.5 ? '½' : m === 1.5 ? '1½' : m}x
            </button>
          ))}
        </div>
      </div>

      {/* 調整後合計 */}
      <div className="bg-[var(--color-sage-light)] rounded-2xl p-3">
        <p className="text-xs text-[var(--color-sage)] font-medium mb-2">{portionLabel} 的營養合計</p>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { label: '蛋白質', value: `${adjusted.protein}g`, highlight: true },
            { label: '熱量',   value: `${adjusted.calories}`, unit: 'kcal' },
            { label: '碳水',   value: `${adjusted.carbs}g` },
            { label: '脂肪',   value: `${adjusted.fat}g` },
          ].map(item => (
            <div key={item.label}>
              <p className={`stat-number text-sm ${item.highlight ? 'text-[var(--color-sage)]' : 'text-[var(--color-deep)]'}`}>
                {item.value}
              </p>
              <p className="text-xs text-[var(--color-muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          取消
        </Button>
        <Button className="flex-1 gap-1" onClick={() => onConfirm(analysis.foods, multiplier)}>
          <Plus size={16} />
          加入記錄
        </Button>
      </div>

      {/* AI 信心度提示 */}
      {'confidence' in analysis && (analysis as AiFoodAnalysis & { confidence?: string }).confidence === 'low' && (
        <p className="text-xs text-[var(--color-muted)] text-center">
          ⚠️ 圖片不夠清晰，估算可能有誤差
        </p>
      )}
    </Card>
  )
}
