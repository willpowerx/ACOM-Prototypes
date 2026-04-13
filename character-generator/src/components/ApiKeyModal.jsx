import { useState } from 'react';
import { X, Key, Eye, EyeOff, ExternalLink, CheckCircle, AlertTriangle, Trash2, Save } from 'lucide-react';

const SOURCE_CONFIG = {
  env: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    label: 'Configured via environment variable',
    description: 'VITE_GEMINI_API_KEY is set in your .env file. This key takes priority and cannot be overridden here.',
  },
  local: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    label: 'API key saved locally',
    description: 'Your key is stored in your browser\'s localStorage. It stays on your device and is never sent anywhere except to Google\'s API.',
  },
  none: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    label: 'No API key configured',
    description: 'Add your Gemini API key below to start using the tool.',
  },
};

export default function ApiKeyModal({ source, localKey, onSave, onClear, onClose }) {
  const [inputValue, setInputValue] = useState(localKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saved'

  const config = SOURCE_CONFIG[source];
  const StatusIcon = config.icon;

  const handleSave = () => {
    if (!inputValue.trim()) return;
    onSave(inputValue.trim());
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const handleClear = () => {
    onClear();
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-800">API Key Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Status banner */}
          <div className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg}`}>
            <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
            <div>
              <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{config.description}</p>
            </div>
          </div>

          {/* Input — disabled when key comes from env */}
          {source !== 'env' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="AIza..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                             font-mono tracking-wide placeholder:tracking-normal placeholder:font-sans"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!inputValue.trim() || saveState === 'saved'}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${saveState === 'saved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                >
                  {saveState === 'saved' ? (
                    <><CheckCircle className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Key</>
                  )}
                </button>

                {localKey && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600
                               hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Get a key link */}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Get a free Gemini API key at Google AI Studio
          </a>

          {/* Env-var tip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Developer tip — .env.local
            </p>
            <code className="block text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono">
              VITE_GEMINI_API_KEY=AIza...
            </code>
            <p className="text-xs text-slate-400 mt-1.5">
              Set this in a <code className="font-mono">.env.local</code> file at the project root. It is git-ignored by default and takes priority over any key saved here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
