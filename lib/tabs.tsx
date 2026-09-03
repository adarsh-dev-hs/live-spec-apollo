import { Boxes, FileClock, Milestone, MonitorPlay } from 'lucide-react';
import type { ReactNode } from 'react';
import { originalPlanRoute, pocAppLoginUrl } from './shared';

/**
 * The four tabs, in reading order: what was originally asked for, what it looks
 * like, what is being delivered when, and how it is built.
 *
 * Declared once here and consumed in three places — the home layout's header
 * (via `baseOptions().links`), the docs sidebar banner, and the original-plan
 * header — so the set can never drift between them.
 */
export interface Tab {
  title: string;
  short: string;
  description: string;
  url: string;
  icon: ReactNode;
  external?: boolean;
}

export const TABS: Tab[] = [
  {
    title: 'Original Plan',
    short: 'Original',
    description: "The client's delivery plan, exactly as issued",
    url: originalPlanRoute,
    icon: <FileClock />,
  },
  {
    title: 'Live POC App',
    short: 'POC',
    description: 'The screens every specification links to',
    url: pocAppLoginUrl,
    icon: <MonitorPlay />,
    external: true,
  },
  {
    title: 'Release Plan',
    short: 'Release',
    description: '51 deliverables across three parts',
    url: '/docs/release-plan',
    icon: <Milestone />,
  },
  {
    title: 'Engineering Documentation',
    short: 'Engineering',
    description: 'Architecture, modules, data, APIs, infrastructure',
    url: '/docs/engineering',
    icon: <Boxes />,
  },
];

/** True when `pathname` sits inside this tab. External tabs are never active. */
export function isTabActive(tab: Tab, pathname: string): boolean {
  if (tab.external) return false;
  return pathname === tab.url || pathname.startsWith(`${tab.url}/`);
}
