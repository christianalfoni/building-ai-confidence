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
  it("starts with no selected post", () => {
    const state = reactive(new AppState());
    expect(state.selectedPostSlug).toBeNull();
  });

  it("selectPost sets the selected slug and view", () => {
    const state = reactive(new AppState());
    state.selectPost("building-confidence-with-ai");
    expect(state.selectedPostSlug).toBe("building-confidence-with-ai");
    expect(state.view).toBe("post");
  });

  it("goBack clears the selected slug and returns to list", () => {
    const state = reactive(new AppState());
    state.selectPost("building-confidence-with-ai");
    state.goBack();
    expect(state.selectedPostSlug).toBeNull();
    expect(state.view).toBe("list");
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
