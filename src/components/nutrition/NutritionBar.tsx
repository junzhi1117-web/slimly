// 四項營養數值橫條（蛋白質最突出）
import React from 'react'

interface NutritionBarProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  proteinGoal?: number
  compact?: boolean
}

export const NutritionBar: React.FC<NutritionBarProps> = ({
  calories, protein, carbs, fat, proteinGoal, compact = false
}) => {
  const proteinPct = proteinGoal ? Math.min(100, Math.round((protein / proteinGoal) * 100)) : null

  if (compact) {
    return (
      <div className="flex gap-3 text-xs">
        <span className="font-semibold text-[var(--color-sage)]">{Math.round(protein)}g 蛋白</span>
        <span className="text-[var(--color-muted)]">{Math.round(calories)} kcal</span>
        <span className="text-[var(--color-muted)]">{Math.round(carbs)}g 醣</span>
        <span className="text-[var(--color-muted)]">{Math.round(fat)}g 脂</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 蛋白質：主角 */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium text-[var(--color-deep)]">蛋白質</span>
          <span className="stat-number text-base text-[var(--color-sage)]">
            {Math.round(protein)}g
            {proteinGoal && (
              <span className="text-xs text-[var(--color-muted)] font-normal ml-1">
                / {proteinGoal}g 目標
              </span>
            )}
          </span>
        </div>
        {proteinGoal && (
          <div className="h-2 bg-[var(--color-sage-light)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-sage)] rounded-full transition-all duration-500"
              style={{ width: `${proteinPct}%` }}
            />
          </div>
        )}
      </div>

      {/* 其他三項：輔助 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '熱量', value: `${Math.round(calories)}`, unit: 'kcal' },
          { label: '碳水', value: `${Math.round(carbs)}`, unit: 'g' },
          { label: '脂肪', value: `${Math.round(fat)}`, unit: 'g' },
        ].map(item => (
          <div key={item.label} className="text-center bg-[var(--color-surface)] rounded-2xl py-2">
            <p className="stat-number text-base text-[var(--color-deep)]">
              {item.value}<span className="text-xs font-normal ml-0.5">{item.unit}</span>
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
