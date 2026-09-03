import type { Metadata } from 'next'
import Link from 'next/link'
import { TabBar } from '@/components/tab-bar'
import { appName } from '@/lib/shared'

export const metadata: Metadata = {
  title: 'Original plan',
  description:
    'The Apollo Knowledge GWD delivery plan exactly as the client received it, with its own tabs, filters and styling.',
}

/**
 * Full-bleed frame around the client's own HTML, so its tabs and filters keep
 * working. It sits outside both fumadocs layouts — the document needs the whole
 * viewport — so it carries the four tabs itself.
 */
export default function OriginalPlanPage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="border-fd-border flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2">
        <Link href="/" className="text-sm font-semibold">
          {appName}
        </Link>
        <TabBar orientation="horizontal" />
        <a
          href="/requirement-doc.html"
          target="_blank"
          rel="noreferrer"
          className="text-fd-muted-foreground ms-auto text-sm hover:underline"
        >
          Open in a new tab ↗
        </a>
      </header>
      <p className="text-fd-muted-foreground border-fd-border shrink-0 border-b px-4 py-2 text-sm">
        The original delivery plan, unmodified. Scope now follows the{' '}
        <Link href="/docs/release-plan" className="underline underline-offset-2">
          signed SOW of 3 September 2026
        </Link>
        .
      </p>
      <iframe
        src="/requirement-doc.html"
        title="Apollo Knowledge GWD — original delivery plan"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  )
}
