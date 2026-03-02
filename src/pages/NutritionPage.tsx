import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FoodPhotoAnalyzer } from '../components/nutrition/FoodPhotoAnalyzer'
import { FoodResultCard } from '../components/nutrition/FoodResultCard'
import { CommonFoodPicker } from '../components/nutrition/CommonFoodPicker'
import { NutritionBar } from '../components/nutrition/NutritionBar'
import { Camera, UtensilsCrossed, List, Trash2 } from 'lucide-react'
import { getTodayEntries, getNutritionTotals, computeProteinGoal, type CommonFood } from '../lib/nutrition'
import type { AiFoodAnalysis, NutritionEntry, UserProfile, WeightLog } from '../types'

type InputMode = 'idle' | 'photo' | 'common'

interface NutritionPageProps {
  entries: NutritionEntry[]
  profile: UserProfile
  weightLogs: WeightLog[]
  onAddEntry: (entry: Omit<NutritionEntry, 'id'>) => Promise<NutritionEntry>
  onRemoveEntry: (id: string) => void
}

export const NutritionPage: React.FC<NutritionPageProps> = ({
  entries, profile, weightLogs, onAddEntry, onRemoveEntry
}) => {
  const [mode, setMode] = useState<InputMode>('idle')
  const [aiResult, setAiResult] = useState<AiFoodAnalysis | null>(null)


  const today = new Date().toISOString().split('T')[0]
  const todayEntries = getTodayEntries(entries)
  const totals = getNutritionTotals(todayEntries)
  const proteinGoal = computeProteinGoal(profile, weightLogs)

  // ── AI 拍照流程 ──────────────────────────────────────

  const handleAiResult = (result: AiFoodAnalysis) => {
    setAiResult(result)
  }

  const handleAiConfirm = async (foods: AiFoodAnalysis['foods'], multiplier: number) => {
    for (const food of foods) {
      await onAddEntry({
        date: today,
        name: food.name,
        portion: food.portion,
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbs * multiplier * 10) / 10,
        fat: Math.round(food.fat * multiplier * 10) / 10,
        source: 'ai_photo',
      })
    }
    setAiResult(null)
    setMode('idle')
  }

  // ── 常用食物流程 ────────────────────────────────────

  const handleCommonFood = async (food: CommonFood, count: number) => {
    await onAddEntry({
      date: today,
      name: food.name,
      portion: count === 1 ? food.portion : `${count} × ${food.portion}`,
      calories: food.calories * count,
      protein: Math.round(food.protein * count * 10) / 10,
      carbs: Math.round(food.carbs * count * 10) / 10,
      fat: Math.round(food.fat * count * 10) / 10,
      source: 'common_food',
    })
    setMode('idle')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header
        title={mode !== 'idle' ? (mode === 'photo' ? '拍照記錄' : '常用食物') : '今日飲食'}
        onBack={mode !== 'idle' ? () => { setMode('idle'); setAiResult(null) } : undefined}
      />
      <main className="p-4 space-y-4">

        {/* 今日摘要卡 */}
        {mode === 'idle' && (
          <Card variant="hero">
            <p className="text-white/60 text-sm mb-3">今日營養</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 蛋白質：主角 */}
              <div className="bg-white/10 rounded-2xl p-3 col-span-2">
                <p className="text-white/50 text-xs mb-1">蛋白質（今日重點）</p>
                <div className="flex items-baseline gap-2">
                  <span className="stat-number text-2xl text-white">
                    {Math.round(totals.protein)}g
                  </span>
                  <span className="text-white/60 text-sm">
                    / {proteinGoal.grams}g 目標
                  </span>
                  <span className="ml-auto text-white/80 text-sm font-medium">
                    {Math.min(100, Math.round(totals.protein / proteinGoal.grams * 100))}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, totals.protein / proteinGoal.grams * 100)}%` }}
                  />
                </div>
              </div>
              {/* 其他三項 */}
              {[
                { label: '熱量', value: Math.round(totals.calories), unit: 'kcal' },
                { label: '碳水', value: Math.round(totals.carbs), unit: 'g' },
                { label: '脂肪', value: Math.round(totals.fat), unit: 'g' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/50 text-xs mb-1">{item.label}</p>
                  <p className="stat-number text-lg text-white">
                    {item.value}<span className="text-xs font-normal ml-0.5 text-white/60">{item.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 記錄入口 */}
        {mode === 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              fullWidth
              className="h-14 gap-2 flex-col py-3 text-sm"
              onClick={() => setMode('photo')}
            >
              <Camera size={20} />
              拍照辨識
            </Button>
            <Button
              fullWidth
              variant="secondary"
              className="h-14 gap-2 flex-col py-3 text-sm"
              onClick={() => setMode('common')}
            >
              <List size={20} />
              常用食物
            </Button>
          </div>
        )}

        {/* 拍照模式 */}
        {mode === 'photo' && !aiResult && (
          <FoodPhotoAnalyzer onResult={handleAiResult} />
        )}

        {/* AI 結果確認 */}
        {mode === 'photo' && aiResult && (
          <FoodResultCard
            analysis={aiResult}
            onConfirm={handleAiConfirm}
            onCancel={() => { setAiResult(null); setMode('idle') }}
          />
        )}

        {/* 常用食物模式 */}
        {mode === 'common' && (
          <CommonFoodPicker onAdd={handleCommonFood} />
        )}

        {/* 今日記錄列表 */}
        {mode === 'idle' && todayEntries.length > 0 && (
          <section>
            <h3 className="font-serif text-lg text-[var(--color-deep)] mb-3">今日記錄</h3>
            <div className="space-y-2">
              {todayEntries.map(entry => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--color-deep)] truncate">
                          {entry.name}
                        </p>
                        {entry.source === 'ai_photo' && (
                          <span className="text-[10px] bg-[var(--color-sage-light)] text-[var(--color-sage)] px-1.5 py-0.5 rounded-full shrink-0">
                            AI
                          </span>
                        )}
                      </div>
                      <NutritionBar
                        calories={entry.calories}
                        protein={entry.protein}
                        carbs={entry.carbs}
                        fat={entry.fat}
                        compact
                      />
                    </div>
                    <button
                      onClick={() => onRemoveEntry(entry.id)}
                      className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-rose)] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 空白狀態 */}
        {mode === 'idle' && todayEntries.length === 0 && (
          <Card className="text-center py-10">
            <UtensilsCrossed size={32} className="text-[var(--color-muted)] mx-auto mb-3" />
            <p className="text-[var(--color-muted)] text-sm">今天還沒有飲食記錄</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              目標蛋白質：{proteinGoal.grams}g / 天
            </p>
          </Card>
        )}

      </main>
    </div>
  )
}
