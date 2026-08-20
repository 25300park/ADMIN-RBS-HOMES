'use client'

import { useCallback, useState } from 'react'

export const ACTIVE_TIMER_STORAGE_KEY = 'rbs:time-management:active-timer:v1'

export type CrmLink = {
  source: 'MYSQL_CRM'
  type: 'CONTACT' | 'LISTING' | 'LEAD' | 'DEAL'
  id: string
  label: string
}

export type ActiveTimerDisplay = {
  entryId: string
  categoryId: string
  startedAt: string
  crm?: CrmLink
}

function readStoredTimer(): ActiveTimerDisplay | null {
  if (typeof window === 'undefined') return null
  try {
    const value = localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY)
    return value ? JSON.parse(value) as ActiveTimerDisplay : null
  } catch {
    localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY)
    return null
  }
}

function normalizeEntry(entry: Record<string, unknown> | null): ActiveTimerDisplay | null {
  if (!entry) return null
  const entryId = String(entry.entryId ?? entry.id ?? '')
  const categoryId = String(entry.categoryId ?? entry.standardCategoryId ?? entry.standard_category_id ?? '')
  const startedAt = String(entry.startedAt ?? entry.started_at ?? '')
  if (!entryId || !categoryId || !startedAt) return null
  const directCrm = (entry.crm ?? entry.crmLink ?? entry.crm_link) as CrmLink | undefined
  const linkedType = entry.linked_entity_type as CrmLink['type'] | undefined
  const crm = directCrm ?? (
    entry.linked_entity_source === 'MYSQL_CRM' && linkedType && entry.linked_entity_id && entry.linked_entity_label
      ? {
          source: 'MYSQL_CRM' as const,
          type: linkedType,
          id: String(entry.linked_entity_id),
          label: String(entry.linked_entity_label),
        }
      : undefined
  )
  return { entryId, categoryId, startedAt, ...(crm ? { crm } : {}) }
}

export function useActiveTimeEntry() {
  const [timer, setTimer] = useState<ActiveTimerDisplay | null>(readStoredTimer)

  const replaceFromAuthoritative = useCallback((entry: Record<string, unknown> | null) => {
    const next = normalizeEntry(entry)
    setTimer(next)
    if (next) localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY)
  }, [])

  return { timer, replaceFromAuthoritative }
}
