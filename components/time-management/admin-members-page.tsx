'use client'

import { useMemo, useState } from 'react'
import { Alert, Button, Card, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { TimeClient } from '@/lib/time-management/client'
import { timeClient } from '@/lib/time-management/client'

type DirectoryMember = { externalUserId: string; name: string; level: number; timeRole: 'admin' | 'agent' }
type Mapping = { externalUserId: string; role: 'admin' | 'agent'; isActive: boolean }
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

async function requestUpdate(fetchImpl: FetchLike, externalUserId: string, isActive: boolean) {
  const response = await fetchImpl(`/api/time-management/admin/members/${externalUserId}`, {
    method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ isActive }),
  })
  if (!response.ok) throw new Error('Member access could not be updated.')
  return response.json() as Promise<{ isActive: boolean }>
}

export default function AdminMembersPage({ client = timeClient, fetchImpl = fetch }: { client?: TimeClient; fetchImpl?: FetchLike }) {
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<DirectoryMember | null>(null)
  const [error, setError] = useState('')
  const [updatedStates, setUpdatedStates] = useState<Record<string, boolean>>({})
  const directory = useQuery({
    queryKey: ['time-management', 'admin', 'member-directory', query],
    queryFn: () => client.get<{ data: DirectoryMember[] }>(`/admin/member-directory?q=${encodeURIComponent(query)}&limit=50`),
  })
  const externalUserIds = useMemo(() => directory.data?.data.map((member) => member.externalUserId) ?? [], [directory.data])
  const mappings = useQuery({
    queryKey: ['time-management', 'admin', 'member-mappings', externalUserIds],
    enabled: externalUserIds.length > 0,
    queryFn: () => client.get<{ members: Mapping[] }>(`/members?externalUserIds=${externalUserIds.join(',')}`),
  })
  const mappingByExternalId = new Map((mappings.data?.members ?? []).map((member) => [member.externalUserId, member]))
  const isActive = (externalUserId: string) => updatedStates[externalUserId] ?? mappingByExternalId.get(externalUserId)?.isActive === true

  const confirm = async () => {
    if (!pending) return
    setError('')
    try {
      const nextActive = !isActive(pending.externalUserId)
      await requestUpdate(fetchImpl, pending.externalUserId, nextActive)
      setUpdatedStates((states) => ({ ...states, [pending.externalUserId]: nextActive }))
      setPending(null)
      await mappings.refetch()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Member access could not be updated.') }
  }

  return <section className="space-y-5">
    <div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Administration</p><h1 className="text-2xl font-bold">Time access members</h1></div>
    <Card title="Eligible CRM members">
      <div className="space-y-4">
        <Input aria-label="Search CRM members" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name" className="min-h-11" />
        {(directory.isPending || mappings.isPending) && <p role="status">Loading members…</p>}
        {(directory.error || mappings.error || error) && <Alert role="alert" type="error" showIcon message="Member access could not be loaded or updated." />}
        <div className="space-y-3">
          {(directory.data?.data ?? []).map((member) => {
            const active = isActive(member.externalUserId)
            const action = active ? 'Deactivate' : 'Activate'
            return <article key={member.externalUserId} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-bold">{member.name}</h2><p className="text-sm text-muted-foreground">CRM #{member.externalUserId} · {member.timeRole}</p></div>
              <div className="flex items-center gap-3"><span className={active ? 'font-semibold text-primary' : 'text-muted-foreground'}>{active ? 'Active' : mappings.isSuccess ? 'Not activated' : 'Loading status'}</span><Button className="min-h-11" onClick={() => setPending(member)} aria-label={`${action} ${member.name}`}>{action}</Button></div>
            </article>
          })}
        </div>
      </div>
    </Card>
    {pending && <Card title={isActive(pending.externalUserId) ? 'Deactivate member' : 'Activate member'}>
      <div className="space-y-3"><p>{isActive(pending.externalUserId) ? 'Access will be removed; existing time records will be retained.' : `Grant time-management access to ${pending.name}.`}</p><div className="flex gap-2"><Button onClick={() => setPending(null)}>Cancel</Button><Button type="primary" onClick={() => void confirm()}>{isActive(pending.externalUserId) ? 'Confirm deactivation' : 'Confirm activation'}</Button></div></div>
    </Card>}
  </section>
}
