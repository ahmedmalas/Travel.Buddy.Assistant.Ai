import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TripPlatform } from './TripPlatform';

describe('Deal engine platform surfaces', () => {
  it('opens super deal engine, partner centre, and growth via Deals group', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);

    await user.click(screen.getByRole('tab', { name: /^Deals$/i }));
    await user.click(screen.getByRole('tab', { name: /Super deal engine/i }));
    expect(await screen.findByRole('heading', { name: /Super Deal Engine/i })).toBeInTheDocument();
    expect(screen.getByText(/LIVE PROVIDERS DISABLED/i)).toBeInTheDocument();
    expect(screen.getByText(/Affiliate disclosure/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Partner centre/i }));
    expect(await screen.findByRole('heading', { name: /Partner centre/i })).toBeInTheDocument();
    expect(screen.getByText(/No live partnerships claimed/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^Growth$/i }));
    expect(await screen.findByRole('heading', { name: /Growth & recommendation engine/i })).toBeInTheDocument();
  });
});
