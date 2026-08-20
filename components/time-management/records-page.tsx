'use client'

import { useMemo, useState } from 'react'
import { Alert, Button, Card, Input } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { TimeClient, TimeCommand } from '@/lib/time-management/client'
import { timeClient } from '@/lib/time-management/client'

type Category = { id: string; name: string }
type Revision = { id: string; entryId: string; changedAt: string; changedFields: string[]; changedBySelf: boolean }
type Entry = {
  id: string
  standard_category_id: string
  started_at: string
  ended_at: string | null
  notes: string | null
  linked_entity_source?: string | null
  linked_entity_type: string | null
  linked_entity_id: string | null
  linked_entity_label: string | null
  revisions: Revision[]
}

type Props = { client?: TimeClient; online?: boolean; now?: () => Date }
const defaultNow = () => new Date()

export function businessDateInSeoul(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export default function RecordsPage({ client = timeClient, online = true, now = defaultNow }: Props) {
  const businessDate = useMemo(() => businessDateInSeoul(now()), [now])
  const [entries, setEntries] = useState<Entry[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const [manualConfirming, setManualConfirming] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionConfirming, setRevisionConfirming] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const categoriesQuery = useQuery({
    queryKey: ['time-management', 'categories'],
    queryFn: () => client.get<{ standard: Category[] }>('/categories'),
  })
  const entriesQuery = useQuery({
    queryKey: ['time-management', 'entries', businessDate],
    queryFn: async () => {
      const result = await client.get<{ entries: Entry[] }>(`/entries?businessDate=${businessDate}`)
      setEntries(result.entries)
      return result
    },
  })
  const categories = categoriesQuery.data?.standard ?? []
  const selectedCategoryId = categoryId || categories[0]?.id || ''

  const mutation = useMutation({
    mutationFn: (command: TimeCommand<unknown>) => command(),
    retry: 1,
    retryDelay: 0,
    onMutate: () => { setError(''); setMessage('') },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Record change could not be saved.'),
  })

  const saveManual = () => {
    if (!online || !selectedCategoryId || mutation.isPending) return
    if (!manualConfirming) return setManualConfirming(true)
    const endedAt = now()
    const startedAt = new Date(endedAt.getTime() - 30 * 60 * 1000)
    mutation.mutate(client.createCommand('/entries/manual', {
      standardCategoryId: selectedCategoryId,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    }), {
      onSuccess: () => {
        setManualOpen(false)
        setManualConfirming(false)
        setMessage('Manual entry saved.')
      },
    })
  }

  const saveRevision = () => {
    if (!editing || !online || mutation.isPending) return
    if (!revisionConfirming) return setRevisionConfirming(true)
    const notes = revisionNotes.trim()
    mutation.mutate(client.createMutation('PATCH', `/entries/${editing.id}`, { notes }), {
      onSuccess: () => {
        setEntries((current) => current.map((entry) => entry.id === editing.id ? { ...entry, notes } : entry))
        setEditing(null)
        setRevisionConfirming(false)
        setMessage('Record revision saved.')
      },
    })
  }

  const loading = categoriesQuery.isPending || entriesQuery.isPending
  const loadError = categoriesQuery.error ?? entriesQuery.error

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Records</p><h1 className="text-2xl font-bold">Recorded work</h1></div>
        <Button className="min-h-11" type="primary" onClick={() => { setManualOpen(true); setManualConfirming(false) }}>Add manual entry</Button>
      </div>
      {!online && <Alert type="warning" showIcon message="Offline: record changes are unavailable." />}
      {message && <p role="status" className="rounded-lg bg-success/10 p-3 text-success">{message}</p>}
      {(error || loadError) && <Alert role="alert" type="error" showIcon message={error || 'Records could not be loaded.'} />}
      {loading && <p role="status">Loading records…</p>}

      {manualOpen && (
        <Card title="Manual entry">
          <div className="space-y-3">
            <label className="block space-y-2"><span className="text-sm font-semibold">Category</span>
              <select aria-label="Manual category" value={selectedCategoryId} onChange={(event) => setCategoryId(event.target.value)} className="min-h-11 w-full rounded-lg border border-input px-3">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">Creates a 30-minute entry ending now. Confirm before saving.</p>
            <Button className="min-h-11" type="primary" disabled={!online || !selectedCategoryId} loading={mutation.isPending} onClick={saveManual}>
              {manualConfirming ? 'Confirm manual entry' : 'Save manual entry'}
            </Button>
          </div>
        </Card>
      )}

      {editing && (
        <Card title="Revise record">
          <div className="space-y-3">
            <label className="block space-y-2"><span className="text-sm font-semibold">Revision notes</span>
              <Input.TextArea aria-label="Revision notes" maxLength={5000} rows={5} value={revisionNotes} onChange={(event) => setRevisionNotes(event.target.value)} />
            </label>
            <p className="text-sm text-muted-foreground">Confirm before replacing the saved note.</p>
            <Button className="min-h-11" type="primary" disabled={!online} loading={mutation.isPending} onClick={saveRevision}>
              {revisionConfirming ? 'Confirm revision' : 'Save revision'}
            </Button>
          </div>
        </Card>
      )}

      {!loading && entries.length === 0 && <p className="rounded-lg bg-muted p-4 text-muted-foreground">No records for this business date.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {entries.map((entry) => (
          <Card key={entry.id} title={businessDateInSeoul(new Date(entry.started_at))}>
            <div className="space-y-2">
              <p>{entry.notes || 'No notes'}</p>
              {entry.linked_entity_label && <p className="font-semibold">{entry.linked_entity_label}</p>}
              {entry.linked_entity_id && <p className="text-sm text-muted-foreground">CRM link unavailable; showing stored snapshot.</p>}
              <p className="text-sm text-muted-foreground">{entry.revisions.length} {entry.revisions.length === 1 ? 'revision' : 'revisions'}</p>
              {entry.revisions.length > 0 && <ol aria-label="Revisions" className="space-y-2">{entry.revisions.map((revision) => (
                <li key={revision.id} className="rounded-lg bg-muted p-3 text-sm">
                  <time dateTime={revision.changedAt}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(revision.changedAt))}</time>
                  <p>{revision.changedBySelf ? 'Changed by you' : 'Changed by another authorized user'}</p>
                  <p>Changed fields: {revision.changedFields.join(', ') || 'No field summary available'}</p>
                </li>
              ))}</ol>}
              <Button className="min-h-11" onClick={() => { setEditing(entry); setRevisionNotes(entry.notes || ''); setRevisionConfirming(false) }}>Edit record</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
