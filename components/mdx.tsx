import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Card, Cards } from 'fumadocs-ui/components/card';
import type { MDXComponents } from 'mdx/types';
import { Code } from './poc-screen-link';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // used by the generated section landing pages
    Card,
    Cards,
    // screen references (`/board`, `/requisitions/:id`) link to the live POC app
    code: Code,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
