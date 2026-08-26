import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delivery plan — original document',
  description:
    'The Apollo Knowledge GWD six-month delivery plan exactly as the client received it, with its own tabs, filters and styling.',
}

export default function RequirementDocPage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 text-sm">
        <Link href="/docs/06-source-plan" className="font-medium hover:underline">
          ← Source plan
        </Link>
        <span className="text-fd-muted-foreground">
          The original delivery plan, unmodified — tabs, filters and all.
        </span>
        <a
          href="/requirement-doc.html"
          target="_blank"
          rel="noreferrer"
          className="text-fd-muted-foreground ml-auto hover:underline"
        >
          Open in a new tab ↗
        </a>
      </header>
      <iframe
        src="/requirement-doc.html"
        title="Apollo Knowledge GWD — delivery plan"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  )
}
