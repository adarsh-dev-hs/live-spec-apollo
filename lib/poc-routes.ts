import { pocAppUrl } from './shared';

/**
 * Every route the live POC app actually serves.
 *
 * Source of truth: `live_app_apollo/src/App.tsx`. Regenerate with
 *   grep -oE 'path="[^"]*"' ../live_app_apollo/src/App.tsx
 * and re-nest the `/app`, `/portal` and `/l` children by hand — they are declared
 * as relative paths inside a parent <Route>.
 *
 * A screen reference in the docs is linked ONLY if it appears here. That is what
 * keeps the linking honest: API paths (`/v1/...`), health endpoints (`/readyz`) and
 * screens the specs require but the POC does not render stay plain code, because
 * they are not routes this app can navigate to.
 */
const STATIC_ROUTES = [
  // Entry
  '/login',
  '/forgot-password',
  // Console
  '/showcase',
  '/board',
  '/requisitions',
  '/requisitions/new',
  '/inbound',
  '/inbound/unmatched',
  '/inbound/manual-entry',
  '/duplicates',
  '/candidates',
  '/verification',
  '/verification/pendency',
  '/learner-matches',
  '/search',
  '/segments',
  '/interviews',
  '/offers',
  '/shortlists',
  '/placements',
  '/trial',
  '/attendance',
  '/timesheets',
  '/engagement/review',
  '/engagement/calls',
  '/engagement/runs',
  '/messaging/delivery-log',
  '/invoices',
  '/billing/evidence',
  '/receivables',
  '/reports/funnel',
  '/reports/fill',
  '/reports/trial-survival',
  '/reports/stage-loss',
  '/reports/performance',
  '/reports/rate-variance',
  '/reports/monthly-pack',
  '/clients',
  '/contracts',
  '/links',
  '/workforce/onboarding',
  '/workforce/requests',
  '/workforce/payroll',
  '/admin/users',
  '/admin/roles',
  '/admin/settings',
  '/admin/channels',
  '/admin/templates',
  '/admin/cadence',
  '/admin/ranking-weights',
  '/admin/registries',
  '/admin/link-types',
  '/admin/jobs',
  '/admin/open-decisions',
  '/admin/system',
  // Candidate mobile app
  '/app',
  '/app/login',
  '/app/signup',
  '/app/home',
  '/app/jobs',
  '/app/shifts',
  '/app/applications',
  '/app/check-in',
  '/app/availability',
  '/app/documents',
  '/app/profile',
  '/app/notifications',
  '/app/onboarding',
  '/app/payslips',
  // Public tokenised links
  '/l',
  // Client portal
  '/portal',
  '/portal/requisitions',
  '/portal/requisitions/new',
  '/portal/shortlists',
  '/portal/timesheets',
  '/portal/invoices',
] as const;

const STATIC = new Set<string>(STATIC_ROUTES);

/**
 * Routes with a `:param`. A literal `:id` resolves to nothing, so each one is
 * pointed at a record the POC's seed always creates (`live_app_apollo/src/mocks/seed.ts`
 * numbers its fixtures from 001). The reader still sees the pattern; the link lands
 * on a populated screen instead of the catch-all.
 */
const DYNAMIC: Record<string, string> = {
  '/requisitions/:id': '/requisitions/req-001',
  '/requisitions/:id/ranking': '/requisitions/req-001/ranking',
  '/requisitions/:id/shortlist': '/requisitions/req-001/shortlist',
  '/candidates/:id': '/candidates/cnd-001',
  '/clients/:id': '/clients/cli-001',
  '/contracts/:id': '/contracts/con-001',
  '/placements/:id': '/placements/plc-001',
  '/timesheets/:id': '/timesheets/tsh-001',
  '/invoices/:id': '/invoices/inv-001',
  // No fixed token or job id to aim at — land on the index that lists them.
  '/l/:token': '/l',
  '/app/jobs/:id': '/app/jobs',
};

/**
 * The live-app URL a screen reference points at, or `null` when the POC has no such
 * screen.
 *
 * Two references are deliberately left unlinked. `/` is one: the docs use it as a
 * separator far more often than as a route. A reference carrying a query or hash
 * (`/board?sort=priority`) is the other — the route table cannot say whether the POC
 * honours that parameter, and the specs mark some of those variants **not in POC**.
 */
export function pocScreenUrl(reference: string): string | null {
  const route = reference.trim();
  if (route.length < 2 || !route.startsWith('/') || /[?#]/.test(route)) return null;

  const target = DYNAMIC[route] ?? (STATIC.has(route) ? route : null);
  return target ? `${pocAppUrl}${target}` : null;
}

/** True when `reference` names a screen the POC serves. */
export function isPocScreen(reference: string): boolean {
  return pocScreenUrl(reference) !== null;
}
