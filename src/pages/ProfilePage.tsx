import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MedSelector } from '../components/medication/MedSelector'
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } from '../lib/supabase'
import type { UserProfile, MedicationType } from '../types'
import type { User } from '@supabase/supabase-js'
import { MEDICATIONS } from '../lib/medications'
import { Info, ChevronRight, ShieldCheck, LogIn, LogOut, Mail, X, Leaf } from 'lucide-react'

interface ProfilePageProps {
  profile: UserProfile
  onUpdateProfile: (profile: Partial<UserProfile>) => void
  user: User | null
  onLoginSync: () => Promise<void>
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onUpdateProfile, user, onLoginSync }) => {
  const { t, i18n } = useTranslation()
  const med = MEDICATIONS[profile.medicationType]
  const [showLogin, setShowLogin] = useState(false)

  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-TW'

  const handleLanguageChange = async (next: 'zh-TW' | 'en') => {
    await i18n.changeLanguage(next)
    localStorage.setItem('slimly_lang', next)
    document.documentElement.lang = next
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <Header title={t('profile.title')} />

      <main className="p-4 space-y-6">
        <section className="space-y-3">
          <h3 className="font-medium text-[var(--color-muted)] text-sm px-1">{t('profile.current_med')}</h3>
          <MedSelector
            selected={profile.medicationType}
            onSelect={(type) => onUpdateProfile({ medicationType: type as MedicationType })}
          />
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-[var(--color-muted)] text-sm px-1">{t('profile.progress')}</h3>
          <Card className="divide-y divide-[var(--color-border)] p-0">
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">{t('profile.start_date')}</span>
              <input
                type="date"
                value={profile.startDate}
                onChange={(e) => onUpdateProfile({ startDate: e.target.value })}
                className="text-sm text-[var(--color-sage)] font-semibold bg-transparent outline-none text-right"
              />
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">{t('profile.start_weight')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.startWeight}
                  onChange={(e) => onUpdateProfile({ startWeight: parseFloat(e.target.value) })}
                  className="text-sm text-[var(--color-sage)] font-semibold bg-transparent outline-none text-right w-16"
                />
                <span className="text-xs text-[var(--color-muted)]">kg</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">{t('profile.target_weight')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.targetWeight || ''}
                  onChange={(e) => onUpdateProfile({ targetWeight: parseFloat(e.target.value) })}
                  placeholder={t('profile.target_weight_unset')}
                  className="text-sm text-[var(--color-sage)] font-semibold bg-transparent outline-none text-right w-16"
                />
                <span className="text-xs text-[var(--color-muted)]">kg</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">{t('profile.current_dose')}</span>
              <select
                value={profile.currentDose}
                onChange={(e) => onUpdateProfile({ currentDose: parseFloat(e.target.value) })}
                className="text-sm text-[var(--color-sage)] font-semibold bg-transparent outline-none text-right"
              >
                {med.doses.map(d => (
                  <option key={d} value={d}>{d}{med.unit}</option>
                ))}
              </select>
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-[var(--color-muted)] text-sm px-1">{t('profile.language')}</h3>
          <Card className="p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('zh-TW')}
                className={`h-10 rounded-xl text-sm font-medium transition-colors ${
                  language === 'zh-TW'
                    ? 'bg-[var(--color-sage)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`}
              >
                繁體中文
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`h-10 rounded-xl text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-[var(--color-sage)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`}
              >
                English
              </button>
            </div>
          </Card>
        </section>

        {/* 停藥狀態 */}
        <section className="space-y-3">
          <h3 className="font-medium text-[var(--color-muted)] text-sm px-1">{t('profile.maintenance_label')}</h3>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${profile.maintenanceMode ? 'bg-[#EFF6F4] text-[#24342F]' : 'bg-[var(--color-sage-light)] text-[var(--color-sage)]'}`}>
                  <Leaf size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {profile.maintenanceMode ? t('profile.maintenance_mode_label') : t('profile.on_medication')}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {profile.maintenanceMode
                      ? t('profile.maintenance_stop_date', { date: profile.maintenanceStartDate ?? t('profile.maintenance_not_recorded') })
                      : t('profile.stop_med_prompt')}
                  </p>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => {
                  if (!profile.maintenanceMode) {
                    // 開啟：記錄今天為停藥日
                    const today = new Date().toISOString().split('T')[0]
                    onUpdateProfile({ maintenanceMode: true, maintenanceStartDate: today })
                  } else {
                    // 關閉：恢復用藥中
                    onUpdateProfile({ maintenanceMode: false, maintenanceStartDate: undefined })
                  }
                }}
                className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  profile.maintenanceMode ? 'bg-[#24342F]' : 'bg-[var(--color-border)]'
                }`}
                style={{ minWidth: '48px' }}
              >
                <span
                  className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 mt-0.5 ${
                    profile.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {profile.maintenanceMode && (
              <p className="text-xs text-[var(--color-muted)] mt-3 leading-relaxed">
                {t('profile.maintenance_tip')}
              </p>
            )}
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-[var(--color-muted)] text-sm px-1">{t('profile.education')}</h3>
          <Card className="p-0 overflow-hidden">
            <a href="/articles/dose-adjustment.html" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 w-full text-left hover:bg-[var(--color-sage-light)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-sage-light)] text-[var(--color-sage)] rounded-xl">
                  <Info size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t('profile.dose_adjustment')}</p>
                  <p className="text-xs text-[var(--color-muted)]">{t('profile.dose_adjustment_desc')}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[var(--color-muted)]" />
            </a>
            <div className="h-px bg-[var(--color-border)] mx-4"></div>
            <a href="/articles/mounjaro-side-effects.html" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 w-full text-left hover:bg-[var(--color-sage-light)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-rose-light)] text-[var(--color-rose)] rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t('profile.side_effect_guide')}</p>
                  <p className="text-xs text-[var(--color-muted)]">{t('profile.side_effect_guide_desc')}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[var(--color-muted)]" />
            </a>
          </Card>
        </section>

        {/* 帳號與同步 */}
        <section className="space-y-3">
          <h3 className="font-medium text-[var(--color-muted)] text-sm px-1">{t('profile.account')}</h3>
          {user ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-sage)] font-semibold text-sm">
                  {(user.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-[var(--color-sage)]">{t('profile.logged_in_sync')}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-rose)] transition-colors"
              >
                <LogOut size={16} />
                {t('profile.logout')}
              </button>
            </Card>
          ) : (
            <Card
              className="p-4 cursor-pointer flex items-center gap-3 transition-all active:scale-[0.98]"
              onClick={() => setShowLogin(true)}
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-sage)]">
                <LogIn size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{t('profile.login_prompt')}</p>
                <p className="text-xs text-[var(--color-muted)]">{t('profile.not_logged_in_desc')}</p>
              </div>
              <ChevronRight size={18} className="text-[var(--color-muted)]" />
            </Card>
          )}
        </section>

        <div className="pt-4 pb-8 text-center">
          <p className="text-xs text-[var(--color-muted)]">{t('profile.version_text')}</p>
          <p className="text-[10px] text-[var(--color-muted)] mt-1 opacity-60">
            {user ? t('profile.data_synced') : t('profile.data_local')}
          </p>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoginSync={onLoginSync}
        />
      )}
    </div>
  )
}

// ── Login Modal ────────────────────────────────────────

interface LoginModalProps {
  onClose: () => void
  onLoginSync: () => Promise<void>
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSync }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleEmailAuth = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')

    const { error: authError } = mode === 'login'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Sync localStorage data to Supabase
    setSyncing(true)
    await onLoginSync()
    setSyncing(false)
    setLoading(false)
    onClose()
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError('')
    const { error: authError } = await signInWithGoogle()
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
    // Google OAuth redirects, so modal will be gone after redirect
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-bg)] rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif italic text-[var(--color-deep)]">
            {mode === 'login' ? '登入帳號' : '建立帳號'}
          </h2>
          <button onClick={onClose} className="p-1 text-[var(--color-muted)]">
            <X size={20} />
          </button>
        </div>

        {syncing ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-sage)] font-medium">正在同步資料...</p>
            <p className="text-xs text-[var(--color-muted)] mt-2">將本地記錄上傳至雲端</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
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
              {error && (
                <p className="text-sm text-[var(--color-rose)]">{error}</p>
              )}
              <Button
                fullWidth
                onClick={handleEmailAuth}
                disabled={loading || !email || !password}
                className="gap-2"
              >
                <Mail size={18} />
                {mode === 'login' ? '登入' : '建立帳號'}
              </Button>
            </div>

            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full text-center text-sm text-[var(--color-muted)] py-2 hover:text-[var(--color-deep)] transition-colors"
            >
              {mode === 'login' ? '還沒有帳號？建立帳號' : '已有帳號？登入'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
