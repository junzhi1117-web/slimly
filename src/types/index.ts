export type MedicationType = 'mounjaro' | 'wegovy' | 'saxenda'

export type MedicationRoute = 'injection' | 'oral'

export interface Medication {
  id: string
  name: string
  brandName: string
  manufacturer: string
  doses: number[]
  frequency: 'weekly' | 'daily' | 'custom'
  unit: string
  route: MedicationRoute
}

export type InjectionSite = 'abdomen-left' | 'abdomen-right' | 'thigh-left' | 'thigh-right' | 'arm-left' | 'arm-right'

export type SideEffectType = 'nausea' | 'vomiting' | 'fatigue' | 'dizziness' | 'constipation' | 'diarrhea' | 'appetite_loss' | 'other'

export interface SideEffectEntry {
  type: SideEffectType
  severity: 1 | 2 | 3   // 輕微/中等/嚴重
}

export interface DoseRecord {
  id: string
  date: string
  medication: string
  dose: number
  route: MedicationRoute
  injectionSite?: InjectionSite
  withMeal?: boolean
  notes?: string
  sideEffects?: SideEffectEntry[]
}

export interface InjectionLog {
  id: string
  date: string
  medication: MedicationType
  dose: number
  site: InjectionSite
  notes?: string
  sideEffects?: SideEffectEntry[]
}

export interface WeightLog {
  id: string
  date: string
  weight: number        // kg
  waist?: number        // cm（選填）
}

// ── Nutrition ─────────────────────────────────────────

export type NutritionSource = 'ai_photo' | 'manual' | 'common_food'

export interface NutritionEntry {
  id: string
  date: string             // YYYY-MM-DD
  name: string             // 食物名稱（中文）
  portion: string          // 份量描述（例如「1份」「約150g」）
  calories: number         // 熱量 (kcal)
  protein: number          // 蛋白質 (g)
  carbs: number            // 碳水化合物 (g)
  fat: number              // 脂肪 (g)
  source: NutritionSource  // 記錄來源
}

export interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// AI 分析食物圖片的回傳結果
export interface AiFoodAnalysis {
  foods: Array<{
    name: string
    portion: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }>
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export interface UserProfile {
  medicationType: MedicationType
  currentDose: number
  injectionDay?: number  // 0=Sun..6=Sat
  startDate: string
  startWeight: number
  targetWeight?: number
  height?: number
  isPremium?: boolean    // Premium 訂閱狀態（由 Supabase 後台 / 金流 webhook 寫入）
}
