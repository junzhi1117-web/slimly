import { useState, useEffect, useCallback } from 'react'
import { supabase, useLocalStorage } from './supabase'
import type { DoseRecord, WeightLog, UserProfile, MedicationType, MedicationRoute } from '../types'
import type { User } from '@supabase/supabase-js'

// ── Legacy data migration ──────────────────────────────

/** Migrate slimly_injection_logs → slimly_dose_records (run once) */
export function migrateLegacyData() {
  if (localStorage.getItem('slimly_dose_records')) return
  const raw = localStorage.getItem('slimly_injection_logs')
  if (!raw) return
  try {
    const logs = JSON.parse(raw) as Record<string, unknown>[]
    const migrated: DoseRecord[] = logs.map(log => ({
      id: log.id as string,
      date: log.date as string,
      medication: log.medication as string,
      dose: log.dose as number,
      route: 'injection' as MedicationRoute,
      injectionSite: (log.site ?? log.injectionSite) as DoseRecord['injectionSite'],
      notes: log.notes as string | undefined,
      sideEffects: log.sideEffects as DoseRecord['sideEffects'],
    }))
    localStorage.setItem('slimly_dose_records', JSON.stringify(migrated))
  } catch { /* ignore corrupt data */ }
}

// ── Auth hook ──────────────────────────────────────────

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// ── camelCase ↔ snake_case mappers ─────────────────────

const DEFAULT_PROFILE: UserProfile = {
  medicationType: 'mounjaro',
  currentDose: 2.5,
  startDate: new Date().toISOString().split('T')[0],
  startWeight: 80,
  targetWeight: 70,
  height: 175,
}

export function toSnakeProfile(p: UserProfile) {
  return {
    medication_type: p.medicationType,
    current_dose: p.currentDose,
    injection_day: p.injectionDay,
    start_date: p.startDate,
    start_weight: p.startWeight,
    target_weight: p.targetWeight,
    height: p.height,
  }
}

function toCamelProfile(row: Record<string, unknown>): UserProfile {
  return {
    medicationType: row.medication_type as MedicationType,
    currentDose: row.current_dose as number,
    injectionDay: row.injection_day as number | undefined,
    startDate: row.start_date as string,
    startWeight: row.start_weight as number,
    targetWeight: row.target_weight as number | undefined,
    height: row.height as number | undefined,
  }
}

function toSnakeDoseRecord(r: DoseRecord, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    date: r.date,
    medication: r.medication,
    dose: r.dose,
    route: r.route,
    injection_site: r.injectionSite,
    with_meal: r.withMeal,
    notes: r.notes,
    side_effects: r.sideEffects,
  }
}

function toCamelDoseRecord(row: Record<string, unknown>): DoseRecord {
  return {
    id: row.id as string,
    date: row.date as string,
    medication: row.medication as string,
    dose: row.dose as number,
    route: row.route as MedicationRoute,
    injectionSite: row.injection_site as DoseRecord['injectionSite'],
    withMeal: row.with_meal as boolean | undefined,
    notes: row.notes as string | undefined,
    sideEffects: row.side_effects as DoseRecord['sideEffects'],
  }
}

function toSnakeWeightLog(l: WeightLog, userId: string) {
  return {
    id: l.id,
    user_id: userId,
    date: l.date,
    weight: l.weight,
    waist: l.waist,
  }
}

function toCamelWeightLog(row: Record<string, unknown>): WeightLog {
  return {
    id: row.id as string,
    date: row.date as string,
    weight: row.weight as number,
    waist: row.waist as number | undefined,
  }
}

// ── Data hooks ─────────────────────────────────────────

export function useProfile(user: User | null, refreshKey = 0) {
  const [localProfile, setLocalProfile] = useLocalStorage<UserProfile>('slimly_profile', DEFAULT_PROFILE)
  const [supaProfile, setSupaProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setSupaProfile(null); return }
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setSupaProfile(toCamelProfile(data))
        setLoading(false)
      })
  }, [user?.id, refreshKey])

  const profile = (user && supaProfile) ? supaProfile : localProfile

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const merged = { ...profile, ...updates }
    // Always update localStorage (guest fallback)
    setLocalProfile(merged)
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...toSnakeProfile(merged) })
      if (!error) setSupaProfile(merged)
    }
  }, [user, profile, setLocalProfile])

  return { profile, updateProfile, loading }
}

export function useDoseRecords(user: User | null, refreshKey = 0) {
  const [localRecords, setLocalRecords] = useLocalStorage<DoseRecord[]>('slimly_dose_records', [])
  const [supaRecords, setSupaRecords] = useState<DoseRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setSupaRecords([]); return }
    setLoading(true)
    supabase
      .from('dose_records')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) setSupaRecords(data.map(toCamelDoseRecord))
        setLoading(false)
      })
  }, [user?.id, refreshKey])

  const records = user ? supaRecords : localRecords

  const addRecord = useCallback(async (record: Omit<DoseRecord, 'id'>) => {
    const newRecord: DoseRecord = { ...record, id: crypto.randomUUID() }
    if (user) {
      const { error } = await supabase
        .from('dose_records')
        .insert(toSnakeDoseRecord(newRecord, user.id))
      if (!error) setSupaRecords(prev => [newRecord, ...prev])
    } else {
      setLocalRecords(prev => [newRecord, ...prev])
    }
  }, [user, setLocalRecords])

  return { records, addRecord, loading }
}

export function useWeightLogs(user: User | null, refreshKey = 0) {
  const [localLogs, setLocalLogs] = useLocalStorage<WeightLog[]>('slimly_weight_logs', [])
  const [supaLogs, setSupaLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setSupaLogs([]); return }
    setLoading(true)
    supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) setSupaLogs(data.map(toCamelWeightLog))
        setLoading(false)
      })
  }, [user?.id, refreshKey])

  const logs = user ? supaLogs : localLogs

  const addLog = useCallback(async (log: Omit<WeightLog, 'id'>) => {
    const newLog: WeightLog = { ...log, id: crypto.randomUUID() }
    if (user) {
      const { error } = await supabase
        .from('weight_logs')
        .insert(toSnakeWeightLog(newLog, user.id))
      if (!error) setSupaLogs(prev => [newLog, ...prev])
    } else {
      setLocalLogs(prev => [newLog, ...prev])
    }
  }, [user, setLocalLogs])

  return { logs, addLog, loading }
}

// ── Sync localStorage → Supabase ───────────────────────

export async function syncLocalToSupabase(userId: string) {
  const rawProfile = localStorage.getItem('slimly_profile')
  if (rawProfile) {
    const profile: UserProfile = JSON.parse(rawProfile)
    await supabase.from('profiles').upsert({ id: userId, ...toSnakeProfile(profile) })
  }

  const rawRecords = localStorage.getItem('slimly_dose_records')
  if (rawRecords) {
    const records: DoseRecord[] = JSON.parse(rawRecords)
    if (records.length > 0) {
      const rows = records.map(r => toSnakeDoseRecord(r, userId))
      await supabase.from('dose_records').upsert(rows)
    }
  }

  const rawWeights = localStorage.getItem('slimly_weight_logs')
  if (rawWeights) {
    const logs: WeightLog[] = JSON.parse(rawWeights)
    if (logs.length > 0) {
      const rows = logs.map(l => toSnakeWeightLog(l, userId))
      await supabase.from('weight_logs').upsert(rows)
    }
  }
}
