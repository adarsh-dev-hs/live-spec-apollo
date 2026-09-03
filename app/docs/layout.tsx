import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { TabBar } from '@/components/tab-bar';

/**
 * `links={[]}` and `tabs={false}`, with the four tabs rendered as the sidebar
 * banner instead.
 *
 * The docs header is mobile-only, so nav links fall through to the sidebar and
 * render with the same styling as page-tree items — four top-level destinations
 * reading as siblings of "Overview" and "Context". The banner sits above the tree
 * in its own bordered block, which is what the tabs actually are.
 */
export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      links={[]}
      tabs={false}
      sidebar={{ banner: <TabBar orientation="vertical" /> }}
    >
      {children}
    </DocsLayout>
  );
}
