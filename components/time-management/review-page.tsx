'use client'

import { useState } from 'react'
import { Alert, Button, Card, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { TimeClient } from '@/lib/time-management/client'
import { timeClient } from '@/lib/time-management/client'
import ReflectionPanel from './reflection-panel'
import PushSettings from './push-settings'

type Metrics = { completion: { plan: boolean; time: boolean; reflection: boolean }; planVarianceMinutes: number; coreWorkRatio: number | null }
type Review = {
  keywords?: string[]; summary?: string; wins?: string[]; blockers?: string[]
  next_actions?: string[]; nextActions?: string[]; reflection_version?: number
}
type Reflection = { reflection_text?: string; version?: number }

const completionLabel = (completion: Metrics['completion']) => {
  const complete = [completion.plan && 'Plan', completion.time && 'time', completion.reflection && 'reflection'].filter(Boolean)
  const pending = [!completion.plan && 'plan', !completion.time && 'time', !completion.reflection && 'reflection'].filter(Boolean)
  return `${complete.length ? `${complete.join(' and ')} complete` : 'Nothing complete'}${pending.length ? `; ${pending.join(' and ')} pending` : ''}`
}

const varianceLabel = (minutes: number) => minutes === 0 ? 'On plan' : `${Math.abs(minutes)} minutes ${minutes < 0 ? 'under' : 'over'} plan`

function AiReview({ review }: { review: Review | null }) {
  if (!review) return <p className="rounded-lg bg-muted p-4 text-muted-foreground">No AI review is available yet.</p>
  const nextActions = review.next_actions ?? review.nextActions ?? []
  const sections = [
    ['Wins', review.wins ?? []],
    ['Blockers', review.blockers ?? []],
    ['Next actions', nextActions],
  ] as const
  return (
    <Card title="AI daily review">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">{(review.keywords ?? []).map((keyword) => <span key={keyword} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{keyword}</span>)}</div>
        {review.summary && <p>{review.summary}</p>}
        <div className="grid gap-3 md:grid-cols-3">{sections.map(([title, items]) => <section key={title} className="rounded-lg bg-muted p-3"><h3 className="font-bold">{title}</h3>{items.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">None recorded</p>}</section>)}</div>
      </div>
    </Card>
  )
}

export default function ReviewPage({ client = timeClient, online = true }: { client?: TimeClient; online?: boolean }) {
  const [historyDate, setHistoryDate] = useState('')
  const [history, setHistory] = useState<{ reflection: Reflection; review: Review | null } | null>(null)
  const [historyError, setHistoryError] = useState('')
  const reviewQuery = useQuery({
    queryKey: ['time-management', 'analytics', 'personal', 'today'],
    queryFn: () => client.get<{ metrics: Metrics; reflection: Reflection | null; review: Review | null }>('/analytics/personal/today'),
  })

  const loadHistory = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(historyDate)) return
    setHistoryError('')
    try {
      const result = await client.get<{ reflection: Reflection | null; review: Review | null }>(`/reflections/${historyDate}`)
      setHistory(result.reflection ? { reflection: result.reflection, review: result.review } : null)
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : 'Historical review could not be loaded.')
    }
  }

  const data = reviewQuery.data
  return (
    <section className="space-y-5">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Review</p><h1 className="text-2xl font-bold">Daily review</h1></div>
      {reviewQuery.isPending && <p role="status">Loading personal review…</p>}
      {reviewQuery.error && <Alert role="alert" type="error" showIcon message="Personal review could not be loaded." />}
      {data && <section aria-label="Daily metrics" className="grid gap-3 md:grid-cols-3">
        <Card title="Completion"><p>{completionLabel(data.metrics.completion)}</p></Card>
        <Card title="Plan variance"><p>{varianceLabel(data.metrics.planVarianceMinutes)}</p></Card>
        <Card title="Core-work ratio"><p>{data.metrics.coreWorkRatio === null ? 'No tracked time yet' : `${(data.metrics.coreWorkRatio * 100).toFixed(1)}% of tracked time`}</p></Card>
      </section>}
      <ReflectionPanel client={client} online={online} onReviewReady={() => void reviewQuery.refetch()} />
      <AiReview review={data?.review ?? null} />
      <Card title="Reflection history">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input aria-label="Review date" type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} className="min-h-11" />
            <Button className="min-h-11" onClick={() => void loadHistory()}>Load review date</Button>
          </div>
          {historyError && <p role="alert" className="text-destructive">{historyError}</p>}
          {history && <div className="space-y-3"><p className="text-sm font-semibold">Historical version {history.reflection.version ?? 1}</p><p>{history.reflection.reflection_text}</p><AiReview review={history.review} /></div>}
        </div>
      </Card>
      <PushSettings client={client} />
    </section>
  )
}
