'use client'

import { Button, Card, InputNumber } from 'antd'
import type { TimeCategory } from './current-timer-card'

export type PlanAllocation = { standardCategoryId: string; plannedMinutes: number }

type Props = {
  categories: TimeCategory[]
  availableMinutes: number
  allocations: PlanAllocation[]
  hasPlan: boolean
  pending: boolean
  onAvailableMinutesChange: (value: number) => void
  onAllocationChange: (categoryId: string, value: number) => void
  onSave: () => void
}

export default function DailyPlanCard(props: Props) {
  return (
    <Card title="Daily plan" className="h-full">
      <div className="space-y-4">
        {!props.hasPlan && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No daily plan yet</p>}
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">
          <span>Available minutes</span>
          <InputNumber
            aria-label="Available minutes"
            min={0}
            max={1440}
            value={props.availableMinutes}
            disabled={props.pending}
            onChange={(value) => props.onAvailableMinutesChange(Number(value ?? 0))}
            className="min-h-11 w-32"
          />
        </label>
        <div className="space-y-2">
          {props.categories.map((category) => {
            const allocation = props.allocations.find((item) => item.standardCategoryId === category.id)
            return (
              <label key={category.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{category.name}</span>
                <InputNumber
                  aria-label={`${category.name} planned minutes`}
                  min={0}
                  max={1440}
                  value={allocation?.plannedMinutes ?? 0}
                  disabled={props.pending}
                  onChange={(value) => props.onAllocationChange(category.id, Number(value ?? 0))}
                  className="min-h-11 w-32"
                />
              </label>
            )
          })}
        </div>
        <Button type="primary" className="min-h-11 w-full" loading={props.pending} onClick={props.onSave}>
          Save daily plan
        </Button>
      </div>
    </Card>
  )
}
