import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    links: [
      {
        text: 'Original plan',
        url: '/requirement-doc',
        description: "The client's delivery plan, exactly as issued",
      },
    ],
  };
}
