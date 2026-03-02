// 每日 AI 拍照免費次數追蹤（localStorage，按日重置）
// Premium 用戶不受此限制

const DAILY_FREE_LIMIT = 3

function todayKey(): string {
  return `slimly_photo_uses_${new Date().toISOString().split('T')[0]}`
}

export function getTodayUsageCount(): number {
  return parseInt(localStorage.getItem(todayKey()) ?? '0', 10)
}

export function getRemainingFreeUses(): number {
  return Math.max(0, DAILY_FREE_LIMIT - getTodayUsageCount())
}

export function canUsePhotoToday(isPremium: boolean): boolean {
  if (isPremium) return true
  return getTodayUsageCount() < DAILY_FREE_LIMIT
}

export function incrementPhotoUsage(): void {
  const key = todayKey()
  const current = parseInt(localStorage.getItem(key) ?? '0', 10)
  localStorage.setItem(key, String(current + 1))
}

export { DAILY_FREE_LIMIT }
