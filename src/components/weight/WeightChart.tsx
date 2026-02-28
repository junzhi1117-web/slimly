import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeightLog } from '../../types'
import { format, parseISO } from 'date-fns'

interface WeightChartProps {
  logs: WeightLog[]
  height?: number
}

export const WeightChart: React.FC<WeightChartProps> = ({ logs, height = 300 }) => {
  const data = [...logs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      ...log,
      displayDate: format(parseISO(log.date), 'MM/dd')
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-2xl" style={{ height }}>
        <p className="text-[var(--color-muted)]">還沒有體重記錄</p>
      </div>
    )
  }

  const weights = data.map(d => d.weight)
  const minWeight = Math.floor(Math.min(...weights) - 1)
  const maxWeight = Math.ceil(Math.max(...weights) + 1)

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(143,188,176,0.2)" />
          <XAxis
            dataKey="displayDate"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9BB5B0' }}
          />
          <YAxis
            domain={[minWeight, maxWeight]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9BB5B0' }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(143,188,176,0.15)',
              background: '#FFFFFF',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#5C7A74' }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#8FBCB0"
            strokeWidth={3}
            dot={{ r: 4, fill: '#8FBCB0', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#5C7A74' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
