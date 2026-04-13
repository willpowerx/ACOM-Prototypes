# MotionGen — Design Spec
**Date:** 2026-03-25
**Status:** Approved

---

## Overview

MotionGen is a standalone professional-grade animation playground and code generator built on Framer Motion. It lets users visually configure physics-based spring animations, easing curves, and text-split reveals, then exports production-ready Framer Motion JSX. It is a **completely separate Vite project** — it does not touch or share code with the existing Prompt-tools app.

---

## Project Location & Setup

```
/Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/motion-gen/
```

A sibling directory to `Prompt-tools/`. Bootstrapped as a new Vite + React + Tailwind project.

**Dependencies:**
- `react`, `react-dom`
- `framer-motion` — live preview with actual physics
- `prism-react-renderer` — JSX syntax highlighting, **Night Owl theme**
- `lucide-react` — icons
- `tailwindcss`, `postcss`, `autoprefixer`
- `vite`, `@vitejs/plugin-react`

---

## File Structure

```
motion-gen/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  src/
    main.jsx
    App.jsx                  # Layout shell + all shared state
    index.css
    components/
      Sidebar.jsx            # All control sections (collapsible)
      SpringVisualizer.jsx   # SVG damped oscillator curve
      PreviewCanvas.jsx      # Live Framer Motion preview
      CodeOutput.jsx         # Syntax-highlighted code export panel
    utils/
      codeGen.js             # Generates Framer Motion JSX strings
      springMath.js          # Spring physics simulation for visualizer
```

---

## State Shape

All state lives in `App.jsx` and is passed down as props. No Context needed.

```js
{
  // Transform & Filters
  opacity: 1,       // 0–1, step 0.01
  x: 0,             // -200–200px, step 1
  y: 0,             // -200–200px, step 1
  scale: 1,         // 0.1–3, step 0.05
  rotate: 0,        // -360–360 deg, step 1
  blur: 0,          // 0–40px, step 1

  // Transition
  type: "spring",   // "spring" | "tween"
  stiffness: 100,   // 1–1000, step 1
  damping: 10,      // 1–100, step 1
  mass: 1,          // 0.1–10, step 0.1

  duration: 0.5,    // 0.1–5s, step 0.1 (tween only)
  ease: "easeInOut",// one of EASING_OPTIONS (tween only)

  // Gesture Triggers — at least one must always be true
  triggerOnMount: true,
  triggerOnHover: false,
  triggerOnTap: false,

  // Typography Reveal
  text: "Revolutionizing Motion Systems",
  splitType: "none",  // "none" | "word" | "char"
  stagger: 0.05,      // 0–0.5s, step 0.01

  // UI State
  activeTab: "preview",  // "preview" | "code"
  viewMode: "desktop",   // "desktop" | "mobile"
  replayKey: 0,          // incremented by replay button to remount preview
}
```

**Easing options** (tween mode only):
```js
const EASING_OPTIONS = [
  "linear", "easeIn", "easeOut", "easeInOut",
  "circOut", "backOut", "anticipate"
];
```

---

## Preset Configurations

Preset chips appear at the top of the sidebar. Clicking one merges these values into state (all other state values remain at their current settings unless listed):

| Preset | opacity | y | scale | rotate | blur | type | stiffness | damping | mass |
|---|---|---|---|---|---|---|---|---|---|
| Fade In | 1 | 0 | 1 | 0 | 0 | spring | 80 | 12 | 1 |
| Slide Up | 1 | -60 | 1 | 0 | 0 | spring | 120 | 14 | 1 |
| Pop & Spin | 1 | 0 | 1.1 | 360 | 0 | spring | 200 | 20 | 1 |
| Soft Blur | 1 | 0 | 1 | 0 | 8 | tween | — | — | — |

"Soft Blur" preset also sets `type: "tween"`, `duration: 0.6`, `ease: "easeOut"`.

---

## Components

### `App.jsx`

- Owns all state via `useState` with the shape defined above
- `updateConfig(key, value)` helper updates a single key
- Layout: full-height flex row — `<Sidebar>` (320px fixed) + main panel (flex-1)
- **Header** (top of main panel): MotionGen logo + wordmark (left), replay button (icon, increments `replayKey`), desktop/mobile toggle, "Export Code" button (right). The Export Code button copies the generated code to clipboard — same action as the copy button inside `CodeOutput`, just surfaced as the primary CTA. Shows "Copied!" state for 2s.
- **Tab bar** (below header, top of main panel): two tab buttons — "Live Preview" and "Code Output". Active tab has indigo underline indicator. Controlled by `activeTab` state.
- Renders `<PreviewCanvas>` when `activeTab === "preview"`, `<CodeOutput>` when `activeTab === "code"`

### `Sidebar.jsx`

Scrollable left panel, 320px wide. Four collapsible sections with section headers (icon + label). Sections are open by default.

**Section 1 — Transform & Filters**
Sliders in this order: Opacity, Scale, Rotate, Y Offset, X Offset, Blur. (Y before X is intentional — Y-axis motion is the primary vertical reveal direction and deserves prominence.)
Each slider uses a `ControlGroup` sub-component showing label, current value with unit, and a range input.
Blur > 10px shows an amber warning badge: _"Heavy blur detected. Keep under 10px for best GPU performance."_

**Section 2 — Transition Strategy**
Spring/Tween pill toggle at the top.
- **Spring:** Stiffness, Damping, Mass sliders + `<SpringVisualizer>` rendered inline below the sliders.
- **Tween:** Duration slider + Easing `<select>` from `EASING_OPTIONS`.

**Section 3 — Gesture Triggers**
Label: "Animation Triggers". Three toggle switches:
- On Mount (default on)
- On Hover
- On Tap

**Enforcement rule:** A toggle cannot be switched off if it is the last active trigger. When a user attempts to turn off the last active trigger, the UI silently no-ops (the toggle does not change state).

**Section 4 — Typography Reveal**
- Text `<input>` (single line)
- Split type buttons: None / Word / Char (pill group, one active at a time)
- Stagger slider — only rendered when `splitType !== "none"`

---

### `SpringVisualizer.jsx`

Props: `{ stiffness, damping, mass }`

- Calls `computeSpringCurve({ stiffness, damping, mass })` on every render (pure, fast)
- Renders as an inline SVG, `width="100%"` `height="100"` `viewBox="0 0 200 80"`
- Contents:
  - Dashed horizontal equilibrium line at y=40 (midpoint), color `zinc-700`
  - The spring curve path in `indigo-400`, stroke-width 2, no fill
  - Small "0" label bottom-left, "1" label at the equilibrium line on the right
- Only rendered when `type === "spring"` (parent conditionally mounts it)

---

### `PreviewCanvas.jsx`

Props: full config object + `replayKey`

**Blur wrapper pattern:** To avoid CSS filter conflicts between user-configured blur, animated entry blur, and hover brightness effects, blur is applied on a **non-animated wrapper div** that sits outside the `motion` elements:
```jsx
<div style={{ filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined }}>
  {/* motion elements go here */}
</div>
```
This means:
- The static user blur never interferes with Framer Motion's `filter` prop on motion elements
- Hover brightness (`filter: "brightness(1.15)"`) animates cleanly on the motion element without clobbering blur
- Child variants in split mode can use their own `filter: "blur(8px)"` entry effect independently

**Simple animation (`splitType === "none"`):**

Single `motion.div` card. The `initial` state is always fixed: `{ opacity: 0, scale: 0.8, y: 20 }`. The user-configured values define the `animate` target.

- When `triggerOnMount: true` — `initial={{ opacity: 0, scale: 0.8, y: 20 }}`, `animate={{ opacity, scale, y, x, rotate }}`
- When `triggerOnMount: false` — `initial={false}` (element starts at configured target, no entry animation; replay button has no visible effect)
- `whileHover={{ scale: config.scale * 1.05, filter: "brightness(1.15)" }}` — only when `triggerOnHover: true`
- `whileTap={{ scale: config.scale * 0.95, filter: "brightness(0.9)" }}` — only when `triggerOnTap: true`
- `key={replayKey}` on this motion element

**Split animation (`splitType !== "none"`):**

Structure:
```jsx
<div style={{ filter: blurStyle }}>         {/* blur wrapper */}
  <motion.div                                {/* variants container */}
    key={replayKey}
    variants={containerVariants}
    initial={triggerOnMount ? "hidden" : "visible"}
    animate="visible"
    whileHover={triggerOnHover ? { scale: 1.02 } : undefined}
    whileTap={triggerOnTap ? { scale: 0.98 } : undefined}
  >
    {items.map((item, i) => (
      <motion.span key={i} variants={childVariants} style={{ display: "inline-block" }}>
        {item}
      </motion.span>
    ))}
  </motion.div>
</div>
```

Note: `whileHover` / `whileTap` in split mode use simpler container-level scale only (no brightness filter on the variants container, to avoid conflicting with child variant animations).

```js
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: config.stagger } }
};
const childVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: config.opacity, y: config.y, scale: config.scale,
    rotate: config.rotate,
    filter: "blur(0px)",   // always clear to "none" in visible state
    transition: { ...transitionProps }
  }
};
```

When `triggerOnMount: false` in split mode: `initial="visible"` — the container starts already in its visible state. No stagger animation plays. Replay button has no visible effect.

**`key={replayKey}`** is on the outermost `motion` element in both simple and split modes. Incrementing causes React to remount, replaying the entry animation from `initial`.

**Viewport sizing:**
- Desktop: preview container fills the available area (`w-full h-full max-w-4xl max-h-[600px]`)
- Mobile: fixed `w-[375px] h-[667px]` (iPhone-sized)

---

### `CodeOutput.jsx`

Props: full config object

- Calls `generateFramerCode(config)` → string
- Passes the string through `prism-react-renderer` with **Night Owl theme** and `"jsx"` language
- Renders tokenized output as `<pre><code>` with token spans
- Panel header: macOS-style traffic light dots (decorative) + "Generated Component" label (center)
- Copy button (top-right of panel): `navigator.clipboard.writeText(code)`, fallback to `document.execCommand('copy')` via a temporary `<textarea>`. Shows "Copied!" for 2s.

---

## Utilities

### `codeGen.js`

`generateFramerCode(config) → string`

**Non-default prop pruning:** omit any prop where the value equals its neutral/identity value:
- `x: 0` → omit
- `y: 0` → omit
- `rotate: 0` → omit
- `scale: 1` → omit
- `blur: 0` → omit (no filter emitted)
- `blur > 0` → emit `filter: "blur(${blur}px)"` inside `animate`
- `opacity` is **never pruned** — always emitted in `animate` even when `opacity: 1`. This ensures the fade-in from `initial: { opacity: 0 }` is always correctly expressed in the output.

**Simple animation (`splitType === "none"`):**

Emits a single `motion.div` component. Includes:
- `initial={{ opacity: 0, scale: 0.8, y: 20 }}` (only when `triggerOnMount: true`)
- `initial={false}` (when `triggerOnMount: false`)
- `animate={{ ...nonDefaultProps }}` (only when `triggerOnMount: true`)
- `whileHover={{ scale: configScale * 1.05 }}` (only when `triggerOnHover: true`)
- `whileTap={{ scale: configScale * 0.95 }}` (only when `triggerOnTap: true`)
- `transition={{ type: "spring", stiffness, damping, mass }}` or `{ duration, ease }`

**Split animation (`splitType !== "none"`):**

Emits `containerVariants`, `childVariants`, and an `AnimatedText` component. Child variants use the configured animate target values. Stagger from `config.stagger`.

**Transition string:**
```js
// Spring:
`type: "spring", stiffness: ${stiffness}, damping: ${damping}, mass: ${mass}`
// Tween:
`duration: ${duration}, ease: "${ease}"`
```

---

### `springMath.js`

`computeSpringCurve({ stiffness, damping, mass }, steps = 200) → [number, number][]`

Returns an array of `[t, position]` tuples where:
- `t` ranges from `0` to `2` (seconds, the display window)
- `position` is the spring displacement (0 = start, 1 = target)

Uses closed-form damped harmonic oscillator. Three regimes:

**Underdamped** (`damping² < 4 * stiffness * mass`):
```
ωn = sqrt(stiffness / mass)
ζ  = damping / (2 * sqrt(stiffness * mass))
ωd = ωn * sqrt(1 - ζ²)
position(t) = 1 - e^(-ζ * ωn * t) * (cos(ωd * t) + (ζ * ωn / ωd) * sin(ωd * t))
```

**Critically damped** (`damping² === 4 * stiffness * mass`):
```
ωn = sqrt(stiffness / mass)
position(t) = 1 - e^(-ωn * t) * (1 + ωn * t)
```

**Overdamped** (`damping² > 4 * stiffness * mass`):
```
ωn = sqrt(stiffness / mass)
ζ  = damping / (2 * sqrt(stiffness * mass))
r1 = -ωn * (ζ - sqrt(ζ² - 1))
r2 = -ωn * (ζ + sqrt(ζ² - 1))
position(t) = 1 - (r2 * e^(r1 * t) - r1 * e^(r2 * t)) / (r2 - r1)
```

Degenerate inputs are prevented at the slider level (stiffness min 1, damping min 1, mass min 0.1), so no special casing needed inside the math function.

---

## Visual Design

Dark studio aesthetic:
- Background: `#0a0a0a` (app), `#0f0f0f` (sidebar), `#0d0d0d` (canvas)
- Accent: indigo-500 (`#6366f1`)
- Borders: `zinc-800`
- Text: `zinc-100` primary, `zinc-400` secondary/labels
- Dot-grid canvas background: `radial-gradient` 32px repeating pattern
- Custom scrollbar on sidebar: thin (6px), `zinc-700` thumb
- Indigo ambient glow behind preview element (absolutely positioned blur circle)

---

## Edge Cases & Behaviour Table

| Scenario | Behaviour |
|---|---|
| Last active trigger turned off | UI silently no-ops — toggle does not change |
| `triggerOnMount: false`, only hover active | Element starts at target; hover animates scale ±5%. Replay button has no visible effect. Code emits `initial={false}` + `whileHover` only. |
| `splitType !== "none"` with `triggerOnHover` | Hover applies `whileHover` to the container div; stagger still plays on mount |
| `blur > 10px` | Amber performance warning badge shown below blur slider |
| `blur > 0` in code output | `filter: "blur(Xpx)"` included in `animate` object (Framer Motion animates CSS filter) |
| `blur > 0` in live preview | Applied as `style={{ filter: "blur(Xpx)" }}` — static, not animated in preview |
| `type === "tween"` | SpringVisualizer is unmounted. Tween has no curve to display. |
| Overdamped spring | Visualizer shows smooth asymptotic approach to 1 with no oscillation |
| Preset "Soft Blur" applied | Sets `type: "tween"`, `duration: 0.6`, `ease: "easeOut"`, `blur: 8` |
| Mobile viewMode | Preview container constrained to 375×667px (iPhone dimensions) |

---

## Out of Scope (this version)

- `layoutId` / shared layout animations
- Drag interaction triggers
- Multiple elements / timeline sequencing
- TypeScript export
- Saving / loading configs
- Exit animations (`AnimatePresence`)
