# MotionGen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Framer Motion animation playground and code generator at `/Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/motion-gen/`.

**Architecture:** Separate Vite + React + Tailwind project with all state in App.jsx passed as props. Pure utility functions (springMath.js, codeGen.js) are TDD'd first; UI components are built bottom-up and wired together in App.jsx last.

**Tech Stack:** React 18, Vite, Tailwind CSS, framer-motion, prism-react-renderer v2, lucide-react, Vitest

---

## File Map

| File | Responsibility |
|---|---|
| `src/App.jsx` | Layout shell, all state, tab switching, replay key, export CTA |
| `src/components/Sidebar.jsx` | Four collapsible sections + ControlGroup sub-component + preset chips |
| `src/components/SpringVisualizer.jsx` | SVG spring curve, reads from springMath.js |
| `src/components/PreviewCanvas.jsx` | Live Framer Motion preview, blur wrapper pattern |
| `src/components/CodeOutput.jsx` | prism-react-renderer highlighted panel, copy button |
| `src/utils/springMath.js` | Pure: computeSpringCurve — damped harmonic oscillator math |
| `src/utils/codeGen.js` | Pure: generateFramerCode — builds JSX string from config |
| `src/utils/springMath.test.js` | Unit tests for springMath |
| `src/utils/codeGen.test.js` | Unit tests for codeGen |

---

## Task 1: Project Bootstrap

**Files:**
- Create: `/Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/motion-gen/` (entire project)

- [ ] **Step 1: Scaffold the Vite project**

```bash
cd /Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT
npm create vite@latest motion-gen -- --template react
cd motion-gen
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install framer-motion prism-react-renderer lucide-react
```

Expected: all three packages listed under `dependencies` in `package.json`.

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 4: Configure Tailwind**

Replace the contents of `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Configure Vitest**

Add to `vite.config.js` (replace the whole file):
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

Create `src/test-setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Set up index.css with Tailwind directives**

Replace `src/index.css` entirely:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
```

- [ ] **Step 7: Clean up Vite template defaults**

Delete these files (they're Vite template boilerplate we don't need):
```bash
rm src/App.css src/assets/react.svg public/vite.svg 2>/dev/null; true
```

Replace `src/App.jsx` with a placeholder:
```jsx
export default function App() {
  return <div className="h-screen bg-[#0a0a0a] text-zinc-100">MotionGen</div>
}
```

Replace `src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Replace `index.html` title:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MotionGen</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite server starts, browser shows dark page with "MotionGen" text.

- [ ] **Step 9: Add `package.json` test script and verify Vitest runs**

Add `"test": "vitest"` to the `scripts` section of `package.json`. Then:

```bash
npm test -- --run
```

Expected: "No test files found" or similar — no errors, just no tests yet.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: bootstrap motion-gen vite project with tailwind + vitest"
```

---

## Task 2: springMath.js (TDD)

**Files:**
- Create: `src/utils/springMath.js`
- Create: `src/utils/springMath.test.js`

- [ ] **Step 1: Create the test file**

Create `src/utils/springMath.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { computeSpringCurve } from './springMath'

describe('computeSpringCurve', () => {
  it('returns 200 [t, position] tuples by default', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 })
    expect(result).toHaveLength(200)
    expect(result[0]).toHaveLength(2)
  })

  it('starts near 0 and ends near 1 for a typical underdamped spring', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 })
    expect(result[0][1]).toBeCloseTo(0, 2)
    expect(result[199][1]).toBeCloseTo(1, 1)
  })

  it('t values range from 0 to 2', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 })
    expect(result[0][0]).toBe(0)
    expect(result[199][0]).toBeCloseTo(2, 5)
  })

  it('overdamped spring ends near 1 without oscillating past 1', () => {
    // High damping relative to stiffness = overdamped
    const result = computeSpringCurve({ stiffness: 10, damping: 100, mass: 1 })
    const positions = result.map(([, p]) => p)
    // Never exceeds 1 (no overshoot in overdamped)
    expect(Math.max(...positions)).toBeLessThanOrEqual(1.001)
    expect(result[199][1]).toBeCloseTo(1, 1)
  })

  it('underdamped spring overshoots 1 before settling', () => {
    // Low damping = underdamped = overshoot
    const result = computeSpringCurve({ stiffness: 200, damping: 5, mass: 1 })
    const positions = result.map(([, p]) => p)
    expect(Math.max(...positions)).toBeGreaterThan(1)
  })

  it('respects custom steps count', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 }, 50)
    expect(result).toHaveLength(50)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run
```

Expected: 6 failures — "Cannot find module './springMath'"

- [ ] **Step 3: Implement springMath.js**

Create `src/utils/springMath.js`:
```js
/**
 * Computes a damped harmonic oscillator (spring) curve.
 * Returns an array of [t, position] tuples from t=0 to t=2 (seconds).
 * position: 0 = start, 1 = equilibrium target.
 */
export function computeSpringCurve({ stiffness, damping, mass }, steps = 200) {
  const tMax = 2
  const points = []

  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * tMax
    points.push([t, springPosition(stiffness, damping, mass, t)])
  }

  return points
}

function springPosition(stiffness, damping, mass, t) {
  const discriminant = damping * damping - 4 * stiffness * mass

  if (discriminant < 0) {
    // Underdamped: oscillates
    const wn = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))
    const wd = wn * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * wn * t) * (
      Math.cos(wd * t) + (zeta * wn / wd) * Math.sin(wd * t)
    )
  }

  if (discriminant === 0) {
    // Critically damped: fastest non-oscillating approach
    const wn = Math.sqrt(stiffness / mass)
    return 1 - Math.exp(-wn * t) * (1 + wn * t)
  }

  // Overdamped: slow, no oscillation
  const wn = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  const sqrtTerm = Math.sqrt(zeta * zeta - 1)
  const r1 = -wn * (zeta - sqrtTerm)
  const r2 = -wn * (zeta + sqrtTerm)
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
}
```

- [ ] **Step 4: Run tests — all must pass**

```bash
npm test -- --run
```

Expected: 6 passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add src/utils/springMath.js src/utils/springMath.test.js
git commit -m "feat: add springMath utility with damped harmonic oscillator"
```

---

## Task 3: codeGen.js (TDD)

**Files:**
- Create: `src/utils/codeGen.js`
- Create: `src/utils/codeGen.test.js`

The base config used throughout tests (all values at defaults):
```js
const BASE = {
  opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, blur: 0,
  type: 'spring', stiffness: 100, damping: 10, mass: 1,
  duration: 0.5, ease: 'easeInOut',
  triggerOnMount: true, triggerOnHover: false, triggerOnTap: false,
  text: 'Hello', splitType: 'none', stagger: 0.05,
}
```

- [ ] **Step 1: Create the test file**

Create `src/utils/codeGen.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { generateFramerCode } from './codeGen'

const BASE = {
  opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, blur: 0,
  type: 'spring', stiffness: 100, damping: 10, mass: 1,
  duration: 0.5, ease: 'easeInOut',
  triggerOnMount: true, triggerOnHover: false, triggerOnTap: false,
  text: 'Hello', splitType: 'none', stagger: 0.05,
}

describe('generateFramerCode', () => {
  it('always emits opacity in animate even when opacity is 1', () => {
    const code = generateFramerCode(BASE)
    expect(code).toContain('opacity: 1')
  })

  it('omits x when x is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\bx:\s*0\b/)
  })

  it('omits y when y is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\by:\s*0\b/)
  })

  it('omits rotate when rotate is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\brotate:\s*0\b/)
  })

  it('omits scale when scale is 1', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\bscale:\s*1\b/)
  })

  it('omits filter when blur is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toContain('filter')
  })

  it('emits filter in animate when blur > 0', () => {
    const code = generateFramerCode({ ...BASE, blur: 5 })
    expect(code).toContain('filter: "blur(5px)"')
  })

  it('emits spring transition props', () => {
    const code = generateFramerCode(BASE)
    expect(code).toContain('type: "spring"')
    expect(code).toContain('stiffness: 100')
    expect(code).toContain('damping: 10')
    expect(code).toContain('mass: 1')
  })

  it('emits tween transition when type is tween', () => {
    const code = generateFramerCode({ ...BASE, type: 'tween', duration: 0.8, ease: 'easeOut' })
    expect(code).toContain('duration: 0.8')
    expect(code).toContain('ease: "easeOut"')
    expect(code).not.toContain('type: "spring"')
  })

  it('emits initial={false} when triggerOnMount is false', () => {
    const code = generateFramerCode({ ...BASE, triggerOnMount: false })
    expect(code).toContain('initial={false}')
    expect(code).not.toContain('animate=')
  })

  it('emits whileHover when triggerOnHover is true', () => {
    const code = generateFramerCode({ ...BASE, triggerOnHover: true })
    expect(code).toContain('whileHover=')
  })

  it('does not emit whileHover when triggerOnHover is false', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toContain('whileHover')
  })

  it('emits whileTap when triggerOnTap is true', () => {
    const code = generateFramerCode({ ...BASE, triggerOnTap: true })
    expect(code).toContain('whileTap=')
  })

  it('emits containerVariants and childVariants for word split', () => {
    const code = generateFramerCode({ ...BASE, splitType: 'word' })
    expect(code).toContain('containerVariants')
    expect(code).toContain('childVariants')
    expect(code).toContain('staggerChildren')
  })

  it('emits containerVariants and childVariants for char split', () => {
    const code = generateFramerCode({ ...BASE, splitType: 'char' })
    expect(code).toContain('containerVariants')
    expect(code).toContain('childVariants')
  })

  it('includes framer-motion import', () => {
    const code = generateFramerCode(BASE)
    expect(code).toContain('from "framer-motion"')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run
```

Expected: 15 failures — "Cannot find module './codeGen'"

- [ ] **Step 3: Implement codeGen.js**

Create `src/utils/codeGen.js`:
```js
/**
 * Generates a production-ready Framer Motion JSX component string.
 */
export function generateFramerCode(config) {
  if (config.splitType !== 'none') {
    return generateSplitCode(config)
  }
  return generateSimpleCode(config)
}

// --- Simple (no text split) ---

function generateSimpleCode(config) {
  const animateProps = buildAnimateProps(config)
  const transitionStr = buildTransitionStr(config)

  const initialAttr = config.triggerOnMount
    ? `initial={{ opacity: 0, scale: 0.8, y: 20 }}`
    : `initial={false}`

  const animateAttr = config.triggerOnMount
    ? `\n      animate={${JSON.stringify(animateProps).replace(/"([^"]+)":/g, '$1:')}}`
    : ''

  const hoverAttr = config.triggerOnHover
    ? `\n      whileHover={{ scale: ${round(config.scale * 1.05)} }}`
    : ''

  const tapAttr = config.triggerOnTap
    ? `\n      whileTap={{ scale: ${round(config.scale * 0.95)} }}`
    : ''

  return `import { motion } from "framer-motion";

export const MyComponent = () => {
  return (
    <motion.div
      ${initialAttr}${animateAttr}${hoverAttr}${tapAttr}
      transition={{
        ${transitionStr}
      }}
    >
      {/* Your content here */}
    </motion.div>
  );
};`
}

// --- Split (word or char) ---

function generateSplitCode(config) {
  const animateProps = buildAnimateProps(config)
  const transitionStr = buildTransitionStr(config)
  const animateStr = JSON.stringify(animateProps).replace(/"([^"]+)":/g, '$1:')

  return `import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: ${config.stagger} },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    ...${animateStr},
    filter: "blur(0px)",
    transition: { ${transitionStr} },
  },
};

export const AnimatedText = () => {
  const text = "${config.text}";
  const items = text.split(${config.splitType === 'word' ? '" "' : '""'});

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
    >
      {items.map((item, i) => (
        <motion.span key={i} variants={childVariants} style={{ display: "inline-block" }}>
          {item}
        </motion.span>
      ))}
    </motion.div>
  );
};`
}

// --- Helpers ---

function buildAnimateProps(config) {
  const props = { opacity: config.opacity } // opacity is never pruned

  if (config.x !== 0) props.x = config.x
  if (config.y !== 0) props.y = config.y
  if (config.scale !== 1) props.scale = config.scale
  if (config.rotate !== 0) props.rotate = config.rotate
  if (config.blur > 0) props.filter = `blur(${config.blur}px)`

  return props
}

function buildTransitionStr(config) {
  if (config.type === 'spring') {
    return `type: "spring", stiffness: ${config.stiffness}, damping: ${config.damping}, mass: ${config.mass}`
  }
  return `duration: ${config.duration}, ease: "${config.ease}"`
}

function round(n) {
  return Math.round(n * 100) / 100
}
```

- [ ] **Step 4: Run tests — all must pass**

```bash
npm test -- --run
```

Expected: 15 passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add src/utils/codeGen.js src/utils/codeGen.test.js
git commit -m "feat: add codeGen utility — generates framer-motion JSX from config"
```

---

## Task 4: App.jsx Shell (State + Layout)

**Files:**
- Modify: `src/App.jsx`

Build the full layout shell with real state but placeholder content areas (no child components yet). This validates the layout before any components are built.

- [ ] **Step 1: Replace App.jsx with the full state + layout**

```jsx
import { useState } from 'react'
import { Wind, RotateCcw, Monitor, Smartphone, Copy, Check } from 'lucide-react'
import { generateFramerCode } from './utils/codeGen'

const EASING_OPTIONS = [
  'linear', 'easeIn', 'easeOut', 'easeInOut', 'circOut', 'backOut', 'anticipate',
]

const INITIAL_STATE = {
  opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, blur: 0,
  type: 'spring', stiffness: 100, damping: 10, mass: 1,
  duration: 0.5, ease: 'easeInOut',
  triggerOnMount: true, triggerOnHover: false, triggerOnTap: false,
  text: 'Revolutionizing Motion Systems',
  splitType: 'none', stagger: 0.05,
  activeTab: 'preview', viewMode: 'desktop', replayKey: 0,
}

export default function App() {
  const [config, setConfig] = useState(INITIAL_STATE)
  const [copied, setCopied] = useState(false)

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  const handleExport = async () => {
    const code = generateFramerCode(config)
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar placeholder */}
      <div className="w-80 border-r border-zinc-800 bg-[#0f0f0f] flex-shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">MotionGen</h1>
          </div>
        </div>
        <div className="p-4 text-zinc-500 text-sm">Sidebar coming in Task 5</div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => updateConfig('activeTab', 'preview')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${config.activeTab === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Live Preview
            </button>
            <button
              onClick={() => updateConfig('activeTab', 'code')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${config.activeTab === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Code Output
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => updateConfig('replayKey', config.replayKey + 1)}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              title="Replay animation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => updateConfig('viewMode', 'desktop')}
                className={`p-1.5 rounded-md transition-all ${config.viewMode === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateConfig('viewMode', 'mobile')}
                className={`p-1.5 rounded-md transition-all ${config.viewMode === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Export Code'}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
          {config.activeTab === 'preview' ? (
            <div className="text-zinc-500 text-sm">Preview canvas — Task 7</div>
          ) : (
            <div className="text-zinc-500 text-sm">Code output — Task 8</div>
          )}
        </div>
      </div>
    </div>
  )
}

export { EASING_OPTIONS, INITIAL_STATE }
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected: Dark two-column layout with header tabs, replay button, viewport toggle, Export Code button. Clicking tabs switches between placeholder text. Export Code button copies code to clipboard (open DevTools console to verify no errors).

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add App.jsx layout shell with full state and header controls"
```

---

## Task 5: Sidebar.jsx

**Files:**
- Create: `src/components/Sidebar.jsx`
- Modify: `src/App.jsx` (import and use Sidebar)

- [ ] **Step 1: Create Sidebar.jsx**

Create `src/components/Sidebar.jsx`:
```jsx
import { useState } from 'react'
import { Layers, Zap, MousePointer2, Type, ChevronRight, Info } from 'lucide-react'
import SpringVisualizer from './SpringVisualizer'

const EASING_OPTIONS = [
  'linear', 'easeIn', 'easeOut', 'easeInOut', 'circOut', 'backOut', 'anticipate',
]

const PRESETS = [
  { label: 'Fade In',   config: { opacity:1, y:0, scale:1, rotate:0, blur:0, type:'spring', stiffness:80, damping:12, mass:1 } },
  { label: 'Slide Up',  config: { opacity:1, y:-60, scale:1, rotate:0, blur:0, type:'spring', stiffness:120, damping:14, mass:1 } },
  { label: 'Pop & Spin', config: { opacity:1, y:0, scale:1.1, rotate:360, blur:0, type:'spring', stiffness:200, damping:20, mass:1 } },
  { label: 'Soft Blur', config: { opacity:1, y:0, scale:1, rotate:0, blur:8, type:'tween', duration:0.6, ease:'easeOut' } },
]

export default function Sidebar({ config, updateConfig }) {
  const [openSections, setOpenSections] = useState({
    transform: true, transition: true, triggers: true, typography: true,
  })

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const applyPreset = (preset) => {
    Object.entries(preset.config).forEach(([k, v]) => updateConfig(k, v))
  }

  const handleTriggerToggle = (key) => {
    const active = ['triggerOnMount', 'triggerOnHover', 'triggerOnTap'].filter(k => config[k])
    // Silently no-op if this is the last active trigger being turned off
    if (config[key] && active.length === 1) return
    updateConfig(key, !config[key])
  }

  return (
    <div className="w-80 flex-shrink-0 border-r border-zinc-800 bg-[#0f0f0f] flex flex-col overflow-hidden">
      {/* Brand header */}
      <div className="p-5 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-base tracking-tight">MotionGen</h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-1">

        {/* Preset chips */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Transform & Filters */}
        <Section
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Transform & Filters"
          open={openSections.transform}
          onToggle={() => toggleSection('transform')}
        >
          <ControlGroup label="Opacity" value={config.opacity} min={0} max={1} step={0.01} unit="" onChange={v => updateConfig('opacity', v)} />
          <ControlGroup label="Scale" value={config.scale} min={0.1} max={3} step={0.05} unit="×" onChange={v => updateConfig('scale', v)} />
          <ControlGroup label="Rotate" value={config.rotate} min={-360} max={360} step={1} unit="°" onChange={v => updateConfig('rotate', v)} />
          <ControlGroup label="Y Offset" value={config.y} min={-200} max={200} step={1} unit="px" onChange={v => updateConfig('y', v)} />
          <ControlGroup label="X Offset" value={config.x} min={-200} max={200} step={1} unit="px" onChange={v => updateConfig('x', v)} />
          <ControlGroup label="Blur" value={config.blur} min={0} max={40} step={1} unit="px" onChange={v => updateConfig('blur', v)} />
          {config.blur > 10 && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Heavy blur detected. Keep under 10px for best GPU performance.</span>
            </div>
          )}
        </Section>

        {/* Section 2: Transition Strategy */}
        <Section
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Transition Strategy"
          open={openSections.transition}
          onToggle={() => toggleSection('transition')}
        >
          {/* Spring / Tween pill */}
          <div className="flex bg-zinc-950 p-1 rounded-lg mb-3">
            {['spring', 'tween'].map(t => (
              <button
                key={t}
                onClick={() => updateConfig('type', t)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${config.type === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {config.type === 'spring' ? (
            <>
              <ControlGroup label="Stiffness" value={config.stiffness} min={1} max={1000} step={1} unit="" onChange={v => updateConfig('stiffness', v)} />
              <ControlGroup label="Damping" value={config.damping} min={1} max={100} step={1} unit="" onChange={v => updateConfig('damping', v)} />
              <ControlGroup label="Mass" value={config.mass} min={0.1} max={10} step={0.1} unit="" onChange={v => updateConfig('mass', v)} />
              <SpringVisualizer stiffness={config.stiffness} damping={config.damping} mass={config.mass} />
            </>
          ) : (
            <>
              <ControlGroup label="Duration" value={config.duration} min={0.1} max={5} step={0.1} unit="s" onChange={v => updateConfig('duration', v)} />
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Easing</span>
                <select
                  value={config.ease}
                  onChange={e => updateConfig('ease', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  {EASING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </>
          )}
        </Section>

        {/* Section 3: Gesture Triggers */}
        <Section
          icon={<MousePointer2 className="w-3.5 h-3.5" />}
          label="Animation Triggers"
          open={openSections.triggers}
          onToggle={() => toggleSection('triggers')}
        >
          {[
            { key: 'triggerOnMount', label: 'On Mount', desc: 'Plays when element appears' },
            { key: 'triggerOnHover', label: 'On Hover', desc: 'Plays on mouse enter' },
            { key: 'triggerOnTap',   label: 'On Tap',   desc: 'Plays on click / touch' },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => handleTriggerToggle(key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${config[key] ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
            >
              <div className="text-left">
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] opacity-60">{desc}</p>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${config[key] ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${config[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          ))}
        </Section>

        {/* Section 4: Typography Reveal */}
        <Section
          icon={<Type className="w-3.5 h-3.5" />}
          label="Typography Reveal"
          open={openSections.typography}
          onToggle={() => toggleSection('typography')}
        >
          <input
            type="text"
            value={config.text}
            onChange={e => updateConfig('text', e.target.value)}
            placeholder="Enter display text..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1.5">Split By</p>
            <div className="grid grid-cols-3 gap-1.5">
              {['none', 'word', 'char'].map(t => (
                <button
                  key={t}
                  onClick={() => updateConfig('splitType', t)}
                  className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${config.splitType === t ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {config.splitType !== 'none' && (
            <ControlGroup label="Stagger" value={config.stagger} min={0} max={0.5} step={0.01} unit="s" onChange={v => updateConfig('stagger', v)} />
          )}
        </Section>

      </div>
    </div>
  )
}

// --- Sub-components ---

function Section({ icon, label, open, onToggle, children }) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2 text-zinc-400">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 space-y-3 bg-zinc-950/30">
          {children}
        </div>
      )}
    </div>
  )
}

function ControlGroup({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-zinc-400">{label}</span>
        <span className="text-indigo-400 tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  )
}
```

- [ ] **Step 2: Add custom scrollbar CSS to index.css**

Append to `src/index.css`:
```css
.sidebar-scroll::-webkit-scrollbar { width: 4px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
.sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #52525b; }
```

- [ ] **Step 3: Wire Sidebar into App.jsx**

Replace the sidebar placeholder div in `src/App.jsx` with:
```jsx
import Sidebar from './components/Sidebar'
// ... (add this import at top)

// Replace the sidebar placeholder div with:
<Sidebar config={config} updateConfig={updateConfig} />
```

Also remove the logo/brand header from App.jsx's sidebar placeholder since Sidebar now owns it.

- [ ] **Step 4: Stub SpringVisualizer so Sidebar can import it**

Create a minimal `src/components/SpringVisualizer.jsx` stub so Sidebar doesn't crash (will be implemented fully in Task 6):
```jsx
export default function SpringVisualizer() {
  return <div className="h-24 bg-zinc-900/50 rounded-lg border border-zinc-800 mt-2" />
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Expected: Full sidebar visible with all 4 sections, preset chips, all sliders, trigger toggles, and typography controls. Sections collapse/expand on click. Changing sliders updates values in real time. Preset chips fire without errors. Blur warning appears when blur > 10.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.jsx src/components/SpringVisualizer.jsx src/index.css src/App.jsx
git commit -m "feat: add Sidebar with all four control sections and preset chips"
```

---

## Task 6: SpringVisualizer.jsx

**Files:**
- Modify: `src/components/SpringVisualizer.jsx` (replace the stub)

- [ ] **Step 1: Replace the stub with the real implementation**

Replace the entire contents of `src/components/SpringVisualizer.jsx`:
```jsx
import { useMemo } from 'react'
import { computeSpringCurve } from '../utils/springMath'

export default function SpringVisualizer({ stiffness, damping, mass }) {
  const points = useMemo(
    () => computeSpringCurve({ stiffness, damping, mass }),
    [stiffness, damping, mass]
  )

  // Map [t, position] to SVG coordinates
  // viewBox: 0 0 200 80
  // t 0–2 → x 10–190  (10px padding each side)
  // position 0–1.5 → y 70–10 (flipped: higher = lower y)
  const tMax = 2
  const posMin = -0.3  // allow slight undershoot display
  const posMax = 1.5   // allow overshoot display

  const toX = (t) => 10 + (t / tMax) * 180
  const toY = (pos) => 70 - ((pos - posMin) / (posMax - posMin)) * 60

  const pathD = points
    .map(([t, pos], i) => `${i === 0 ? 'M' : 'L'}${toX(t).toFixed(1)},${toY(pos).toFixed(1)}`)
    .join(' ')

  // Equilibrium line (position = 1) y-coordinate
  const eqY = toY(1)

  return (
    <div className="mt-1 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 px-3 pt-2 pb-0">
        Spring Curve
      </p>
      <svg
        width="100%"
        height="80"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        className="block"
      >
        {/* Zero line (position = 0) */}
        <line
          x1="10" y1={toY(0)} x2="190" y2={toY(0)}
          stroke="#27272a" strokeWidth="0.5"
        />
        {/* Equilibrium line (position = 1) — dashed */}
        <line
          x1="10" y1={eqY} x2="190" y2={eqY}
          stroke="#3f3f46" strokeWidth="0.8" strokeDasharray="4 3"
        />
        {/* Spring curve */}
        <path
          d={pathD}
          fill="none"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Labels */}
        <text x="4" y={toY(0) + 1} fontSize="6" fill="#52525b" dominantBaseline="middle">0</text>
        <text x="193" y={eqY + 1} fontSize="6" fill="#52525b" dominantBaseline="middle">1</text>
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected: When Transition section is in "Spring" mode, an SVG curve appears below the mass slider. Moving stiffness/damping/mass sliders updates the curve in real time. Switching to Tween hides the visualizer.

- [ ] **Step 3: Commit**

```bash
git add src/components/SpringVisualizer.jsx
git commit -m "feat: add SpringVisualizer SVG with damped oscillator curve"
```

---

## Task 7: PreviewCanvas.jsx

**Files:**
- Create: `src/components/PreviewCanvas.jsx`
- Modify: `src/App.jsx` (import and use PreviewCanvas)

- [ ] **Step 1: Create PreviewCanvas.jsx**

Create `src/components/PreviewCanvas.jsx`:
```jsx
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function PreviewCanvas({ config, replayKey, viewMode }) {
  const blurStyle = config.blur > 0 ? `blur(${config.blur}px)` : undefined

  const transitionProps = config.type === 'spring'
    ? { type: 'spring', stiffness: config.stiffness, damping: config.damping, mass: config.mass }
    : { duration: config.duration, ease: config.ease }

  const animateTarget = {
    opacity: config.opacity,
    ...(config.x !== 0 && { x: config.x }),
    ...(config.y !== 0 && { y: config.y }),
    ...(config.scale !== 1 && { scale: config.scale }),
    ...(config.rotate !== 0 && { rotate: config.rotate }),
  }

  return (
    <div
      className={`relative bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 flex items-center justify-center ${
        viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full max-w-4xl max-h-[600px]'
      }`}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a1a1a 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/8 blur-[100px] pointer-events-none rounded-full" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center w-full px-8">
        {config.splitType === 'none' ? (
          <SimplePreview
            config={config}
            replayKey={replayKey}
            blurStyle={blurStyle}
            animateTarget={animateTarget}
            transitionProps={transitionProps}
          />
        ) : (
          <SplitPreview
            config={config}
            replayKey={replayKey}
            blurStyle={blurStyle}
            transitionProps={transitionProps}
          />
        )}
      </div>
    </div>
  )
}

function SimplePreview({ config, replayKey, blurStyle, animateTarget, transitionProps }) {
  return (
    <div style={{ filter: blurStyle }}>
      <motion.div
        key={replayKey}
        initial={config.triggerOnMount ? { opacity: 0, scale: 0.8, y: 20 } : false}
        animate={config.triggerOnMount ? { ...animateTarget, transition: transitionProps } : undefined}
        whileHover={config.triggerOnHover ? { scale: config.scale * 1.05, filter: 'brightness(1.15)' } : undefined}
        whileTap={config.triggerOnTap ? { scale: config.scale * 0.95, filter: 'brightness(0.9)' } : undefined}
        className="p-8 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/60 rounded-2xl shadow-inner text-center max-w-sm"
      >
        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="text-white w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white leading-tight">{config.text}</h2>
        <p className="text-zinc-500 text-sm">High-performance React Motion</p>
      </motion.div>
    </div>
  )
}

function SplitPreview({ config, replayKey, blurStyle, transitionProps }) {
  const items = config.text.split(config.splitType === 'word' ? ' ' : '')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: config.stagger },
    },
  }

  const childVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
      opacity: config.opacity,
      y: config.y,
      scale: config.scale,
      rotate: config.rotate,
      filter: 'blur(0px)',
      transition: transitionProps,
    },
  }

  return (
    <div style={{ filter: blurStyle }}>
      <motion.div
        key={replayKey}
        variants={containerVariants}
        initial={config.triggerOnMount ? 'hidden' : 'visible'}
        animate="visible"
        whileHover={config.triggerOnHover ? { scale: 1.02 } : undefined}
        whileTap={config.triggerOnTap ? { scale: 0.98 } : undefined}
        className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-2xl"
      >
        {items.map((item, i) => (
          <motion.span
            key={i}
            variants={childVariants}
            className="inline-block text-4xl font-black text-white leading-tight tracking-tighter"
          >
            {item || '\u00A0'}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Wire PreviewCanvas into App.jsx**

In `src/App.jsx`, replace the preview placeholder:
```jsx
import PreviewCanvas from './components/PreviewCanvas'

// Replace the preview placeholder:
{config.activeTab === 'preview' ? (
  <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-[#0d0d0d]">
    <PreviewCanvas
      config={config}
      replayKey={config.replayKey}
      viewMode={config.viewMode}
    />
  </div>
) : (
  <div className="text-zinc-500 text-sm">Code output — Task 8</div>
)}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected:
- Default state: animated card with Sparkles icon fades/scales in on mount
- Replay button re-triggers animation
- Changing scale/rotate/opacity sliders updates the animate target
- Spring slider changes affect animation physics
- Enabling "On Hover" makes card scale up on mouse hover
- Enabling "On Tap" makes card compress on click
- Changing splitType to "word" shows staggered word animation
- Mobile toggle constrains preview to phone dimensions
- Blur slider applies visible blur (static, not animated)

- [ ] **Step 4: Commit**

```bash
git add src/components/PreviewCanvas.jsx src/App.jsx
git commit -m "feat: add PreviewCanvas with Framer Motion live preview and gesture triggers"
```

---

## Task 8: CodeOutput.jsx

**Files:**
- Create: `src/components/CodeOutput.jsx`
- Modify: `src/App.jsx` (import and use CodeOutput)

- [ ] **Step 1: Create CodeOutput.jsx**

Create `src/components/CodeOutput.jsx`:
```jsx
import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Copy, Check } from 'lucide-react'
import { generateFramerCode } from '../utils/codeGen'

export default function CodeOutput({ config }) {
  const [copied, setCopied] = useState(false)
  const code = generateFramerCode(config)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full h-full max-w-4xl max-h-[600px] bg-[#011627] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col font-mono text-sm shadow-2xl">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-[#011627] flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/60 border border-[#ff5f56]/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/60 border border-[#ffbd2e]/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/60 border border-[#27c93f]/30" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Generated Component
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto sidebar-scroll">
        <Highlight theme={themes.nightOwl} code={code.trim()} language="jsx">
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} p-6 text-sm leading-relaxed min-h-full`} style={{ ...style, background: 'transparent', margin: 0 }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="select-none text-zinc-600 mr-4 tabular-nums text-xs" style={{ minWidth: '1.5rem', display: 'inline-block', textAlign: 'right' }}>
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire CodeOutput into App.jsx**

In `src/App.jsx`, replace the code output placeholder:
```jsx
import CodeOutput from './components/CodeOutput'

// Replace the code output placeholder:
{config.activeTab === 'code' && (
  <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-[#0d0d0d]">
    <CodeOutput config={config} />
  </div>
)}
```

Also update the Export Code button in App.jsx to use the same `generateFramerCode(config)` import that's already there (it already does — no change needed).

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected:
- Clicking "Code Output" tab shows a dark panel with Night Owl syntax-highlighted JSX
- Line numbers visible on left
- Code updates live as config changes (switching spring/tween, enabling triggers, etc.)
- Copy button inside the panel copies code and shows "Copied!" for 2s
- "Export Code" button in the header also copies and shows "Copied!"
- Split mode shows containerVariants / childVariants / AnimatedText component

- [ ] **Step 4: Commit**

```bash
git add src/components/CodeOutput.jsx src/App.jsx
git commit -m "feat: add CodeOutput with prism-react-renderer Night Owl syntax highlighting"
```

---

## Task 9: Final Polish

**Files:**
- Modify: `src/App.jsx` (visual refinements)
- Modify: `src/index.css` (global styles)

- [ ] **Step 1: Add dot-grid to the outer content area background**

In `src/index.css`, add:
```css
.dot-grid {
  background-image: radial-gradient(circle at 2px 2px, #1a1a1a 1px, transparent 0);
  background-size: 32px 32px;
}
```

In `src/App.jsx`, add `dot-grid` to the `className` of the outer content area flex div — the one that wraps **both** the preview and code tab panels (not the inner canvas container inside `PreviewCanvas`, which already has its own internal dot grid). This creates a subtle grid behind the canvas border itself.

- [ ] **Step 2: Verify the full flow end-to-end**

Manual QA checklist:
- [ ] Preset "Fade In" → preview shows fade in, code shows spring 80/12/1
- [ ] Preset "Soft Blur" → transition switches to Tween, SpringVisualizer hides
- [ ] Drag stiffness to 500, damping to 5 → spring curve shows heavy oscillation
- [ ] Enable "On Hover" → card scales on hover in preview + whileHover in code
- [ ] Set splitType to "word", replay → staggered word reveal
- [ ] Set blur to 15 → amber warning badge appears
- [ ] Export Code button → clipboard contains valid JSX (paste into any editor to verify)
- [ ] Mobile toggle → preview constrains to phone dimensions

- [ ] **Step 3: Run all unit tests one final time**

```bash
npm test -- --run
```

Expected: All 21 tests pass (6 springMath + 15 codeGen).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: motiongen complete — animation playground with spring visualizer, gesture triggers, and syntax-highlighted code export"
```
