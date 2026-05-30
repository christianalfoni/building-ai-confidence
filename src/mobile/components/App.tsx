import { useApp } from "../../contexts/AppContext";
import { BlogList } from "./BlogList";
import { BlogPost } from "./BlogPost";

export function App() {
  const app = useApp();
  return (
    <div className="min-h-screen bg-terminal text-text font-mono">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-chrome border-b border-border">
        <span className="font-mono text-sm font-bold text-mauve">~/blog</span>
        {app.user ? (
          <span className="flex items-center gap-2">
            <img src={app.user.avatarUrl} alt={app.user.name} className="w-7 h-7 rounded-full" />
            <button
              onClick={() => app.signOut()}
              className="text-xs text-muted font-mono"
            >
              sign out
            </button>
          </span>
        ) : app.isPreview ? (
          <form method="post" action="/auth/test-login">
            <button type="submit" className="text-xs text-mauve font-mono">
              sign in (test)
            </button>
          </form>
        ) : (
          <a href="/auth/github" className="text-xs text-mauve font-mono">
            sign in
          </a>
        )}
      </header>
      <main>
        {app.selectedPostSlug ? <BlogPost /> : <BlogList />}
      </main>
    </div>
  );
}
