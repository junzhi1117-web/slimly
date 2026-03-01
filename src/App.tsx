import { useState, useCallback, useEffect } from 'react'
import { HomePage } from './pages/HomePage'
import { LogPage } from './pages/LogPage'
import { WeightPage } from './pages/WeightPage'
import { ProfilePage } from './pages/ProfilePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { BottomNav } from './components/layout/BottomNav'
import { Header } from './components/layout/Header'
import { useLocalStorage } from './lib/supabase'
import { supabase } from './lib/supabase'
import { useAuth, useProfile, useDoseRecords, useWeightLogs, migrateLegacyData, syncLocalToSupabase } from './lib/db'
import type { UserProfile } from './types'

// Migrate old injection_logs → dose_records on first load
migrateLegacyData()

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [onboarded, setOnboarded] = useLocalStorage('slimly_onboarded', false)

  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const { profile, updateProfile } = useProfile(user, refreshKey)
  const { records: doseRecords, addRecord } = useDoseRecords(user, refreshKey)
  const { logs: weightLogs, addLog: addWeightLog } = useWeightLogs(user, refreshKey)

  // Handle OAuth callback: if user signed in via Google and has a profile, auto-complete onboarding
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && !onboarded) {
        // Check if this user already has a profile in Supabase
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingProfile && existingProfile.start_weight) {
          // Returning user — mark onboarded and skip onboarding
          setOnboarded(true)
          setRefreshKey(k => k + 1)
        }
        // If no complete profile, they'll continue onboarding (step 4 handler will save it)
      }
    })
    return () => subscription.unsubscribe()
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

  if (!onboarded) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="p-4">
            <Header title="纖記" />
            <HomePage
              profile={profile}
              doseRecords={doseRecords}
              weightLogs={weightLogs}
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
          />
        )
      case 'weight':
        return (
          <WeightPage
            logs={weightLogs}
            profile={profile}
            onAddLog={addWeightLog}
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
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
