import React, { useMemo } from 'react';
import { Dimensions, BorderConfig, Unit } from '../types';
import { MM_PER_INCH } from '../constants';

interface MountVisualizerProps {
  boardSize: Dimensions;
  apertureSize: Dimensions;
  aperturePosition: { x: number; y: number }; // Top-Left of aperture relative to board
  photoTotalSize: Dimensions; // Size of physical photo paper (Aperture + Underlap*2 + PhotoBorder*2 is tricky, let's simplify)
  // Actually: Photo Paper Size is usually independent, but here we calculate required paper size.
  // Required Paper = Aperture + 2*Underlap.
  // The Visual Image = Aperture - 2*PhotoBorder.
  
  photoBorder: number; // Visible white space inside aperture
  underlap: number; // Hidden overlap
  unit: Unit;
  boardColor?: string;
}

const MountVisualizer: React.FC<MountVisualizerProps> = ({
  boardSize,
  apertureSize,
  aperturePosition,
  photoBorder,
  underlap,
  unit,
  boardColor = '#e2e8f0' // Slate-200
}) => {
  // SVG ViewBox
  const viewBoxPadding = Math.max(boardSize.width, boardSize.height) * 0.1;
  const viewBox = `-${viewBoxPadding} -${viewBoxPadding} ${boardSize.width + viewBoxPadding * 2} ${boardSize.height + viewBoxPadding * 2}`;

  // Calculated Geometries
  // 1. Board Rect: (0, 0) to (boardSize.width, boardSize.height)
  
  // 2. Aperture Rect: (aperturePosition.x, aperturePosition.y)
  
  // 3. Visible Image Rect: Inside Aperture by photoBorder
  const imageRect = {
    x: aperturePosition.x + photoBorder,
    y: aperturePosition.y + photoBorder,
    width: Math.max(0, apertureSize.width - 2 * photoBorder),
    height: Math.max(0, apertureSize.height - 2 * photoBorder),
  };

  // 4. Physical Photo Paper Rect: Outside Aperture by underlap
  // This is what sits BEHIND the mount.
  const paperRect = {
    x: aperturePosition.x - underlap,
    y: aperturePosition.y - underlap,
    width: apertureSize.width + 2 * underlap,
    height: apertureSize.height + 2 * underlap,
  };

  const formatVal = (val: number) => {
    return unit === 'inch' 
      ? (val / MM_PER_INCH).toFixed(2) + '"' 
      : Math.round(val) + 'mm';
  };

  // Arrow markers
  const markerId = "arrowhead";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-hidden relative shadow-inner">
      <svg
        className="w-full h-full max-h-[80vh]"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* 1. Backing Board / Mount Background */}
        <rect
          x={0}
          y={0}
          width={boardSize.width}
          height={boardSize.height}
          fill={boardColor}
          stroke="#475569"
          strokeWidth={1}
          filter="url(#shadow)"
        />

        {/* 2. Physical Photo Paper (Hidden/Dashed) */}
        <rect
          x={paperRect.x}
          y={paperRect.y}
          width={paperRect.width}
          height={paperRect.height}
          fill="white"
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="5,5"
        />

        {/* 3. Aperture (Hole in Mount) - Represented as the Image + White Border */}
        {/* We draw the "Photo Border" (white space) first */}
        <rect
          x={aperturePosition.x}
          y={aperturePosition.y}
          width={apertureSize.width}
          height={apertureSize.height}
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth={0.5}
        />

        {/* 4. Actual Image (The printed part) */}
        <rect
          x={imageRect.x}
          y={imageRect.y}
          width={imageRect.width}
          height={imageRect.height}
          fill="#3b82f6"
          fillOpacity={0.2}
          stroke="#2563eb"
          strokeWidth={1}
        />
        
        {/* Crosshair in Image Center */}
        <line 
            x1={imageRect.x + imageRect.width/2 - 10} 
            y1={imageRect.y + imageRect.height/2} 
            x2={imageRect.x + imageRect.width/2 + 10} 
            y2={imageRect.y + imageRect.height/2} 
            stroke="#2563eb" strokeWidth={0.5} opacity={0.5}
        />
        <line 
            x1={imageRect.x + imageRect.width/2} 
            y1={imageRect.y + imageRect.height/2 - 10} 
            x2={imageRect.x + imageRect.width/2} 
            y2={imageRect.y + imageRect.height/2 + 10} 
            stroke="#2563eb" strokeWidth={0.5} opacity={0.5}
        />

        {/* LABELS */}
        
        {/* Board Width */}
        <line 
            x1={0} y1={-viewBoxPadding/2} 
            x2={boardSize.width} y2={-viewBoxPadding/2} 
            stroke="#64748b" markerEnd={`url(#${markerId})`} markerStart={`url(#${markerId})`}
        />
        <text x={boardSize.width/2} y={-viewBoxPadding/2 - 5} textAnchor="middle" fill="#475569" fontSize={14}>
            Board: {formatVal(boardSize.width)}
        </text>

        {/* Board Height */}
        <line 
            x1={-viewBoxPadding/2} y1={0} 
            x2={-viewBoxPadding/2} y2={boardSize.height} 
            stroke="#64748b" markerEnd={`url(#${markerId})`} markerStart={`url(#${markerId})`}
        />
         <text 
            x={-viewBoxPadding/2 - 10} y={boardSize.height/2} 
            textAnchor="middle" fill="#475569" fontSize={14} 
            transform={`rotate(-90 ${-viewBoxPadding/2 - 10} ${boardSize.height/2})`}
        >
            Board: {formatVal(boardSize.height)}
        </text>

        {/* Top Border */}
        {aperturePosition.y > 20 && (
            <text x={boardSize.width/2} y={aperturePosition.y/2} textAnchor="middle" fill="#475569" fontSize={12} opacity={0.8}>
                Top: {formatVal(aperturePosition.y)}
            </text>
        )}
        
        {/* Bottom Border */}
        {(boardSize.height - (aperturePosition.y + apertureSize.height)) > 20 && (
            <text x={boardSize.width/2} y={aperturePosition.y + apertureSize.height + (boardSize.height - (aperturePosition.y + apertureSize.height))/2} textAnchor="middle" fill="#475569" fontSize={12} opacity={0.8}>
                Bottom: {formatVal(boardSize.height - (aperturePosition.y + apertureSize.height))}
            </text>
        )}

      </svg>
      
      <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow text-xs text-slate-600 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 border border-slate-400"></div> Mount Board
        </div>
        <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 bg-white border border-slate-300"></div> Aperture (White Border)
        </div>
        <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-500 opacity-50"></div> Image
        </div>
        <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 border border-dashed border-slate-400"></div> Photo Paper (Underlap)
        </div>
      </div>
    </div>
  );
};

export default MountVisualizer;
