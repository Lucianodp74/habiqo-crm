// app/dashboard/loading.tsx
// Skeleton mostrato durante il caricamento della dashboard

export default function DashboardLoading() {
  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto animate-pulse">

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-3 w-32 bg-[var(--bg-sunken)] rounded mb-3" />
        <div className="h-9 w-48 bg-[var(--bg-sunken)] rounded mb-2" />
        <div className="h-3 w-64 bg-[var(--bg-sunken)] rounded" />
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 h-28" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 h-52" />

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] h-64" />
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] h-48" />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] h-40" />
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] h-36" />
        </div>
      </div>
    </div>
  )
}
