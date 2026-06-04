// Shared constants for the non-highlight markdown decorations, so the editor
// (CodeMirror line/range decorations) and the reader (React) stay in lockstep.

// Per-nesting-level indent applied to list-item lines, in rem. Both the editor
// line decoration and the reader line wrapper use this so a `- item` indents the
// same amount on each side.
export const LIST_INDENT_REM = 1.25;

// Class applied to a rendered line (reader) / line decoration (editor) so the
// shared stylesheet can target markdown lines.
export const MD_LINE_CLASS = "md-line";

// Class applied to a rendered image (reader <img> and editor widget <img>) so
// both sides share one centered-block, non-clickable style.
export const MD_IMAGE_CLASS = "md-image";

// Matches a line whose entire content is a single markdown image — `![alt](url)`
// with optional surrounding whitespace. Capture groups: 1 = alt, 2 = url. Both
// editor and reader use this to decide when a line renders as a centered image.
export const IMAGE_LINE_RE = /^\s*!\[([^\]]*)\]\(([^)\s]+)\)\s*$/;
