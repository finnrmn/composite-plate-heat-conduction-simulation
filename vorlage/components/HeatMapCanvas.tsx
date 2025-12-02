import React, { useRef, useEffect } from 'react';
import { drawHeatmap } from '../utils/colors';
import { HeatSource, Region } from '../utils/types';
import { MATERIALS } from '../utils/constants';

interface HeatMapCanvasProps {
  data: Float32Array;
  width: number;
  height: number;
  minTemp: number;
  maxTemp: number;
  heatSource?: HeatSource;
  scaleX?: number; // Physical to Canvas Scale
  scaleY?: number;
  Lx?: number; // Physical Width
  Ly?: number; // Physical Height
  inclusions?: Region[];
  baseMaterial?: string;
}

export const HeatMapCanvas: React.FC<HeatMapCanvasProps> = ({ 
  data, 
  width, 
  height, 
  minTemp, 
  maxTemp,
  heatSource,
  Lx = 0.1,
  Ly = 0.1,
  inclusions = [],
  baseMaterial = 'Basalt'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    drawHeatmap(ctx, data, width, height, minTemp, maxTemp);
  }, [data, width, height, minTemp, maxTemp]);

  const baseMatSymbol = MATERIALS[baseMaterial]?.symbol || baseMaterial;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl border border-slate-700 bg-black">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full h-full object-contain image-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Overlay Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 100 100`} preserveAspectRatio="none">
        {/* Base Material Label (Top Right Corner) */}
        <text x="98" y="5" textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="4" fontWeight="bold" fontFamily="monospace">
          {baseMatSymbol}
        </text>

        {/* Inclusions */}
        {inclusions.map((inc) => {
           // Calculate percentages based on physical dimensions
           // Assumes y=0 is Top in visualization (mapped to grid j=0)
           const xPerc = (inc.x / Lx) * 100;
           const yPerc = (inc.y / Ly) * 100;
           const wPerc = (inc.width / Lx) * 100;
           const hPerc = (inc.height / Ly) * 100;
           
           const matSymbol = MATERIALS[inc.materialName]?.symbol || '';

           return (
             <g key={inc.id}>
               <rect 
                 x={xPerc} 
                 y={yPerc} 
                 width={wPerc} 
                 height={hPerc} 
                 fill="none" 
                 stroke="rgba(255,255,255,0.6)" 
                 strokeWidth="0.25" 
                 strokeDasharray="1"
               />
               <text 
                 x={xPerc + wPerc/2} 
                 y={yPerc + hPerc/2 + 1} 
                 textAnchor="middle" 
                 fill="rgba(255,255,255,0.6)" 
                 fontSize="4" 
                 fontWeight="bold"
                 style={{ textShadow: '0px 0px 2px rgba(0,0,0,0.8)' }}
               >
                 {matSymbol}
               </text>
             </g>
           );
        })}

        {/* Heat Source Overlay */}
        {heatSource && heatSource.active && (
          <g>
            <rect 
              x={((heatSource.x - heatSource.size/2) / Lx) * 100}
              y={((heatSource.y - heatSource.size/2) / Ly) * 100}
              width={(heatSource.size / Lx) * 100}
              height={(heatSource.size / Ly) * 100}
              fill="none"
              stroke="rgba(255, 50, 50, 0.8)"
              strokeWidth="0.5"
              strokeDasharray="1"
            />
            <circle 
              cx={(heatSource.x / Lx) * 100} 
              cy={(heatSource.y / Ly) * 100} 
              r="0.5" 
              fill="rgba(255, 50, 50, 0.9)" 
            />
          </g>
        )}
      </svg>
    </div>
  );
};