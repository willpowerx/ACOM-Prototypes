import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Copy, Check } from 'lucide-react'
import { generateFramerCode } from '../utils/codeGen'

export default function CodeOutput({ config }) {
  const [copied, setCopied] = useState(false)
  const code = generateFramerCode(config)

  const handleCopy = async () => {
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
