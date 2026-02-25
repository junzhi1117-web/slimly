import React, { useState } from 'react'
import type { MedicationType, InjectionSite, SideEffectType, InjectionLog, SideEffectEntry } from '../../types'
import { MEDICATIONS, INJECTION_SITE_LABELS, SIDE_EFFECT_LABELS } from '../../lib/medications'
import { Button } from '../ui/Button'
import { Check } from 'lucide-react'

interface InjectionFormProps {
  medicationType: MedicationType
  onSave: (log: Omit<InjectionLog, 'id'>) => void
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
        return [...prev, { type, severity: 1 }]
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
      site,
      notes,
      sideEffects: selectedSideEffects
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">注射日期</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">劑量 ({med.unit})</label>
          <div className="grid grid-cols-3 gap-2">
            {med.doses.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDose(d)}
                className={`py-2 rounded-xl border transition-all ${
                  dose === d 
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                    : 'bg-white border-[var(--color-border)] text-[var(--color-text)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">注射部位</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(INJECTION_SITE_LABELS) as InjectionSite[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSite(s)}
                className={`py-3 px-2 rounded-xl border text-sm flex items-center justify-between ${
                  site === s 
                    ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]' 
                    : 'bg-white border-[var(--color-border)] text-[var(--color-text)]'
                }`}
              >
                {INJECTION_SITE_LABELS[s]}
                {site === s && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">副作用記錄</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(SIDE_EFFECT_LABELS) as SideEffectType[]).map(type => {
              const isSelected = selectedSideEffects.some(se => se.type === type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleSideEffect(type)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    isSelected 
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' 
                      : 'bg-white border-[var(--color-border)] text-[var(--color-text-muted)]'
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
                <div key={se.type} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[var(--color-border)]">
                  <span className="text-sm font-medium">{SIDE_EFFECT_LABELS[se.type]}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateSeverity(se.type, level as 1|2|3)}
                        className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all ${
                          se.severity === level 
                            ? 'bg-[var(--color-accent)] text-white' 
                            : 'bg-gray-100 text-gray-400'
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
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">備註</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="記錄心情或特別狀況..."
            className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none h-24 resize-none"
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
