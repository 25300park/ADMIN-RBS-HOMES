import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '@/components/sidebar'
import { TIME_MENU_ITEMS } from '@/utils/constants/menu'

afterEach(cleanup)

describe('responsive time-management shell', () => {
  it('exposes Today, Records, and Review as authorized time routes', () => {
    expect(TIME_MENU_ITEMS[0].children?.map((item) => item.path)).toEqual([
      '/time-management/today',
      '/time-management/records',
      '/time-management/review',
    ])
  })

  it('keeps desktop navigation and opens a dismissible mobile drawer', () => {
    const close = vi.fn()
    const { rerender } = render(
      <Sidebar
        collapsed={false}
        menus={TIME_MENU_ITEMS}
        currentPath="/time-management/today"
        mobileOpen={false}
        onMobileClose={close}
      />,
    )

    expect(screen.getByTestId('desktop-sidebar')).toHaveClass('hidden', 'md:block')
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument()

    rerender(
      <Sidebar
        collapsed={false}
        menus={TIME_MENU_ITEMS}
        currentPath="/time-management/today"
        mobileOpen
        onMobileClose={close}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(close).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(close).toHaveBeenCalledTimes(2)
  })
})
