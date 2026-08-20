'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Spin } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useActiveTimeEntry, type CrmLink } from '@/hooks/use-active-time-entry'
import { timeClient, type TimeClient, type TimeCommand } from '@/lib/time-management/client'
import { timeQueryKeys } from '@/lib/time-management/query-keys'
import CurrentTimerCard, { type TimeCategory } from './current-timer-card'
import DailyPlanCard, { type PlanAllocation } from './daily-plan-card'

type CategoriesResponse = { standard?: TimeCategory[]; data?: { standard?: TimeCategory[] } }
type PlanResponse = {
  plan?: { availableMinutes?: number; available_minutes?: number } | null
  allocations?: Array<PlanAllocation & { standard_category_id?: string; planned_minutes?: number }>
  data?: PlanResponse
}
type ReconcileResponse = {
  authoritativeEntry?: Record<string, unknown> | null
  authoritative_entry?: Record<string, unknown> | null
  data?: ReconcileResponse
}

type Props = {
  client?: TimeClient
  approvalActive?: boolean
}

const safeMessage = (error: unknown) => error instanceof Error ? error.message : 'Time-management request failed'

function unwrap<T extends { data?: T }>(value: T): T {
  return value.data ?? value
}

export default function TodayPage({ client = timeClient, approvalActive = true }: Props) {
  const { timer, replaceFromAuthoritative } = useActiveTimeEntry()
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(480)
  const [allocations, setAllocations] = useState<PlanAllocation[]>([])
  const [crmQuery, setCrmQuery] = useState('')
  const [crmResults, setCrmResults] = useState<CrmLink[]>([])
  const [selectedCrm, setSelectedCrm] = useState<CrmLink | null>(null)
  const [crmLoading, setCrmLoading] = useState(false)
  const [error, setError] = useState('')

  const categoriesQuery = useQuery({
    queryKey: timeQueryKeys.categories,
    queryFn: () => client.get<CategoriesResponse>('/categories'),
    enabled: approvalActive,
  })
  const planQuery = useQuery({
    queryKey: timeQueryKeys.todayPlan,
    queryFn: () => client.get<PlanResponse>('/plans/today'),
    enabled: approvalActive,
  })

  const categoriesPayload = categoriesQuery.data ? unwrap(categoriesQuery.data) : undefined
  const categories = useMemo(() => categoriesPayload?.standard ?? [], [categoriesPayload])
  const planPayload = planQuery.data ? unwrap(planQuery.data) : undefined
  const displayedEntryId = timer?.entryId
  const displayedStartedAt = timer?.startedAt

  useEffect(() => {
    if (!selectedCategoryId && categories[0]) setSelectedCategoryId(categories[0].id)
  }, [categories, selectedCategoryId])

  useEffect(() => {
    setSelectedCrm(timer?.crm ?? null)
    if (timer?.crm) {
      setCrmResults((current) => current.some((item) => item.type === timer.crm?.type && item.id === timer.crm?.id)
        ? current
        : [timer.crm!, ...current])
    }
  }, [timer])

  useEffect(() => {
    if (!planPayload) return
    const plan = planPayload.plan
    setAvailableMinutes(Number(plan?.availableMinutes ?? plan?.available_minutes ?? 480))
    setAllocations((planPayload.allocations ?? []).map((item) => ({
      standardCategoryId: item.standardCategoryId ?? item.standard_category_id ?? '',
      plannedMinutes: Number(item.plannedMinutes ?? item.planned_minutes ?? 0),
    })).filter((item) => item.standardCategoryId))
  }, [planPayload])

  const reconcile = useCallback(async () => {
    try {
      const result = unwrap(await client.post<ReconcileResponse>('/entries/timer/reconcile', {
        displayedEntryId: displayedEntryId ?? null,
        displayedStartedAt: displayedStartedAt ?? null,
      }))
      replaceFromAuthoritative(result.authoritativeEntry ?? result.authoritative_entry ?? null)
    } catch (cause) {
      setError(safeMessage(cause))
    }
  }, [client, displayedEntryId, displayedStartedAt, replaceFromAuthoritative])

  useEffect(() => {
    if (!approvalActive) return
    void reconcile()
    const handleOnline = () => void reconcile()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [approvalActive, reconcile])

  const timerMutation = useMutation({
    mutationFn: (command: TimeCommand<unknown>) => command(),
    retry: 1,
    retryDelay: 0,
    onMutate: () => setError(''),
    onSuccess: () => reconcile(),
    onError: (cause) => setError(safeMessage(cause)),
  })
  const planMutation = useMutation({
    mutationFn: () => client.put('/plans/today', { availableMinutes, allocations }),
    onMutate: () => setError(''),
    onError: (cause) => setError(safeMessage(cause)),
  })

  const searchCrm = async () => {
    setCrmLoading(true)
    setError('')
    try {
      const query = new URLSearchParams({ q: crmQuery.trim(), limit: '10' }).toString()
      const response = await client.get<{ data?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>(`/crm-links?${query}`)
      const rows = response.data ?? response.items ?? []
      const allowedTypes = new Set<CrmLink['type']>(['CONTACT', 'LISTING', 'LEAD', 'DEAL'])
      setCrmResults(rows.flatMap((row) => {
        const type = String(row.type ?? row.entityType ?? '') as CrmLink['type']
        const id = String(row.id ?? row.entityId ?? '')
        const label = String(row.label ?? '')
        return (row.source ?? 'MYSQL_CRM') === 'MYSQL_CRM' && allowedTypes.has(type) && id && label
          ? [{ source: 'MYSQL_CRM' as const, type, id, label }]
          : []
      }))
    } catch (cause) {
      setError(safeMessage(cause))
    } finally {
      setCrmLoading(false)
    }
  }

  if (!approvalActive) {
    return (
      <section className="rounded-xl border border-warning/40 bg-warning/10 p-6">
        <h1 className="text-xl font-bold">Approval required</h1>
        <p className="mt-2 text-muted-foreground">A CRM administrator must activate time management before these controls are available.</p>
      </section>
    )
  }

  if (categoriesQuery.isPending || planQuery.isPending) {
    return <div role="status" className="flex min-h-64 items-center justify-center gap-3"><Spin />Loading today’s work</div>
  }

  const queryError = categoriesQuery.error ?? planQuery.error
  if (queryError) {
    return <Alert type="error" showIcon message="Unable to load today’s work" description={safeMessage(queryError)} />
  }

  const pending = timerMutation.isPending
  const startOrSwitch = () => {
    if (!selectedCategoryId || pending) return
    const path = timer ? '/entries/timer/switch' : '/entries/timer/start'
    const body: Record<string, unknown> = { standardCategoryId: selectedCategoryId }
    if (selectedCrm) body.crmLink = selectedCrm
    timerMutation.mutate(client.createCommand(path, body))
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Today</p>
        <h1 className="text-2xl font-bold">Plan the day and track work as it happens</h1>
      </div>
      {error && <Alert role="alert" type="error" showIcon message={error} closable onClose={() => setError('')} />}
      <div className="grid gap-5 xl:grid-cols-2">
        <CurrentTimerCard
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          timer={timer}
          crmQuery={crmQuery}
          onCrmQueryChange={setCrmQuery}
          crmResults={crmResults}
          selectedCrm={selectedCrm}
          onCrmSelected={setSelectedCrm}
          onCrmSearch={() => void searchCrm()}
          crmLoading={crmLoading}
          pending={pending}
          onStartOrSwitch={startOrSwitch}
          onStop={() => timerMutation.mutate(client.createCommand('/entries/timer/stop'))}
        />
        <DailyPlanCard
          categories={categories}
          availableMinutes={availableMinutes}
          allocations={allocations}
          hasPlan={Boolean(planPayload?.plan)}
          pending={planMutation.isPending}
          onAvailableMinutesChange={setAvailableMinutes}
          onAllocationChange={(categoryId, value) => setAllocations((current) => [
            ...current.filter((item) => item.standardCategoryId !== categoryId),
            { standardCategoryId: categoryId, plannedMinutes: value },
          ])}
          onSave={() => planMutation.mutate()}
        />
      </div>
    </section>
  )
}
