import { Markdown } from "../../common/ui-components/Markdown";

// Visual reference for the SSR reader. The CodeMirror editor must render the
// same source the same way (same `tok-*` classes, same kept markers).
function Frame({ source }: { source: string }) {
  return (
    <div className="bg-terminal p-8 font-mono text-sm leading-relaxed text-subtext max-w-2xl">
      <Markdown source={source} />
    </div>
  );
}

const headingSource = `# Building AI confidence
## A second level heading
### And a third

Some intro paragraph text that stays plain.`;

const listSource = `Shopping list:

- first item
- second item
  - nested item
  - another nested item
- third item`;

const codeSource = `Here is a TypeScript snippet:

\`\`\`ts
function greet(name: string): string {
  const greeting = "hello, " + name;
  return greeting;
}
\`\`\`

And some JSON:

\`\`\`json
{ "name": "ada", "age": 36, "admin": true }
\`\`\``;

const mixedSource = `# Release notes

We shipped **bold** and *italic* support, plus \`inline code\`.

## Changes

- markdown reader mirrors the editor
- fenced code is highlighted

\`\`\`js
const ok = true;
console.log(ok);
\`\`\``;

export function headings() {
  return { element: <Frame source={headingSource} /> };
}

export function lists() {
  return { element: <Frame source={listSource} /> };
}

export function codeBlocks() {
  return { element: <Frame source={codeSource} /> };
}

export function mixed() {
  return { element: <Frame source={mixedSource} /> };
}
