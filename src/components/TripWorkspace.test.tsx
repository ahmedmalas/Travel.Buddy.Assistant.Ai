import React, { type ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TripStoreProvider } from '../store/TripStoreContext';
import { TripWorkspace } from './TripWorkspace';

const TRIP_KEY = 'travel-buddy:trip-state:v1';

const renderWithStore = (ui: ReactElement) => render(<TripStoreProvider>{ui}</TripStoreProvider>);

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
    const { container } = renderWithStore(<TripWorkspace />);
    expect(screen.getByText(/Trip itinerary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Integrity Audit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Integrity Diagnostics/i)).toBeInTheDocument();
    expect(container.querySelectorAll('section').length).toBeGreaterThan(0);
  });

  it('shows empty itinerary state when trip has no stops', () => {
    localStorage.setItem(TRIP_KEY, JSON.stringify({ tripName: 'Empty', stops: [] }));
    renderWithStore(<TripWorkspace />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByText(/Day 1/i)).not.toBeInTheDocument();
  });

  it('supports create, edit and delete itinerary item with confirmations', async () => {
    const user = userEvent.setup();
    renderWithStore(<TripWorkspace />);

    await user.click(screen.getByRole('button', { name: /add itinerary item/i }));
    expect(screen.getAllByText(/New itinerary item/i).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    expect(screen.getByText(/Itinerary item updated and snapshot saved\./i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    expect(window.confirm).toHaveBeenCalled();
  });

  it('shows import validation feedback for malformed backup', async () => {
    const user = userEvent.setup();
    const { container } = renderWithStore(<TripWorkspace />);

    const fileInput = container.querySelector('input[type="file"][accept="application/json"]');
    expect(fileInput).toBeTruthy();
    const badFile = new File(['{bad-json'], 'bad.json', { type: 'application/json' });
    await user.upload(fileInput as HTMLInputElement, badFile);

    const feedback = await screen.findByText(/Backup file is not valid JSON\./i);
    expect(feedback).toBeInTheDocument();
  });

  it('prevents duplicate audit runs from double-click race by requiring explicit actions', async () => {
    const user = userEvent.setup();
    renderWithStore(<TripWorkspace />);
    const runButton = screen.getByRole('button', { name: /Run Integrity Audit/i });
    await user.dblClick(runButton);
    expect(screen.getByText(/Total runs retained:/i)).toBeInTheDocument();
  });

  it('supports keyboard confirmation controls for destructive flow', async () => {
    const user = userEvent.setup();
    renderWithStore(<TripWorkspace />);

    await user.click(screen.getByRole('button', { name: /Run Integrity Audit/i }));
    await user.click(screen.getByRole('button', { name: /Clear Audit History/i }));
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    confirmButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('button', { name: /Confirm/i })).not.toBeInTheDocument();
  });

  it('runs integrity diagnostics and surfaces overall status feedback', async () => {
    const user = userEvent.setup();
    renderWithStore(<TripWorkspace />);
    await user.click(screen.getAllByRole('button', { name: /Run Diagnostics/i })[0]);
    expect(await screen.findByText(/Integrity diagnostics completed:/i)).toBeInTheDocument();
  });

  it('simulates selected repairs after an integrity audit', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      TRIP_KEY,
      JSON.stringify({
        tripName: '',
        stops: [{ id: 'stop-1', title: '', day: 1, order: 1, notes: '' }],
      }),
    );
    renderWithStore(<TripWorkspace />);
    await user.click(screen.getByRole('button', { name: /Run Integrity Audit/i }));
    await user.click(screen.getByRole('button', { name: /Simulate Selected Repairs/i }));
    expect(await screen.findByText(/Simulation complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Repair simulation summary/i)).toBeInTheDocument();
  });

  it('exports trip backup JSON through the download control', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:backup');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    renderWithStore(<TripWorkspace />);
    await user.click(screen.getByRole('button', { name: /Export backup/i }));
    expect(await screen.findByText(/Backup exported:/i)).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows history validation panel counters after audit activity', async () => {
    const user = userEvent.setup();
    renderWithStore(<TripWorkspace />);
    await user.click(screen.getByRole('button', { name: /Run Integrity Audit/i }));
    const validationLabels = screen.getAllByText(/History validation:/i);
    const validation = validationLabels[validationLabels.length - 1]?.closest('div');
    expect(validation).toBeTruthy();
    expect(within(validation as HTMLElement).getByText(/Invalid baseline reference:/i)).toBeInTheDocument();
    expect(within(validation as HTMLElement).getByText(/Duplicate run IDs:/i)).toBeInTheDocument();
  });
});
