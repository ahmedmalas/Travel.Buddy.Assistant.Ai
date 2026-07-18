import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TripPlatform } from './TripPlatform'

const TRIP_KEY = 'travel-buddy:trip-state:v1'

describe('TripPlatform deep coverage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('supports itinerary CRUD, packing, travellers, and budget expense edits', () => {
    render(<TripPlatform />)

    fireEvent.click(screen.getByRole('tab', { name: 'Itinerary' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Museum' } })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add itinerary item' }))
    expect(screen.getByText('Museum')).toBeTruthy()

    const museumCard = screen.getByText('Museum').closest('li')!
    fireEvent.click(within(museumCard).getByRole('button', { name: 'Edit' }))
    const editTitle = within(museumCard).getAllByRole('textbox')[0]!
    fireEvent.change(editTitle, { target: { value: 'Museum tour' } })
    fireEvent.click(within(museumCard).getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Museum tour')).toBeTruthy()

    const tourCard = screen.getByText('Museum tour').closest('li')!
    fireEvent.click(within(tourCard).getByRole('button', { name: 'Duplicate' }))
    expect(screen.getByText('Museum tour (copy)')).toBeTruthy()

    const copyCard = screen.getByText('Museum tour (copy)').closest('li')!
    fireEvent.click(within(copyCard).getByRole('button', { name: 'Down' }))
    fireEvent.click(within(copyCard).getByRole('button', { name: 'Up' }))
    fireEvent.click(within(copyCard).getByRole('button', { name: 'Delete' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Budget' }))
    fireEvent.change(screen.getByLabelText('Expense title'), { target: { value: 'Lunch' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'food' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Cafe lunch' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(screen.getByText('Lunch')).toBeTruthy()

    const lunchRow = screen.getByText('Lunch').closest('li')!
    fireEvent.click(within(lunchRow).getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByLabelText('Paid'))
    fireEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    fireEvent.click(within(screen.getByText('Lunch').closest('li')!).getByRole('button', { name: 'Delete' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Packing' }))
    fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'Charger' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add packing item' }))
    expect(screen.getByText(/Charger/)).toBeTruthy()
    const chargerRow = screen.getByText(/Charger/).closest('li')!
    fireEvent.click(within(chargerRow).getByRole('checkbox'))
    fireEvent.click(within(chargerRow).getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use Weekend getaway' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add custom list' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Travellers' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam' } })
    fireEvent.change(screen.getByLabelText('Nationality'), { target: { value: 'CA' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save traveller' }))
    expect(screen.getByText('Sam')).toBeTruthy()
    const samRow = screen.getByText('Sam').closest('article')!
    fireEvent.click(within(samRow).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam Lee' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save traveller' }))
    expect(screen.getByText('Sam Lee')).toBeTruthy()
    fireEvent.click(within(screen.getByText('Sam Lee').closest('article')!).getByRole('button', { name: 'Delete' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Bookings' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Train' } })
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'RailCo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    expect(screen.getByText('Train')).toBeTruthy()
    const trainRow = screen.getByText('Train').closest('article')!
    fireEvent.click(within(trainRow).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Express train' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    expect(screen.getByText('Express train')).toBeTruthy()
    fireEvent.click(within(screen.getByText('Express train').closest('article')!).getByRole('button', { name: 'Delete' }))

    const stored = JSON.parse(localStorage.getItem(TRIP_KEY) ?? '{}') as { tripName?: string }
    expect(stored.tripName).toBeTruthy()
  })

  it('shows validation errors on invalid trip setup', () => {
    render(<TripPlatform />)
    fireEvent.click(screen.getByRole('tab', { name: 'Trip setup' }))
    fireEvent.change(screen.getByLabelText('Trip name'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save trip' }))
    expect(screen.getByText(/Please fix the highlighted fields/i)).toBeTruthy()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })

  it('creates a new blank trip from setup', () => {
    render(<TripPlatform />)
    fireEvent.click(screen.getByRole('tab', { name: 'Trip setup' }))
    fireEvent.click(screen.getByRole('button', { name: 'New blank trip' }))
    expect((screen.getByLabelText('Trip name') as HTMLInputElement).value).toBe('Untitled Trip')
  })
})
