import React, { useState } from 'react'
import type { MedicationType, InjectionSite, SideEffectType, DoseRecord, SideEffectEntry } from '../../types'
import { MEDICATIONS, INJECTION_SITE_LABELS, SIDE_EFFECT_LABELS } from '../../lib/medications'
import { Button } from '../ui/Button'
import { Check } from 'lucide-react'

const SITE_EMOJI: Record<InjectionSite, string> = {
  'abdomen-left': '🫃←',
  'abdomen-right': '🫃→',
  'thigh-left': '🦵←',
  'thigh-right': '🦵→',
  'arm-left': '💪←',
  'arm-right': '💪→',
}

interface InjectionFormProps {
  medicationType: MedicationType
  onSave: (log: Omit<DoseRecord, 'id'>) => void
  onCancel: () => void
  suggestedSite?: InjectionSite
  currentDose: number
}

export const InjectionForm: React.FC<InjectionFormProps> = ({
  medicationType,
  onSave,
  onCancel,
  suggestedSite = 'abdomen-left',
  currentDose
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dose, setDose] = useState(currentDose)
  const [site, setSite] = useState<InjectionSite>(suggestedSite)
  const [selectedSideEffects, setSelectedSideEffects] = useState<SideEffectEntry[]>([])
  const [notes, setNotes] = useState('')

  const med = MEDICATIONS[medicationType]

  const toggleSideEffect = (type: SideEffectType) => {
    setSelectedSideEffects(prev => {
      const exists = prev.find(se => se.type === type)
      if (exists) {
        return prev.filter(se => se.type !== type)
      } else {
        return [...prev, { type, severity: 1 as const }]
      }
    })
  }

  const updateSeverity = (type: SideEffectType, severity: 1 | 2 | 3) => {
    setSelectedSideEffects(prev => prev.map(se => se.type === type ? { ...se, severity } : se))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      date,
      medication: medicationType,
      dose,
      route: med.route,
      injectionSite: site,
      notes,
      sideEffects: selectedSideEffects
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">注射日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-monet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">劑量 ({med.unit})</label>
          <div className="grid grid-cols-3 gap-2">
            {med.doses.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDose(d)}
                className={`py-2.5 rounded-full border font-medium text-sm transition-all ${
                  dose === d
                    ? 'bg-[var(--color-sage)] text-white border-[var(--color-sage)] shadow-sm'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-deep)] hover:border-[var(--color-sage)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">注射部位</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(INJECTION_SITE_LABELS) as InjectionSite[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSite(s)}
                className={`py-3 px-3 rounded-2xl border text-sm flex items-center gap-2 transition-all ${
                  site === s
                    ? 'bg-[var(--color-sage-light)] border-[var(--color-sage)] text-[var(--color-deep)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-deep)] hover:border-[var(--color-sage)]'
                }`}
              >
                <span className="text-base">{SITE_EMOJI[s]}</span>
                <span className="flex-1 text-left">{INJECTION_SITE_LABELS[s]}</span>
                {site === s && <Check size={16} className="text-[var(--color-sage)]" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">副作用記錄</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(SIDE_EFFECT_LABELS) as SideEffectType[]).map(type => {
              const isSelected = selectedSideEffects.some(se => se.type === type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleSideEffect(type)}
                  className={`px-3.5 py-1.5 rounded-full text-sm border transition-all ${
                    isSelected
                      ? 'bg-[var(--color-rose-light)] text-[var(--color-rose)] border-[var(--color-rose)] font-medium'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-rose)]'
                  }`}
                >
                  {SIDE_EFFECT_LABELS[type]}
                </button>
              )
            })}
          </div>

          {selectedSideEffects.length > 0 && (
            <div className="space-y-3 mt-4">
              {selectedSideEffects.map(se => (
                <div key={se.type} className="flex items-center justify-between card-rose p-3">
                  <span className="text-sm font-medium">{SIDE_EFFECT_LABELS[se.type]}</span>
                  <div className="flex gap-1">
                    {([1, 2, 3] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateSeverity(se.type, level)}
                        className={`w-8 h-8 rounded-xl text-xs flex items-center justify-center transition-all ${
                          se.severity === level
                            ? 'bg-[var(--color-rose)] text-white'
                            : 'bg-[var(--color-bg)] text-[var(--color-muted)]'
                        }`}
                      >
                        {level === 1 ? '輕' : level === 2 ? '中' : '重'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">備註</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="記錄心情或特別狀況..."
            className="input-monet h-24 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>取消</Button>
        <Button type="submit" variant="primary" fullWidth>儲存記錄</Button>
      </div>
    </form>
  )
}
