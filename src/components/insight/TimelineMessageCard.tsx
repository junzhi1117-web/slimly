import React, { useState } from 'react'
import { X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import type { TimelineMessage } from '../../lib/timelineMessages'

interface TimelineMessageCardProps {
  message: TimelineMessage
  onDismiss: (id: string) => void
}

export const TimelineMessageCard: React.FC<TimelineMessageCardProps> = ({
  message,
  onDismiss
}) => {
  const [expanded, setExpanded] = useState(false)

  const bodyLines = message.body.split('\n\n')
  const previewText = bodyLines[0]
  const hasMore = bodyLines.length > 1

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8D5B8' }}
    >
      {/* 頂部色帶 */}
      <div style={{ height: 4, backgroundColor: '#8FBCB0' }} />

      <div className="p-4">
        {/* 標題列 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-base font-semibold leading-snug flex-1"
            style={{ color: '#5C7A74', fontFamily: '"Noto Serif TC", serif' }}
          >
            {message.title}
          </h3>
          <button
            onClick={() => onDismiss(message.id)}
            className="flex-shrink-0 rounded-full p-1 transition-colors"
            style={{ color: '#5C7A74' }}
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>

        {/* 主文 */}
        <div
          className="text-sm leading-relaxed mb-2"
          style={{ color: '#4a4a4a', fontFamily: '"Noto Sans TC", sans-serif' }}
        >
          <p>{previewText}</p>

          {expanded && hasMore && (
            <div className="mt-2 space-y-2">
              {bodyLines.slice(1).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* 展開/收起 */}
        {hasMore && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs mb-3 transition-opacity hover:opacity-70"
            style={{ color: '#8FBCB0', fontFamily: '"Noto Sans TC", sans-serif' }}
          >
            {expanded ? (
              <><ChevronUp size={14} /> 收起</>
            ) : (
              <><ChevronDown size={14} /> 繼續閱讀</>
            )}
          </button>
        )}

        {/* 安全提醒 */}
        {expanded && (
          <div
            className="flex items-start gap-2 rounded-xl p-3 mt-1"
            style={{ backgroundColor: '#EDE9E4' }}
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#C9A0A8' }} />
            <p
              className="text-xs leading-relaxed"
              style={{ color: '#7a6a6a', fontFamily: '"Noto Sans TC", sans-serif' }}
            >
              {message.safetyNote}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
