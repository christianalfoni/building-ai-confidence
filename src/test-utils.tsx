import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { reactive } from "reactx";
import { AppContext } from "./contexts/AppContext";
import { AppState } from "./state/AppState";
import type {
  DatabaseService,
  DbPost,
  NavigationService,
  Services,
  SessionService,
  User,
} from "./services";
import type { Route } from "./utils";

// In-memory session service for tests. Records `signOut` calls so navigation
// can be asserted without touching the network.
export class FakeSessionService implements SessionService {
  user: User | null;
  isPreview: boolean;
  signOutCalls = 0;

  constructor(opts: { user?: User | null; isPreview?: boolean } = {}) {
    this.user = opts.user ?? null;
    this.isPreview = opts.isPreview ?? false;
  }

  async preload() {}

  async signOut() {
    this.signOutCalls += 1;
  }
}

type DbOverrides = Partial<Pick<DatabaseService, "createPost" | "updatePost" | "deletePost">>;

// In-memory database service for tests. Mutations can be overridden per test;
// by default `deletePost` records the deleted ids and the others throw.
export class FakeDatabaseService implements DatabaseService {
  posts: DbPost[];
  deleted: string[] = [];
  private overrides: DbOverrides;

  constructor(opts: { posts?: DbPost[] } & DbOverrides = {}) {
    const { posts, ...overrides } = opts;
    this.posts = posts ?? [];
    this.overrides = overrides;
  }

  async preload() {}

  async createPost(authorId: string): Promise<DbPost> {
    if (this.overrides.createPost) return this.overrides.createPost(authorId);
    throw new Error("createPost not implemented");
  }

  async updatePost(
    id: string,
    fields: Partial<Pick<DbPost, "title" | "body" | "published" | "slug">>,
  ): Promise<DbPost> {
    if (this.overrides.updatePost) return this.overrides.updatePost(id, fields);
    throw new Error("updatePost not implemented");
  }

  async deletePost(id: string): Promise<void> {
    if (this.overrides.deletePost) return this.overrides.deletePost(id);
    this.deleted.push(id);
  }
}

// In-memory navigation service for tests. Records `navigate` targets.
export class FakeNavigationService implements NavigationService {
  route: Route;
  navigations: string[] = [];

  constructor(route?: Route) {
    this.route = route ?? { view: "list", postId: null };
  }

  navigate(path: string): void {
    this.navigations.push(path);
  }
}

export type CreateServicesOptions = {
  user?: User | null;
  isPreview?: boolean;
  posts?: DbPost[];
  route?: Route;
  session?: SessionService;
  database?: DatabaseService;
  navigation?: NavigationService;
};

export function createServices(opts: CreateServicesOptions = {}): Services {
  return {
    session: opts.session ?? new FakeSessionService({ user: opts.user, isPreview: opts.isPreview }),
    database: opts.database ?? new FakeDatabaseService({ posts: opts.posts }),
    navigation: opts.navigation ?? new FakeNavigationService(opts.route),
  };
}

export function createAppState(opts: CreateServicesOptions = {}): AppState {
  return reactive(new AppState(createServices(opts)));
}

export function renderWithApp(ui: ReactElement, appState: AppState) {
  return render(<AppContext value={appState}>{ui}</AppContext>);
}
