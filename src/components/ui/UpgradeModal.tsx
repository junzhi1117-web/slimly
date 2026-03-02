// Premium 升級提示 Modal
import React from 'react'
import { X, Sparkles, Camera, FileText, TrendingUp, Cloud } from 'lucide-react'
import { Button } from './Button'

interface UpgradeModalProps {
  onClose: () => void
  /** 哪個功能觸發了這個 Modal（顯示在標題） */
  featureName?: string
}

const PREMIUM_FEATURES = [
  { icon: Camera,    label: 'AI 拍照辨識食物熱量' },
  { icon: FileText,  label: '每月診療摘要 PDF 報告' },
  { icon: TrendingUp,label: '個人化藥代動力學曲線' },
  { icon: Cloud,     label: '雲端同步與備份' },
]

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, featureName }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
        <div className="bg-[var(--color-bg)] rounded-t-[2rem] p-6 pb-[max(2rem,env(safe-area-inset-bottom))]">

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-deep)] transition-colors"
          >
            <X size={20} />
          </button>

          {/* 標題 */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[var(--color-sage-light)] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} className="text-[var(--color-sage)]" />
            </div>
            <h2 className="text-xl font-serif italic text-[var(--color-deep)] mb-1">
              {featureName ? `「${featureName}」是 Premium 功能` : '升級 Slimly Premium'}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              解鎖全部進階功能，更完整地陪你走完這趟旅程
            </p>
          </div>

          {/* 功能列表 */}
          <div className="space-y-3 mb-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--color-sage-light)] rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[var(--color-sage)]" />
                </div>
                <span className="text-sm text-[var(--color-deep)]">{label}</span>
              </div>
            ))}
          </div>

          {/* 定價 */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-4 text-center border border-[var(--color-border)]">
            <p className="text-3xl font-semibold text-[var(--color-deep)]">
              NT$149
              <span className="text-base font-normal text-[var(--color-muted)] ml-1">/ 月</span>
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">隨時可取消</p>
          </div>

          {/* CTA */}
          <Button fullWidth className="h-14 text-base mb-3">
            立即升級 Premium
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-[var(--color-muted)] py-2"
          >
            稍後再說
          </button>
        </div>
      </div>
    </>
  )
}
