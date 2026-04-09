import { useState } from 'react'
import { RotateCcw, Monitor, Smartphone, Copy, Check } from 'lucide-react'
import { generateFramerCode } from './utils/codeGen'
import Sidebar from './components/Sidebar'
import PreviewCanvas from './components/PreviewCanvas'
import CodeOutput from './components/CodeOutput'

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
    let success = false
    try {
      await navigator.clipboard.writeText(code)
      success = true
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      success = document.execCommand('copy')
      ta.remove()
    }
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">
      <Sidebar config={config} updateConfig={updateConfig} />

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md flex-shrink-0">
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
        <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-[#0d0d0d] dot-grid">
          {config.activeTab === 'preview' ? (
            <PreviewCanvas
              config={config}
              replayKey={config.replayKey}
              viewMode={config.viewMode}
            />
          ) : (
            <CodeOutput config={config} />
          )}
        </div>
      </div>
    </div>
  )
}

export { EASING_OPTIONS, INITIAL_STATE }
