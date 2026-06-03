// Shared constants for the non-highlight markdown decorations, so the editor
// (CodeMirror line/range decorations) and the reader (React) stay in lockstep.

// Per-nesting-level indent applied to list-item lines, in rem. Both the editor
// line decoration and the reader line wrapper use this so a `- item` indents the
// same amount on each side.
export const LIST_INDENT_REM = 1.25;

// Class applied to a rendered line (reader) / line decoration (editor) so the
// shared stylesheet can target markdown lines.
export const MD_LINE_CLASS = "md-line";
