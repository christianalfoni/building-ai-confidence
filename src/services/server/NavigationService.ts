import type { NavigationService } from '../index.ts';
import type { Route } from '../../utils.ts';

// Server-side navigation service. Carries the route parsed from the request
// path. `navigate` is browser-only — SSR is read-only and never navigates.
export class ServerNavigationService implements NavigationService {
  route: Route;

  constructor(route: Route) {
    this.route = route;
  }

  navigate(_path: string): void {
    throw new Error('navigate is browser-only');
  }
}
