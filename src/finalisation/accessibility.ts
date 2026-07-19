/**
 * Slice 93 — Accessibility helpers and audit checklist.
 */

export interface A11yAuditItem {
  id: string;
  area: string;
  status: 'pass' | 'partial' | 'fail';
  notes: string;
}

export function buildAccessibilityAudit(): A11yAuditItem[] {
  return [
    {
      id: 'keyboard',
      area: 'Keyboard navigation',
      status: 'pass',
      notes: 'Grouped tablists use aria-selected; platform tabs support arrow keys; forms are focusable.',
    },
    {
      id: 'focus',
      area: 'Focus management',
      status: 'pass',
      notes: 'Tab activation can move focus to the selected tab; focus-visible outlines on buttons/inputs.',
    },
    {
      id: 'sr',
      area: 'Screen-reader support',
      status: 'pass',
      notes: 'Panels use landmarks/headings; status badges expose text; offline banner uses role=status.',
    },
    {
      id: 'contrast',
      area: 'Colour contrast',
      status: 'partial',
      notes: 'Sky-on-slate theme aims for AA on primary text; decorative muted labels remain secondary.',
    },
    {
      id: 'errors',
      area: 'Error messaging',
      status: 'pass',
      notes: 'Import/validation errors use role=alert and plain-language messages.',
    },
    {
      id: 'mobile',
      area: 'Mobile usability',
      status: 'pass',
      notes: 'Section select for small screens; touch-friendly controls; no hover-only critical actions.',
    },
    {
      id: 'tablet',
      area: 'Tablet optimisation',
      status: 'pass',
      notes: 'Responsive grids (md breakpoints) keep Deals/System panels readable on mid widths.',
    },
  ];
}

export function announcePolite(message: string): void {
  if (typeof document === 'undefined') return;
  let live = document.getElementById('travel-buddy-a11y-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'travel-buddy-a11y-live';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.className = 'sr-only';
    document.body.appendChild(live);
  }
  live.textContent = message;
}
