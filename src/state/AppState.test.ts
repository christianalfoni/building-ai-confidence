import { reactive } from "reactx";
import { AppState } from "./AppState";
import type { DbPost, User } from "../services";
import { FakeDatabaseService, FakeMediaService, FakeNavigationService, FakeSessionService } from "../test-utils";
import type { Route } from "../utils";

function makeUser(githubLogin: string): User {
  return { id: "u1", githubId: 1, githubLogin, name: "Test", avatarUrl: "" };
}

function makePost(overrides: Partial<DbPost> = {}): DbPost {
  return {
    id: "p1",
    authorId: "u1",
    slug: "my-post",
    title: "My Post",
    body: "Hello",
    published: false,
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
    ...overrides,
  };
}

function makeState(opts: {
  user?: User | null;
  isPreview?: boolean;
  posts?: DbPost[];
  route?: Route;
  database?: FakeDatabaseService;
  navigation?: FakeNavigationService;
} = {}): AppState {
  const session = new FakeSessionService({ user: opts.user, isPreview: opts.isPreview });
  const database = opts.database ?? new FakeDatabaseService({ posts: opts.posts });
  const navigation = opts.navigation ?? new FakeNavigationService(opts.route);
  const media = new FakeMediaService();
  return reactive(new AppState({ session, database, navigation, media }));
}

describe("AppState", () => {
  it("defaults to the list view with no selected post", () => {
    const state = makeState();
    expect(state.view).toBe("list");
    expect(state.selectedPostId).toBeNull();
  });

  describe("route-driven init", () => {
    it("starts on the post view for a post route", () => {
      const state = makeState({ route: { view: "post", postId: "p1" } });
      expect(state.view).toBe("post");
      expect(state.selectedPostId).toBe("p1");
    });

    it("starts on the list view for a list route", () => {
      const state = makeState({ route: { view: "list", postId: null } });
      expect(state.view).toBe("list");
      expect(state.selectedPostId).toBeNull();
    });
  });

  describe("selectedPost / postNotFound", () => {
    it("resolves the selected post by id", () => {
      const post = makePost({ id: "p1", published: true });
      const state = makeState({ posts: [post], route: { view: "post", postId: "p1" } });
      expect(state.selectedPost?.id).toBe("p1");
      expect(state.postNotFound).toBe(false);
    });

    it("flags postNotFound when the post is missing from the visible set", () => {
      const state = makeState({ route: { view: "post", postId: "missing" } });
      expect(state.selectedPost).toBeNull();
      expect(state.postNotFound).toBe(true);
    });

    it("never flags postNotFound on the list view", () => {
      const state = makeState({ route: { view: "list", postId: null } });
      expect(state.postNotFound).toBe(false);
    });
  });

  describe("closeEditor", () => {
    it("returns to the post view when a post is selected", () => {
      const post = makePost({ id: "p1", published: true });
      const state = makeState({ user: makeUser("test"), posts: [post], route: { view: "post", postId: "p1" } });
      state.openEditor("p1");
      expect(state.view).toBe("editor");
      state.closeEditor();
      expect(state.view).toBe("post");
      expect(state.draftPostId).toBeNull();
    });

    it("returns to the list view when no post is selected", () => {
      const state = makeState({ user: makeUser("test") });
      state.openEditor("unknown");
      state.closeEditor();
      expect(state.view).toBe("list");
      expect(state.draftPostId).toBeNull();
    });
  });

  describe("isAuthor", () => {
    it("returns true for allowed logins", () => {
      expect(makeState({ user: makeUser("christianalfoni") }).isAuthor).toBe(true);
      expect(makeState({ user: makeUser("test") }).isAuthor).toBe(true);
    });

    it("returns false for disallowed logins", () => {
      expect(makeState({ user: makeUser("someoneelse") }).isAuthor).toBe(false);
    });

    it("returns false when not signed in", () => {
      expect(makeState({ user: null }).isAuthor).toBe(false);
    });
  });

  describe("openEditor", () => {
    it("sets view to editor and initializes draft fields from the post", () => {
      const post = makePost({ title: "Draft Title", published: true });
      const state = makeState({ user: makeUser("test"), posts: [post] });
      state.openEditor("p1");
      expect(state.view).toBe("editor");
      expect(state.draftPostId).toBe("p1");
      expect(state.draftTitle).toBe("Draft Title");
      expect(state.draftPublished).toBe(true);
    });

    it("defaults draft fields when post not found", () => {
      const state = makeState({ user: makeUser("test") });
      state.openEditor("unknown");
      expect(state.draftTitle).toBe("");
      expect(state.draftPublished).toBe(false);
    });
  });

  describe("updateDbPost", () => {
    it("updates an existing post in-place", () => {
      const post = makePost();
      const state = makeState({ posts: [post] });
      const updated = makePost({ title: "Updated" });
      state.updateDbPost(updated);
      expect(state.dbPosts[0].title).toBe("Updated");
      expect(state.dbPosts).toHaveLength(1);
    });

    it("prepends a new post when not found", () => {
      const state = makeState();
      state.updateDbPost(makePost());
      expect(state.dbPosts).toHaveLength(1);
      expect(state.dbPosts[0].id).toBe("p1");
    });
  });

  describe("deletePost", () => {
    it("calls database.deletePost, removes the post, and navigates home", async () => {
      const database = new FakeDatabaseService({ posts: [makePost({ id: "p1" })] });
      const navigation = new FakeNavigationService({ view: "post", postId: "p1" });
      const state = makeState({ user: makeUser("test"), database, navigation });

      await state.deletePost("p1");

      expect(database.deleted).toEqual(["p1"]);
      expect(state.dbPosts).toHaveLength(0);
      expect(navigation.navigations).toEqual(["/"]);
    });

    it("throws and keeps the post when the delete fails", async () => {
      const database = new FakeDatabaseService({
        posts: [makePost({ id: "p1" })],
        deletePost: async () => { throw new Error("boom"); },
      });
      const navigation = new FakeNavigationService({ view: "post", postId: "p1" });
      const state = makeState({ user: makeUser("test"), database, navigation });

      await expect(state.deletePost("p1")).rejects.toThrow("boom");
      expect(state.dbPosts).toHaveLength(1);
      expect(navigation.navigations).toEqual([]);
    });
  });
});
