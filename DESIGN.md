# Design Guide

## Color Palette

Terminal dark theme inspired by Catppuccin Mocha.

| Token | Hex | Usage |
|---|---|---|
| `base` | `#070B10` | Outer page background |
| `terminal` | `#13161D` | Terminal window background |
| `chrome` | `#0F1219` | Title bar / sticky header |
| `surface` | `#1A1E2A` | Card backgrounds, inset panels |
| `border` | `#252836` | Borders, dividers |
| `dim` | `#45475A` | Very muted text, separators |
| `muted` | `#6C7086` | Placeholder text, timestamps, metadata |
| `subtext` | `#BAC2DE` | Body text, post content |
| `text` | `#CDD6F4` | Primary text |
| `mauve` | `#CBA6F7` | Headings, prompt symbol, interactive accents |
| `teal` | `#89DCEB` | Post titles, highlighted values |
| `green` | `#A6E3A1` | Tags, success states |

## Theme Tokens

Defined as CSS custom properties via Tailwind's `@theme` block in `src/index.css`. Available as Tailwind utility classes (`bg-terminal`, `text-mauve`, `border-border`, etc.).

## Typography

- **Font family:** monospace (`font-mono`) throughout — the entire UI uses monospace to reinforce the terminal aesthetic
- **Headings:** `font-bold text-mauve` (directory paths) or `font-semibold text-teal` (post titles)
- **Body:** `text-subtext leading-relaxed`
- **Meta / timestamps:** `text-xs text-muted`

## Spacing & Radius

- Base unit: `4px` (Tailwind default)
- Border radius: `rounded` (4px) for tags, `rounded-lg` (8px) for cards
- Card padding: `p-4` (mobile), `p-6` (desktop)

## Component Conventions

- **Terminal window** (desktop): dark `bg-terminal` container with `bg-chrome` title bar and traffic-light dots (`#FF5F57`, `#FFBD2E`, `#28CA41`)
- **Tags:** `text-xs text-green bg-green/10 px-1.5 py-0.5 rounded font-mono`
- **Prompt symbol:** `text-mauve` `❯` character with a blinking `bg-mauve/80` cursor block
- **Interactive rows:** `cursor-pointer` with `hover:text-mauve` on title, no background flash — keep it terminal-like
- **Navigation back:** plain text `← cd ..` button, `text-muted hover:text-text`
- **Auth controls:** minimal text links in the title bar, `text-muted` or `text-mauve`, `font-mono text-xs`
