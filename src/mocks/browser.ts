import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Used in browser environments (e.g. Storybook, manual dev testing).
// Playwright E2E tests use page.route() instead of this service worker.
export const worker = setupWorker(...handlers);
