import React, { useState } from 'react'
import type { WeightLog } from '../../types'
import { Button } from '../ui/Button'

interface WeightFormProps {
  onSave: (log: Omit<WeightLog, 'id'>) => void
  onCancel: () => void
  initialWeight?: number
}

export const WeightForm: React.FC<WeightFormProps> = ({ onSave, onCancel, initialWeight }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState(initialWeight?.toString() || '')
  const [waist, setWaist] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return
    onSave({
      date,
      weight: parseFloat(weight),
      waist: waist ? parseFloat(waist) : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">記錄日期</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">體重 (kg)</label>
          <input 
            type="number" 
            step="0.1"
            value={weight} 
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
            className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-2xl font-bold"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">腰圍 (cm，選填)</label>
          <input 
            type="number" 
            step="0.1"
            value={waist} 
            onChange={(e) => setWaist(e.target.value)}
            placeholder="0.0"
            className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>取消</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!weight}>儲存體重</Button>
      </div>
    </form>
  )
}
