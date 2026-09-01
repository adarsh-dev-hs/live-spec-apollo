export const appName = 'Apollo Knowledge GWD';
export const appDescription =
  'Engineering documentation for the Apollo Knowledge GWD healthcare talent platform.';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

/**
 * Base URL of the live POC app (`live_app_apollo`). Every screen reference in
 * `07-phases/` is a route to be resolved against this. Set NEXT_PUBLIC_POC_APP_URL
 * when the POC is deployed; the default is the Vite dev server.
 */
export const pocAppUrl = process.env.NEXT_PUBLIC_POC_APP_URL ?? 'http://localhost:5173';
