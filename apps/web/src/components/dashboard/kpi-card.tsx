// components/dashboard/kpi-card.tsx

interface Props {
  label:     string
  value:     number | string
  icon:      string
  sublabel?: string
  accent?:   boolean
}

export function KpiCard({ label, value, icon, sublabel, accent }: Props) {
  return (
    <div className={[
      'relative rounded-2xl border p-5 overflow-hidden transition-shadow duration-200',
      'hover:shadow-[0_8px_32px_-12px_rgba(24,20,16,0.15)]',
      accent
        ? 'bg-[var(--fg-primary)] border-[var(--fg-primary)]'
        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]',
    ].join(' ')}>

      {/* Background glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: accent
            ? 'radial-gradient(600px 180px at 0% 0%, rgba(167,122,69,0.25), transparent 60%)'
            : 'radial-gradient(600px 180px at 0% 0%, rgba(167,122,69,0.08), transparent 60%)',
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className={[
            'text-[11px] font-mono uppercase tracking-[0.18em]',
            accent ? 'text-white/60' : 'text-[var(--fg-muted)]',
          ].join(' ')}>
            {label}
          </p>
          <span className="text-xl">{icon}</span>
        </div>

        <div className={[
          'font-display text-[32px] leading-none font-bold tracking-tight',
          accent ? 'text-white' : 'text-[var(--fg-primary)]',
        ].join(' ')}>
          {value}
        </div>

        {sublabel && (
          <p className={[
            'text-[12px] mt-2',
            accent ? 'text-white/50' : 'text-[var(--fg-muted)]',
          ].join(' ')}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}
