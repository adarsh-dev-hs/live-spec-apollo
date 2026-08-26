import Link from 'next/link';

const READING_ORDER = [
  {
    href: '/docs/00-foundation/00-01-product-context',
    title: 'Product context',
    body: 'The business, the two ways money reaches Apollo, and the actors. Nothing else makes sense without it.',
  },
  {
    href: '/docs/00-foundation/00-02-system-architecture',
    title: 'System architecture',
    body: 'The shape of the system and why it is that shape.',
  },
  {
    href: '/docs/00-foundation/00-04-component-map',
    title: 'Component map',
    body: 'What exists, what depends on what, and where each of the 208 plan items lives.',
  },
  {
    href: '/docs/01-standards',
    title: 'Standards',
    body: 'All ten. Read once, obeyed always.',
  },
  {
    href: '/docs/05-delivery/05-02-implementation-playbook',
    title: 'Implementation playbook',
    body: 'How to take one spec from this site to a merged pull request.',
  },
];

const SECTIONS = [
  { href: '/docs/00-foundation', title: 'Foundation', body: 'Context, read once.' },
  { href: '/docs/01-standards', title: 'Standards', body: 'House rules, obeyed always.' },
  { href: '/docs/02-platform', title: 'Platform', body: 'Shared components, built once.' },
  { href: '/docs/03-modules', title: 'Modules', body: 'One spec per implementable unit.' },
  { href: '/docs/04-integrations', title: 'Integrations', body: 'Every external system.' },
  { href: '/docs/05-delivery', title: 'Delivery', body: 'Sequence, playbook, open decisions.' },
  {
    href: '/docs/06-source-plan',
    title: 'Source plan',
    body: "The client's plan, reproduced verbatim.",
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
          Engineering documentation for the AI-native healthcare talent platform: permanent placement
          and contractual shift staffing for nurses, doctors and allied health professionals, across
          hospital and home healthcare settings, in India.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="bg-fd-primary text-fd-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            Read the documentation
          </Link>
          <Link
            href="/docs/00-foundation/00-04-component-map"
            className="border-fd-border rounded-md border px-4 py-2 text-sm font-medium"
          >
            Component map
          </Link>
          <Link
            href="/requirement-doc"
            className="border-fd-border rounded-md border px-4 py-2 text-sm font-medium"
          >
            The original plan
          </Link>
        </div>

        <dl className="border-fd-border mt-12 grid grid-cols-2 gap-6 border-t pt-8 md:grid-cols-4">
          {[
            ['71', 'specifications'],
            ['208', 'buildable items'],
            ['1,062', 'conditions'],
            ['96', 'open decisions'],
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
          <h2 className="text-2xl font-semibold tracking-tight">
            What this is, and what it is not
          </h2>
          <p className="text-fd-muted-foreground mt-3 max-w-3xl">
            The requirement document is organised by <strong>when work is sold and scheduled</strong>.
            This is the engineering translation, organised by{' '}
            <strong>what gets built and deployed</strong>. Nothing here is invented scope: every
            requirement traces back to the source, and where the source is silent it is recorded as an
            open decision with an explicit working assumption rather than a quiet guess.
          </p>
        </div>
      </section>

      <section className="border-fd-border border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            First time on this project — read these five, in order
          </h2>
          <ol className="mt-6 space-y-3">
            {READING_ORDER.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="border-fd-border hover:bg-fd-accent flex gap-4 rounded-lg border p-4 transition-colors"
                >
                  <span className="text-fd-muted-foreground w-6 shrink-0 text-sm font-medium">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="text-fd-muted-foreground text-sm">{item.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-fd-border border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Sections</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="border-fd-border hover:bg-fd-accent rounded-lg border p-4 transition-colors"
              >
                <span className="block font-medium">{s.title}</span>
                <span className="text-fd-muted-foreground text-sm">{s.body}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
