'use client';

import Link from 'fumadocs-core/link';
import { usePathname } from 'fumadocs-core/framework';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isTabActive, TABS } from '@/lib/tabs';

/**
 * The four tabs, rendered as a distinct block rather than as list items.
 *
 * `vertical` sits at the top of the docs sidebar, above the page tree, so the
 * top-level choice reads as a different thing from the pages inside it.
 * `horizontal` sits in the original-plan page's own header, which is outside both
 * fumadocs layouts.
 */
export function TabBar({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  const pathname = usePathname();
  const vertical = orientation === 'vertical';

  return (
    <nav
      aria-label="Sections"
      className={cn(
        'flex gap-0.5',
        vertical
          ? 'bg-fd-secondary/40 flex-col rounded-lg border p-1'
          : 'flex-row flex-wrap items-center',
      )}
    >
      {TABS.map((tab) => {
        const active = isTabActive(tab, pathname);
        return (
          <Link
            key={tab.url}
            href={tab.url}
            external={tab.external}
            data-active={active}
            className={cn(
              'text-fd-muted-foreground flex items-center gap-2 rounded-md transition-colors',
              'hover:bg-fd-accent hover:text-fd-accent-foreground',
              'data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:font-medium',
              '[&_svg]:size-4 [&_svg]:shrink-0',
              vertical ? 'p-2 text-sm' : 'px-2.5 py-1.5 text-sm',
            )}
          >
            {tab.icon}
            <span className={vertical ? '' : 'max-sm:hidden'}>{tab.title}</span>
            {!vertical && <span className="sm:hidden">{tab.short}</span>}
            {tab.external && <ArrowUpRight className="text-fd-muted-foreground/60 ms-auto" />}
          </Link>
        );
      })}
    </nav>
  );
}
