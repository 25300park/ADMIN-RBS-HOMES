'use client'

import { Alert, Card } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { TimeClient } from '@/lib/time-management/client'
import { timeClient } from '@/lib/time-management/client'

type Metrics = { completion: { plan: boolean; time: boolean }; planVarianceMinutes: number; coreWorkRatio: number | null }
type Summary = { user: { id: string; name: string }; metrics: Metrics }
const dateFor = (now: Date) => now.toISOString().slice(0, 10)
const variance = (minutes: number) => minutes === 0 ? 'On plan' : `${Math.abs(minutes)} minutes ${minutes < 0 ? 'under' : 'over'} plan`

export default function AdminSummaryPage({ client = timeClient, now = () => new Date() }: { client?: TimeClient; now?: () => Date }) {
  const businessDate = dateFor(now())
  const members = useQuery({
    queryKey: ['time-management', 'admin', 'summary', businessDate],
    queryFn: async () => {
      const data = await client.get<Summary[] | { members: Summary[] }>(`/analytics/admin/members/${businessDate}`)
      return Array.isArray(data) ? data : data.members
    },
  })
  const keywords = useQuery({
    queryKey: ['time-management', 'admin', 'team-keywords', businessDate],
    queryFn: () => client.post<{ status: string; contributorCount: number; keywords: Array<{ keyword: string; contributorCount: number }> }>('/analytics/admin/team-keywords', { periodStart: businessDate, periodEnd: businessDate }),
  })
  return <section className="space-y-5">
    <div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Administration</p><h1 className="text-2xl font-bold">Team time summary</h1></div>
    {(members.isPending || keywords.isPending) && <p role="status">Loading team summary…</p>}
    {(members.error || keywords.error) && <Alert role="alert" type="error" showIcon message="Team summary could not be loaded." />}
    <section aria-label="Member completion summary" className="grid gap-3 md:grid-cols-2">
      {(members.data ?? []).map((member) => <Card key={member.user.id} title={member.user.name}><div className="space-y-2"><p>{member.metrics.completion.plan && member.metrics.completion.time ? 'Plan and time complete' : 'Plan or time pending'}</p><p>{variance(member.metrics.planVarianceMinutes)}</p><p>{member.metrics.coreWorkRatio === null ? 'No tracked time' : `${(member.metrics.coreWorkRatio * 100).toFixed(1)}% core work`}</p></div></Card>)}
    </section>
    <Card title="Team keywords"><div className="space-y-2">{keywords.data?.status === 'INSUFFICIENT_DATA' ? <p>Team keywords require at least three contributors.</p> : (keywords.data?.keywords ?? []).map((item) => <span key={item.keyword} className="mr-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{item.keyword} · {item.contributorCount}</span>)}</div></Card>
  </section>
}
