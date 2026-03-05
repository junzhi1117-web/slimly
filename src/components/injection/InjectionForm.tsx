import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MedicationType, InjectionSite, DoseRecord } from '../../types'
import { MEDICATIONS } from '../../lib/medications'
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

const SITE_KEYS: InjectionSite[] = [
  'abdomen-left', 'abdomen-right',
  'thigh-left', 'thigh-right',
  'arm-left', 'arm-right',
]

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
  const { t } = useTranslation()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dose, setDose] = useState(currentDose)
  const [site, setSite] = useState<InjectionSite>(suggestedSite)
  const [notes, setNotes] = useState('')

  const med = MEDICATIONS[medicationType]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      date,
      medication: medicationType,
      dose,
      route: med.route,
      injectionSite: site,
      notes,
      sideEffects: [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">{t('injection.date_label')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-monet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">{t('injection.dose_label', { unit: med.unit })}</label>
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
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">{t('injection.site_label')}</label>
          <p className="text-xs text-[var(--color-muted)] mb-2">
            {t('injection.suggested_site')}<span className="text-[var(--color-sage)] font-medium">{t('injection_site.' + suggestedSite)}</span>{t('injection.auto_rotate')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SITE_KEYS.map(s => (
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
                <span className="flex-1 text-left">{t('injection_site.' + s)}</span>
                {site === s && <Check size={16} className="text-[var(--color-sage)]" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">{t('injection.notes_label')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('injection.notes_placeholder')}
            className="input-monet h-20 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" fullWidth>{t('injection.save')}</Button>
      </div>
    </form>
  )
}
