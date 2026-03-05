import React, { useState } from 'react'
import type { DoseRecord, SideEffectEntry, SideEffectType } from '../../types'
import { MEDICATIONS, INJECTION_SITE_LABELS } from '../../lib/medications'
import { Button } from '../ui/Button'
import { ChevronRight } from 'lucide-react'

type Feeling = 'great' | 'meh' | 'bad'

const SYMPTOM_LIST: { type: SideEffectType; label: string }[] = [
  { type: 'nausea',         label: '噁心' },
  { type: 'vomiting',       label: '嘔吐' },
  { type: 'fatigue',        label: '疲倦' },
  { type: 'dizziness',      label: '頭暈' },
  { type: 'constipation',   label: '便秘' },
  { type: 'diarrhea',       label: '腹瀉' },
  { type: 'appetite_loss',  label: '食慾下降' },
  { type: 'other',          label: '其他' },
]

interface PostInjectionCheckInProps {
  record: DoseRecord
  onComplete: (sideEffects: SideEffectEntry[]) => void
  onSkip: () => void
}

export const PostInjectionCheckIn: React.FC<PostInjectionCheckInProps> = ({
  record,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<'feeling' | 'symptoms' | 'done'>('feeling')
  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<SideEffectType>>(new Set())
  const [severity, setSeverity] = useState<1 | 2 | 3>(1)

  const med = MEDICATIONS[record.medication as keyof typeof MEDICATIONS]
  const siteName = INJECTION_SITE_LABELS[record.injectionSite!] ?? ''

  // ── Feeling step ────────────────────────────────────────────────
  const handleFeelingSelect = (f: Feeling) => {
    setFeeling(f)
    if (f === 'great') {
      // No symptoms, save empty side effects
      onComplete([])
    } else {
      setStep('symptoms')
    }
  }

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

  const handleSymptomsSubmit = () => {
    const entries: SideEffectEntry[] = Array.from(selectedTypes).map(type => ({
      type,
      severity,
    }))
    onComplete(entries)
  }

  // ── Feeling step UI ─────────────────────────────────────────────
  if (step === 'feeling') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8 text-center">
        {/* Confirmation banner */}
        <div className="w-full bg-[var(--color-sage-light)] rounded-3xl p-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-sage)] flex items-center justify-center text-white text-xl">
            ✨
          </div>
          <div className="text-left">
            <p className="font-semibold text-[var(--color-deep)] text-sm">注射記錄已儲存</p>
            <p className="text-xs text-[var(--color-muted)]">
              {med.name} {record.dose}{med.unit} · {siteName}
            </p>
          </div>
        </div>

        <h2 className="font-serif text-2xl text-[var(--color-deep)] mb-2">
          打完針，感覺怎樣？
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          點一下就好，幫你追蹤身體的適應狀況
        </p>

        {/* Three feeling buttons */}
        <div className="flex gap-4 w-full max-w-xs mb-10">
          {([
            { f: 'great' as Feeling, emoji: '😊', label: '沒什麼\n特別' },
            { f: 'meh'   as Feeling, emoji: '😐', label: '有點\n不適' },
            { f: 'bad'   as Feeling, emoji: '🤢', label: '很不\n舒服' },
          ]).map(({ f, emoji, label }) => (
            <button
              key={f}
              onClick={() => handleFeelingSelect(f)}
              className={`flex-1 flex flex-col items-center justify-center py-5 rounded-3xl border-2 gap-2 transition-all active:scale-95 ${
                feeling === f
                  ? 'border-[var(--color-sage)] bg-[var(--color-sage-light)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-sage)]'
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-xs text-[var(--color-deep)] whitespace-pre-line leading-tight text-center">
                {label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onSkip}
          className="text-sm text-[var(--color-muted)] flex items-center gap-1"
        >
          跳過，之後再說 <ChevronRight size={14} />
        </button>
      </div>
    )
  }

  // ── Symptoms step UI ────────────────────────────────────────────
  if (step === 'symptoms') {
    return (
      <div className="pb-20">
        <div className="text-center py-6 px-4">
          <h2 className="font-serif text-2xl text-[var(--color-deep)] mb-1">
            哪裡不舒服？
          </h2>
          <p className="text-sm text-[var(--color-muted)]">可以多選</p>
        </div>

        {/* Symptom chips */}
        <div className="flex flex-wrap gap-2 px-4 mb-6">
          {SYMPTOM_LIST.map(({ type, label }) => {
            const selected = selectedTypes.has(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleSymptom(type)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${
                  selected
                    ? 'bg-[var(--color-rose-light)] text-[var(--color-rose)] border-[var(--color-rose)] font-medium'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Severity — only show if at least one selected */}
        {selectedTypes.size > 0 && (
          <div className="mx-4 mb-6">
            <p className="text-sm font-medium text-[var(--color-muted)] mb-3">整體感受</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 1 as const, label: '輕度', desc: '有點感覺' },
                { val: 2 as const, label: '中度', desc: '明顯不舒服' },
                { val: 3 as const, label: '重度', desc: '相當難受' },
              ]).map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSeverity(val)}
                  className={`py-3 rounded-2xl border text-center transition-all ${
                    severity === val
                      ? 'bg-[var(--color-rose-light)] border-[var(--color-rose)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${severity === val ? 'text-[var(--color-rose)]' : 'text-[var(--color-deep)]'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onSkip}
          >
            跳過
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleSymptomsSubmit}
            disabled={selectedTypes.size === 0}
          >
            記錄完成
          </Button>
        </div>
      </div>
    )
  }

  return null
}
