# UPS Flex Grid — Design Spec
**Date:** 2026-03-12
**Files:** `s2a-grids/ups-flex-grid.html` (replace), `s2a-grids/ups-grid.css` (replace)

---

## Goal

Rewrite the UPS flex grid demo page and its stylesheet to produce a clean, card-oriented responsive grid system. The system is inspired by Milo's editorial card pattern and uses CSS Grid fr-units for layout. It runs in tandem with the existing `grid.css` — inheriting its container system, overlay, gutter tokens, and breakpoint boundaries.

---

## Stylesheet Chain

```
tokens.css → grid.css → styles.css → ups-grid.css
```

- `tokens.css` — design tokens (colors, spacing, typography, shadows, radii)
- `grid.css` — containers, overlay, gutter overrides, row/col system
- `styles.css` — base reset, body, typographic defaults, button, demo-card
- `ups-grid.css` — ups grid layer only; no duplication of above

---

## Breakpoints (aligned to grid.css)

| Range | Label | Behavior |
|---|---|---|
| `<768px` | Mobile | Single column, stacked |
| `768px–1279px` | Tablet | Always 2-up (`repeat(2, 1fr)`) |
| `≥1280px` | Desktop | N-up per variant class |

---

## ups-grid.css Architecture

### Base container
```css
.ups-grid {
  display: grid;
  gap: var(--s2a-grid-gutter); /* shared with grid.css gutter toggle */
  align-items: start;
}
```

### Desktop variants (≥1280px)
Applied via modifier class on `.ups-grid`:

| Class | Columns |
|---|---|
| `.two-up` | `repeat(2, 1fr)` |
| `.three-up` | `repeat(3, 1fr)` |
| `.four-up` | `repeat(4, 1fr)` |
| `.five-up` | `repeat(5, 1fr)` |
| `.six-up` | `repeat(6, 1fr)` |

### Tablet (768px–1279px)
All variants collapse to `repeat(2, 1fr)` — no modifier class needed.

### Mobile (<768px)
All variants collapse to `1fr` — single column stack.

### Orphan rule (opt-in)
`.ups-grid.orphan-full` — when applied, the last child in an odd DOM position gets `grid-column: 1 / -1`, spanning full width. In a 2-column grid, odd-positioned items always land in column 1. If the last card is odd-positioned it is visually orphaned (column 1 only); this selector correctly targets that case. Even-positioned last children are not orphaned (they fill column 2) and the selector does not fire.

```css
/* Tablet only — does not fire on mobile or desktop */
@media (min-width: 768px) and (max-width: 1279.98px) {
  .ups-grid.orphan-full > :last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}
```

`1279.98px` used for max-width to avoid subpixel rounding gaps at the 1280px boundary. The class is harmless outside this range (no rule fires).

---

## Default Page Load State

| Control | Default |
|---|---|
| Container | Default (`.container`) |
| Ups | 3-up (`.three-up` active) |
| Orphan | Off |
| Gutter | 8 (`gutter-8` on body) |
| Guides | On (overlay visible) |

---

## HTML Page Structure (`ups-flex-grid.html`)

### Stylesheet links
```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="grid.css">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="ups-grid.css">
```

### Grid overlay
Identical to existing page — 12 overlay cols, `grid-overlay` / `grid-overlay-container` structure, driven by `grid.css`.

### Header
Simplified description block covering:
- Breakpoint ranges and behavior summary
- Class naming convention
- Orphan-full opt-in note

### Sticky nav — control groups

| Group | Options | Action |
|---|---|---|
| Container | Default / HD / Fluid / Hero Offset | `setContainerType()` |
| Ups | 2 / 3 / 4 / 5 / 6 | `setUps()` — swaps `*-up` class on all `.ups-grid` |
| Orphan | Toggle | `toggleOrphan()` — adds/removes `.orphan-full` on all `.ups-grid` |
| Gutter | 32 / 16 / 8 / 0 | `setGutter()` — sets body gutter class, drives `--s2a-grid-gutter` |
| Guides | Toggle Overlay | `toggleOverlay()` |

### Demo sections
One section per up-count (2-up through 6-up). Each section has:
- A heading (`h2`) labeling the variant (e.g. "3-up")
- A `.container` wrapping a single `.ups-grid.[n]-up` wrapper
- Card counts chosen to produce exactly one orphan on tablet 2-up:

| Section | Cards | Orphan on tablet? |
|---|---|---|
| 2-up | 5 | Yes (5th card) |
| 3-up | 7 | Yes (7th card) |
| 4-up | 9 | Yes (9th card) |
| 5-up | 11 | Yes (11th card) |
| 6-up | 11 | Yes (11th card) |

`setUps(n)` swaps the `*-up` class on all `.ups-grid` elements simultaneously, so all sections reflect the active up-count at once.

### Card placeholder style (`.ups-card`)
- Background: `#ffd97d` (amber/yellow per mockups)
- Border: `1px solid rgba(0,0,0,0.08)`
- Border-radius: `var(--radius-sm)` (8px)
- Padding: `var(--spacing-lg)` (1.5rem)
- Min-height: `80px`
- Display: flex, centered text
- Label: up-count name + `8 grid/gap` text (static, matches mockup labels)

### Class reference section
Minimal table listing all variant classes and the orphan modifier.

---

## JS Functions (inline `<script>`)

| Function | Purpose |
|---|---|
| `setActiveBtn(btn)` | Removes `.active` from sibling group buttons, adds to clicked |
| `toggleOverlay()` | Toggles `.active` on `#gridOverlay` |
| `setContainerType(type, btn)` | Swaps container class on `#mainContainer` and overlay container |
| `setGutter(size, btn)` | Swaps `gutter-*` class on `body` |
| `setUps(n, btn)` | Removes all `*-up` classes from every `.ups-grid`, adds `[n]-up` |
| `toggleOrphan(btn)` | Toggles `.orphan-full` on every `.ups-grid` |

---

## What Is NOT in ups-grid.css

- No container definitions (from `grid.css`)
- No gutter override classes (from `grid.css`)
- No overlay system (from `grid.css`)
- No base reset or typography (from `styles.css` / `tokens.css`)
- No `auto-fit` / `minmax` — explicit fr columns only
