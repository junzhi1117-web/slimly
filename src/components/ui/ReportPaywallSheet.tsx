import React from 'react'
import { X, FileText, Activity, ShieldCheck } from 'lucide-react'
import { Button } from './Button'

interface ReportPaywallSheetProps {
  onClose: () => void
  onPrimaryAction: () => void
  onSecondaryAction: () => void
  variant: 'A' | 'B'
}

const COPY = {
  A: {
    title: '回診前 1 分鐘，報告自動整理好',
    subtitle: '少講 10 分鐘，醫師更快掌握你的狀況',
    cta: '升級 Pro，解鎖完整報告',
  },
  B: {
    title: '每次回診，都有重點可說',
    subtitle: '把零碎紀錄變成醫師看得懂的摘要',
    cta: '開始使用 Pro',
  },
} as const

export const ReportPaywallSheet: React.FC<ReportPaywallSheetProps> = ({
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  variant,
}) => {
  const copy = COPY[variant]

  return (
    <>
      <div className="fixed inset-0 bg-black/35 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-up">
        <div className="bg-[var(--color-bg)] rounded-t-[2rem] p-6 pb-[max(2rem,env(safe-area-inset-bottom))] relative">
          <button onClick={onClose} className="absolute top-5 right-5 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-deep)] transition-colors">
            <X size={20} />
          </button>

          <div className="mb-6 text-center">
            <p className="text-eyebrow mb-2">Slimly Pro</p>
            <h2 className="text-xl font-serif text-[var(--color-deep)] mb-1 leading-snug">{copy.title}</h2>
            <p className="text-sm text-[var(--color-muted)]">{copy.subtitle}</p>
          </div>

          <div className="space-y-3 mb-5">
            {[
              { icon: FileText, title: '完整診間摘要', desc: '白話 + 專業重點，一眼看懂' },
              { icon: Activity, title: '一鍵匯出 PDF', desc: '回診可直接分享給醫師' },
              { icon: ShieldCheck, title: '歷史報告回看', desc: '持續追蹤更清楚' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-sage-light)] text-[var(--color-sage)] flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-deep)]">{title}</p>
                  <p className="text-xs text-[var(--color-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 text-center mb-4">
            <p className="text-3xl text-[var(--color-deep)] font-semibold">
              NT$149
              <span className="text-base font-normal text-[var(--color-muted)] ml-1">/ 月</span>
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">可隨時取消</p>
          </div>

          <Button fullWidth className="h-14 text-base mb-2" onClick={onPrimaryAction}>
            {copy.cta}
          </Button>
          <button onClick={onSecondaryAction} className="w-full text-sm text-[var(--color-sage)] py-2">
            先看看免費版
          </button>
          <p className="text-[11px] text-center text-[var(--color-muted)] pt-1">你的資料僅用於個人健康追蹤，不對外公開。</p>
        </div>
      </div>
    </>
  )
}
