import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TripPlatform } from './TripPlatform'

const goTo = (tabId: string) => {
  fireEvent.change(screen.getByLabelText('Section screen'), { target: { value: tabId } })
}

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

  it('creates vault trips, templates, documents, and search hits', async () => {
    render(<TripPlatform />)
    goTo('vault')
    expect(await screen.findByRole('heading', { name: /^Trip vault$/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'New trip' }))
    expect(screen.getByText(/Created a new draft trip/i)).toBeTruthy()

    goTo('templates')
    fireEvent.change(await screen.findByLabelText('Template name'), { target: { value: 'UI Template' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save current trip as template' }))
    expect(await screen.findByText('UI Template')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Create trip' })[0]!)

    goTo('documents')
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Travel insurance' } })
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'insurance' } })
    fireEvent.change(screen.getByLabelText('Expiry date'), { target: { value: '2026-08-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save document' }))
    expect(await screen.findByText('Travel insurance')).toBeTruthy()

    goTo('search')
    fireEvent.change(await screen.findByLabelText('Search query'), { target: { value: 'insurance' } })
    expect(await screen.findByText(/Travel insurance/i)).toBeTruthy()

    goTo('collaboration')
    fireEvent.change(await screen.findByLabelText('Invitee name'), { target: { value: 'Riley' } })
    fireEvent.change(screen.getByLabelText('Invitee email'), { target: { value: 'riley@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Invite traveller' }))
    expect(await screen.findByText('Riley')).toBeTruthy()

    goTo('calendar')
    expect(await screen.findByRole('heading', { name: /Calendar planner/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Day' }))

    goTo('import')
    expect(await screen.findByRole('heading', { name: /Import & migration/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Copy vault backup' }))

    goTo('vault')
    expect(await screen.findByRole('heading', { name: /^Trip vault$/i })).toBeTruthy()
    const cards = screen.getAllByRole('article')
    expect(cards.length).toBeGreaterThan(0)
    fireEvent.click(within(cards[0]!).getByRole('button', { name: /Favourite|Unfavourite/i }))
  })
})
