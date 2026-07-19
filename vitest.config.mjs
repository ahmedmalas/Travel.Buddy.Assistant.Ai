import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Keep unit tests on local/demo auth/storage even if a developer has `.env.local`.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_SUPABASE_PROJECT_REF: '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.ts',
        'src/vite-env.d.ts',
        'src/global.d.ts',
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        // Large lazy UI surfaces are smoke-tested; domain/store coverage carries the gate.
        'src/components/trip-platform/DestinationsPanel.tsx',
        'src/components/trip-platform/FlightsPanel.tsx',
        'src/components/trip-platform/StaysPanel.tsx',
        'src/components/trip-platform/GroundTransportPanel.tsx',
        'src/components/trip-platform/MapsRoutesPanel.tsx',
        'src/components/trip-platform/ChecklistCentrePanel.tsx',
        'src/components/trip-platform/EmergencyCentrePanel.tsx',
        'src/components/trip-platform/JournalPanel.tsx',
        'src/components/trip-platform/AssistancePanel.tsx',
        'src/components/trip-platform/OnboardingPanel.tsx',
        'src/components/trip-platform/DealEnginePanel.tsx',
        'src/components/trip-platform/PartnerCentrePanel.tsx',
        'src/components/trip-platform/GrowthEnginePanel.tsx',
        'src/components/trip-platform/UniversalImportPanel.tsx',
        'src/components/trip-platform/TripHealthPanel.tsx',
        'src/components/trip-platform/OpsDashboardPanel.tsx',
        'src/components/trip-platform/ReleaseCentrePanel.tsx',
        'src/components/trip-platform/shared/VirtualList.tsx',
        'src/components/ErrorBoundary.tsx',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 55,
        lines: 60,
      },
    },
  },
});
