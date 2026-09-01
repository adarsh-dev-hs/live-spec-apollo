import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, pocAppLoginUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    links: [
      {
        text: 'Release parts',
        url: '/docs/07-phases/07-00-release-model',
        description: 'The three-part release model: what ships in Part 1, 2 and 3',
      },
      {
        text: 'Original plan',
        url: '/requirement-doc',
        description: "The client's delivery plan, exactly as issued",
      },
      {
        text: 'Live POC app',
        url: pocAppLoginUrl,
        external: true,
        description: 'The screens every specification links to',
      },
    ],
  };
}
