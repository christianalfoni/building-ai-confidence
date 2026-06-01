import { reactive } from "reactx";
import { AppState } from "./AppState";
import type { DbPost, User } from "../services";

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

describe("AppState", () => {
  it("defaults to the list view with no selected post", () => {
    const state = reactive(new AppState());
    expect(state.view).toBe("list");
    expect(state.selectedPostId).toBeNull();
  });

  describe("route-driven init", () => {
    it("starts on the post view for a post route", () => {
      const state = reactive(new AppState(null, false, [], null, { view: "post", postId: "p1" }));
      expect(state.view).toBe("post");
      expect(state.selectedPostId).toBe("p1");
    });

    it("starts on the list view for a list route", () => {
      const state = reactive(new AppState(null, false, [], null, { view: "list", postId: null }));
      expect(state.view).toBe("list");
      expect(state.selectedPostId).toBeNull();
    });
  });

  describe("selectedPost / postNotFound", () => {
    it("resolves the selected post by id", () => {
      const post = makePost({ id: "p1", published: true });
      const state = reactive(new AppState(null, false, [post], null, { view: "post", postId: "p1" }));
      expect(state.selectedPost?.id).toBe("p1");
      expect(state.postNotFound).toBe(false);
    });

    it("flags postNotFound when the post is missing from the visible set", () => {
      const state = reactive(new AppState(null, false, [], null, { view: "post", postId: "missing" }));
      expect(state.selectedPost).toBeNull();
      expect(state.postNotFound).toBe(true);
    });

    it("never flags postNotFound on the list view", () => {
      const state = reactive(new AppState(null, false, [], null, { view: "list", postId: null }));
      expect(state.postNotFound).toBe(false);
    });
  });

  describe("closeEditor", () => {
    it("returns to the post view when a post is selected", () => {
      const post = makePost({ id: "p1", published: true });
      const state = reactive(new AppState(makeUser("test"), false, [post], null, { view: "post", postId: "p1" }));
      state.openEditor("p1");
      expect(state.view).toBe("editor");
      state.closeEditor();
      expect(state.view).toBe("post");
      expect(state.draftPostId).toBeNull();
    });

    it("returns to the list view when no post is selected", () => {
      const state = reactive(new AppState(makeUser("test"), false, []));
      state.openEditor("unknown");
      state.closeEditor();
      expect(state.view).toBe("list");
      expect(state.draftPostId).toBeNull();
    });
  });

  describe("isAuthor", () => {
    it("returns true for allowed logins", () => {
      expect(new AppState(makeUser("christianalfoni")).isAuthor).toBe(true);
      expect(new AppState(makeUser("test")).isAuthor).toBe(true);
    });

    it("returns false for disallowed logins", () => {
      expect(new AppState(makeUser("someoneelse")).isAuthor).toBe(false);
    });

    it("returns false when not signed in", () => {
      expect(new AppState(null).isAuthor).toBe(false);
    });
  });

  describe("openEditor", () => {
    it("sets view to editor and initializes draft fields from the post", () => {
      const post = makePost({ title: "Draft Title", published: true });
      const state = reactive(new AppState(makeUser("test"), false, [post]));
      state.openEditor("p1");
      expect(state.view).toBe("editor");
      expect(state.draftPostId).toBe("p1");
      expect(state.draftTitle).toBe("Draft Title");
      expect(state.draftPublished).toBe(true);
    });

    it("defaults draft fields when post not found", () => {
      const state = reactive(new AppState(makeUser("test"), false, []));
      state.openEditor("unknown");
      expect(state.draftTitle).toBe("");
      expect(state.draftPublished).toBe(false);
    });
  });

  describe("updateDbPost", () => {
    it("updates an existing post in-place", () => {
      const post = makePost();
      const state = reactive(new AppState(null, false, [post]));
      const updated = makePost({ title: "Updated" });
      state.updateDbPost(updated);
      expect(state.dbPosts[0].title).toBe("Updated");
      expect(state.dbPosts).toHaveLength(1);
    });

    it("prepends a new post when not found", () => {
      const state = reactive(new AppState(null, false, []));
      state.updateDbPost(makePost());
      expect(state.dbPosts).toHaveLength(1);
      expect(state.dbPosts[0].id).toBe("p1");
    });
  });
});
