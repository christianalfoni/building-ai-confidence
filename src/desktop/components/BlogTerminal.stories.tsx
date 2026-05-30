const POSTS = [
  {
    slug: "building-confidence-with-ai",
    title: "Building Confidence with AI",
    date: "2026-05-30",
    readTime: "8m",
    tags: ["ai", "productivity"],
    excerpt:
      "When I first started using AI tools in my daily workflow, I was skeptical. Not of the technology itself, but of whether it would actually change how I worked in any meaningful way.",
  },
  {
    slug: "the-case-for-terminal-ux",
    title: "The Case for Terminal UX",
    date: "2026-05-15",
    readTime: "5m",
    tags: ["design", "ux"],
    excerpt:
      "There is something deeply satisfying about an interface that trusts you. No wizards, no confirmations, no hand-holding. Just a prompt and the full power of the system.",
  },
  {
    slug: "why-typescript-still-matters",
    title: "Why TypeScript Still Matters",
    date: "2026-04-22",
    readTime: "12m",
    tags: ["typescript", "dev"],
    excerpt:
      "Every few months someone publishes a hot take about dropping TypeScript. Here is why they are missing the point.",
  },
  {
    slug: "reviewing-claude-code",
    title: "Reviewing Claude Code",
    date: "2026-04-10",
    readTime: "4m",
    tags: ["ai", "tools"],
    excerpt:
      "I have been using Claude Code for six weeks. Here is an honest assessment of what it gets right, what it gets wrong, and where it is headed.",
  },
  {
    slug: "the-vibe-coding-trap",
    title: "The Vibe Coding Trap",
    date: "2026-03-28",
    readTime: "7m",
    tags: ["ai", "craft"],
    excerpt:
      "Vibe coding is seductive. Let the AI write everything and ship fast. But there is a compounding cost that nobody talks about.",
  },
  {
    slug: "building-in-public",
    title: "Building in Public",
    date: "2026-03-14",
    readTime: "6m",
    tags: ["indie", "transparency"],
    excerpt:
      "Twelve months of sharing work-in-progress, revenue numbers, and failures. What I learned and what I would do differently.",
  },
];

// ─── Shared window chrome ────────────────────────────────────────────────────

function WindowChrome({
  title,
  children,
  bg = "#0D1117",
}: {
  title: string;
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-8"
      style={{ background: "#070B10" }}
    >
      <div
        className="w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl"
        style={{ background: bg, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
          <span
            className="flex-1 text-center text-xs font-mono"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {title}
          </span>
        </div>
        {/* Content */}
        <div className="p-6 font-mono text-sm">{children}</div>
      </div>
    </div>
  );
}

// ─── Story 1: Classic Green ───────────────────────────────────────────────────

function GreenPrompt({ path = "~" }: { path?: string }) {
  return (
    <span>
      <span style={{ color: "#56D364" }}>visitor</span>
      <span style={{ color: "rgba(255,255,255,0.3)" }}>@</span>
      <span style={{ color: "#79C0FF" }}>blog</span>
      <span style={{ color: "rgba(255,255,255,0.3)" }}>:</span>
      <span style={{ color: "#F0883E" }}>{path}</span>
      <span style={{ color: "rgba(255,255,255,0.3)" }}>$ </span>
    </span>
  );
}

function ClassicGreenBlogList() {
  return (
    <WindowChrome title="christian alfoni — blog">
      <div style={{ color: "#C9D1D9" }} className="space-y-1">
        {/* Welcome */}
        <div style={{ color: "rgba(255,255,255,0.25)" }} className="mb-4 text-xs">
          Last login: Sat May 30 09:14:22 on ttys001
        </div>

        {/* ls command */}
        <div className="flex gap-2">
          <GreenPrompt path="~/posts" />
          <span style={{ color: "#C9D1D9" }}>ls -la</span>
        </div>

        {/* Output header */}
        <div style={{ color: "rgba(255,255,255,0.3)" }} className="mt-3 mb-1 text-xs">
          total {POSTS.length} posts
        </div>

        {/* Post entries */}
        <div className="space-y-1">
          {POSTS.map((post) => (
            <div
              key={post.slug}
              className="flex items-baseline gap-3 group cursor-pointer"
            >
              <span style={{ color: "rgba(255,255,255,0.2)" }} className="text-xs">
                -rw-r--r--
              </span>
              <span style={{ color: "#79C0FF" }} className="text-xs w-24 shrink-0">
                {post.date}
              </span>
              <span
                className="flex-1 truncate"
                style={{ color: "#56D364" }}
              >
                {post.slug}.md
              </span>
              <span style={{ color: "#F0883E" }} className="text-xs shrink-0">
                {post.readTime}
              </span>
              <span style={{ color: "rgba(255,255,255,0.2)" }} className="text-xs shrink-0">
                [{post.tags.join(", ")}]
              </span>
            </div>
          ))}
        </div>

        {/* Prompt */}
        <div className="flex gap-2 mt-4">
          <GreenPrompt path="~/posts" />
          <span className="inline-block w-2 h-4 bg-[#56D364] animate-pulse align-middle" />
        </div>
      </div>
    </WindowChrome>
  );
}

export function classicGreen() {
  return { element: <ClassicGreenBlogList /> };
}

// ─── Story 2: Modern Dark ────────────────────────────────────────────────────

function ModernDarkBlogList() {
  return (
    <WindowChrome title="christian alfoni — blog" bg="#13161D">
      <div className="space-y-6" style={{ color: "#CDD6F4" }}>
        {/* Header */}
        <div>
          <div style={{ color: "#CBA6F7" }} className="text-lg font-bold mb-1">
            ~/posts
          </div>
          <div style={{ color: "#6C7086" }} className="text-xs">
            {POSTS.length} entries · sorted by date · newest first
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Post list */}
        <div className="space-y-4">
          {POSTS.map((post, i) => (
            <div key={post.slug} className="group cursor-pointer">
              <div className="flex items-center gap-3 mb-1">
                <span style={{ color: "#45475A" }} className="text-xs w-4 text-right shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ color: "#89DCEB" }} className="font-semibold">
                  {post.title}
                </span>
                <span
                  style={{
                    background: "rgba(203,166,247,0.12)",
                    color: "#CBA6F7",
                  }}
                  className="ml-auto text-xs px-2 py-0.5 rounded"
                >
                  {post.readTime} read
                </span>
              </div>
              <div className="flex items-center gap-3 ml-7">
                <span style={{ color: "#6C7086" }} className="text-xs">
                  {post.date}
                </span>
                <span style={{ color: "#45475A" }}>·</span>
                <div className="flex gap-1">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      style={{ color: "#A6E3A1", background: "rgba(166,227,161,0.1)" }}
                      className="text-xs px-1.5 py-0.5 rounded"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ color: "#585B70" }} className="text-xs mt-1.5 ml-7 leading-relaxed line-clamp-1">
                {post.excerpt}
              </div>
            </div>
          ))}
        </div>

        {/* Prompt */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-4">
          <div className="flex items-center gap-2">
            <span style={{ color: "#CBA6F7" }}>❯</span>
            <span className="inline-block w-2 h-4 bg-[#CBA6F7] opacity-80 animate-pulse" />
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}

export function modernDark() {
  return { element: <ModernDarkBlogList /> };
}

// ─── Story 3: Amber Retro ────────────────────────────────────────────────────

function AmberBlogList() {
  return (
    <WindowChrome title="christian alfoni — blog" bg="#0F0A00">
      <div style={{ color: "#FFB347", fontFamily: "'Courier New', monospace" }} className="space-y-2">
        {/* Scanline effect illusion via top banner */}
        <div className="text-center mb-6 space-y-1">
          <div style={{ color: "#FF8C00" }} className="text-lg tracking-widest">
            ████████████████████████████████
          </div>
          <div style={{ color: "#FFB347" }} className="text-base tracking-widest font-bold">
            CHRISTIAN ALFONI BLOG SYSTEM v1.0
          </div>
          <div style={{ color: "#FF8C00" }} className="text-lg tracking-widest">
            ████████████████████████████████
          </div>
        </div>

        <div style={{ color: "#CC8800" }} className="text-xs mb-4">
          READY. ENTER COMMAND OR SELECT ENTRY:
        </div>

        {/* Post list */}
        <div className="space-y-1.5">
          {POSTS.map((post, i) => (
            <div key={post.slug} className="flex items-center gap-3 cursor-pointer group">
              <span style={{ color: "#FF8C00" }} className="shrink-0">
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span className="flex-1" style={{ color: "#FFD080" }}>
                {post.title.toUpperCase()}
              </span>
              <span style={{ color: "#CC8800" }} className="text-xs shrink-0">
                {post.date}
              </span>
              <span style={{ color: "#FF8C00" }} className="text-xs shrink-0">
                {post.readTime}
              </span>
            </div>
          ))}
        </div>

        <div style={{ color: "#CC8800" }} className="text-xs mt-6 mb-2">
          ──────────────────────────────────────────────────────
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: "#FF8C00" }}>SELECT&gt;</span>
          <span
            className="inline-block w-3 h-4 animate-pulse"
            style={{ background: "#FFB347" }}
          />
        </div>
      </div>
    </WindowChrome>
  );
}

export function amberRetro() {
  return { element: <AmberBlogList /> };
}

// ─── Story 4: Post Reading View ──────────────────────────────────────────────

function PostReadingView() {
  const post = POSTS[0];
  const bodyParagraphs = [
    "When I first started using AI tools in my daily workflow, I was skeptical. Not of the technology itself — I could see it was impressive — but of whether it would actually change how I worked in any meaningful way.",
    "Six months later, I can say it has. But not in the ways I expected. The productivity gains are real, but they come with a hidden cost: confidence erosion. When the AI writes your code, designs your component, or drafts your email, a small part of you starts to wonder: could I have done this without it?",
    "The answer matters. Not because AI assistance is bad — it isn't — but because knowing your own capability floor is essential for trusting your own judgement. You need to know when to push back on the AI, when its suggestion is subtly wrong, when the shortcut it's offering will create debt downstream.",
  ];

  return (
    <WindowChrome title={`${post.slug}.md — blog`} bg="#13161D">
      <div style={{ color: "#CDD6F4" }} className="space-y-4">
        {/* cat command */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6C7086" }}>
          <span style={{ color: "#CBA6F7" }}>❯</span>
          <span>cat {post.slug}.md</span>
        </div>

        {/* Post header */}
        <div
          className="rounded p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div style={{ color: "#89DCEB" }} className="text-xl font-bold leading-snug">
            {post.title}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#6C7086" }}>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime} read</span>
            <span>·</span>
            <div className="flex gap-1">
              {post.tags.map((t) => (
                <span
                  key={t}
                  style={{ color: "#A6E3A1", background: "rgba(166,227,161,0.1)" }}
                  className="px-1.5 py-0.5 rounded"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ color: "#45475A" }} className="text-xs">
          {"─".repeat(60)}
        </div>

        {/* Body */}
        <div className="space-y-3">
          {bodyParagraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "#BAC2DE" }}>
              {p}
            </p>
          ))}
        </div>

        {/* Page indicator */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            color: "#45475A",
          }}
          className="pt-3 flex items-center justify-between text-xs"
        >
          <span>── page 1 of 3 ──</span>
          <span style={{ color: "#6C7086" }}>SPACE next · b back · q quit · / search</span>
        </div>
      </div>
    </WindowChrome>
  );
}

export function postView() {
  return { element: <PostReadingView /> };
}
