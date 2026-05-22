# Design Guide

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `surface` | `#F3F2F5` | Page backgrounds, cards, containers |
| `crimson` | `#C03535` | Primary actions, destructive states, emphasis |
| `terracotta` | `#CD5130` | Secondary actions, hover states, highlights |
| `gold` | `#D4A83C` | Accents, badges, warnings |
| `navy` | `#2D4A7A` | Text on light, headers, navigation, trust signals |

## Theme Tokens

Theme tokens are defined as CSS custom properties via Tailwind's `@theme` block in `src/index.css`. They are available as Tailwind utility classes (e.g. `bg-surface`, `text-navy`, `border-crimson`).

### Scale convention

Each color has a single semantic role. No numeric scale — keep it purposeful.

```
surface     → backgrounds / containers
crimson     → primary / danger
terracotta  → secondary / hover
gold        → accent / badge / warning
navy        → headings / navigation / body text on light
```

## Typography

- **Font family:** system-ui stack (no custom font)
- **Headings:** `font-semibold`, `text-navy`
- **Body:** default weight, `text-navy/80` or `text-gray-700`
- **Mono / code:** `font-mono`, `text-terracotta`

## Spacing & Radius

- Base unit: `4px` (Tailwind default)
- Border radius: `rounded-md` (6px) for inputs/buttons, `rounded-lg` (8px) for cards
- Card padding: `p-6`

## Component Conventions

- **Buttons – primary:** `bg-crimson text-white hover:bg-terracotta`
- **Buttons – secondary:** `border border-navy text-navy hover:bg-surface`
- **Badges:** `bg-gold/20 text-navy text-xs font-semibold rounded-full px-2 py-0.5`
- **Focus ring:** `focus-visible:ring-2 focus-visible:ring-crimson`
