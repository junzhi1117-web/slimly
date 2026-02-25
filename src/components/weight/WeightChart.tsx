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
      <div className="flex items-center justify-center bg-gray-50 rounded-2xl" style={{ height }}>
        <p className="text-[var(--color-text-muted)]">尚無體重記錄</p>
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} 
          />
          <YAxis 
            domain={[minWeight, maxWeight]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="var(--color-primary)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: 'var(--color-primary)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
