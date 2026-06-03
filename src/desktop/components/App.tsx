import { useApp } from "../../contexts/AppContext";
import type { AppState } from "../../state/AppState";
import { BlogList } from "./BlogList";
import { BlogPost } from "./BlogPost";
import { BlogEditor } from "./BlogEditor";

function getPageTitle(app: AppState): string {
  if (app.view === "editor") return "new post — Claude in the Cloud";
  if (app.view === "post") {
    return app.selectedPost
      ? `${app.selectedPost.title || "Untitled"} — Claude in the Cloud`
      : "404 — Claude in the Cloud";
  }
  return "Claude in the Cloud";
}

export function App() {
  const app = useApp();
  const title = getPageTitle(app);

  return (
    <div className="min-h-screen bg-base flex items-start justify-center p-8">
      <div className="w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl border border-border">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-chrome border-b border-border">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
          <span className="flex-1 text-center text-xs font-mono text-muted">{title}</span>
          <div className="flex items-center gap-3">
            {app.user ? (
              <span className="flex items-center gap-2">
                <img
                  src={app.user.avatarUrl}
                  alt={app.user.name}
                  className="w-5 h-5 rounded-full"
                />
                <button
                  onClick={() => app.signOut()}
                  className="text-xs text-muted hover:text-text cursor-pointer transition-colors font-mono"
                >
                  sign out
                </button>
              </span>
            ) : app.isPreview ? (
              <form method="post" action="/auth/test-login">
                <button
                  type="submit"
                  className="text-xs text-mauve hover:text-text cursor-pointer transition-colors font-mono"
                >
                  sign in (test)
                </button>
              </form>
            ) : (
              <a
                href="/auth/github"
                className="text-xs text-mauve hover:text-text transition-colors font-mono"
              >
                sign in
              </a>
            )}
          </div>
        </div>
        {/* Content */}
        <div className="p-6 bg-terminal font-mono">
          {app.view === "editor" ? (
            <BlogEditor />
          ) : app.view === "post" ? (
            <BlogPost />
          ) : (
            <BlogList />
          )}
        </div>
      </div>
    </div>
  );
}
