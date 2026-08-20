import { describe, expect, test } from 'vitest'
import { toSheetData } from '@/utils/excel'

describe('Excel export data conversion', () => {
  test('preserves reviewed object columns and primitive values', () => {
    expect(toSheetData([
      { name: 'Agent Kim', hours: 2, active: true },
      { name: 'Agent Lee', hours: null, active: false },
    ])).toEqual([
      ['name', 'hours', 'active'],
      ['Agent Kim', 2, true],
      ['Agent Lee', null, false],
    ])
  })

  test('returns an empty sheet for an empty result', () => {
    expect(toSheetData([])).toEqual([])
  })
})
