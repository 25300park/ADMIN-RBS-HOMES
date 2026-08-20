'use client'

import { Button, Card } from 'antd'
import { useEffect, useState } from 'react'
import type { ActiveTimerDisplay, CrmLink } from '@/hooks/use-active-time-entry'
import CrmLinkPicker from './crm-link-picker'

export type TimeCategory = { id: string; name: string; color?: string }

type Props = {
  categories: TimeCategory[]
  selectedCategoryId: string
  onCategoryChange: (value: string) => void
  timer: ActiveTimerDisplay | null
  crmQuery: string
  onCrmQueryChange: (value: string) => void
  crmResults: CrmLink[]
  selectedCrm: CrmLink | null
  onCrmSelected: (value: CrmLink | null) => void
  onCrmSearch: () => void
  crmLoading: boolean
  pending: boolean
  onStartOrSwitch: () => void
  onStop: () => void
}

export default function CurrentTimerCard(props: Props) {
  const [now, setNow] = useState(Date.now)
  const runningCategory = props.categories.find((item) => item.id === props.timer?.categoryId)
  useEffect(() => {
    if (!props.timer) return
    setNow(Date.now())
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [props.timer])

  const elapsedSeconds = props.timer
    ? Math.max(0, Math.floor((now - Date.parse(props.timer.startedAt)) / 1000))
    : 0
  const elapsed = [
    Math.floor(elapsedSeconds / 3600),
    Math.floor((elapsedSeconds % 3600) / 60),
    elapsedSeconds % 60,
  ].map((part) => String(part).padStart(2, '0')).join(':')

  return (
    <Card title="Current timer" className="h-full">
      <div className="space-y-5">
        <div aria-live="polite" className="rounded-xl bg-muted p-4">
          <p className="font-semibold">
            {props.timer ? `Running: ${runningCategory?.name ?? 'Current work'}` : 'No timer running'}
          </p>
          {props.timer && <p className="mt-1 font-mono text-lg font-bold">Elapsed {elapsed}</p>}
          {props.timer?.crm && <p className="mt-1 text-sm text-muted-foreground">{props.timer.crm.label}</p>}
        </div>

        <label className="block space-y-2 text-sm font-semibold">
          <span>Work category</span>
          <select
            aria-label="Work category"
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={props.selectedCategoryId}
            disabled={props.pending}
            onChange={(event) => props.onCategoryChange(event.target.value)}
          >
            {props.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>

        <CrmLinkPicker
          query={props.crmQuery}
          onQueryChange={props.onCrmQueryChange}
          results={props.crmResults}
          selected={props.selectedCrm}
          onSelected={props.onCrmSelected}
          onSearch={props.onCrmSearch}
          loading={props.crmLoading}
          disabled={props.pending}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="primary"
            className="min-h-11 flex-1"
            disabled={!props.selectedCategoryId || props.pending}
            loading={props.pending}
            onClick={props.onStartOrSwitch}
          >
            {props.timer ? 'Switch task' : 'Start timer'}
          </Button>
          {props.timer && (
            <Button danger className="min-h-11 sm:min-w-32" disabled={props.pending} onClick={props.onStop}>
              Stop timer
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
