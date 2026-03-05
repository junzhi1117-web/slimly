import React, { useState } from 'react'
import type { DoseRecord, SideEffectEntry, SideEffectType } from '../../types'
import { MEDICATIONS, INJECTION_SITE_LABELS } from '../../lib/medications'
import { X } from 'lucide-react'
import { differenceInHours, format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

const SYMPTOM_LIST: { type: SideEffectType; label: string }[] = [
  { type: 'nausea',        label: '噁心' },
  { type: 'vomiting',      label: '嘔吐' },
  { type: 'fatigue',       label: '疲倦' },
  { type: 'dizziness',     label: '頭暈' },
  { type: 'constipation',  label: '便秘' },
  { type: 'diarrhea',      label: '腹瀉' },
  { type: 'appetite_loss', label: '食慾下降' },
  { type: 'other',         label: '其他' },
]


interface PostInjectionCheckInBannerProps {
  record: DoseRecord
  onComplete: (id: string, sideEffects: SideEffectEntry[]) => void
  onDismiss: () => void
}

type Step = 'feeling' | 'symptoms'

export const PostInjectionCheckInBanner: React.FC<PostInjectionCheckInBannerProps> = ({
  record,
  onComplete,
  onDismiss,
}) => {
  const [step, setStep] = useState<Step>('feeling')
  const [selectedTypes, setSelectedTypes] = useState<Set<SideEffectType>>(new Set())
  const [severity, setSeverity] = useState<1 | 2 | 3>(1)

  const med = MEDICATIONS[record.medication as keyof typeof MEDICATIONS]
  const hours = differenceInHours(new Date(), parseISO(record.date))
  const timeLabel = hours < 24
    ? `${hours} 小時前`
    : format(parseISO(record.date), 'M/d (eee)', { locale: zhTW })

  const toggleSymptom = (type: SideEffectType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleFeelingGreat = () => {
    // No side effects — save empty array
    onComplete(record.id, [])
  }

  const handleFeelingBad = () => {
    setStep('symptoms')
  }

  const handleSymptomsSubmit = () => {
    const entries: SideEffectEntry[] = Array.from(selectedTypes).map(type => ({
      type,
      severity,
    }))
    onComplete(record.id, entries)
  }

  return (
    <div className="mx-0 mb-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-xs text-[var(--color-muted)]">{timeLabel}的注射</p>
          <p className="text-sm font-semibold text-[var(--color-deep)]">
            {med.name} {record.dose}{med.unit}
            {record.injectionSite && (
              <span className="font-normal text-[var(--color-muted)]">
                {' '}· {INJECTION_SITE_LABELS[record.injectionSite]}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label="關閉"
        >
          <X size={16} />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)] mx-4" />

      {step === 'feeling' && (
        <div className="px-4 py-4">
          <p className="text-sm text-[var(--color-deep)] mb-3">
            注射後感覺怎樣？
          </p>
          <div className="flex gap-3">
            {/* 沒事 */}
            <button
              onClick={handleFeelingGreat}
              className="flex-1 flex flex-col items-center py-3 rounded-2xl bg-[var(--color-sage-light)] border border-[var(--color-sage)] gap-1 active:scale-95 transition-all"
            >
              <span className="text-2xl">😊</span>
              <span className="text-xs text-[var(--color-deep)]">沒什麼特別</span>
            </button>

            {/* 有些不適 */}
            <button
              onClick={handleFeelingBad}
              className="flex-1 flex flex-col items-center py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] gap-1 active:scale-95 transition-all"
            >
              <span className="text-2xl">😐</span>
              <span className="text-xs text-[var(--color-muted)]">有些不舒服</span>
            </button>

            {/* 很不舒服 */}
            <button
              onClick={handleFeelingBad}
              className="flex-1 flex flex-col items-center py-3 rounded-2xl bg-[var(--color-rose-light)] border border-[var(--color-border)] gap-1 active:scale-95 transition-all"
            >
              <span className="text-2xl">🤢</span>
              <span className="text-xs text-[var(--color-muted)]">很不舒服</span>
            </button>
          </div>
        </div>
      )}

      {step === 'symptoms' && (
        <div className="px-4 py-4 space-y-4">
          {/* Symptom chips */}
          <div>
            <p className="text-sm text-[var(--color-deep)] mb-2">哪裡不舒服？（可多選）</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_LIST.map(({ type, label }) => {
                const selected = selectedTypes.has(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleSymptom(type)}
                    className={`px-3.5 py-1.5 rounded-full text-sm border transition-all ${
                      selected
                        ? 'bg-[var(--color-rose-light)] text-[var(--color-rose)] border-[var(--color-rose)] font-medium'
                        : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity — only if symptoms selected */}
          {selectedTypes.size > 0 && (
            <div>
              <p className="text-sm text-[var(--color-deep)] mb-2">整體感受</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: 1 as const, label: '輕度', sub: '有點感覺' },
                  { val: 2 as const, label: '中度', sub: '明顯不適' },
                  { val: 3 as const, label: '重度', sub: '很難受' },
                ]).map(({ val, label, sub }) => (
                  <button
                    key={val}
                    onClick={() => setSeverity(val)}
                    className={`py-2.5 rounded-2xl border text-center transition-all ${
                      severity === val
                        ? 'bg-[var(--color-rose-light)] border-[var(--color-rose)]'
                        : 'bg-[var(--color-bg)] border-[var(--color-border)]'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${severity === val ? 'text-[var(--color-rose)]' : 'text-[var(--color-deep)]'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-2xl border border-[var(--color-border)] text-sm text-[var(--color-muted)]"
            >
              跳過
            </button>
            <button
              onClick={handleSymptomsSubmit}
              disabled={selectedTypes.size === 0}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                selectedTypes.size > 0
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'bg-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed'
              }`}
            >
              記錄完成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
