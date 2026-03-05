import React from 'react'
import { AlertCircle, BellRing, ChevronRight, Info } from 'lucide-react'
import type { SmartReminder } from '../../lib/smartReminders'

interface SmartRemindersCardProps {
  reminders: SmartReminder[]
  onAction: (tab: string) => void
}

function levelConfig(level: SmartReminder['level']) {
  switch (level) {
    case 'alert':
      return {
        Icon: AlertCircle,
        dot: 'bg-[#C9A0A8]',
        text: 'text-[#7A4B56]',
        border: 'border-[#E7C7CE]',
      }
    case 'warning':
      return {
        Icon: BellRing,
        dot: 'bg-[#E8D5B8]',
        text: 'text-[#7A6446]',
        border: 'border-[#E8D5B8]',
      }
    default:
      return {
        Icon: Info,
        dot: 'bg-[#8FBCB0]',
        text: 'text-[#2D5B52]',
        border: 'border-[#BFD6D1]',
      }
  }
}

export const SmartRemindersCard: React.FC<SmartRemindersCardProps> = ({ reminders, onAction }) => {
  if (reminders.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-[var(--color-deep)]">智慧提醒</h3>
        <span className="text-[10px] text-[var(--color-muted)]">P1</span>
      </div>

      <div className="space-y-2">
        {reminders.map((reminder) => {
          const cfg = levelConfig(reminder.level)
          const Icon = cfg.Icon

          return (
            <div
              key={reminder.id}
              className={`rounded-2xl border ${cfg.border} bg-[var(--color-surface)] p-3`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-1 size-2 rounded-full ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon size={14} className={cfg.text} />
                    <p className="text-sm font-semibold text-[var(--color-deep)]">{reminder.title}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-muted)]">{reminder.body}</p>

                  {reminder.cta && reminder.actionTab && (
                    <button
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sage)]"
                      onClick={() => onAction(reminder.actionTab!)}
                    >
                      {reminder.cta}
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
