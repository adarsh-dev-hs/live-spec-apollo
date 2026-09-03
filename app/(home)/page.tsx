import Link from 'next/link';
import { originalPlanRoute, pocAppLoginUrl } from '@/lib/shared';

const TABS = [
  {
    href: originalPlanRoute,
    title: 'Original Plan',
    body: "The client's delivery plan exactly as it was issued — its own tabs, filters and styling, unmodified.",
    meta: 'As issued',
    external: false,
  },
  {
    href: pocAppLoginUrl,
    title: 'Live POC App',
    body: 'Every screen the specifications describe, running. Screen references throughout the docs link straight into it.',
    meta: 'Opens in a new tab',
    external: true,
  },
  {
    href: '/docs/release-plan',
    title: 'Release Plan',
    body: 'The signed Statement of Work: 51 deliverables across three parts, with the assumptions and client dependencies behind them.',
    meta: 'The authority on scope',
    external: false,
  },
  {
    href: '/docs/engineering',
    title: 'Engineering Documentation',
    body: 'How it is built: architecture, platform services, the twenty modules with their scope and purpose, data, APIs and infrastructure.',
    meta: 'Eleven pages',
    external: false,
  },
];

const PARTS = [
  {
    href: '/docs/release-plan/parts/part-1',
    label: 'Part 1 · Quarter 1',
    title: 'Permanent placement, end to end',
    body: 'One client, one category, one line of business — from sign-in to a day-90 retention invoice.',
  },
  {
    href: '/docs/release-plan/parts/part-2',
    label: 'Part 2 · Quarter 2',
    title: 'All remaining capability opened',
    body: 'Shift attendance and shift billing, the client portal, multi-channel intake, notifications, verified checking.',
  },
  {
    href: '/docs/release-plan/parts/part-3',
    label: 'Part 3 · Quarter 3',
    title: 'Full depth',
    body: 'Payroll, analytics and MIS, workforce operations, collections, the legacy migration, and go-live.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <p className="text-fd-muted-foreground text-sm font-medium tracking-wide uppercase">
          Hiresense · Apollo Knowledge Services
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Apollo Knowledge GWD
        </h1>
        <p className="text-fd-muted-foreground mt-4 max-w-3xl text-lg">
          An AI-native healthcare talent platform: permanent placement and contractual shift staffing
          for nurses, doctors and allied health professionals, across hospital and home healthcare
          settings, in India.
        </p>

        <dl className="border-fd-border mt-12 grid grid-cols-2 gap-6 border-t pt-8 md:grid-cols-4">
          {[
            ['51', 'deliverables in scope'],
            ['3', 'release parts'],
            ['9', 'months'],
            ['35', 'components built'],
          ].map(([n, label]) => (
            <div key={label}>
              <dt className="text-3xl font-semibold">{n}</dt>
              <dd className="text-fd-muted-foreground text-sm">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-fd-border border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Four places to look</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TABS.map((t) => {
              const inner = (
                <>
                  <span className="text-fd-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t.meta}
                  </span>
                  <span className="mt-1 block text-lg font-medium">
                    {t.title}
                    {t.external ? ' ↗' : ''}
                  </span>
                  <span className="text-fd-muted-foreground mt-1 block text-sm">{t.body}</span>
                </>
              );
              const className =
                'border-fd-border hover:bg-fd-accent block rounded-lg border p-5 transition-colors';
              return t.external ? (
                <a key={t.href} href={t.href} target="_blank" rel="noreferrer" className={className}>
                  {inner}
                </a>
              ) : (
                <Link key={t.href} href={t.href} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-fd-border border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Three parts over nine months</h2>
          <p className="text-fd-muted-foreground mt-3 max-w-3xl">
            Scope follows the Statement of Work signed on <strong>3 September 2026</strong>. The
            approach determines only the order in which capability becomes available — the whole of
            the scope is delivered.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PARTS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="border-fd-border hover:bg-fd-accent rounded-lg border p-5 transition-colors"
              >
                <span className="text-fd-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {p.label}
                </span>
                <span className="mt-1 block font-medium">{p.title}</span>
                <span className="text-fd-muted-foreground mt-1 block text-sm">{p.body}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-fd-border border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">What this documentation is</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <p className="text-fd-muted-foreground">
              The <strong>release plan</strong> reproduces the signed SOW: every deliverable, which
              part it falls in, and the assumptions and client dependencies the dates rest on. It is
              the authority on scope.
            </p>
            <p className="text-fd-muted-foreground">
              The <strong>engineering documentation</strong> is the translation of it — organised by
              what gets built rather than by what was sold, with each module&apos;s purpose and scope
              mapped to the deliverables it satisfies. Where the two disagree, the release plan wins.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
