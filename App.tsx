import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Ruler, Settings, Image as ImageIcon, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { MountConfig, Unit, Dimensions, BorderConfig } from './types';
import { PAPER_SIZES, COMMON_PHOTO_SIZES, MM_PER_INCH } from './constants';
import MountVisualizer from './components/MountVisualizer';

// --- HELPER COMPONENTS ---

interface InputGroupProps {
  label: string;
  value: number;
  unit: Unit;
  onCommit: (val: number) => void;
  step?: number;
  min?: number;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, unit, onCommit, step = 0.1, min = 0 }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync local value when prop value changes (e.g. external updates like presets)
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    const floatVal = parseFloat(localValue);
    if (!isNaN(floatVal)) {
      onCommit(floatVal);
    } else {
      setLocalValue(value.toString()); // Reset on invalid input
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          min={min}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border-slate-300 border bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1.5 text-xs text-slate-400 pointer-events-none">
          {unit === 'inch' ? 'in' : 'mm'}
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- STATE ---
  const [unit, setUnit] = useState<Unit>('inch');
  
  // Default Config
  const [config, setConfig] = useState<MountConfig>({
    photoWidth: 203.2, // 8 inches
    photoHeight: 254,  // 10 inches
    photoBorder: 6.35, // 0.25 inches
    underlap: 12.7,    // 0.5 inches
    mountOffset: 7.62, // 0.3 inches
    minBorderWidth: 50.8, // 2 inches
    boardPreset: 'A2',
    customBoardSize: { width: 420, height: 594 }, // A2 default
    mode: 'FixedBoard', // Start with fitting to board
    manualBorders: { top: 50, bottom: 50, left: 50, right: 50 },
    orientation: 'portrait'
  });

  // --- CALCULATIONS ---

  // Helper: Convert display value back to mm for storage
  const fromDisplay = (val: number) => {
    return unit === 'inch' ? val * MM_PER_INCH : val;
  };

  // Helper: Convert mm to display value
  const toDisplay = (mm: number, precision = 3) => {
    const val = unit === 'inch' ? mm / MM_PER_INCH : mm;
    return parseFloat(val.toFixed(precision));
  };

  const apertureSize: Dimensions = useMemo(() => ({
    width: config.photoWidth + (config.photoBorder * 2),
    height: config.photoHeight + (config.photoBorder * 2)
  }), [config.photoWidth, config.photoHeight, config.photoBorder]);

  // 2. Calculated Board Dimensions & Aperture Position
  const { boardSize, aperturePosition } = useMemo(() => {
    let bWidth = 0;
    let bHeight = 0;
    let aX = 0;
    let aY = 0;

    if (config.mode === 'FixedBoard') {
      // Board size is set by user (Preset or Custom)
      if (config.boardPreset === 'Custom') {
        bWidth = config.customBoardSize.width;
        bHeight = config.customBoardSize.height;
      } else {
        const preset = PAPER_SIZES.find(p => p.name === config.boardPreset);
        // Default to A2 if not found
        let pW = preset ? preset.width : 420;
        let pH = preset ? preset.height : 594;

        // Respect Global Orientation for Presets
        if (config.orientation === 'landscape') {
            bWidth = Math.max(pW, pH);
            bHeight = Math.min(pW, pH);
        } else {
            bWidth = Math.min(pW, pH);
            bHeight = Math.max(pW, pH);
        }
      }

      // Calculate margins to center the aperture
      const totalMarginX = bWidth - apertureSize.width;
      const totalMarginY = bHeight - apertureSize.height;

      // X Position (Centered)
      aX = totalMarginX / 2;

      // Y Position (Centered + Offset)
      // Offset positive -> move up
      aY = (totalMarginY / 2) - config.mountOffset;

    } else {
      // CustomBorders Mode: Board grows around aperture
      const { top, bottom, left, right } = config.manualBorders;
      bWidth = apertureSize.width + left + right;
      bHeight = apertureSize.height + top + bottom;
      aX = left;
      aY = top;
    }

    return { 
        boardSize: { width: bWidth, height: bHeight },
        aperturePosition: { x: aX, y: aY }
    };
  }, [config, apertureSize]);


  // --- HANDLERS ---
  
  const updateConfig = (key: keyof MountConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateConfigFromInput = (key: keyof MountConfig, displayVal: number) => {
      updateConfig(key, fromDisplay(displayVal));
  };

  const toggleOrientation = () => {
    setConfig(prev => {
        const newOrientation = prev.orientation === 'portrait' ? 'landscape' : 'portrait';
        
        // Swap Photo Dimensions
        const newPhotoWidth = prev.photoHeight;
        const newPhotoHeight = prev.photoWidth;

        // Swap Custom Board Dimensions
        const newCustomBoard = {
            width: prev.customBoardSize.height,
            height: prev.customBoardSize.width
        };

        return {
            ...prev,
            orientation: newOrientation,
            photoWidth: newPhotoWidth,
            photoHeight: newPhotoHeight,
            customBoardSize: newCustomBoard
        };
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-100">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Ruler className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">MountMaster</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
                onClick={toggleOrientation}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                title="Rotate Orientation"
            >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {config.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </button>

            <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
              <button 
                onClick={() => setUnit('mm')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${unit === 'mm' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                MM
              </button>
              <button 
                onClick={() => setUnit('inch')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${unit === 'inch' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                IN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-6rem)] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* SECTION 1: PHOTO */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
              <Image as={ImageIcon} className="w-4 h-4 text-blue-500" /> Photo Dimensions
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-medium text-slate-500 mb-1">Preset Size</label>
                    <select 
                        onChange={(e) => {
                            const s = COMMON_PHOTO_SIZES.find(p => p.name === e.target.value);
                            if(s) {
                                // Apply preset based on current orientation logic
                                let w = s.width;
                                let h = s.height;
                                if (config.orientation === 'landscape') {
                                    // ensure w > h
                                    if (h > w) { const t = w; w = h; h = t; }
                                } else {
                                    // ensure h > w
                                    if (w > h) { const t = w; w = h; h = t; }
                                }
                                updateConfig('photoWidth', w);
                                updateConfig('photoHeight', h);
                            }
                        }}
                        className="w-full rounded-md border-slate-300 border bg-slate-50 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Custom</option>
                        {COMMON_PHOTO_SIZES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Width" unit={unit} value={toDisplay(config.photoWidth)} onCommit={(v) => updateConfigFromInput('photoWidth', v)} />
                <InputGroup label="Height" unit={unit} value={toDisplay(config.photoHeight)} onCommit={(v) => updateConfigFromInput('photoHeight', v)} />
              </div>
              
              <div className="border-t border-slate-100 pt-3">
                 <div className="grid grid-cols-2 gap-3">
                    <InputGroup label="Photo Border (White)" unit={unit} value={toDisplay(config.photoBorder)} onCommit={(v) => updateConfigFromInput('photoBorder', v)} />
                    <InputGroup label="Underlap (Hidden)" unit={unit} value={toDisplay(config.underlap)} onCommit={(v) => updateConfigFromInput('underlap', v)} />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2">
                    Aperture Size: {toDisplay(apertureSize.width)} x {toDisplay(apertureSize.height)} {unit === 'inch' ? '"' : 'mm'}
                 </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: BOARD & MOUNT */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                    <Settings className="w-4 h-4 text-blue-500" /> Mount Configuration
                </h2>
                
                <div className="flex bg-slate-100 rounded p-0.5">
                    <button 
                        onClick={() => updateConfig('mode', 'FixedBoard')}
                        className={`text-[10px] px-2 py-1 rounded ${config.mode === 'FixedBoard' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        Fit to Board
                    </button>
                    <button 
                         onClick={() => updateConfig('mode', 'CustomBorders')}
                         className={`text-[10px] px-2 py-1 rounded ${config.mode === 'CustomBorders' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        Set Borders
                    </button>
                </div>
            </div>

            {config.mode === 'FixedBoard' ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1">Board Size</label>
                        <select 
                            value={config.boardPreset}
                            onChange={(e) => updateConfig('boardPreset', e.target.value)}
                            className="w-full rounded-md border-slate-300 border bg-slate-50 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            {PAPER_SIZES.map(s => {
                                // Display dimensions respecting orientation for info purposes
                                let w = s.width;
                                let h = s.height;
                                if (config.orientation === 'landscape') {
                                    if (h > w) { const t = w; w = h; h = t; }
                                } else {
                                    if (w > h) { const t = w; w = h; h = t; }
                                }
                                return (
                                    <option key={s.name} value={s.name}>
                                        {s.name} ({Math.round(unit==='inch' ? w/MM_PER_INCH : w)} x {Math.round(unit==='inch' ? h/MM_PER_INCH : h)})
                                    </option>
                                );
                            })}
                            <option value="Custom">Custom Dimensions</option>
                        </select>
                    </div>
                    {config.boardPreset === 'Custom' && (
                        <div className="grid grid-cols-2 gap-3">
                             <InputGroup label="Board Width" unit={unit} value={toDisplay(config.customBoardSize.width)} onCommit={(v) => updateConfig('customBoardSize', { ...config.customBoardSize, width: fromDisplay(v) })} />
                             <InputGroup label="Board Height" unit={unit} value={toDisplay(config.customBoardSize.height)} onCommit={(v) => updateConfig('customBoardSize', { ...config.customBoardSize, height: fromDisplay(v) })} />
                        </div>
                    )}
                    
                    <div className="pt-2 border-t border-slate-100">
                        <InputGroup 
                            label="Vertical Offset (Upwards)" 
                            unit={unit}
                            value={toDisplay(config.mountOffset)} 
                            onCommit={(v) => updateConfigFromInput('mountOffset', v)} 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Positive value moves aperture UP (bottom weighted).</p>
                    </div>

                    {/* Calculated Borders Display */}
                    <div className="bg-slate-50 rounded p-2 text-xs text-slate-600 space-y-1">
                        <p className="font-semibold">Resulting Borders:</p>
                        <div className="grid grid-cols-2 gap-x-4">
                            <span>Top: {toDisplay(aperturePosition.y)}</span>
                            <span>Bottom: {toDisplay(boardSize.height - aperturePosition.y - apertureSize.height)}</span>
                            <span>Sides: {toDisplay(aperturePosition.x)}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                     <p className="text-xs text-slate-500">Define border widths manually. Board size will adjust.</p>
                     <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Top" unit={unit} value={toDisplay(config.manualBorders.top)} onCommit={(v) => updateConfig('manualBorders', {...config.manualBorders, top: fromDisplay(v)})} />
                        <InputGroup label="Bottom" unit={unit} value={toDisplay(config.manualBorders.bottom)} onCommit={(v) => updateConfig('manualBorders', {...config.manualBorders, bottom: fromDisplay(v)})} />
                        <InputGroup label="Left" unit={unit} value={toDisplay(config.manualBorders.left)} onCommit={(v) => updateConfig('manualBorders', {...config.manualBorders, left: fromDisplay(v)})} />
                        <InputGroup label="Right" unit={unit} value={toDisplay(config.manualBorders.right)} onCommit={(v) => updateConfig('manualBorders', {...config.manualBorders, right: fromDisplay(v)})} />
                     </div>
                     <div className="bg-slate-50 rounded p-2 text-xs text-slate-600">
                         Total Board: {toDisplay(boardSize.width)} x {toDisplay(boardSize.height)}
                     </div>
                </div>
            )}
          </section>
        </div>

        {/* RIGHT PANEL: VISUALIZER */}
        <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-auto">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex-1 p-1">
            <MountVisualizer 
                boardSize={boardSize}
                apertureSize={apertureSize}
                aperturePosition={aperturePosition}
                photoBorder={config.photoBorder}
                underlap={config.underlap}
                unit={unit}
                photoTotalSize={{ width: 0, height: 0 }} // Not strictly needed for vis logic inside
            />
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Board Dimensions</h4>
                <p className="text-lg font-mono text-slate-800">{toDisplay(boardSize.width)} x {toDisplay(boardSize.height)} {unit === 'inch' ? '"' : 'mm'}</p>
             </div>
             <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Aperture Cut</h4>
                <p className="text-lg font-mono text-slate-800">{toDisplay(apertureSize.width)} x {toDisplay(apertureSize.height)} {unit === 'inch' ? '"' : 'mm'}</p>
             </div>
             <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Required Paper</h4>
                <p className="text-lg font-mono text-slate-800">
                    &gt; {toDisplay(apertureSize.width + config.underlap * 2)} x {toDisplay(apertureSize.height + config.underlap * 2)}
                </p>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

// Simple Icon wrapper to fix type checks if necessary
const Image = ({ as: Icon, className }: any) => <Icon className={className} />;

export default App;