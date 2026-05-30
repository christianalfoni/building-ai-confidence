import { createAppState } from "../test-utils";

describe("AppState", () => {
  it("starts with no selected post", () => {
    const state = createAppState();
    expect(state.selectedPostSlug).toBeNull();
  });

  it("selectPost sets the selected slug", () => {
    const state = createAppState();
    state.selectPost("building-confidence-with-ai");
    expect(state.selectedPostSlug).toBe("building-confidence-with-ai");
  });

  it("goBack clears the selected slug", () => {
    const state = createAppState();
    state.selectPost("building-confidence-with-ai");
    state.goBack();
    expect(state.selectedPostSlug).toBeNull();
  });
});
