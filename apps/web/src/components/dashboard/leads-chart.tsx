'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface ChartPoint {
  date:  string
  count: number
}

interface Props {
  data: ChartPoint[]
}

function CustomTooltip({ active, payload, label }: {
  active?:  boolean
  payload?: { value: number }[]
  label?:   string
}) {
  if (!active || !payload?.length || !payload[0]) return null
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg px-3 py-2">
      <p className="text-[11px] text-[var(--fg-muted)] mb-1">{label}</p>
      <p className="text-[15px] font-semibold text-[var(--fg-primary)]">
        {payload[0].value} lead
      </p>
    </div>
  )
}

export function LeadsChart({ data }: Props) {
  const hasData = data.some(d => d.count > 0)

  if (!hasData) {
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="text-[13px] text-[var(--fg-muted)] italic">Nessun lead negli ultimi 30 giorni.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a67c52" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#a67c52" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(0,0,0,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--fg-muted)' }}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--fg-muted)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a67c52', strokeWidth: 1, strokeDasharray: '4 2' }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#a67c52"
          strokeWidth={2}
          fill="url(#leadGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#a67c52', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}


