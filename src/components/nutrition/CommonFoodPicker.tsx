// 常用台灣食物快選
import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Plus, Minus } from 'lucide-react'
import { COMMON_FOODS, type CommonFood } from '../../lib/nutrition'

interface CommonFoodPickerProps {
  onAdd: (food: CommonFood, count: number) => void
}

export const CommonFoodPicker: React.FC<CommonFoodPickerProps> = ({ onAdd }) => {
  const [counts, setCounts] = useState<Record<string, number>>({})

  const adjust = (id: string, delta: number) => {
    setCounts(prev => {
      const next = (prev[id] ?? 0) + delta
      if (next <= 0) {
        const rest = { ...prev }
        delete rest[id]
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const selectedCount = Object.values(counts).reduce((a, b) => a + b, 0)

  const handleAddAll = () => {
    Object.entries(counts).forEach(([id, count]) => {
      const food = COMMON_FOODS.find(f => f.id === id)
      if (food && count > 0) onAdd(food, count)
    })
    setCounts({})
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted)] px-1">常用食物（點擊加入）</p>
      <div className="grid grid-cols-1 gap-2">
        {COMMON_FOODS.map(food => {
          const count = counts[food.id] ?? 0
          return (
            <div
              key={food.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                count > 0
                  ? 'bg-[var(--color-sage-light)] border-[var(--color-sage)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)]'
              }`}
            >
              <span className="text-2xl w-8 text-center">{food.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-deep)]">{food.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {food.portion} · <span className="text-[var(--color-sage)] font-medium">{food.protein}g 蛋白</span> · {food.calories} kcal
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {count > 0 && (
                  <>
                    <button
                      onClick={() => adjust(food.id, -1)}
                      className="w-7 h-7 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="stat-number text-sm w-4 text-center">{count}</span>
                  </>
                )}
                <button
                  onClick={() => adjust(food.id, 1)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    count > 0
                      ? 'bg-[var(--color-sage)] text-white'
                      : 'bg-white border border-[var(--color-border)]'
                  }`}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <Button fullWidth className="gap-2" onClick={handleAddAll}>
          <Plus size={16} />
          加入 {selectedCount} 項食物
        </Button>
      )}
    </div>
  )
}
