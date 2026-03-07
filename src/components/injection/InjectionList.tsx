import React from 'react'
import type { DoseRecord } from '../../types'
import { MEDICATIONS, INJECTION_SITE_LABELS, SIDE_EFFECT_LABELS } from '../../lib/medications'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Syringe, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface InjectionListProps {
  logs: DoseRecord[]
  onRemove?: (id: string) => void
}

export const InjectionList: React.FC<InjectionListProps> = ({ logs, onRemove }) => {
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
                    {log.sideEffects.map((se: unknown, idx: number) => {
                      if (typeof se === 'string') {
                        // 處理舊版資料結構（單純字串陣列）
                        const typeKey = se as import('../../types').SideEffectType
                        return (
                          <Badge key={`${log.id}-${se}-${idx}`} variant="rose" className="text-[10px]">
                            {SIDE_EFFECT_LABELS[typeKey] || se}
                          </Badge>
                        )
                      }
                      // 處理新版資料結構（物件帶有 type 與 severity）
                      const entry = se as import('../../types').SideEffectEntry
                      return (
                        <Badge key={`${log.id}-${entry.type}`} variant="rose" className="text-[10px]">
                          {SIDE_EFFECT_LABELS[entry.type]} {entry.severity === 3 ? '!!!' : entry.severity === 2 ? '!!' : '!'}
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {log.notes && (
                  <p className="text-xs text-[var(--color-muted)] mt-3 italic border-l-2 border-[var(--color-gold)] pl-2">
                    {log.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onRemove && (
                  <button
                    onClick={() => onRemove(log.id)}
                    className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-rose)] transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <div className="bg-[var(--color-sage-light)] p-2 rounded-full">
                  <Syringe size={20} className="text-[var(--color-sage)]" />
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
