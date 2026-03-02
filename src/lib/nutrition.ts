import type { UserProfile, WeightLog, NutritionEntry, NutritionTotals } from '../types'

// ── 蛋白質目標計算 ─────────────────────────────────────
//
// 有身高：用 AdjBW 法（ESPEN 減重期建議）
//   IBW    = 22.5 × (身高m)²         ← 亞洲人目標 BMI 22.5，無需性別
//   AdjBW  = IBW + 0.25 × (當前體重 - IBW)
//   目標   = AdjBW × 1.3 g/kg
//
// 無身高：保守估計
//   目標   = 當前體重 × 1.2 g/kg

export interface ProteinGoalResult {
  grams: number            // 建議攝取量（g，已四捨五入）
  currentWeight: number    // 計算基準體重（kg）
  method: 'adjbw' | 'actual'
  ibw?: number             // 理想體重（僅 adjbw 方法）
  adjbw?: number           // 調整體重（僅 adjbw 方法）
}

export function getLatestWeight(weightLogs: WeightLog[]): number | null {
  if (weightLogs.length === 0) return null
  return [...weightLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0].weight
}

export function computeProteinGoal(
  profile: UserProfile,
  weightLogs: WeightLog[]
): ProteinGoalResult {
  const currentWeight = getLatestWeight(weightLogs) ?? profile.startWeight

  if (profile.height && profile.height > 0) {
    const heightM = profile.height / 100
    const ibw = 22.5 * heightM * heightM
    // 若當前體重 < IBW，直接用當前體重（不調整）
    const adjbw = currentWeight <= ibw
      ? currentWeight
      : ibw + 0.25 * (currentWeight - ibw)
    return {
      grams: Math.round(adjbw * 1.3),
      currentWeight,
      method: 'adjbw',
      ibw: Math.round(ibw * 10) / 10,
      adjbw: Math.round(adjbw * 10) / 10,
    }
  }

  return {
    grams: Math.round(currentWeight * 1.2),
    currentWeight,
    method: 'actual',
  }
}

// ── 營養合計計算 ───────────────────────────────────────

export function getNutritionTotals(entries: NutritionEntry[]): NutritionTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  acc.protein  + e.protein,
      carbs:    acc.carbs    + e.carbs,
      fat:      acc.fat      + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function getTodayEntries(entries: NutritionEntry[]): NutritionEntry[] {
  const today = new Date().toISOString().split('T')[0]
  return entries.filter(e => e.date === today)
}

export function getEntriesByDate(entries: NutritionEntry[], date: string): NutritionEntry[] {
  return entries.filter(e => e.date === date)
}

// ── 常用台灣食物資料庫 ─────────────────────────────────

export interface CommonFood {
  id: string
  name: string
  emoji: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const COMMON_FOODS: CommonFood[] = [
  { id: 'egg',         name: '雞蛋',     emoji: '🥚', portion: '1顆',    calories: 72,  protein: 6.3,  carbs: 0.4,  fat: 4.8  },
  { id: 'chicken',     name: '雞胸肉',   emoji: '🍗', portion: '100g',   calories: 165, protein: 31.0, carbs: 0,    fat: 3.6  },
  { id: 'tofu',        name: '板豆腐',   emoji: '🟨', portion: '1塊150g',calories: 108, protein: 12.0, carbs: 2.4,  fat: 5.4  },
  { id: 'salmon',      name: '鮭魚',     emoji: '🐟', portion: '1片100g',calories: 208, protein: 20.0, carbs: 0,    fat: 13.0 },
  { id: 'greek_yogurt',name: '希臘優格', emoji: '🥛', portion: '1杯150g',calories: 100, protein: 17.0, carbs: 6.0,  fat: 0.7  },
  { id: 'protein_bar', name: '蛋白棒',   emoji: '🍫', portion: '1條',    calories: 200, protein: 20.0, carbs: 22.0, fat: 6.0  },
  { id: 'tea_egg',     name: '茶葉蛋',   emoji: '🥚', portion: '1顆',    calories: 78,  protein: 7.0,  carbs: 1.0,  fat: 4.8  },
  { id: 'milk',        name: '鮮奶',     emoji: '🥛', portion: '1杯240ml',calories: 149, protein: 8.0,  carbs: 11.0, fat: 8.0  },
  { id: 'edamame',     name: '毛豆',     emoji: '🫘', portion: '100g',   calories: 122, protein: 11.0, carbs: 9.9,  fat: 5.2  },
  { id: 'shrimp',      name: '蝦仁',     emoji: '🦐', portion: '100g',   calories: 99,  protein: 20.9, carbs: 0,    fat: 1.7  },
  { id: 'pork',        name: '豬里肌',   emoji: '🥩', portion: '100g',   calories: 143, protein: 22.0, carbs: 0,    fat: 5.8  },
  { id: 'tuna',        name: '鮪魚罐頭', emoji: '🐟', portion: '1罐80g', calories: 88,  protein: 19.0, carbs: 0,    fat: 1.0  },
  { id: 'protein_shake',name:'乳清蛋白', emoji: '💪', portion: '1匙30g', calories: 120, protein: 24.0, carbs: 3.0,  fat: 1.5  },
  { id: 'pork_belly',  name: '滷肉飯',   emoji: '🍚', portion: '1碗',    calories: 380, protein: 14.0, carbs: 52.0, fat: 12.0 },
  { id: 'steam_chicken',name:'白切雞',   emoji: '🍗', portion: '1份100g',calories: 167, protein: 25.0, carbs: 0,    fat: 7.0  },
]
