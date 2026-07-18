import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TripPlatform } from './TripPlatform'

describe('TripPlatform vault slices UI', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => undefined,
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('creates vault trips, templates, documents, and search hits', () => {
    render(<TripPlatform />)

    fireEvent.click(screen.getByRole('button', { name: 'New trip' }))
    expect(screen.getByText(/Created a new draft trip/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Templates' }))
    fireEvent.change(screen.getByLabelText('Template name'), { target: { value: 'UI Template' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save current trip as template' }))
    expect(screen.getByText('UI Template')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Create trip' })[0]!)

    fireEvent.click(screen.getByRole('tab', { name: 'Documents' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Travel insurance' } })
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'insurance' } })
    fireEvent.change(screen.getByLabelText('Expiry date'), { target: { value: '2026-08-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save document' }))
    expect(screen.getByText('Travel insurance')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    fireEvent.change(screen.getByLabelText('Search query'), { target: { value: 'insurance' } })
    expect(screen.getByText(/Travel insurance/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Collaboration' }))
    fireEvent.change(screen.getByLabelText('Invitee name'), { target: { value: 'Riley' } })
    fireEvent.change(screen.getByLabelText('Invitee email'), { target: { value: 'riley@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Invite traveller' }))
    expect(screen.getByText('Riley')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Calendar' }))
    expect(screen.getByRole('heading', { name: /Calendar planner/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Day' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Import' }))
    expect(screen.getByRole('heading', { name: /Import & migration/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Copy vault backup' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Vault' }))
    const cards = screen.getAllByRole('article')
    expect(cards.length).toBeGreaterThan(0)
    fireEvent.click(within(cards[0]!).getByRole('button', { name: /Favourite|Unfavourite/i }))
  })
})
