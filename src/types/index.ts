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

export interface UserProfile {
  medicationType: MedicationType
  currentDose: number
  injectionDay?: number  // 0=Sun..6=Sat
  startDate: string
  startWeight: number
  targetWeight?: number
  height?: number
}
