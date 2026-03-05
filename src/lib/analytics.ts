import { supabase } from './supabase'

type EventPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsEventName =
  | 'report_page_viewed'
  | 'report_preview_shown'
  | 'report_upgrade_cta_clicked'
  | 'paywall_viewed'
  | 'subscription_checkout_started'
  | 'subscription_checkout_completed'
  | 'report_export_clicked'
  | 'report_export_succeeded'
  | 'report_export_failed'

interface AnalyticsRecord {
  event: AnalyticsEventName
  user_id: string
  session_id: string
  timestamp: string
  payload: EventPayload
}

const STORAGE_KEY = 'slimly_analytics_events'
const QUEUE_KEY = 'slimly_analytics_queue'
const SESSION_KEY = 'slimly_session_id'
const AB_KEY = 'slimly_paywall_variant'

let flushing = false

function getSessionId() {
  const current = localStorage.getItem(SESSION_KEY)
  if (current) return current
  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}

function appendEvent(event: AnalyticsRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? (JSON.parse(raw) as AnalyticsRecord[]) : []
    const next = [...list, event].slice(-200)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    return
  }
}

function enqueueForSync(event: AnalyticsRecord) {
  if (event.user_id === 'guest') return

  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const queue = raw ? (JSON.parse(raw) as AnalyticsRecord[]) : []
    const next = [...queue, event].slice(-400)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(next))
  } catch {
    return
  }
}

function cleanPayload(payload: EventPayload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

export function getPaywallVariant(): 'A' | 'B' {
  const current = localStorage.getItem(AB_KEY)
  if (current === 'A' || current === 'B') return current
  const variant: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B'
  localStorage.setItem(AB_KEY, variant)
  return variant
}

export async function flushAnalyticsEvents() {
  if (flushing) return
  flushing = true

  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const queue = raw ? (JSON.parse(raw) as AnalyticsRecord[]) : []
    if (queue.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const canSend = queue.filter((item) => item.user_id === user.id).slice(0, 50)
    if (canSend.length === 0) return

    const rows = canSend.map((item) => ({
      user_id: item.user_id,
      event_name: item.event,
      session_id: item.session_id,
      event_at: item.timestamp,
      payload: item.payload,
    }))

    const { error } = await supabase.from('analytics_events').insert(rows)
    if (error) return

    const sentIds = new Set(canSend.map((item) => `${item.session_id}:${item.timestamp}:${item.event}`))
    const nextQueue = queue.filter((item) => !sentIds.has(`${item.session_id}:${item.timestamp}:${item.event}`))
    localStorage.setItem(QUEUE_KEY, JSON.stringify(nextQueue))
  } finally {
    flushing = false
  }
}

export function trackEvent(
  event: AnalyticsEventName,
  userId: string,
  payload: EventPayload = {}
) {
  const record: AnalyticsRecord = {
    event,
    user_id: userId,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
    payload: cleanPayload(payload),
  }

  appendEvent(record)
  enqueueForSync(record)
  void flushAnalyticsEvents()

  if (import.meta.env.DEV) {
    console.info('[analytics]', record)
  }
}
