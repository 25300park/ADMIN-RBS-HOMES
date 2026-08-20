'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Card, Input } from 'antd'
import type { TimeClient } from '@/lib/time-management/client'
import { timeClient } from '@/lib/time-management/client'

type AiState = 'idle' | 'processing' | 'completed' | 'failed' | 'error'
type Props = { client?: Pick<TimeClient, 'get' | 'put' | 'post'>; online?: boolean; onReviewReady?: () => void }

function stateFromStatus(status: unknown): AiState | null {
  if (status === 'PROCESSING') return 'processing'
  if (status === 'COMPLETED') return 'completed'
  if (status === 'FAILED') return 'failed'
  return null
}

export default function ReflectionPanel({ client = timeClient, online = true, onReviewReady }: Props) {
  const [text, setText] = useState('')
  const [version, setVersion] = useState<number | null>(null)
  const [state, setState] = useState<AiState>('idle')

  useEffect(() => {
    let cancelled = false
    void Promise.allSettled([
      client.get<{ reflection?: { reflection_text?: string; version?: number } | null; review?: unknown }>('/reflections/today'),
      client.get<{ status?: string }>('/reflections/today/status'),
    ]).then(([reflectionResult, statusResult]) => {
      if (cancelled) return
      if (reflectionResult.status === 'fulfilled') {
        const reflection = reflectionResult.value.reflection
        if (reflection?.reflection_text) setText(reflection.reflection_text)
        if (Number.isInteger(reflection?.version)) setVersion(reflection!.version!)
        if (reflectionResult.value.review) setState('completed')
      }
      if (statusResult.status === 'fulfilled') {
        const next = stateFromStatus(statusResult.value.status)
        if (next) setState(next)
      }
    })
    return () => { cancelled = true }
  }, [client])

  useEffect(() => {
    if (state !== 'processing') return
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const result = await client.get<{ status?: string }>('/reflections/today/status')
        if (cancelled) return
        const next = stateFromStatus(result.status)
        if (next === 'completed') {
          setState('completed')
          onReviewReady?.()
          return
        }
        if (next === 'failed') return setState('failed')
      } catch {
        // A later bounded poll can still recover the authoritative state.
      }
      attempts += 1
      if (!cancelled && attempts < 5) timer = setTimeout(poll, Math.min(250 * 2 ** attempts, 2000))
    }
    timer = setTimeout(poll, 250)
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [client, onReviewReady, state])

  const applySaveResult = (result: { reflection?: { version?: number }; ai?: { status?: string } }) => {
    if (Number.isInteger(result.reflection?.version)) setVersion(result.reflection!.version!)
    const next = stateFromStatus(result.ai?.status) ?? 'processing'
    setState(next)
    if (next === 'completed') onReviewReady?.()
  }

  const save = async () => {
    if (!online || !text.trim()) return
    setState('idle')
    try {
      applySaveResult(await client.put('/reflections/today', { reflectionText: text.trim() }))
    } catch {
      setState('error')
    }
  }

  const retry = async () => {
    if (!online) return
    try {
      applySaveResult(await client.post('/reflections/today/retry', {}))
    } catch {
      setState('failed')
    }
  }

  return (
    <Card title="Daily reflection" id="reflection">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Capture preparation, wins, blockers, plan variance, and tomorrow’s next action.</p>
        <label className="block space-y-2"><span className="text-sm font-semibold">Daily reflection</span>
          <Input.TextArea aria-label="Daily reflection" maxLength={5000} rows={9} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{version ? `Version ${version}` : 'Not saved yet'}</span><span>{text.length} / 5000 characters</span>
        </div>
        {!online && <Alert type="warning" showIcon message="Offline: reflections are not queued. Reconnect before saving." />}
        {state === 'processing' && <p role="status">AI review is processing. Your original reflection is saved.</p>}
        {state === 'completed' && <p role="status">AI review is ready below.</p>}
        {state === 'failed' && <p role="alert" className="text-destructive">AI review could not be completed. Your original reflection remains available.</p>}
        {state === 'error' && <p role="alert" className="text-destructive">Reflection could not be saved. Your text remains here so you can retry.</p>}
        <Button type="primary" className="min-h-11" disabled={!online || !text.trim()} onClick={() => void (state === 'failed' ? retry() : save())}>
          {state === 'failed' ? 'Retry AI review' : 'Save reflection'}
        </Button>
      </div>
    </Card>
  )
}
