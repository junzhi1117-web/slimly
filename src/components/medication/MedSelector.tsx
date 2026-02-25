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
          onClick={() => onSelect(med.id)}
          className={`cursor-pointer transition-all ${
            selected === med.id 
              ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' 
              : 'hover:border-[var(--color-primary-light)]'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{med.name}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{med.brandName} · {med.manufacturer}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
              selected === med.id 
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' 
                : 'border-[var(--color-border)] bg-gray-50'
            }`}>
              {selected === med.id && <Check size={14} />}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
