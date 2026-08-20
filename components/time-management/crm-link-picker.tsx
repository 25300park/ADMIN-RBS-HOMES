'use client'

import { Button, Input } from 'antd'
import type { CrmLink } from '@/hooks/use-active-time-entry'

type Props = {
  query: string
  onQueryChange: (value: string) => void
  results: CrmLink[]
  selected: CrmLink | null
  onSelected: (value: CrmLink | null) => void
  onSearch: () => void
  loading?: boolean
  disabled?: boolean
}

export default function CrmLinkPicker(props: Props) {
  const selectedValue = props.selected ? `${props.selected.type}:${props.selected.id}` : ''
  return (
    <fieldset disabled={props.disabled} className="space-y-2">
      <legend className="text-sm font-semibold">Optional CRM link</legend>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">CRM search</span>
          <Input
            aria-label="CRM search"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            onPressEnter={props.onSearch}
            placeholder="Search a contact or listing"
            className="min-h-11"
          />
        </label>
        <Button className="min-h-11" loading={props.loading} onClick={props.onSearch}>Search CRM</Button>
      </div>
      <label className="block">
        <span className="sr-only">CRM record</span>
        <select
          aria-label="CRM record"
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={selectedValue}
          onChange={(event) => {
            const next = props.results.find((item) => `${item.type}:${item.id}` === event.target.value)
            props.onSelected(next ?? null)
          }}
        >
          <option value="">No CRM record</option>
          {props.results.map((item) => (
            <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}
