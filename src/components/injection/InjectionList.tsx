import React from 'react'
import type { DoseRecord } from '../../types'
import { MEDICATIONS, INJECTION_SITE_LABELS, SIDE_EFFECT_LABELS } from '../../lib/medications'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Syringe } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface InjectionListProps {
  logs: DoseRecord[]
}

export const InjectionList: React.FC<InjectionListProps> = ({ logs }) => {
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-muted)]">
        <Syringe size={48} className="mx-auto mb-4 opacity-20" />
        <p>還沒有注射記錄，今天是個好的開始 🌿</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedLogs.map((log) => {
        const med = MEDICATIONS[log.medication as keyof typeof MEDICATIONS]
        return (
          <Card key={log.id} className="relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold">{format(parseISO(log.date), 'MM/dd', { locale: zhTW })}</span>
                  <span className="text-sm text-[var(--color-muted)]">({format(parseISO(log.date), 'EEEE', { locale: zhTW })})</span>
                  <Badge variant="sage">{med.name} {log.dose}{med.unit}</Badge>
                </div>
                <p className="text-sm text-[var(--color-muted)] mb-2">
                  部位：{INJECTION_SITE_LABELS[log.injectionSite!]}
                </p>

                {log.sideEffects && log.sideEffects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {log.sideEffects.map(se => (
                      <Badge key={se.type} variant="rose" className="text-[10px]">
                        {SIDE_EFFECT_LABELS[se.type]} {se.severity === 3 ? '!!!' : se.severity === 2 ? '!!' : '!'}
                      </Badge>
                    ))}
                  </div>
                )}

                {log.notes && (
                  <p className="text-xs text-[var(--color-muted)] mt-3 italic border-l-2 border-[var(--color-gold)] pl-2">
                    {log.notes}
                  </p>
                )}
              </div>
              <div className="bg-[var(--color-sage-light)] p-2 rounded-full">
                <Syringe size={20} className="text-[var(--color-sage)]" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
