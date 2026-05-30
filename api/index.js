// server/index.ts
import express from "express";
import { randomBytes } from "node:crypto";

// src/services/server/DatabaseService.ts
import { neon } from "@neondatabase/serverless";
var NeonDatabaseService = class {
  sql;
  constructor(connectionString) {
    this.sql = neon(connectionString);
  }
  async getUser(sessionId) {
    const rows = await this.sql`
      SELECT u.id, u.github_id, u.github_login, u.name, u.avatar_url
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `;
    if (!rows[0]) return null;
    const r = rows[0];
    return { id: r.id, githubId: r.github_id, githubLogin: r.github_login, name: r.name, avatarUrl: r.avatar_url };
  }
  async upsertUser(githubId, githubLogin, name, avatarUrl) {
    const rows = await this.sql`
      INSERT INTO users (github_id, github_login, name, avatar_url)
      VALUES (${githubId}, ${githubLogin}, ${name}, ${avatarUrl})
      ON CONFLICT (github_id) DO UPDATE SET github_login = EXCLUDED.github_login, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
      RETURNING id, github_id, github_login, name, avatar_url
    `;
    const r = rows[0];
    return { id: r.id, githubId: r.github_id, githubLogin: r.github_login, name: r.name, avatarUrl: r.avatar_url };
  }
  async createSession(userId) {
    const rows = await this.sql`
      INSERT INTO sessions (user_id, expires_at)
      VALUES (${userId}, NOW() + INTERVAL '30 days')
      RETURNING id
    `;
    return rows[0].id;
  }
  async deleteSession(sessionId) {
    await this.sql`DELETE FROM sessions WHERE id = ${sessionId}`;
  }
  async getPosts() {
    const rows = await this.sql`
      SELECT id, author_id, slug, title, body, published, created_at, updated_at
      FROM posts
      ORDER BY created_at DESC
    `;
    return rows.map(toDbPost);
  }
  async createPost(authorId) {
    const rows = await this.sql`
      INSERT INTO posts (author_id) VALUES (${authorId})
      RETURNING id, author_id, slug, title, body, published, created_at, updated_at
    `;
    return toDbPost(rows[0]);
  }
  async updatePost(id, fields) {
    const slug = fields.slug !== void 0 ? fields.slug : fields.title !== void 0 ? slugify(fields.title) || id : void 0;
    const rows = await this.sql`
      UPDATE posts SET
        title      = COALESCE(${fields.title ?? null}, title),
        body       = COALESCE(${fields.body ?? null}, body),
        published  = COALESCE(${fields.published ?? null}, published),
        slug       = COALESCE(${slug ?? null}, slug),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, author_id, slug, title, body, published, created_at, updated_at
    `;
    return toDbPost(rows[0]);
  }
};
function toDbPost(r) {
  return {
    id: r.id,
    authorId: r.author_id,
    slug: r.slug,
    title: r.title,
    body: r.body,
    published: r.published,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString()
  };
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// src/entry-server.tsx
import { renderToPipeableStream } from "react-dom/server";
import { StrictMode, Suspense } from "react";
import { readFileSync } from "node:fs";
import { Transform } from "node:stream";
import { join } from "node:path";

// src/contexts/AppContext.ts
import { createContext, useContext } from "react";

// src/state/AppState.ts
var AUTHOR_LOGINS = ["christianalfoni", "test"];
var AppState = class {
  user;
  isPreview;
  view = "list";
  selectedPostSlug = null;
  draftPostId = null;
  draftTitle = "";
  draftPublished = false;
  dbPosts = [];
  db;
  constructor(user = null, isPreview = false, dbPosts = [], db = null) {
    this.user = user;
    this.isPreview = isPreview;
    this.dbPosts = dbPosts;
    this.db = db;
  }
  get isAuthor() {
    return !!this.user && AUTHOR_LOGINS.includes(this.user.githubLogin);
  }
  selectPost(slug) {
    this.selectedPostSlug = slug;
    this.view = "post";
  }
  setDraftTitle(title) {
    this.draftTitle = title;
  }
  setDraftPublished(published) {
    this.draftPublished = published;
  }
  openEditor(postId) {
    const post = this.dbPosts.find((p) => p.id === postId);
    this.draftPostId = postId;
    this.draftTitle = post?.title ?? "";
    this.draftPublished = post?.published ?? false;
    this.view = "editor";
  }
  goBack() {
    this.selectedPostSlug = null;
    this.draftPostId = null;
    this.view = "list";
  }
  updateDbPost(post) {
    const idx = this.dbPosts.findIndex((p) => p.id === post.id);
    if (idx >= 0) {
      this.dbPosts[idx] = post;
    } else {
      this.dbPosts.unshift(post);
    }
  }
  async createPost() {
    if (!this.db || !this.user) return;
    const post = await this.db.createPost(this.user.id);
    this.updateDbPost(post);
    this.openEditor(post.id);
  }
  async savePost(fields) {
    if (!this.db || !this.draftPostId) return;
    const post = await this.db.updatePost(this.draftPostId, fields);
    this.updateDbPost(post);
  }
  signOut() {
    fetch("/auth/logout", { method: "POST" }).then(() => {
      window.location.href = "/";
    });
  }
};

// src/utils.ts
function isMobileUA(ua) {
  return /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
function invariant(value, error) {
  if (!value) {
    throw new Error(error);
  }
}

// src/contexts/AppContext.ts
var AppContext = createContext(null);
function useApp() {
  const appState = useContext(AppContext);
  invariant(appState, "No AppState available");
  return appState;
}

// src/desktop/ui-components/Tag.tsx
import { jsxs } from "react/jsx-runtime";
function Tag({ label }) {
  return /* @__PURE__ */ jsxs("span", { className: "text-xs text-green bg-green/10 px-1.5 py-0.5 rounded font-mono", children: [
    "#",
    label
  ] });
}

// src/data/posts.ts
var posts = [
  {
    slug: "building-confidence-with-ai",
    title: "Building Confidence with AI",
    date: "2026-05-30",
    readTime: "8m",
    tags: ["ai", "productivity"],
    excerpt: "When I first started using AI tools in my daily workflow, I was skeptical. Not of the technology itself, but of whether it would actually change how I worked in any meaningful way.",
    body: [
      "When I first started using AI tools in my daily workflow, I was skeptical. Not of the technology itself \u2014 I could see it was impressive \u2014 but of whether it would actually change how I worked in any meaningful way.",
      "Six months later, I can say it has. But not in the ways I expected. The productivity gains are real, but they come with a hidden cost: confidence erosion. When the AI writes your code, designs your component, or drafts your email, a small part of you starts to wonder: could I have done this without it?",
      "The answer matters. Not because AI assistance is bad \u2014 it isn't \u2014 but because knowing your own capability floor is essential for trusting your own judgement. You need to know when to push back on the AI, when its suggestion is subtly wrong, when the shortcut it's offering will create debt downstream.",
      "The developers I see thriving with AI are not the ones who outsource their thinking. They are the ones who use AI as a multiplier on thinking they were already doing well. They have strong opinions about architecture. They can spot a bad abstraction. They know what good looks like.",
      "Building that foundation is what this blog is about. Not tutorials, not hot takes. Just honest writing about the craft of software development in an era where the tools are changing faster than our ability to evaluate them.",
      "If you are reading this wondering whether AI is making you a better or worse developer \u2014 that question itself is a good sign. Keep asking it."
    ]
  }
];

// src/desktop/components/BlogList.tsx
import { Fragment, jsx, jsxs as jsxs2 } from "react/jsx-runtime";
function dbPostToPost(p) {
  return {
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    date: p.createdAt.slice(0, 10),
    readTime: "?m",
    tags: [],
    excerpt: p.body.slice(0, 120),
    body: p.body.split("\n\n").filter(Boolean)
  };
}
function BlogList() {
  const app2 = useApp();
  const visibleDbPosts = app2.dbPosts.filter(
    (p) => p.published || app2.isAuthor && p.authorId === app2.user?.id
  );
  const allPosts = [
    ...visibleDbPosts.map(dbPostToPost),
    ...posts
  ].sort((a, b) => b.date.localeCompare(a.date));
  function handleNewPost() {
    app2.createPost();
  }
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-6 font-mono text-sm text-text", children: [
    /* @__PURE__ */ jsxs2("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-mauve mb-1", children: "~/posts" }),
      /* @__PURE__ */ jsxs2("div", { className: "text-xs text-muted", children: [
        allPosts.length,
        " ",
        allPosts.length === 1 ? "entry" : "entries",
        " \xB7 sorted by date \xB7 newest first"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-border" }),
    /* @__PURE__ */ jsxs2("div", { className: "space-y-4", children: [
      app2.isAuthor && /* @__PURE__ */ jsx(
        "div",
        {
          className: "group cursor-pointer opacity-50 hover:opacity-100 transition-opacity",
          onClick: handleNewPost,
          children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3 mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-dim w-4 text-right shrink-0", children: "+" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted group-hover:text-mauve transition-colors italic", children: "new post..." })
          ] })
        }
      ),
      allPosts.map((post, i) => /* @__PURE__ */ jsxs2(
        "div",
        {
          className: "group cursor-pointer",
          onClick: () => app2.selectPost(post.slug),
          children: [
            /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3 mb-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-dim w-4 text-right shrink-0", children: String(i + 1).padStart(2, "0") }),
              /* @__PURE__ */ jsx("span", { className: "text-teal font-semibold group-hover:text-mauve transition-colors", children: post.title }),
              /* @__PURE__ */ jsxs2("span", { className: "ml-auto text-xs text-mauve bg-mauve/10 px-2 py-0.5 rounded shrink-0", children: [
                post.readTime,
                " read"
              ] })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 ml-7", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted", children: post.date }),
              post.tags.length > 0 && /* @__PURE__ */ jsxs2(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "text-dim", children: "\xB7" }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: post.tags.map((t) => /* @__PURE__ */ jsx(Tag, { label: t }, t)) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-dim mt-1.5 ml-7 leading-relaxed line-clamp-1", children: post.excerpt })
          ]
        },
        post.slug
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-border pt-4", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-mauve", children: "\u276F" }),
      /* @__PURE__ */ jsx("span", { className: "inline-block w-2 h-4 bg-mauve/80 animate-pulse" })
    ] }) })
  ] });
}

// src/desktop/components/BlogPost.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs3 } from "react/jsx-runtime";
function dbPostToPost2(p) {
  return {
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    date: p.createdAt.slice(0, 10),
    readTime: "?m",
    tags: [],
    excerpt: p.body.slice(0, 120),
    body: p.body.split("\n\n").filter(Boolean)
  };
}
function BlogPost() {
  const app2 = useApp();
  const dbMatch = app2.dbPosts.find(
    (p) => (p.slug || p.id) === app2.selectedPostSlug
  );
  const post = dbMatch ? dbPostToPost2(dbMatch) : posts.find((p) => p.slug === app2.selectedPostSlug);
  if (!post) return null;
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-4 font-mono text-sm", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 text-xs text-muted", children: [
      /* @__PURE__ */ jsx2("span", { className: "text-mauve", children: "\u276F" }),
      /* @__PURE__ */ jsxs3("span", { children: [
        "cat ",
        post.slug,
        ".md"
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "rounded p-4 space-y-2 bg-surface border border-border", children: [
      /* @__PURE__ */ jsx2("div", { className: "text-xl font-bold text-teal leading-snug", children: post.title }),
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-3 text-xs text-muted", children: [
        /* @__PURE__ */ jsx2("span", { children: post.date }),
        /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
        /* @__PURE__ */ jsxs3("span", { children: [
          post.readTime,
          " read"
        ] }),
        post.tags.length > 0 && /* @__PURE__ */ jsxs3(Fragment2, { children: [
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("div", { className: "flex gap-1", children: post.tags.map((t) => /* @__PURE__ */ jsx2(Tag, { label: t }, t)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "text-dim text-xs", children: "\u2500".repeat(60) }),
    /* @__PURE__ */ jsx2("div", { className: "space-y-3", children: post.body.map((p, i) => /* @__PURE__ */ jsx2("p", { className: "text-sm leading-relaxed text-subtext", children: p }, i)) }),
    /* @__PURE__ */ jsxs3("div", { className: "border-t border-border pt-3 flex items-center justify-between text-xs", children: [
      /* @__PURE__ */ jsx2(
        "button",
        {
          onClick: () => app2.goBack(),
          className: "text-muted hover:text-text transition-colors cursor-pointer",
          children: "\u2190 cd .."
        }
      ),
      /* @__PURE__ */ jsx2("span", { className: "text-dim", children: "q to go back" })
    ] })
  ] });
}

// src/desktop/components/BlogEditor.tsx
import { useEffect, useRef } from "react";
import { jsx as jsx3, jsxs as jsxs4 } from "react/jsx-runtime";
var DEBOUNCE_MS = 800;
function BlogEditor() {
  const app2 = useApp();
  const post = app2.dbPosts.find((p) => p.id === app2.draftPostId);
  const bodyRef = useRef(null);
  const saveTimer = useRef(null);
  const initialBody = useRef(post?.body ?? "");
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.textContent = initialBody.current;
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);
  if (!post) return null;
  function scheduleSave(fields) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      app2.savePost(fields);
    }, DEBOUNCE_MS);
  }
  function handleTitleChange(e) {
    app2.setDraftTitle(e.target.value);
    scheduleSave({ title: e.target.value });
  }
  function handleBodyInput() {
    const body = bodyRef.current?.textContent ?? "";
    scheduleSave({ body });
  }
  function handlePublishToggle() {
    const next = !app2.draftPublished;
    app2.setDraftPublished(next);
    scheduleSave({ published: next });
  }
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-4 font-mono text-sm", children: [
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 text-xs text-muted", children: [
      /* @__PURE__ */ jsx3("span", { className: "text-mauve", children: "\u276F" }),
      /* @__PURE__ */ jsxs4("span", { children: [
        "edit ",
        post.id,
        ".md"
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "rounded p-4 space-y-2 bg-surface border border-border", children: [
      /* @__PURE__ */ jsx3(
        "input",
        {
          className: "w-full text-xl font-bold text-teal leading-snug bg-transparent outline-none placeholder:text-teal/30",
          placeholder: "Title...",
          value: app2.draftTitle,
          onChange: handleTitleChange
        }
      ),
      /* @__PURE__ */ jsx3("div", { className: "flex items-center gap-3 text-xs text-muted", children: /* @__PURE__ */ jsx3("span", { children: post.createdAt.slice(0, 10) }) })
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "text-dim text-xs", children: "\u2500".repeat(60) }),
    /* @__PURE__ */ jsx3(
      "div",
      {
        ref: bodyRef,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onInput: handleBodyInput,
        className: "text-sm leading-relaxed text-subtext outline-none min-h-[200px] whitespace-pre-wrap focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-dim",
        "data-placeholder": "Start writing..."
      }
    ),
    /* @__PURE__ */ jsxs4("div", { className: "border-t border-border pt-3 flex items-center justify-between text-xs", children: [
      /* @__PURE__ */ jsx3(
        "button",
        {
          onClick: () => app2.goBack(),
          className: "text-muted hover:text-text transition-colors cursor-pointer",
          children: "\u2190 cd .."
        }
      ),
      /* @__PURE__ */ jsx3(
        "button",
        {
          onClick: handlePublishToggle,
          className: `px-3 py-1 rounded border transition-colors cursor-pointer ${app2.draftPublished ? "border-green text-green bg-green/10 hover:bg-green/20" : "border-border text-muted hover:text-text hover:border-muted"}`,
          children: app2.draftPublished ? "published" : "draft"
        }
      )
    ] })
  ] });
}

// src/desktop/components/App.tsx
import { jsx as jsx4, jsxs as jsxs5 } from "react/jsx-runtime";
function App() {
  const app2 = useApp();
  const title = app2.view === "editor" ? `new post \u2014 blog` : app2.selectedPostSlug ? `${app2.selectedPostSlug}.md \u2014 blog` : "christian alfoni \u2014 blog";
  return /* @__PURE__ */ jsx4("div", { className: "min-h-screen bg-base flex items-start justify-center p-8", children: /* @__PURE__ */ jsxs5("div", { className: "w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl border border-border", children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 px-4 py-3 bg-chrome border-b border-border", children: [
      /* @__PURE__ */ jsx4("span", { className: "w-3 h-3 rounded-full bg-[#FF5F57]" }),
      /* @__PURE__ */ jsx4("span", { className: "w-3 h-3 rounded-full bg-[#FFBD2E]" }),
      /* @__PURE__ */ jsx4("span", { className: "w-3 h-3 rounded-full bg-[#28CA41]" }),
      /* @__PURE__ */ jsx4("span", { className: "flex-1 text-center text-xs font-mono text-muted", children: title }),
      /* @__PURE__ */ jsx4("div", { className: "flex items-center gap-3", children: app2.user ? /* @__PURE__ */ jsxs5("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx4(
          "img",
          {
            src: app2.user.avatarUrl,
            alt: app2.user.name,
            className: "w-5 h-5 rounded-full"
          }
        ),
        /* @__PURE__ */ jsx4(
          "button",
          {
            onClick: () => app2.signOut(),
            className: "text-xs text-muted hover:text-text cursor-pointer transition-colors font-mono",
            children: "sign out"
          }
        )
      ] }) : app2.isPreview ? /* @__PURE__ */ jsx4("form", { method: "post", action: "/auth/test-login", children: /* @__PURE__ */ jsx4(
        "button",
        {
          type: "submit",
          className: "text-xs text-mauve hover:text-text cursor-pointer transition-colors font-mono",
          children: "sign in (test)"
        }
      ) }) : /* @__PURE__ */ jsx4(
        "a",
        {
          href: "/auth/github",
          className: "text-xs text-mauve hover:text-text transition-colors font-mono",
          children: "sign in"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx4("div", { className: "p-6 bg-terminal font-mono", children: app2.view === "editor" ? /* @__PURE__ */ jsx4(BlogEditor, {}) : app2.view === "post" ? /* @__PURE__ */ jsx4(BlogPost, {}) : /* @__PURE__ */ jsx4(BlogList, {}) })
  ] }) });
}

// src/mobile/ui-components/Tag.tsx
import { jsxs as jsxs6 } from "react/jsx-runtime";
function Tag2({ label }) {
  return /* @__PURE__ */ jsxs6("span", { className: "text-sm text-green bg-green/10 px-2 py-1 rounded font-mono", children: [
    "#",
    label
  ] });
}

// src/mobile/components/BlogList.tsx
import { jsx as jsx5, jsxs as jsxs7 } from "react/jsx-runtime";
function dbPostToPost3(p) {
  return {
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    date: p.createdAt.slice(0, 10),
    readTime: "?m",
    tags: [],
    excerpt: p.body.slice(0, 120),
    body: p.body.split("\n\n").filter(Boolean)
  };
}
function BlogList2() {
  const app2 = useApp();
  const visibleDbPosts = app2.dbPosts.filter(
    (p) => p.published || app2.isAuthor && p.authorId === app2.user?.id
  );
  const allPosts = [
    ...visibleDbPosts.map(dbPostToPost3),
    ...posts
  ].sort((a, b) => b.date.localeCompare(a.date));
  function handleNewPost() {
    app2.createPost();
  }
  return /* @__PURE__ */ jsxs7("div", { className: "space-y-4 px-4 py-6", children: [
    /* @__PURE__ */ jsxs7("div", { className: "font-mono", children: [
      /* @__PURE__ */ jsx5("div", { className: "text-lg font-bold text-mauve mb-1", children: "~/posts" }),
      /* @__PURE__ */ jsxs7("div", { className: "text-xs text-muted", children: [
        allPosts.length,
        " ",
        allPosts.length === 1 ? "entry" : "entries"
      ] })
    ] }),
    /* @__PURE__ */ jsx5("div", { className: "border-t border-border" }),
    /* @__PURE__ */ jsxs7("div", { className: "space-y-3", children: [
      app2.isAuthor && /* @__PURE__ */ jsx5(
        "button",
        {
          className: "w-full text-left rounded-lg p-4 bg-surface border border-dashed border-border active:opacity-70 opacity-60",
          onClick: handleNewPost,
          children: /* @__PURE__ */ jsx5("span", { className: "font-mono text-muted italic text-sm", children: "+ new post..." })
        }
      ),
      allPosts.map((post) => /* @__PURE__ */ jsxs7(
        "button",
        {
          className: "w-full text-left rounded-lg p-4 bg-surface border border-border active:opacity-70",
          onClick: () => app2.selectPost(post.slug),
          children: [
            /* @__PURE__ */ jsxs7("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
              /* @__PURE__ */ jsx5("span", { className: "font-mono font-semibold text-teal leading-snug", children: post.title }),
              /* @__PURE__ */ jsx5("span", { className: "text-xs text-mauve bg-mauve/10 px-2 py-0.5 rounded shrink-0 font-mono", children: post.readTime })
            ] }),
            /* @__PURE__ */ jsx5("div", { className: "text-xs text-muted font-mono mb-2", children: post.date }),
            post.tags.length > 0 && /* @__PURE__ */ jsx5("div", { className: "flex flex-wrap gap-1 mb-2", children: post.tags.map((t) => /* @__PURE__ */ jsx5(Tag2, { label: t }, t)) }),
            /* @__PURE__ */ jsx5("div", { className: "text-xs text-dim leading-relaxed line-clamp-2", children: post.excerpt })
          ]
        },
        post.slug
      ))
    ] })
  ] });
}

// src/mobile/components/BlogPost.tsx
import { jsx as jsx6, jsxs as jsxs8 } from "react/jsx-runtime";
function dbPostToPost4(p) {
  return {
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    date: p.createdAt.slice(0, 10),
    readTime: "?m",
    tags: [],
    excerpt: p.body.slice(0, 120),
    body: p.body.split("\n\n").filter(Boolean)
  };
}
function BlogPost2() {
  const app2 = useApp();
  const dbMatch = app2.dbPosts.find(
    (p) => (p.slug || p.id) === app2.selectedPostSlug
  );
  const post = dbMatch ? dbPostToPost4(dbMatch) : posts.find((p) => p.slug === app2.selectedPostSlug);
  if (!post) return null;
  return /* @__PURE__ */ jsxs8("div", { className: "px-4 py-6 space-y-4", children: [
    /* @__PURE__ */ jsx6(
      "button",
      {
        onClick: () => app2.goBack(),
        className: "flex items-center gap-2 text-sm text-muted font-mono active:text-text",
        children: "\u2190 back"
      }
    ),
    /* @__PURE__ */ jsxs8("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx6("h1", { className: "text-xl font-bold text-teal font-mono leading-snug", children: post.title }),
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2 text-xs text-muted font-mono", children: [
        /* @__PURE__ */ jsx6("span", { children: post.date }),
        /* @__PURE__ */ jsx6("span", { children: "\xB7" }),
        /* @__PURE__ */ jsxs8("span", { children: [
          post.readTime,
          " read"
        ] })
      ] }),
      post.tags.length > 0 && /* @__PURE__ */ jsx6("div", { className: "flex flex-wrap gap-1", children: post.tags.map((t) => /* @__PURE__ */ jsx6(Tag2, { label: t }, t)) })
    ] }),
    /* @__PURE__ */ jsx6("div", { className: "border-t border-border" }),
    /* @__PURE__ */ jsx6("div", { className: "space-y-4", children: post.body.map((p, i) => /* @__PURE__ */ jsx6("p", { className: "text-sm leading-relaxed text-subtext", children: p }, i)) })
  ] });
}

// src/mobile/components/BlogEditor.tsx
import { useEffect as useEffect2, useRef as useRef2 } from "react";
import { jsx as jsx7, jsxs as jsxs9 } from "react/jsx-runtime";
var DEBOUNCE_MS2 = 800;
function BlogEditor2() {
  const app2 = useApp();
  const post = app2.dbPosts.find((p) => p.id === app2.draftPostId);
  const bodyRef = useRef2(null);
  const saveTimer = useRef2(null);
  const initialBody = useRef2(post?.body ?? "");
  useEffect2(() => {
    if (bodyRef.current) {
      bodyRef.current.textContent = initialBody.current;
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);
  if (!post) return null;
  function scheduleSave(fields) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      app2.savePost(fields);
    }, DEBOUNCE_MS2);
  }
  function handleTitleChange(e) {
    app2.setDraftTitle(e.target.value);
    scheduleSave({ title: e.target.value });
  }
  function handleBodyInput() {
    const body = bodyRef.current?.textContent ?? "";
    scheduleSave({ body });
  }
  function handlePublishToggle() {
    const next = !app2.draftPublished;
    app2.setDraftPublished(next);
    scheduleSave({ published: next });
  }
  return /* @__PURE__ */ jsxs9("div", { className: "px-4 py-6 space-y-4 font-mono text-sm", children: [
    /* @__PURE__ */ jsx7(
      "input",
      {
        className: "w-full text-xl font-bold text-teal leading-snug bg-transparent outline-none placeholder:text-teal/30",
        placeholder: "Title...",
        value: app2.draftTitle,
        onChange: handleTitleChange
      }
    ),
    /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted", children: post.createdAt.slice(0, 10) }),
    /* @__PURE__ */ jsx7("div", { className: "border-t border-border" }),
    /* @__PURE__ */ jsx7(
      "div",
      {
        ref: bodyRef,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onInput: handleBodyInput,
        className: "text-sm leading-relaxed text-subtext outline-none min-h-[300px] whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-dim",
        "data-placeholder": "Start writing..."
      }
    ),
    /* @__PURE__ */ jsxs9("div", { className: "border-t border-border pt-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx7(
        "button",
        {
          onClick: () => app2.goBack(),
          className: "text-xs text-muted font-mono",
          children: "\u2190 cd .."
        }
      ),
      /* @__PURE__ */ jsx7(
        "button",
        {
          onClick: handlePublishToggle,
          className: `text-xs px-3 py-1.5 rounded border font-mono transition-colors ${app2.draftPublished ? "border-green text-green bg-green/10" : "border-border text-muted"}`,
          children: app2.draftPublished ? "published" : "draft"
        }
      )
    ] })
  ] });
}

// src/mobile/components/App.tsx
import { jsx as jsx8, jsxs as jsxs10 } from "react/jsx-runtime";
function App2() {
  const app2 = useApp();
  return /* @__PURE__ */ jsxs10("div", { className: "min-h-screen bg-terminal text-text font-mono", children: [
    /* @__PURE__ */ jsxs10("header", { className: "sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-chrome border-b border-border", children: [
      /* @__PURE__ */ jsx8("span", { className: "font-mono text-sm font-bold text-mauve", children: "~/blog" }),
      app2.user ? /* @__PURE__ */ jsxs10("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx8("img", { src: app2.user.avatarUrl, alt: app2.user.name, className: "w-7 h-7 rounded-full" }),
        /* @__PURE__ */ jsx8(
          "button",
          {
            onClick: () => app2.signOut(),
            className: "text-xs text-muted font-mono",
            children: "sign out"
          }
        )
      ] }) : app2.isPreview ? /* @__PURE__ */ jsx8("form", { method: "post", action: "/auth/test-login", children: /* @__PURE__ */ jsx8("button", { type: "submit", className: "text-xs text-mauve font-mono", children: "sign in (test)" }) }) : /* @__PURE__ */ jsx8("a", { href: "/auth/github", className: "text-xs text-mauve font-mono", children: "sign in" })
    ] }),
    /* @__PURE__ */ jsx8("main", { children: app2.view === "editor" ? /* @__PURE__ */ jsx8(BlogEditor2, {}) : app2.view === "post" ? /* @__PURE__ */ jsx8(BlogPost2, {}) : /* @__PURE__ */ jsx8(BlogList2, {}) })
  ] });
}

// src/entry-server.tsx
import { Fragment as Fragment3, jsx as jsx9, jsxs as jsxs11 } from "react/jsx-runtime";
var AUTHOR_LOGINS2 = ["christianalfoni", "test"];
function loadTemplate() {
  try {
    const templatePath = join(process.cwd(), "dist/client/index.html");
    const html = readFileSync(templatePath, "utf-8");
    const parts = html.split("<!--ssr-outlet-->");
    return [parts[0], parts[1] ?? ""];
  } catch {
    return ['<!doctype html><html><body><div id="root">', "</div></body></html>"];
  }
}
var [htmlStart, htmlEnd] = loadTemplate();
async function render(req, res) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const db = dbUrl ? new NeonDatabaseService(dbUrl) : void 0;
    const sessionId = parseCookie(req.headers.cookie ?? "", "session");
    const user = db && sessionId ? await db.getUser(sessionId) : null;
    const posts2 = db ? (await db.getPosts()).filter(
      (p) => p.published || user && AUTHOR_LOGINS2.includes(user.githubLogin) && p.authorId === user.id
    ) : [];
    const initialData = { dbEnabled: !!db, isPreview: process.env.VERCEL_ENV === "preview", user, posts: posts2 };
    const app2 = new AppState(user, initialData.isPreview, posts2);
    const App3 = isMobileUA(req.headers["user-agent"] ?? "") ? App2 : App;
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.write(htmlStart);
    const appendEnd = new Transform({
      transform(chunk, _enc, cb) {
        cb(null, chunk);
      },
      flush(cb) {
        this.push(htmlEnd);
        cb();
      }
    });
    const { pipe } = renderToPipeableStream(
      /* @__PURE__ */ jsx9(StrictMode, { children: /* @__PURE__ */ jsxs11(Fragment3, { children: [
        /* @__PURE__ */ jsx9("div", { id: "__initial_data__", style: { display: "none" }, children: JSON.stringify(initialData) }),
        /* @__PURE__ */ jsx9(AppContext, { value: app2, children: /* @__PURE__ */ jsx9(Suspense, { fallback: null, children: /* @__PURE__ */ jsx9(App3, {}) }) })
      ] }) }),
      {
        onShellReady() {
          pipe(appendEnd).pipe(res);
        },
        onError(err) {
          console.error("[SSR] render error:", err);
        }
      }
    );
  } catch (err) {
    console.error("[SSR] render error:", err);
    res.status(500).end();
  }
}
function parseCookie(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// server/index.ts
var ALLOWED_LOGINS = ["christianalfoni", "test"];
var app = express();
app.use(express.json());
app.get("/auth/github", (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("GITHUB_CLIENT_ID is not configured");
    return;
  }
  const state = randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 10 * 60 * 1e3, path: "/" });
  const redirectUri = `${process.env.APP_URL ?? "http://localhost:5173"}/auth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${state}`;
  res.redirect(302, url);
});
app.get("/auth/callback", async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const dbUrl = process.env.DATABASE_URL;
    if (!clientId || !clientSecret) {
      res.status(500).send("GitHub OAuth env vars are not configured");
      return;
    }
    if (!dbUrl) {
      res.status(500).send("DATABASE_URL is not configured");
      return;
    }
    const { code, state } = req.query;
    if (!code) {
      res.status(400).send("Missing code");
      return;
    }
    const expectedState = parseCookie2(req.headers.cookie ?? "", "oauth_state");
    res.clearCookie("oauth_state", { path: "/" });
    if (!state || !expectedState || state !== expectedState) {
      res.status(400).send("Invalid state parameter");
      return;
    }
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    if (!tokenRes.ok) {
      res.status(502).send("Failed to exchange GitHub OAuth code");
      return;
    }
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      res.status(400).send(tokenData.error ?? "No access token returned");
      return;
    }
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "building-ai-confidence" }
    });
    if (!userRes.ok) {
      res.status(502).send("Failed to fetch GitHub user");
      return;
    }
    const ghUser = await userRes.json();
    const db = new NeonDatabaseService(dbUrl);
    const user = await db.upsertUser(ghUser.id, ghUser.login, ghUser.name ?? ghUser.login, ghUser.avatar_url);
    const sessionId = await db.createSession(user.id);
    res.cookie("session", sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1e3, path: "/" });
    res.redirect(302, "/");
  } catch (err) {
    console.error("[auth/callback]", err);
    res.status(500).send("Internal server error");
  }
});
app.post("/auth/logout", async (req, res) => {
  try {
    const sessionId = parseCookie2(req.headers.cookie ?? "", "session");
    if (sessionId && process.env.DATABASE_URL) {
      const db = new NeonDatabaseService(process.env.DATABASE_URL);
      await db.deleteSession(sessionId);
    }
    res.clearCookie("session", { path: "/" });
    res.redirect(302, "/");
  } catch (err) {
    console.error("[auth/logout]", err);
    res.status(500).send("Internal server error");
  }
});
app.post("/auth/test-login", async (_req, res) => {
  try {
    if (process.env.VERCEL_ENV !== "preview") {
      res.status(403).send("Test login is only available in preview environments");
      return;
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      res.status(500).send("DATABASE_URL is not configured");
      return;
    }
    const db = new NeonDatabaseService(dbUrl);
    const user = await db.upsertUser(0, "test", "Test User", "https://avatars.githubusercontent.com/u/0");
    const sessionId = await db.createSession(user.id);
    res.cookie("session", sessionId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1e3, path: "/" });
    res.redirect(302, "/");
  } catch (err) {
    console.error("[auth/test-login]", err);
    res.status(500).send("Internal server error");
  }
});
app.get("/api/posts", async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      res.status(500).json({ error: "DATABASE_URL is not configured" });
      return;
    }
    const db = new NeonDatabaseService(dbUrl);
    const sessionId = parseCookie2(req.headers.cookie ?? "", "session");
    const user = sessionId ? await db.getUser(sessionId) : null;
    const all = await db.getPosts();
    res.json(all.filter((p) => p.published || user && ALLOWED_LOGINS.includes(user.githubLogin) && p.authorId === user.id));
  } catch (err) {
    console.error("[GET /api/posts]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/posts", async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      res.status(500).json({ error: "DATABASE_URL is not configured" });
      return;
    }
    const sessionId = parseCookie2(req.headers.cookie ?? "", "session");
    if (!sessionId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const db = new NeonDatabaseService(dbUrl);
    const user = await db.getUser(sessionId);
    if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(await db.createPost(user.id));
  } catch (err) {
    console.error("[POST /api/posts]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.patch("/api/posts/:id", async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      res.status(500).json({ error: "DATABASE_URL is not configured" });
      return;
    }
    const sessionId = parseCookie2(req.headers.cookie ?? "", "session");
    if (!sessionId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const db = new NeonDatabaseService(dbUrl);
    const user = await db.getUser(sessionId);
    if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { id } = req.params;
    const posts2 = await db.getPosts();
    const post = posts2.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (post.authorId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const fields = {};
    if (typeof req.body.title === "string") fields.title = req.body.title;
    if (typeof req.body.body === "string") fields.body = req.body.body;
    if (typeof req.body.published === "boolean") fields.published = req.body.published;
    res.json(await db.updatePost(id, fields));
  } catch (err) {
    console.error("[PATCH /api/posts/:id]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/{*path}", render);
var index_default = app;
function parseCookie2(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
export {
  index_default as default
};
