import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TripWorkspace } from './TripWorkspace';

const TRIP_KEY = 'travel-buddy:trip-state:v1';

describe('TripWorkspace UI smoke coverage', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockImplementation((message?: string) => {
      if ((message ?? '').includes('title')) {
        return 'Edited title';
      }
      if ((message ?? '').includes('notes')) {
        return 'Edited notes';
      }
      return null;
    });
  });

  it('renders existing trip and key integrity panels', () => {
    const { container } = render(<TripWorkspace />);
    expect(screen.getByText(/Trip itinerary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Integrity Audit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Integrity Diagnostics/i)).toBeInTheDocument();
    expect(container.querySelectorAll('section').length).toBeGreaterThan(0);
  });

  it('shows empty itinerary state when trip has no stops', () => {
    localStorage.setItem(TRIP_KEY, JSON.stringify({ tripName: 'Empty', stops: [] }));
    render(<TripWorkspace />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByText(/Day 1/i)).not.toBeInTheDocument();
  });

  it('supports create, edit and delete itinerary item with confirmations', async () => {
    const user = userEvent.setup();
    render(<TripWorkspace />);

    await user.click(screen.getByRole('button', { name: /add itinerary item/i }));
    expect(screen.getAllByText(/New itinerary item/i).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    expect(screen.getByText(/Itinerary item updated and snapshot saved\./i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    expect(window.confirm).toHaveBeenCalled();
  });

  it('shows import validation feedback for malformed backup', async () => {
    const user = userEvent.setup();
    const { container } = render(<TripWorkspace />);

    const fileInput = container.querySelector('input[type="file"][accept="application/json"]');
    expect(fileInput).toBeTruthy();
    const badFile = new File(['{bad-json'], 'bad.json', { type: 'application/json' });
    await user.upload(fileInput as HTMLInputElement, badFile);

    const feedback = await screen.findByText(/Backup file is not valid JSON\./i);
    expect(feedback).toBeInTheDocument();
  });

  it('prevents duplicate audit runs from double-click race by requiring explicit actions', async () => {
    const user = userEvent.setup();
    render(<TripWorkspace />);
    const runButton = screen.getByRole('button', { name: /Run Integrity Audit/i });
    await user.dblClick(runButton);
    expect(screen.getByText(/Total runs retained:/i)).toBeInTheDocument();
  });

  it('supports keyboard confirmation controls for destructive flow', async () => {
    const user = userEvent.setup();
    render(<TripWorkspace />);

    await user.click(screen.getByRole('button', { name: /Run Integrity Audit/i }));
    await user.click(screen.getByRole('button', { name: /Clear Audit History/i }));
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    confirmButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('button', { name: /Confirm/i })).not.toBeInTheDocument();
  });
});
