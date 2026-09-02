import type { ComponentPropsWithoutRef } from 'react';
import { pocScreenUrl } from '@/lib/poc-routes';
import { cn } from '@/lib/cn';

/**
 * Inline code that names a live POC screen becomes a link to it.
 *
 * Every screen reference in the docs is written as inline code (`` `/board` ``), so
 * one `code` override links them all — the release parts, the module specs, anywhere
 * a route is quoted. Only references the POC actually serves are linked; the rest
 * render as ordinary code. See `lib/poc-routes.ts` for that list.
 */
export function Code({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) {
  // Highlighted code blocks arrive as span children under a language class. Only a
  // bare string is a candidate — never reach into a block and linkify its tokens.
  const href =
    typeof children === 'string' && !className ? pocScreenUrl(children) : null;

  if (!href) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title="Open this screen in the live POC app"
      className="no-underline decoration-from-font underline-offset-2 hover:underline"
    >
      <code
        className={cn(
          'transition-colors text-fd-primary border-fd-primary/25 hover:border-fd-primary/60',
        )}
        {...props}
      >
        {children}
      </code>
    </a>
  );
}
