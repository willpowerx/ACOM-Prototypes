# UPS Flex Grid Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ups-grid.css` and `ups-flex-grid.html` with a clean, card-oriented responsive grid system using CSS Grid fr-units, supporting 2–6-up desktop layouts, 2-up tablet, and stacked mobile.

**Architecture:** `ups-grid.css` provides the grid layer only — `.ups-grid` base + five desktop variant classes + orphan rule — all using `--s2a-grid-gutter` from `grid.css` so the existing gutter toggle works automatically. `ups-flex-grid.html` is the demo page with a sticky nav (Container / Ups / Orphan / Gutter / Guides controls), five demo sections (one per up-count, each with enough cards to produce an orphan on tablet), and a class reference table.

**Tech Stack:** Vanilla HTML, CSS (no preprocessor), inline JavaScript. Depends on `tokens.css`, `grid.css`, `styles.css` — all already present in `s2a-grids/`.

---

## Chunk 1: ups-grid.css

### Task 1: Write ups-grid.css

**Files:**
- Overwrite: `s2a-grids/ups-grid.css`

**Spec reference:** `docs/superpowers/specs/2026-03-12-ups-flex-grid-design.md`

- [ ] **Step 1: Open `ups-grid.css` and delete all existing content, replacing with the structure below**

```css
/* =========================================
   UPS Flex Grid
   Requires: tokens.css, grid.css
   grid.css provides: --s2a-grid-gutter, containers, overlay
   ========================================= */

/* --- Base Grid Container --- */
.ups-grid {
    display: grid;
    grid-template-columns: 1fr; /* safe fallback if no variant class applied */
    gap: var(--s2a-grid-gutter);
    align-items: start;
}

/* --- Mobile default: single column stack (<768px) --- */
.ups-grid.two-up,
.ups-grid.three-up,
.ups-grid.four-up,
.ups-grid.five-up,
.ups-grid.six-up {
    grid-template-columns: 1fr;
}

/* --- Tablet: always 2-up (768px–1279.98px) --- */
@media (min-width: 768px) and (max-width: 1279.98px) {
    .ups-grid.two-up,
    .ups-grid.three-up,
    .ups-grid.four-up,
    .ups-grid.five-up,
    .ups-grid.six-up {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* --- Orphan rule: tablet only, opt-in via .orphan-full ---
   In a 2-col grid, odd-positioned items land in column 1.
   A last child in an odd position is visually orphaned.
   Even-positioned last children fill column 2 — no orphan. */
@media (min-width: 768px) and (max-width: 1279.98px) {
    .ups-grid.orphan-full > :last-child:nth-child(odd) {
        grid-column: 1 / -1;
    }
}

/* --- Desktop: N-up fr columns (≥1280px) --- */
@media (min-width: 1280px) {
    .ups-grid.two-up   { grid-template-columns: repeat(2, 1fr); }
    .ups-grid.three-up { grid-template-columns: repeat(3, 1fr); }
    .ups-grid.four-up  { grid-template-columns: repeat(4, 1fr); }
    .ups-grid.five-up  { grid-template-columns: repeat(5, 1fr); }
    .ups-grid.six-up   { grid-template-columns: repeat(6, 1fr); }
}

/* =========================================
   Demo Card (.ups-card) — placeholder only
   ========================================= */
.ups-card {
    background: #ffd97d;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: var(--radius-sm, 8px);
    padding: var(--spacing-lg, 1.5rem);
    min-height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
    line-height: 1.4;
}
```

- [ ] **Step 2: Verify stylesheet chain and token resolution**
  - Open any existing page in `s2a-grids/` that loads `grid.css` (e.g. `col-system.html`)
  - Open devtools → check that `--s2a-grid-gutter` resolves (not empty) on `:root`
  - Confirm the gutter classes (`gutter-8` etc.) are present in `grid.css` — they are, but this confirms the token is live before the demo page is built

- [ ] **Step 3: Commit**

```bash
cd /Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/s2a-grids
git add ups-grid.css
git commit -m "feat: rewrite ups-grid.css — fr-unit card grid, 2-6up desktop, 2up tablet, stacked mobile, orphan-full opt-in"
```

---

## Chunk 2: ups-flex-grid.html

### Task 2: Write ups-flex-grid.html

**Files:**
- Overwrite: `s2a-grids/ups-flex-grid.html`

- [ ] **Step 1: Replace the entire file with the structure below**

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UPS Flex Grid</title>
    <link rel="stylesheet" href="tokens.css">
    <link rel="stylesheet" href="grid.css">
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="ups-grid.css">
</head>

<body class="gutter-8">

    <!-- Grid Overlay (Fixed) -->
    <div class="grid-overlay" id="gridOverlay">
        <div class="grid-overlay-container" id="gridOverlayContainer">
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
            <div class="grid-overlay-col"></div>
        </div>
    </div>

    <header>
        <div class="container">
            <h1>UPS Flex Grid</h1>
            <div style="display: flex; flex-wrap: wrap; gap: 2rem; margin-top: 1rem; line-height: 1.6;">
                <div style="flex: 1; min-width: 260px;">
                    <p class="text-muted">
                        <strong>Desktop (≥1280px)</strong><br>
                        2, 3, 4, 5, or 6 cards per row using equal <code>fr</code> columns.
                        Set via class: <code>.two-up</code> through <code>.six-up</code>.
                    </p>
                    <p class="text-muted">
                        <strong>Tablet (768–1279px)</strong><br>
                        Always 2-up. Add <code>.orphan-full</code> to the grid wrapper
                        to stretch a lone last card to full width.
                    </p>
                </div>
                <div style="flex: 1; min-width: 260px;">
                    <p class="text-muted">
                        <strong>Mobile (&lt;768px)</strong><br>
                        Single column, fully stacked.
                    </p>
                    <p class="text-muted">
                        <strong>Usage</strong><br>
                        <code>&lt;div class="ups-grid three-up"&gt;</code><br>
                        <code>&lt;div class="ups-grid four-up orphan-full"&gt;</code>
                    </p>
                </div>
            </div>
        </div>
    </header>

    <!-- Sticky Navigation Controls -->
    <nav style="position: sticky; top: 0; z-index: 1000; background: var(--color-bg); border-bottom: 1px solid var(--color-border); padding: 1rem 0; margin-bottom: 2rem;">
        <div class="container">
            <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: flex-end; gap: 1.5rem;">

                <!-- Container Type -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);">Container</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn active" data-group="container" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setContainerType('default', this)">Default</button>
                        <button class="btn" data-group="container" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setContainerType('hd', this)">HD</button>
                        <button class="btn" data-group="container" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setContainerType('fluid', this)">Fluid</button>
                        <button class="btn" data-group="container" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setContainerType('hero-offset', this)">Hero Offset</button>
                    </div>
                </div>

                <!-- Ups -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);">Ups</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn" data-group="ups" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setUps('two', this)">2</button>
                        <button class="btn active" data-group="ups" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setUps('three', this)">3</button>
                        <button class="btn" data-group="ups" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setUps('four', this)">4</button>
                        <button class="btn" data-group="ups" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setUps('five', this)">5</button>
                        <button class="btn" data-group="ups" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setUps('six', this)">6</button>
                    </div>
                </div>

                <!-- Orphan -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);">Orphan</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn" id="orphanBtn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="toggleOrphan(this)">Full Width</button>
                    </div>
                </div>

                <!-- Gutter -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);">Gutter</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn" data-group="gutter" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setGutter(32, this)">32</button>
                        <button class="btn" data-group="gutter" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setGutter(16, this)">16</button>
                        <button class="btn active" data-group="gutter" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setGutter(8, this)">8</button>
                        <button class="btn" data-group="gutter" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="setGutter(0, this)">0</button>
                    </div>
                </div>

                <!-- Guides -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);">Guides</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn" id="overlayToggleBtn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="toggleOverlay()">Toggle Overlay</button>
                    </div>
                </div>

            </div>
        </div>
    </nav>

    <main id="mainContainer">

        <!-- 2-up: 5 cards → 1 orphan on tablet -->
        <section>
            <div class="container">
                <h2 style="margin-bottom: 1rem;">2-up</h2>
                <div class="ups-grid two-up" id="grid-two-up">
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                </div>
            </div>
        </section>

        <!-- 3-up: 7 cards → 1 orphan on tablet -->
        <section>
            <div class="container">
                <h2 style="margin-bottom: 1rem;">3-up</h2>
                <div class="ups-grid three-up" id="grid-three-up">
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                </div>
            </div>
        </section>

        <!-- 4-up: 9 cards → 1 orphan on tablet -->
        <section>
            <div class="container">
                <h2 style="margin-bottom: 1rem;">4-up</h2>
                <div class="ups-grid four-up" id="grid-four-up">
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                </div>
            </div>
        </section>

        <!-- 5-up: 11 cards → 1 orphan on tablet -->
        <section>
            <div class="container">
                <h2 style="margin-bottom: 1rem;">5-up</h2>
                <div class="ups-grid five-up" id="grid-five-up">
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                </div>
            </div>
        </section>

        <!-- 6-up: 11 cards → 1 orphan on tablet -->
        <section>
            <div class="container">
                <h2 style="margin-bottom: 1rem;">6-up</h2>
                <div class="ups-grid six-up" id="grid-six-up">
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                    <div class="ups-card">flex + col<br>8 grid/gap</div>
                </div>
            </div>
        </section>

        <!-- Class Reference -->
        <section>
            <div class="container">
                <h2>Class Reference</h2>
                <style>
                    .ref-table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
                    .ref-table th, .ref-table td { border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; text-align: left; }
                    .ref-table th { background: var(--color-surface); font-weight: 600; }
                    .ref-table code { font-family: monospace; }
                </style>
                <table class="ref-table">
                    <thead>
                        <tr><th>Class</th><th>Desktop</th><th>Tablet</th><th>Mobile</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>.ups-grid.two-up</code></td><td>2 col fr</td><td>2 col fr</td><td>1 col</td></tr>
                        <tr><td><code>.ups-grid.three-up</code></td><td>3 col fr</td><td>2 col fr</td><td>1 col</td></tr>
                        <tr><td><code>.ups-grid.four-up</code></td><td>4 col fr</td><td>2 col fr</td><td>1 col</td></tr>
                        <tr><td><code>.ups-grid.five-up</code></td><td>5 col fr</td><td>2 col fr</td><td>1 col</td></tr>
                        <tr><td><code>.ups-grid.six-up</code></td><td>6 col fr</td><td>2 col fr</td><td>1 col</td></tr>
                        <tr><td><code>+ .orphan-full</code></td><td>no effect</td><td>last odd child → full width</td><td>no effect</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

    </main>

    <script>
        const UP_CLASSES = ['two-up', 'three-up', 'four-up', 'five-up', 'six-up'];
        const allGrids = () => document.querySelectorAll('.ups-grid');

        function setActiveBtn(btn) {
            if (!btn) return;
            const group = btn.getAttribute('data-group');
            if (group) {
                document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
            }
            btn.classList.add('active');
        }

        function toggleOverlay() {
            document.getElementById('gridOverlay').classList.toggle('active');
            document.getElementById('overlayToggleBtn').classList.toggle('active');
        }

        function setContainerType(type, btn) {
            setActiveBtn(btn);
            const containers = document.querySelectorAll('#mainContainer .container');
            const overlayContainer = document.getElementById('gridOverlayContainer');
            const removeClasses = ['container-fluid', 'container-hd', 'container-hero-offset'];
            const overlayRemove = ['grid-overlay-container', 'grid-overlay-hd-container', 'grid-overlay-hero-offset-container'];

            containers.forEach(c => c.classList.remove(...removeClasses));
            overlayContainer.classList.remove(...overlayRemove);

            if (type === 'fluid') {
                containers.forEach(c => c.classList.add('container-fluid'));
                overlayContainer.classList.add('grid-overlay-container');
            } else if (type === 'hd') {
                containers.forEach(c => c.classList.add('container-hd'));
                overlayContainer.classList.add('grid-overlay-hd-container');
            } else if (type === 'hero-offset') {
                containers.forEach(c => c.classList.add('container-hero-offset'));
                overlayContainer.classList.add('grid-overlay-hero-offset-container');
            } else {
                overlayContainer.classList.add('grid-overlay-container');
            }
        }

        function setGutter(size, btn) {
            setActiveBtn(btn);
            document.body.classList.remove('gutter-32', 'gutter-16', 'gutter-8', 'gutter-0');
            document.body.classList.add(`gutter-${size}`);
        }

        function setUps(name, btn) {
            setActiveBtn(btn);
            allGrids().forEach(grid => {
                grid.classList.remove(...UP_CLASSES);
                grid.classList.add(`${name}-up`);
            });
        }

        function toggleOrphan(btn) {
            btn.classList.toggle('active');
            allGrids().forEach(grid => grid.classList.toggle('orphan-full'));
        }

        // Init: overlay on, gutter-8 already on body via class attribute
        toggleOverlay();
    </script>

</body>
</html>
```

- [ ] **Step 2: Open `ups-flex-grid.html` in a browser and verify at desktop width (≥1280px)**
  - Default state: 3-up layout, guides on, gutter 8
  - All five sections show 3 equal-width fr columns
  - Cards are amber/yellow, properly padded

- [ ] **Step 3: Verify tablet behavior (resize to 900px)**
  - Confirm all five sections show exactly 2 columns — including the 2-up section (unchanged) and 6-up section (forced down from 6)
  - Orphan button off → in each section the last card occupies only left column (half width), right column empty
  - Click Orphan "Full Width" → last card in each section spans full width (both columns)
  - Click Orphan again → last card returns to half width
  - Even-count sections (e.g. add a 6th card mentally) would NOT orphan — only odd last-child position triggers the rule

- [ ] **Step 4: Verify mobile behavior (resize to 375px)**
  - All cards stack single column
  - No orphan effect visible

- [ ] **Step 5: Verify nav controls**
  - Ups buttons (2–6) switch all grid sections simultaneously
  - Gutter (32/16/8/0) visibly changes gap between cards
  - Container toggle changes container max-width
  - Guides toggle shows/hides the column overlay
  - Orphan toggle adds/removes `.orphan-full` on all grids

- [ ] **Step 6: Commit**

```bash
cd /Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/s2a-grids
git add ups-flex-grid.html
git commit -m "feat: rewrite ups-flex-grid.html — card grid demo, 2-6up nav, orphan toggle, gutter + overlay controls"
```
