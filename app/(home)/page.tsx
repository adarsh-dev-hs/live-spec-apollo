import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Cable,
  Compass,
  Layers,
  Rocket,
  Ruler,
  type LucideIcon,
} from 'lucide-react';

const sections: {
  href: string;
  title: string;
  icon: LucideIcon;
  description: string;
  count: string;
}[] = [
  {
    href: '/docs/00-foundation/00-01-product-context',
    title: 'Foundation',
    icon: Compass,
    description: 'What the business does, how the system is shaped, every entity in one place.',
    count: '6 documents',
  },
  {
    href: '/docs/01-standards/01-01-repository-layout',
    title: 'Standards',
    icon: Ruler,
    description: 'House rules. Read once, obey always — every spec below assumes them.',
    count: '10 documents',
  },
  {
    href: '/docs/02-platform/02-01-identity-and-access',
    title: 'Platform',
    icon: Layers,
    description: 'Shared components, each a dependency of two or more business modules.',
    count: '13 components',
  },
  {
    href: '/docs/03-modules/03-01-clients',
    title: 'Modules',
    icon: Boxes,
    description: 'The business modules. One spec = one implementation session.',
    count: '21 modules',
  },
  {
    href: '/docs/04-integrations/04-01-integration-register',
    title: 'Integrations',
    icon: Cable,
    description: 'Every external system the platform touches, with status and failure modes.',
    count: '6 documents',
  },
  {
    href: '/docs/05-delivery/05-01-build-order',
    title: 'Delivery',
    icon: Rocket,
    description: 'Dependency-ordered build sequence, the playbook, and the open decisions.',
    count: '3 documents',
  },
];

const stack = [
  ['Backend', 'Node.js 22 · TypeScript · Express 5'],
  ['Frontend', 'React 19 + Vite · TanStack Query · Tailwind'],
  ['Database', 'PostgreSQL 16 (RDS, ap-south-1)'],
  ['Cache / queue', 'Redis 7 · BullMQ'],
  ['Object store', 'Amazon S3 (versioned, KMS)'],
  ['Hosting', 'AWS ap-south-1 only · ECS Fargate'],
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-12">
        <p className="text-sm font-medium text-fd-muted-foreground">
          Apollo Knowledge Services
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Engineering documentation
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-fd-muted-foreground">
          The engineering translation of the six-month delivery plan — organised by what gets built
          and deployed rather than by when it is sold. 34 components, each a self-contained,
          independently implementable spec.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Read the documentation
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/00-foundation/00-01-product-context"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Start with product context
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ href, title, icon: Icon, description, count }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
            >
              <Icon className="size-5 text-fd-muted-foreground" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-fd-muted-foreground">{description}</p>
              <p className="mt-3 text-xs font-medium text-fd-muted-foreground">{count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="text-sm font-semibold tracking-wide text-fd-muted-foreground uppercase">
          Stack
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {stack.map(([layer, choice]) => (
            <div
              key={layer}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-fd-border pb-3"
            >
              <dt className="text-sm font-medium">{layer}</dt>
              <dd className="text-sm text-fd-muted-foreground">{choice}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-fd-muted-foreground">
          All personal data stays in <code className="text-fd-foreground">ap-south-1</code>. That is
          a DPDP requirement, not a preference.
        </p>
      </section>
    </main>
  );
}
