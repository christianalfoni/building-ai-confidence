export type Post = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  excerpt: string;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "building-confidence-with-ai",
    title: "Building Confidence with AI",
    date: "2026-05-30",
    readTime: "8m",
    tags: ["ai", "productivity"],
    excerpt:
      "When I first started using AI tools in my daily workflow, I was skeptical. Not of the technology itself, but of whether it would actually change how I worked in any meaningful way.",
    body: [
      "When I first started using AI tools in my daily workflow, I was skeptical. Not of the technology itself — I could see it was impressive — but of whether it would actually change how I worked in any meaningful way.",
      "Six months later, I can say it has. But not in the ways I expected. The productivity gains are real, but they come with a hidden cost: confidence erosion. When the AI writes your code, designs your component, or drafts your email, a small part of you starts to wonder: could I have done this without it?",
      "The answer matters. Not because AI assistance is bad — it isn't — but because knowing your own capability floor is essential for trusting your own judgement. You need to know when to push back on the AI, when its suggestion is subtly wrong, when the shortcut it's offering will create debt downstream.",
      "The developers I see thriving with AI are not the ones who outsource their thinking. They are the ones who use AI as a multiplier on thinking they were already doing well. They have strong opinions about architecture. They can spot a bad abstraction. They know what good looks like.",
      "Building that foundation is what this blog is about. Not tutorials, not hot takes. Just honest writing about the craft of software development in an era where the tools are changing faster than our ability to evaluate them.",
      "If you are reading this wondering whether AI is making you a better or worse developer — that question itself is a good sign. Keep asking it.",
    ],
  },
];
