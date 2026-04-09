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
