import { useState, useRef } from 'react';
import {
  Upload, Wand2, Copy, Check, Image as ImageIcon,
  Loader2, AlertCircle, FileText, Settings, Key,
  CheckSquare, Square, PenLine,
} from 'lucide-react';

import { useApiKey } from './hooks/useApiKey';
import { fetchWithRetry, geminiUrl } from './utils/api';
import ApiKeyModal from './components/ApiKeyModal';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EMPTY_TRAITS = {
  gender: '',
  bone_structure: '',
  skin_parameters: '',
  eye_morphology: '',
  hair_architecture: '',
  apparel_construction: '',
  style: '',
};

const TRAIT_FIELDS = [
  { id: 'gender',              label: 'Gender', presets: ['Male', 'Female', 'Ambiguous', 'Other'] },
  { id: 'bone_structure',      label: 'Bone Structure (Identity)' },
  { id: 'skin_parameters',     label: 'Skin Parameters' },
  { id: 'eye_morphology',      label: 'Eye Morphology' },
  { id: 'hair_architecture',   label: 'Hair Architecture' },
  { id: 'apparel_construction', label: 'Apparel & Materials' },
  { id: 'style',               label: 'Style (Look & Feel)', defaultEnabled: false },
];

// ---------------------------------------------------------------------------
// Prompt builder — kept out of the component so it never re-creates
// ---------------------------------------------------------------------------
function buildMasterPrompt(traits, enabledTraits) {
  // Helper: return trait value if enabled, otherwise a generic fallback
  const t = (key, fallback = 'standard') => enabledTraits[key] ? traits[key] : fallback;

  const gender               = t('gender', 'person');
  const bone_structure      = t('bone_structure', 'balanced proportions');
  const skin_parameters     = t('skin_parameters', 'natural complexion');
  const eye_morphology      = t('eye_morphology', 'natural eyes');
  const hair_architecture   = t('hair_architecture', 'natural hair');
  const apparel_construction = t('apparel_construction', 'simple clothing');
  const style               = t('style', '');

  // Only append style line if it has content
  const styleDirective = style ? `\n\n**STYLE DIRECTION:** Render in the following style: ${style}.` : '';

  return `A professional character design sheet in a 2D digital illustration style, cinematic animation standard, 2K resolution. Pure white background, precise grid layout with clear spacing, zero overlapping, standardized labels.${styleDirective}

**CHARACTER IDENTITY:** ${gender}, ${bone_structure}, ${skin_parameters}, ${eye_morphology}, ${hair_architecture}. Wearing ${apparel_construction}.

**HEAD DETAILS SECTION:** Top row: Exact front view of head, bare face, clear visible eyes, no accessories. Exact 90-degree right profile view of head, bare face, no accessories. Bottom row: Front view of head with full ${hair_architecture} and outfit collar. Right side view of head with full hair and collar. Facial features, skin tone, and proportions are 100% identical across all four head shots. No perspective distortion.

**FULL BODY ORTHOGRAPHIC SECTION:** Horizontal lineup of 5 full body views. Front view, left 45-degree side view, right 90-degree side view, right 45-degree side view, back view. Character maintains a strong, neutral standing A-pose, arms hanging naturally at sides, full body in frame. Strict orthographic projection, absolute zero perspective distortion, identical equal width, height, and proportions across all views. Wearing ${apparel_construction}, no accessories.

**SUPPLEMENTARY VIEWS SECTION:** Half-body side view. Absolute 90-degree top-down bird's-eye view overhead. Absolute bottom-up worm's-eye under view. Character, outfit, and proportions match the main views exactly.

**MATERIAL DETAIL SECTION:** Extreme macro photography, 100mm f/2.8 lens, hyper-magnified close-up of the ${apparel_construction} fabric. Shallow depth of field, sharp focus on interlocking stitches and yarn-level details. Raking side-light. Macro view of back neck seam and fabric drape. Clear display of material patterns and textures.

**QUALITY & LIGHTING:** Professional photography lighting, soft even studio shadows. High precision, maximum detail, ultra-detailed, quality suitable for professional animation or VFX production.

--no perspective distortion, fisheye, dynamic shadows, messy background, overlapping figures, fused limbs, bad anatomy, text, watermarks, glasses, hats, jewelry, 3D render artifacts, cropping`;
}

// ---------------------------------------------------------------------------
// Gemini extraction payload builder
// ---------------------------------------------------------------------------
function buildExtractionPayload(mimeType, imageBase64) {
  const systemInstruction = `You are an expert character designer and vision-language feature extractor.
Analyze the provided character reference image and extract visual characteristics with extreme precision.
Ignore background elements, lighting artifacts, and temporary emotional expressions. Focus entirely on human anatomy, facial features, hair structure, garment construction, and material textures.
Respond strictly in JSON format using the specified schema. Keep descriptions concise and comma-separated (e.g., "sharp angular jawline, prominent cheekbones").`;

  return {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Extract the character\'s physical and apparel traits into the structured JSON schema.' },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          gender:              { type: 'STRING', description: 'Perceived gender: male, female, ambiguous, or other' },
          bone_structure:      { type: 'STRING', description: 'Jawline, cheekbones, brow prominence, chin shape' },
          skin_parameters:     { type: 'STRING', description: 'Complexion, undertones, freckles, scars, texture' },
          eye_morphology:      { type: 'STRING', description: 'Color, shape, distance, eyelid type' },
          hair_architecture:   { type: 'STRING', description: 'Color, length, parting, volume, texture' },
          apparel_construction: { type: 'STRING', description: 'Garment type, fabric material, seams, knit patterns, color' },
          style:               { type: 'STRING', description: 'Overall artistic look and feel, rendering style, mood, aesthetic direction of the reference image' },
        },
        required: ['gender', 'bone_structure', 'skin_parameters', 'eye_morphology', 'hair_architecture', 'apparel_construction', 'style'],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// API Key Status Badge — shown in the header
// ---------------------------------------------------------------------------
function ApiKeyBadge({ source, onClick }) {
  const map = {
    env:   { label: 'API key: env',   classes: 'bg-green-100 text-green-700 border-green-200' },
    local: { label: 'API key: saved', classes: 'bg-blue-100 text-blue-700 border-blue-200'  },
    none:  { label: 'Add API key',    classes: 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse' },
  };
  const { label, classes } = map[source];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 ${classes}`}
      title="Open API key settings"
    >
      <Key className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const { activeKey, source, localKey, saveKey, clearKey } = useApiKey();

  const [showKeyModal, setShowKeyModal]     = useState(false);
  const [mode, setMode]                     = useState('ai');   // 'ai' | 'manual'
  const [imagePreview, setImagePreview]     = useState(null);
  const [imageBase64, setImageBase64]       = useState(null);
  const [mimeType, setMimeType]             = useState(null);
  const [isExtracting, setIsExtracting]     = useState(false);
  const [error, setError]                   = useState(null);
  const [traits, setTraits]                 = useState(EMPTY_TRAITS);
  const [enabledTraits, setEnabledTraits]   = useState(() =>
    Object.fromEntries(TRAIT_FIELDS.map(({ id, defaultEnabled = true }) => [id, defaultEnabled]))
  );
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied]             = useState(false);

  const fileInputRef = useRef(null);

  // -------------------------------------------------------------------------
  // Image upload
  // -------------------------------------------------------------------------
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setImagePreview(dataUrl);
      const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        setMimeType(match[1]);
        setImageBase64(match[2]);
        setError(null);
      } else {
        setError('Failed to process image format.');
      }
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------------------
  // Feature extraction via Gemini Vision
  // -------------------------------------------------------------------------
  const extractFeatures = async () => {
    if (!imageBase64 || !mimeType) {
      setError('Please upload an image first.');
      return;
    }
    if (!activeKey) {
      setShowKeyModal(true);
      setError('Please add your Gemini API key first.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const payload = buildExtractionPayload(mimeType, imageBase64);
      const data = await fetchWithRetry(geminiUrl(activeKey), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResult) throw new Error('Empty response from AI.');

      const parsed = JSON.parse(textResult);
      setTraits({
        gender:              parsed.gender              || '',
        bone_structure:      parsed.bone_structure      || '',
        skin_parameters:     parsed.skin_parameters     || '',
        eye_morphology:      parsed.eye_morphology      || '',
        hair_architecture:   parsed.hair_architecture   || '',
        apparel_construction: parsed.apparel_construction || '',
        style:               parsed.style               || '',
      });
      // Reset trait toggles to their configured defaults on fresh extraction
      setEnabledTraits(Object.fromEntries(TRAIT_FIELDS.map(({ id, defaultEnabled = true }) => [id, defaultEnabled])));
    } catch (err) {
      console.error(err);
      // Surface API key errors helpfully
      const msg = err.message.toLowerCase();
      if (msg.includes('api key') || msg.includes('403') || msg.includes('401')) {
        setError('Invalid or missing API key. Click "Add API key" in the header to update it.');
      } else {
        setError(`Extraction failed: ${err.message}`);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Prompt generation
  // -------------------------------------------------------------------------
  const generatePrompt = () => {
    const { bone_structure, apparel_construction } = traits;
    if (!bone_structure && !apparel_construction) {
      setError('Please extract traits from an image, or fill in the fields manually before generating.');
      return;
    }
    setError(null);
    setGeneratedPrompt(buildMasterPrompt(traits, enabledTraits));
  };

  // -------------------------------------------------------------------------
  // Copy to clipboard
  // -------------------------------------------------------------------------
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedPrompt);
      } else {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = generatedPrompt;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard.');
    }
  };

  const handleTraitChange = (e) => {
    setTraits((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ----------------------------------------------------------------- */}
        {/* Header                                                             */}
        {/* ----------------------------------------------------------------- */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-indigo-600 flex-shrink-0" />
              Character Sheet Prompt Generator
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {mode === 'ai'
                ? 'Vision-Language Feature Extraction & Orthographic Prompt Assembly'
                : 'Manual Trait Entry & Orthographic Prompt Assembly'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode('ai')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  mode === 'ai'
                    ? 'bg-white shadow-sm text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                AI Extract
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  mode === 'manual'
                    ? 'bg-white shadow-sm text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>

            {mode === 'ai' && (
              <>
                <ApiKeyBadge source={source} onClick={() => setShowKeyModal(true)} />
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
                  title="API key settings"
                  aria-label="Open API key settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* ----------------------------------------------------------------- */}
        {/* Error Banner                                                       */}
        {/* ----------------------------------------------------------------- */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* No-key nudge banner                                                */}
        {/* ----------------------------------------------------------------- */}
        {source === 'none' && mode === 'ai' && (
          <button
            onClick={() => setShowKeyModal(true)}
            className="w-full bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 text-left hover:bg-amber-100 transition-colors group"
          >
            <Key className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Add your Gemini API key to get started
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Click here to enter your key — it stays in your browser and is never shared.
              </p>
            </div>
            <Settings className="w-4 h-4 text-amber-500 ml-auto group-hover:rotate-45 transition-transform" />
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* --------------------------------------------------------------- */}
          {/* Left Column                                                       */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-6">

            {/* Image Upload — AI mode only */}
            {mode === 'ai' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-500" />
                  1. Reference Image
                </h2>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    imagePreview
                      ? 'border-indigo-300 bg-indigo-50/30'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="w-full h-48 relative rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                        <img src={imagePreview} alt="Reference" className="max-w-full max-h-full object-contain" />
                      </div>
                      <p className="text-sm text-indigo-600 font-medium">Click to change image</p>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-slate-600 font-medium">Click to upload character reference</p>
                      <p className="text-xs text-slate-400">JPEG, PNG, or WEBP</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={extractFeatures}
                  disabled={!imagePreview || isExtracting}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4
                             rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {isExtracting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Extracting AI Features…</>
                  ) : (
                    <><Wand2 className="w-5 h-5" /> Analyze &amp; Extract Features</>
                  )}
                </button>
              </div>
            )}

            {/* Traits Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                {mode === 'ai' ? '2. Verify Extracted Traits' : '1. Define Character Traits'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {mode === 'ai'
                  ? 'Edit the AI-extracted tokens to perfect the character blueprint before prompt generation.'
                  : 'Describe your character\'s traits below — use the presets or type freely.'}
              </p>

              <div className="space-y-4">
                {TRAIT_FIELDS.map(({ id, label, presets }) => (
                  <div key={id} className={`transition-opacity ${enabledTraits[id] ? '' : 'opacity-40'}`}>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1 cursor-pointer select-none group">
                      <button
                        type="button"
                        onClick={() => setEnabledTraits(prev => ({ ...prev, [id]: !prev[id] }))}
                        className="flex-shrink-0 transition-colors"
                        aria-label={`Toggle ${label}`}
                      >
                        {enabledTraits[id]
                          ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                          : <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-500" />
                        }
                      </button>
                      <span className={enabledTraits[id] ? 'text-slate-600' : 'text-slate-400'}>
                        {label}
                      </span>
                    </label>

                    {/* Quick-fill preset chips */}
                    {presets && enabledTraits[id] && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {presets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTraits(prev => ({ ...prev, [id]: preset.toLowerCase() }))}
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-all ${
                              traits[id] === preset.toLowerCase()
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    )}

                    <textarea
                      name={id}
                      value={traits[id]}
                      onChange={handleTraitChange}
                      rows={presets ? 1 : 2}
                      disabled={!enabledTraits[id]}
                      className={`w-full text-sm border rounded-lg p-3
                                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                 transition-all outline-none resize-none
                                 ${enabledTraits[id]
                                   ? 'bg-slate-50 border-slate-200 text-slate-900'
                                   : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed'}`}
                      placeholder={mode === 'ai' ? 'e.g., waiting for extraction…' : 'Type a description…'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Right Column                                                      */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col h-full space-y-6">
            <button
              onClick={generatePrompt}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-6
                         rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-lg"
            >
              <FileText className="w-6 h-6" />
              Generate Master Layout Prompt
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                    {mode === 'ai' ? '3' : '2'}
                  </span>
                  Final Diffusion Prompt
                </h2>
                <button
                  onClick={copyToClipboard}
                  disabled={!generatedPrompt}
                  className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200
                             text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCopied
                    ? <><Check className="w-4 h-4 text-green-600" /> Copied!</>
                    : <><Copy className="w-4 h-4" /> Copy Prompt</>
                  }
                </button>
              </div>

              <div className="relative flex-grow min-h-[400px]">
                {generatedPrompt ? (
                  <textarea
                    readOnly
                    value={generatedPrompt}
                    className="w-full h-full absolute inset-0 text-sm font-mono text-slate-700 bg-slate-50
                               border border-slate-200 rounded-xl p-5 leading-relaxed resize-none
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="w-full h-full absolute inset-0 border-2 border-dashed border-slate-200
                                  rounded-xl bg-slate-50 flex flex-col items-center justify-center
                                  text-slate-400 p-8 text-center">
                    <Wand2 className="w-10 h-10 mb-3 opacity-20" />
                    <p>{mode === 'ai'
                      ? 'Upload an image, extract features, then click Generate to build the master prompt.'
                      : 'Fill in the trait fields, then click Generate to build the master prompt.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* API Key Modal                                                        */}
      {/* ------------------------------------------------------------------- */}
      {showKeyModal && (
        <ApiKeyModal
          source={source}
          localKey={localKey}
          onSave={saveKey}
          onClear={clearKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
}
