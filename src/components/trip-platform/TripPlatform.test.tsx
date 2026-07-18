import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TripPlatform } from './TripPlatform';

describe('TripPlatform UI', () => {
  it('renders vault and switches to trip setup', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    expect(screen.getByRole('heading', { name: /Trip platform/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Trip vault$/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Trip setup/i }));
    expect(screen.getByRole('heading', { name: /Create or edit trip/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Trip name/i)).toBeInTheDocument();
  });

  it('opens calendar, documents, and search tabs', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    await user.click(screen.getByRole('tab', { name: /^Calendar$/i }));
    expect(screen.getByRole('heading', { name: /Calendar planner/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Documents$/i }));
    expect(screen.getByRole('heading', { name: /Travel documents/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Search$/i }));
    expect(screen.getByRole('heading', { name: /Global search/i })).toBeInTheDocument();
  });

  it('supports arrow-key tab navigation from vault', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    const vault = screen.getByRole('tab', { name: /^Vault$/i });
    vault.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Trip setup/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /Create or edit trip/i })).toBeInTheDocument();
  });
});
