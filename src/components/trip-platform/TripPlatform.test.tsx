import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TripPlatform } from './TripPlatform';

describe('TripPlatform UI', () => {
  it('renders overview and switches to trip setup', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    expect(screen.getByRole('heading', { name: /Trip platform/i })).toBeInTheDocument();
    expect(screen.getByText(/Trip overview/i)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Trip setup/i }));
    expect(screen.getByRole('heading', { name: /Create or edit trip/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Trip name/i)).toBeInTheDocument();
  });

  it('opens bookings and budget tabs', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    await user.click(screen.getByRole('tab', { name: /^Bookings$/i }));
    expect(screen.getByRole('heading', { name: /Bookings manager/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Budget$/i }));
    expect(screen.getByRole('heading', { name: /Budget tracker/i })).toBeInTheDocument();
  });

  it('supports arrow-key tab navigation', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    const overview = screen.getByRole('tab', { name: /^Overview$/i });
    overview.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /^Itinerary$/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /Day-by-day itinerary/i })).toBeInTheDocument();
  });
});
