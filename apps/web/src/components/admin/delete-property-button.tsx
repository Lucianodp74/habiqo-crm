'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProperty } from '@/lib/actions/delete-property'

interface Props {
  propertyId:    string
  propertyTitle: string
  redirectAfter?: boolean
}

export function DeletePropertyButton({ propertyId, propertyTitle, redirectAfter = false }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, start]            = useTransition()
  const [error, setError]             = useState('')
  const router = useRouter()

  function handleDelete() {
    setError('')
    start(async () => {
      const result = await deleteProperty(propertyId)
      if (result.ok) {
        if (redirectAfter) {
          router.push('/admin/properties')
        } else {
          router.refresh()
        }
      } else {
        setError(result.error ?? 'Errore eliminazione')
        setShowConfirm(false)
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--fg-muted)]">Eliminare?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1 text-[12px] font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Sì'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="px-3 py-1 text-[12px] font-medium border border-[var(--border-subtle)] text-[var(--fg-secondary)] rounded-lg hover:bg-[var(--bg-elevated)]"
        >
          No
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      title={`Elimina "${propertyTitle}"`}
      className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
