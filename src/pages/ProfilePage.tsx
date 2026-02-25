import React from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { MedSelector } from '../components/medication/MedSelector'
import type { UserProfile, MedicationType } from '../types'
import { MEDICATIONS } from '../lib/medications'
import { Info, ChevronRight, ShieldCheck } from 'lucide-react'

interface ProfilePageProps {
  profile: UserProfile
  onUpdateProfile: (profile: Partial<UserProfile>) => void
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onUpdateProfile }) => {
  const med = MEDICATIONS[profile.medicationType]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <Header title="個人設定" />
      
      <main className="p-4 space-y-6">
        {/* User Info */}
        <section className="space-y-3">
          <h3 className="font-bold text-gray-400 text-sm px-1 uppercase tracking-wider">目前使用藥物</h3>
          <MedSelector 
            selected={profile.medicationType} 
            onSelect={(type) => onUpdateProfile({ medicationType: type as MedicationType })} 
          />
        </section>

        {/* Goals & Params */}
        <section className="space-y-3">
          <h3 className="font-bold text-gray-400 text-sm px-1 uppercase tracking-wider">個人進度與目標</h3>
          <Card className="divide-y divide-[var(--color-border)] p-0">
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">開始日期</span>
              <input 
                type="date" 
                value={profile.startDate}
                onChange={(e) => onUpdateProfile({ startDate: e.target.value })}
                className="text-sm text-[var(--color-primary)] font-bold bg-transparent outline-none text-right"
              />
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">起始體重</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={profile.startWeight}
                  onChange={(e) => onUpdateProfile({ startWeight: parseFloat(e.target.value) })}
                  className="text-sm text-[var(--color-primary)] font-bold bg-transparent outline-none text-right w-16"
                />
                <span className="text-xs text-gray-400">kg</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">目標體重</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={profile.targetWeight || ''}
                  onChange={(e) => onUpdateProfile({ targetWeight: parseFloat(e.target.value) })}
                  placeholder="未設定"
                  className="text-sm text-[var(--color-primary)] font-bold bg-transparent outline-none text-right w-16"
                />
                <span className="text-xs text-gray-400">kg</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium">目前劑量</span>
              <select 
                value={profile.currentDose}
                onChange={(e) => onUpdateProfile({ currentDose: parseFloat(e.target.value) })}
                className="text-sm text-[var(--color-primary)] font-bold bg-transparent outline-none text-right"
              >
                {med.doses.map(d => (
                  <option key={d} value={d}>{d}{med.unit}</option>
                ))}
              </select>
            </div>
          </Card>
        </section>

        {/* Info Section */}
        <section className="space-y-3">
          <h3 className="font-bold text-gray-400 text-sm px-1 uppercase tracking-wider">衛教與說明</h3>
          <Card className="p-0 overflow-hidden">
            <button className="flex justify-between items-center p-4 w-full text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                  <Info size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">劑量遞增說明</p>
                  <p className="text-xs text-gray-400">了解如何安全地增加劑量</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
            <div className="h-px bg-[var(--color-border)] mx-4"></div>
            <button className="flex justify-between items-center p-4 w-full text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">副作用應對指南</p>
                  <p className="text-xs text-gray-400">改善噁心、便秘等不適</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          </Card>
        </section>

        <div className="pt-4 pb-8 text-center">
          <p className="text-xs text-gray-400">纖記 Slimly v1.0.0</p>
          <p className="text-[10px] text-gray-300 mt-1">資料儲存於本地瀏覽器，請勿清除快取以免資料遺失</p>
        </div>
      </main>
    </div>
  )
}
