// Premium 升級提示 Modal
import React from 'react'
import { X, Sparkles, Camera, FileText, TrendingUp, Cloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface UpgradeModalProps {
  onClose: () => void
  /** 哪個功能觸發了這個 Modal（顯示在標題） */
  featureName?: string
}

const PREMIUM_FEATURES = [
  { icon: FileText, key: 'clinic_report' },
  { icon: TrendingUp, key: 'plain_summary' },
  { icon: Camera, key: 'continuous_tracking' },
  { icon: Cloud, key: 'cloud_backup' },
] as const

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, featureName }) => {
  const { t } = useTranslation()

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
              {featureName
                ? t('premium.title_feature', { feature: featureName })
                : t('premium.title_default')}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {t('premium.subtitle')}
            </p>
          </div>

          {/* 功能列表 */}
          <div className="space-y-3 mb-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--color-sage-light)] rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[var(--color-sage)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-deep)] font-medium">{t(`premium.value_points.${key}.title`)}</p>
                  <p className="text-xs text-[var(--color-muted)]">{t(`premium.value_points.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 定價 */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-4 text-center border border-[var(--color-border)]">
            <p className="text-3xl font-semibold text-[var(--color-deep)]">
              {t('premium.price')}
              <span className="text-base font-normal text-[var(--color-muted)] ml-1">{t('premium.price_unit')}</span>
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">{t('premium.cancel_anytime')}</p>
          </div>

          {/* CTA */}
          <Button fullWidth className="h-14 text-base mb-2">
            {t('premium.primary_cta')}
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-[var(--color-sage)] py-2"
          >
            {t('premium.secondary_cta')}
          </button>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-[var(--color-muted)] py-2"
          >
            {t('premium.later')}
          </button>
        </div>
      </div>
    </>
  )
}
