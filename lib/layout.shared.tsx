import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';
import { TABS } from './tabs';

/**
 * Shared by the home and docs layouts.
 *
 * `links` is what the home layout renders as its header nav. The docs layout
 * passes `links={[]}` and renders the same four tabs as a sidebar banner instead
 * (`components/tab-bar.tsx`) — its own header is mobile-only, so plain nav links
 * would otherwise fall into the sidebar list and read as siblings of the page tree.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    links: TABS.map((tab) => ({
      text: tab.title,
      url: tab.url,
      description: tab.description,
      icon: tab.icon,
      ...(tab.external ? { external: true } : { active: 'nested-url' as const }),
    })),
  };
}
