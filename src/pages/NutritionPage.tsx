import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { UpgradeModal } from '../components/ui/UpgradeModal'
import { FoodPhotoAnalyzer } from '../components/nutrition/FoodPhotoAnalyzer'
import { FoodResultCard } from '../components/nutrition/FoodResultCard'
import { CommonFoodPicker } from '../components/nutrition/CommonFoodPicker'
import { NutritionBar } from '../components/nutrition/NutritionBar'
import { Camera, UtensilsCrossed, List, Trash2, Lock } from 'lucide-react'
import { getTodayEntries, getNutritionTotals, computeProteinGoal, type CommonFood } from '../lib/nutrition'
import { canUsePhotoToday, getRemainingFreeUses, incrementPhotoUsage, DAILY_FREE_LIMIT } from '../lib/photoUsage'
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
  const { t } = useTranslation()
  const [mode, setMode] = useState<InputMode>('idle')
  const [aiResult, setAiResult] = useState<AiFoodAnalysis | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [usageCount, setUsageCount] = useState(() => getRemainingFreeUses())

  const isPremium = profile.isPremium === true
  const canUsePhoto = canUsePhotoToday(isPremium)


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
    // 非 Premium 才計入免費次數
    if (!isPremium) {
      incrementPhotoUsage()
      setUsageCount(getRemainingFreeUses())
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
        title={mode !== 'idle' ? (mode === 'photo' ? t('nutrition.photo_mode') : t('nutrition.common_mode')) : t('nutrition.today')}
        onBack={mode !== 'idle' ? () => { setMode('idle'); setAiResult(null) } : undefined}
      />
      <main className="p-4 space-y-4">

        {/* 今日摘要卡 */}
        {mode === 'idle' && (
          <div className="card-elegant p-5">
            <p className="text-eyebrow mb-4">{t('nutrition.today_summary')}</p>
            {/* 蛋白質主角 */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="stat-display text-5xl text-[var(--color-deep)]">{Math.round(totals.protein)}</span>
                <span className="text-[var(--color-muted)] text-base">g</span>
                <span className="text-xs text-[var(--color-muted)] ml-1">{t('nutrition.protein_goal', { grams: proteinGoal.grams })}</span>
                <span className="ml-auto text-sm font-medium text-[var(--color-sage)]">
                  {Math.min(100, Math.round(totals.protein / proteinGoal.grams * 100))}%
                </span>
              </div>
              <div className="h-1 bg-[var(--color-sage-light)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-sage)] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, totals.protein / proteinGoal.grams * 100)}%` }} />
              </div>
            </div>
            <div className="divider-monet mb-4" />
            {/* 其他三項 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('nutrition.calories'), value: Math.round(totals.calories), unit: 'kcal' },
                { label: t('nutrition.carbs'), value: Math.round(totals.carbs), unit: 'g' },
                { label: t('nutrition.fat'), value: Math.round(totals.fat), unit: 'g' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-eyebrow mb-1">{item.label}</p>
                  <p className="stat-display text-2xl text-[var(--color-deep)]">{item.value}<span className="text-xs text-[var(--color-muted)] ml-0.5">{item.unit}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 記錄入口 */}
        {mode === 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            {/* 拍照辨識 — 每日 3 次免費，Premium 無限 */}
            <div className="relative">
              <Button
                fullWidth
                className="h-14 gap-2 flex-col py-3 text-sm"
                onClick={() => canUsePhoto ? setMode('photo') : setShowUpgrade(true)}
              >
                <Camera size={20} />
                {t('nutrition.photo_action')}
              </Button>
              {/* 次數標籤 */}
              {!isPremium && (
                <div className={`absolute top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none flex items-center gap-0.5 ${
                  canUsePhoto
                    ? 'bg-[var(--color-sage)] text-white'
                    : 'bg-[var(--color-rose)]/90 text-white'
                }`}>
                  {canUsePhoto ? (
                    <>{usageCount}/{DAILY_FREE_LIMIT}</>
                  ) : (
                    <><Lock size={8} /> {t('nutrition.free_used_up')}</>
                  )}
                </div>
              )}
            </div>
            <Button
              fullWidth
              variant="secondary"
              className="h-14 gap-2 flex-col py-3 text-sm"
              onClick={() => setMode('common')}
            >
              <List size={20} />
              {t('nutrition.common_mode')}
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
            <h3 className="font-serif text-lg text-[var(--color-deep)] mb-3">{t('nutrition.today_records')}</h3>
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
                            {t('nutrition.ai_tag')}
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
                      onClick={() => setConfirmDeleteId(entry.id)}
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
            <p className="text-[var(--color-muted)] text-sm">{t('nutrition.empty')}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {t('nutrition.protein_daily_goal', { grams: proteinGoal.grams })}
            </p>
          </Card>
        )}

      </main>

      {/* 刪除確認 Bottom Sheet */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative w-full bg-[var(--color-surface)] rounded-t-3xl p-6 pb-8 space-y-3">
            <p className="text-center font-medium text-[var(--color-deep)]">{t('nutrition.confirm_delete')}</p>
            <button className="w-full py-3 rounded-2xl bg-[var(--color-rose-light)] text-[var(--color-rose)] font-semibold"
              onClick={() => { onRemoveEntry(confirmDeleteId); setConfirmDeleteId(null) }}>
              {t('common.delete')}
            </button>
            <button className="w-full py-3 rounded-2xl text-[var(--color-muted)]"
              onClick={() => setConfirmDeleteId(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Premium 升級 Modal */}
      {showUpgrade && (
        <UpgradeModal
          featureName={t('nutrition.photo_upgrade_feature', { limit: DAILY_FREE_LIMIT })}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  )
}
