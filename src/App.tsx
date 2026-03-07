import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HomePage } from './pages/HomePage'
import { LogPage } from './pages/LogPage'
import { WeightPage } from './pages/WeightPage'
import { NutritionPage } from './pages/NutritionPage'
import { ReportPage } from './pages/ReportPage'
import { ProfilePage } from './pages/ProfilePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { BottomNav } from './components/layout/BottomNav'
import { Header } from './components/layout/Header'
import { useLocalStorage } from './lib/supabase'
import { supabase } from './lib/supabase'
import { useAuth, useProfile, useDoseRecords, useWeightLogs, useNutritionLogs, migrateLegacyData, syncLocalToSupabase } from './lib/db'
import type { UserProfile } from './types'

// Migrate old injection_logs → dose_records on first load
migrateLegacyData()

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const { i18n, t } = useTranslation()
  const [onboarded, setOnboarded] = useLocalStorage('slimly_onboarded', false)
  const [isCheckingAccount, setIsCheckingAccount] = useState(true)

  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const { profile, updateProfile } = useProfile(user, refreshKey)
  const { records: doseRecords, addRecord, removeRecord } = useDoseRecords(user, refreshKey)
  const { logs: weightLogs, addLog: addWeightLog, removeLog: removeWeightLog } = useWeightLogs(user, refreshKey)
  const { entries: nutritionEntries, addEntry: addNutritionEntry, removeEntry: removeNutritionEntry } = useNutritionLogs(user, refreshKey)

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'zh-TW'
  }, [i18n.resolvedLanguage])

  // Handle OAuth callback and initial load: check if user is already onboarded on Supabase
  useEffect(() => {
    let mounted = true

    const checkSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user && !onboarded) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingProfile && existingProfile.start_weight && mounted) {
          setOnboarded(true)
          setRefreshKey(k => k + 1)
        }
      }
      if (mounted) {
        setIsCheckingAccount(false)
      }
    }

    checkSessionAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && !onboarded) {
        if (mounted) setIsCheckingAccount(true)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingProfile && existingProfile.start_weight && mounted) {
          // Returning user — mark onboarded and skip onboarding
          setOnboarded(true)
          setRefreshKey(k => k + 1)
        }
        if (mounted) setIsCheckingAccount(false)
      }
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [onboarded, setOnboarded])

  const handleOnboardingComplete = useCallback((newProfile: UserProfile) => {
    updateProfile(newProfile)
    setOnboarded(true)
  }, [updateProfile, setOnboarded])

  const handleLoginSync = useCallback(async () => {
    const currentUser = user
    if (currentUser) {
      await syncLocalToSupabase(currentUser.id)
      setRefreshKey(k => k + 1)
    }
  }, [user])

  if (isCheckingAccount && !onboarded) {
    // Show a blank loading screen while we determine if they need onboarding
    return <div className="min-h-screen bg-[var(--color-bg)]" />
  }

  if (!onboarded) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />
  }

  const today = new Date().toISOString().split('T')[0]
  const hasTodayLog = doseRecords.some(r => r.date === today)
  const hasTodayWeight = weightLogs.some(w => w.date === today)
  const badges = {
    log: !hasTodayLog && !profile.maintenanceMode,
    weight: !hasTodayWeight,
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="p-4">
            <Header title={t('app.title')} />
            <HomePage
              profile={profile}
              doseRecords={doseRecords}
              weightLogs={weightLogs}
              nutritionEntries={nutritionEntries}
              onAction={setActiveTab}
            />
          </div>
        )
      case 'log':
        return (
          <LogPage
            logs={doseRecords}
            profile={profile}
            onAddLog={addRecord}
            onRemoveLog={removeRecord}
          />
        )
      case 'weight':
        return (
          <WeightPage
            logs={weightLogs}
            profile={profile}
            onAddLog={addWeightLog}
            onRemoveLog={removeWeightLog}
          />
        )
      case 'nutrition':
        return (
          <NutritionPage
            entries={nutritionEntries}
            profile={profile}
            weightLogs={weightLogs}
            onAddEntry={addNutritionEntry}
            onRemoveEntry={removeNutritionEntry}
          />
        )
      case 'report':
        return (
          <ReportPage
            profile={profile}
            doseRecords={doseRecords}
            weightLogs={weightLogs}
            userId={user?.id}
          />
        )
      case 'profile':
        return (
          <ProfilePage
            profile={profile}
            onUpdateProfile={updateProfile}
            user={user}
            onLoginSync={handleLoginSync}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-md mx-auto bg-[var(--color-bg)] min-h-screen pb-20">
      {renderPage()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} maintenanceMode={profile.maintenanceMode} badges={badges} />
    </div>
  )
}

export default App
