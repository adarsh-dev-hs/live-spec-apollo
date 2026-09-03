export const appName = 'Apollo Knowledge GWD';
export const appDescription =
  'Engineering documentation for the Apollo Knowledge GWD healthcare talent platform.';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

/** The client's original delivery plan, rendered as issued. One of the four tabs. */
export const originalPlanRoute = '/original-plan';

/**
 * Base URL of the live POC app (`live_app_apollo`). Every screen reference in the
 * docs is a route to be resolved against this. NEXT_PUBLIC_POC_APP_URL overrides it —
 * set that to `http://localhost:5173` to point the docs at a local Vite dev server.
 */
export const pocAppUrl =
  process.env.NEXT_PUBLIC_POC_APP_URL ?? 'https://live-app-apollo.vercel.app';

/** Entry point of the POC — the top-nav tab lands visitors on the sign-in screen. */
export const pocAppLoginUrl = `${pocAppUrl}/login`;
