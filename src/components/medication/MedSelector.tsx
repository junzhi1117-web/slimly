import React from 'react'
import type { MedicationType } from '../../types'
import { MEDICATIONS } from '../../lib/medications'
import { Card } from '../ui/Card'
import { Check } from 'lucide-react'

interface MedSelectorProps {
  selected: MedicationType
  onSelect: (type: MedicationType) => void
}

export const MedSelector: React.FC<MedSelectorProps> = ({ selected, onSelect }) => {
  const options = Object.values(MEDICATIONS)

  return (
    <div className="space-y-3">
      {options.map((med) => (
        <Card
          key={med.id}
          onClick={() => onSelect(med.id as MedicationType)}
          className={`cursor-pointer transition-all ${
            selected === med.id
              ? '!shadow-[0_4px_20px_rgba(143,188,176,0.3)] ring-2 ring-[var(--color-sage)]'
              : 'hover:!shadow-[0_4px_20px_rgba(143,188,176,0.2)]'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{med.name}</h3>
              <p className="text-sm text-[var(--color-muted)]">{med.brandName} · {med.manufacturer}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {med.frequency === 'weekly' ? '每週注射' : '每日注射'}
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected === med.id
                ? 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white'
                : 'border-[var(--color-border)]'
            }`}>
              {selected === med.id && <Check size={14} />}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
