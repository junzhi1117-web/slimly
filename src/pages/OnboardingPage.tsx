import React, { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MEDICATIONS, WEEKDAY_LABELS } from '../lib/medications'
import { signUpWithEmail, signInWithGoogle, supabase } from '../lib/supabase'
import { toSnakeProfile } from '../lib/db'
import type { MedicationType, UserProfile } from '../types'
import { Check, ChevronRight, ChevronLeft, Mail } from 'lucide-react'

interface OnboardingPageProps {
  onComplete: (profile: UserProfile) => void
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0)

  // Step 1 state
  const [medType, setMedType] = useState<MedicationType>('mounjaro')

  // Step 2 state
  const med = MEDICATIONS[medType]
  const [dose, setDose] = useState(med.doses[0])
  const [injectionDay, setInjectionDay] = useState(3) // Wed
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  // Step 3 state
  const [currentWeight, setCurrentWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [height, setHeight] = useState('')

  // Step 4 state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const handleMedChange = (type: MedicationType) => {
    setMedType(type)
    const m = MEDICATIONS[type]
    setDose(m.doses[0])
  }

  const handleFinish = async () => {
    const profileData: UserProfile = {
      medicationType: medType,
      currentDose: dose,
      injectionDay: med.frequency === 'weekly' ? injectionDay : undefined,
      startDate,
      startWeight: parseFloat(currentWeight) || 80,
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      height: height ? parseFloat(height) : undefined,
    }

    // If authenticated, also save profile to Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, ...toSnakeProfile(profileData) })
    }

    onComplete(profileData)
  }

  const handleSignUp = async () => {
    if (!email || !password) return
    setAuthLoading(true)
    setAuthError('')
    const { error } = await signUpWithEmail(email, password)
    setAuthLoading(false)
    if (error) {
      setAuthError(error.message)
    } else {
      handleFinish()
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setAuthError('')
    const { error } = await signInWithGoogle()
    setAuthLoading(false)
    if (error) {
      setAuthError(error.message)
    }
  }

  const canGoNext = () => {
    switch (step) {
      case 0: return true
      case 1: return true
      case 2: return !!currentWeight
      default: return true
    }
  }

  const next = () => {
    if (step < 3) setStep(step + 1)
  }

  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="px-6 pt-[env(safe-area-inset-top)] mt-4">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content area with slide animation */}
      <div className="flex-1 py-8 overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(calc(-${step} * 100vw))`, width: '400vw' }}
        >
          {/* Step 1 — 選藥物 */}
          <div className="w-screen shrink-0 px-6 overflow-y-auto">
            <h1 className="text-2xl font-serif italic text-[var(--color-deep)] mb-2">
              你使用哪種藥物？
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              選擇你正在使用的處方減重藥
            </p>

            <div className="space-y-3">
              {(Object.keys(MEDICATIONS) as MedicationType[]).map(type => {
                const m = MEDICATIONS[type]
                const selected = medType === type
                return (
                  <Card
                    key={type}
                    onClick={() => handleMedChange(type)}
                    className={`cursor-pointer transition-all ${
                      selected
                        ? '!shadow-[0_4px_20px_rgba(143,188,176,0.3)] ring-2 ring-[var(--color-sage)]'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{m.name}</h3>
                        <p className="text-sm text-[var(--color-muted)]">
                          {m.brandName} · {m.frequency === 'weekly' ? '每週注射' : '每日注射'}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected
                          ? 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white'
                          : 'border-[var(--color-border)]'
                      }`}>
                        {selected && <Check size={14} />}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Step 2 — 劑量與時間 */}
          <div className="w-screen shrink-0 px-6 overflow-y-auto">
            <h1 className="text-2xl font-serif italic text-[var(--color-deep)] mb-2">
              設定你的劑量與時間
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              你可以隨時在設定中調整
            </p>

            <div className="space-y-6">
              {/* Dose */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                  目前劑量 ({med.unit})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {med.doses.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDose(d)}
                      className={`py-2.5 rounded-2xl border text-sm transition-all ${
                        dose === d
                          ? 'bg-[var(--color-sage)] text-white border-[var(--color-sage)]'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                      }`}
                    >
                      {d}{med.unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Injection day */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                  {med.frequency === 'weekly' ? '每週注射日' : '注射頻率'}
                </label>
                {med.frequency === 'weekly' ? (
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInjectionDay(i)}
                        className={`aspect-square rounded-full text-sm transition-all flex items-center justify-center ${
                          injectionDay === i
                            ? 'bg-[var(--color-sage)] text-white'
                            : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-3 text-[var(--color-sage)] font-medium">
                    每天
                  </Card>
                )}
              </div>

              {/* Start date */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                  開始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-sage)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3 — 體重目標 */}
          <div className="w-screen shrink-0 px-6 overflow-y-auto">
            <h1 className="text-2xl font-serif italic text-[var(--color-deep)] mb-2">
              設定你的體重目標
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              目標體重和身高為選填，方便追蹤進度
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                  目前體重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="例如 75.0"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-sage)] outline-none text-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                  目標體重 (kg，選填)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="例如 65.0"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-sage)] outline-none text-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                  身高 (cm，選填)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="例如 170"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-sage)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 4 — 建立帳號 */}
          <div className="w-screen shrink-0 px-6 overflow-y-auto">
            <h1 className="text-2xl font-serif italic text-[var(--color-deep)] mb-2">
              建立帳號，安全保存
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              登入後資料會雲端同步，也可以稍後再說
            </p>

            <div className="space-y-4">
              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full card-monet p-4 flex items-center justify-center gap-3 transition-all hover:!shadow-[0_4px_20px_rgba(143,188,176,0.25)] active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium">使用 Google 登入</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-xs text-[var(--color-muted)]">或使用 Email</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="電子信箱"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-sage)] outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密碼（至少 6 位）"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-sage)] outline-none"
                />
                {authError && (
                  <p className="text-sm text-[var(--color-rose)]">{authError}</p>
                )}
                <Button
                  fullWidth
                  onClick={handleSignUp}
                  disabled={authLoading || !email || !password}
                  className="gap-2"
                >
                  <Mail size={18} />
                  建立帳號
                </Button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinish}
                  className="w-full text-center text-sm text-[var(--color-muted)] py-3 hover:text-[var(--color-deep)] transition-colors"
                >
                  先試用，稍後再登入
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 flex gap-3 bg-[var(--color-bg)]">
        {step > 0 && (
          <Button variant="ghost" onClick={prev} className="px-4">
            <ChevronLeft size={20} />
          </Button>
        )}
        {step < 3 ? (
          <Button
            fullWidth
            onClick={next}
            disabled={!canGoNext()}
            className="gap-2"
          >
            繼續
            <ChevronRight size={18} />
          </Button>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}
