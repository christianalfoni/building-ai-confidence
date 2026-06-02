import type { NavigationService } from '../index.ts';
import { parseRoute, type Route } from '../../utils.ts';

// Browser-side navigation service. Derives the route from the current URL;
// `navigate` triggers a full-page load to the given path.
export class BrowserNavigationService implements NavigationService {
  route: Route;

  constructor() {
    this.route = parseRoute(window.location.pathname);
  }

  navigate(path: string): void {
    window.location.href = path;
  }
}
