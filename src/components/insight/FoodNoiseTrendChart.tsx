import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import type { FoodNoiseLog } from '../../types'

interface FoodNoiseTrendChartProps {
  logs: FoodNoiseLog[]
  height?: number
}

export const FoodNoiseTrendChart: React.FC<FoodNoiseTrendChartProps> = ({ logs, height = 120 }) => {
  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14) // 最近 14 天
    .map(l => ({
      ...l,
      displayDate: format(parseISO(l.date), 'M/d'),
    }))

  if (data.length < 2) {
    return (
      <p className="text-center text-xs text-[var(--color-muted)] py-4">
        記錄 2 天以上即可查看趨勢
      </p>
    )
  }

  // Calculate simple trend: first half avg vs second half avg
  const half = Math.floor(data.length / 2)
  const firstAvg = data.slice(0, half).reduce((s, d) => s + d.level, 0) / half
  const secondAvg = data.slice(half).reduce((s, d) => s + d.level, 0) / (data.length - half)
  const improving = secondAvg < firstAvg - 0.5

  return (
    <div>
      {improving && (
        <p className="text-[10px] text-[#24342F] mb-1 text-center">
          🌿 食慾雜音正在減少，GLP-1 發揮作用了
        </p>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#5D706A' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[1, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#5D706A' }}
              ticks={[1, 5, 10]}
            />
            <ReferenceLine y={5} stroke="#E8E0D8" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(143,188,176,0.15)',
                background: '#FFFFFF',
                fontSize: '12px',
              }}
              formatter={(value: number | undefined) => [`${value ?? '-'} / 10`, '食慾雜音']}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#C9A0A8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#C9A0A8', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#8FBCB0' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
