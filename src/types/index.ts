export type MedicationType = 'mounjaro' | 'wegovy' | 'saxenda'

export interface Medication {
  id: MedicationType
  name: string          // 猛健樂
  brandName: string     // Mounjaro
  manufacturer: string  // 台灣禮來
  doses: number[]       // [2.5, 5, 7.5, 10, 12.5, 15]
  frequency: 'weekly' | 'daily'
  unit: 'mg'
}

export type InjectionSite = 'abdomen-left' | 'abdomen-right' | 'thigh-left' | 'thigh-right' | 'arm-left' | 'arm-right'

export type SideEffectType = 'nausea' | 'vomiting' | 'fatigue' | 'dizziness' | 'constipation' | 'diarrhea' | 'appetite_loss' | 'other'

export interface SideEffectEntry {
  type: SideEffectType
  severity: 1 | 2 | 3   // 輕微/中等/嚴重
}

export interface InjectionLog {
  id: string
  date: string          // ISO date
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

export interface UserProfile {
  medicationType: MedicationType
  currentDose: number
  startDate: string
  startWeight: number
  targetWeight?: number
  height?: number
}
