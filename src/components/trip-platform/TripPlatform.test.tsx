import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TripPlatform } from './TripPlatform';

describe('TripPlatform UI', () => {
  it('renders command centre and switches to trip setup', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    expect(screen.getByRole('heading', { name: /Trip platform/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /^Command centre$/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Trip setup/i }));
    expect(await screen.findByRole('heading', { name: /Create or edit trip/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Trip name/i)).toBeInTheDocument();
  });

  it('opens notifications, auth, and sync tabs', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    await user.click(screen.getByRole('tab', { name: /^Notifications$/i }));
    expect(await screen.findByRole('heading', { name: /Notification centre/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Auth$/i }));
    expect(await screen.findByRole('heading', { name: /^Authentication$/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Sync$/i }));
    expect(await screen.findByRole('heading', { name: /^Sync engine$/i })).toBeInTheDocument();
  });

  it('supports arrow-key tab navigation from command centre', async () => {
    const user = userEvent.setup();
    render(<TripPlatform />);
    const command = await screen.findByRole('tab', { name: /Command centre/i });
    command.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /^Vault$/i })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: /^Trip vault$/i })).toBeInTheDocument();
  });
});
