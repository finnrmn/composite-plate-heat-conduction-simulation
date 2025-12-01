import React, { useRef, useState, useEffect } from 'react';
import { SimulationConfig } from '../utils/types';
import { MATERIALS } from '../utils/constants';
import { Move } from 'lucide-react';

interface PlateEditorProps {
  config: SimulationConfig;
  onUpdateInclusion: (id: string, x: number, y: number) => void;
  onUpdateHeatSource: (x: number, y: number) => void;
  className?: string;
}

export const PlateEditor: React.FC<PlateEditorProps> = ({ 
  config, 
  onUpdateInclusion, 
  onUpdateHeatSource,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const { Lx, Ly, inclusions, heatSource, baseMaterial } = config;

  // Convert mouse event to physical coordinates (meters)
  const getMousePos = (e: MouseEvent | React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    // Scale pixel to meters
    const scaleX = Lx / rect.width;
    const scaleY = Ly / rect.height;
    
    return {
      x: px * scaleX,
      y: py * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, initialX: number, initialY: number, type: 'corner' | 'center') => {
    e.preventDefault();
    e.stopPropagation();
    const mouse = getMousePos(e);
    setDraggingId(id);
    
    // Calculate offset so the object doesn't "snap" to mouse center
    setOffset({
      x: mouse.x - initialX,
      y: mouse.y - initialY
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !svgRef.current) return;
      
      const mouse = getMousePos(e);
      let newX = mouse.x - offset.x;
      let newY = mouse.y - offset.y;

      if (draggingId === 'heatSource') {
        // Clamp to plate bounds
        newX = Math.max(0, Math.min(Lx, newX));
        newY = Math.max(0, Math.min(Ly, newY));
        onUpdateHeatSource(newX, newY);
      } else {
        // Find the inclusion being dragged
        const inc = inclusions.find(i => i.id === draggingId);
        if (inc) {
          // Clamp to plate bounds (top-left based)
          newX = Math.max(0, Math.min(Lx - inc.width, newX));
          newY = Math.max(0, Math.min(Ly - inc.height, newY));
          onUpdateInclusion(draggingId, newX, newY);
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, offset, Lx, Ly, inclusions, onUpdateHeatSource, onUpdateInclusion]);

  const baseColor = MATERIALS[baseMaterial]?.color || '#333';
  const baseSymbol = MATERIALS[baseMaterial]?.symbol || '';

  return (
    <div className={`relative w-full aspect-square bg-slate-900 rounded-lg shadow-xl overflow-hidden border border-slate-700 ${className}`}>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${Lx} ${Ly}`} 
        className="w-full h-full cursor-crosshair"
        preserveAspectRatio="none"
      >
        {/* Base Plate Background */}
        <rect x="0" y="0" width={Lx} height={Ly} fill={baseColor} opacity={0.3} />
        
        {/* Base Material Symbol Watermark */}
        <text 
          x={Lx * 0.95} 
          y={Ly * 0.05} 
          textAnchor="end" 
          dominantBaseline="hanging"
          fill="rgba(255,255,255,0.2)" 
          fontSize={Lx * 0.05} 
          fontWeight="bold" 
          fontFamily="monospace"
        >
          {baseSymbol} (Base)
        </text>

        {/* Inclusions */}
        {inclusions.map((inc) => {
          const mat = MATERIALS[inc.materialName];
          return (
            <g 
              key={inc.id}
              onMouseDown={(e) => handleMouseDown(e, inc.id, inc.x, inc.y, 'corner')}
              style={{ cursor: 'move' }}
              className="group"
            >
              <rect
                x={inc.x}
                y={inc.y}
                width={inc.width}
                height={inc.height}
                fill={mat?.color || '#666'}
                stroke={draggingId === inc.id ? 'white' : 'transparent'}
                strokeWidth={Lx * 0.005}
                className="transition-opacity hover:opacity-90"
              />
               {/* Drag Handle Indicator on Hover */}
               <rect
                x={inc.x}
                y={inc.y}
                width={inc.width}
                height={inc.height}
                fill="transparent"
                stroke="white"
                strokeWidth={Lx * 0.002}
                strokeDasharray={`${Lx*0.01} ${Lx*0.01}`}
                className="opacity-0 group-hover:opacity-50"
              />
              <text
                x={inc.x + inc.width / 2}
                y={inc.y + inc.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize={Math.min(inc.width, inc.height) * 0.4}
                fontWeight="bold"
                className="pointer-events-none select-none"
                style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
              >
                {mat?.symbol}
              </text>
            </g>
          );
        })}

        {/* Heat Source */}
        {heatSource.active && (
          <g
            onMouseDown={(e) => handleMouseDown(e, 'heatSource', heatSource.x, heatSource.y, 'center')}
            style={{ cursor: 'move' }}
            className="group"
          >
             {/* Hit Area (Larger than visible source for easier grabbing) */}
            <rect 
               x={heatSource.x - Math.max(heatSource.size, Lx * 0.05)/2}
               y={heatSource.y - Math.max(heatSource.size, Ly * 0.05)/2}
               width={Math.max(heatSource.size, Lx * 0.05)}
               height={Math.max(heatSource.size, Ly * 0.05)}
               fill="transparent"
            />
            
            {/* Visible Source Area */}
            <rect
              x={heatSource.x - heatSource.size / 2}
              y={heatSource.y - heatSource.size / 2}
              width={heatSource.size}
              height={heatSource.size}
              fill="rgba(255, 50, 50, 0.4)"
              stroke="red"
              strokeWidth={Lx * 0.002}
              strokeDasharray={`${Lx*0.01} ${Lx*0.01}`}
              className={draggingId === 'heatSource' ? 'animate-pulse' : ''}
            />
            {/* Center Point */}
            <circle
              cx={heatSource.x}
              cy={heatSource.y}
              r={Math.max(Lx * 0.005, heatSource.size/4)}
              fill="#ef4444"
              stroke="white"
              strokeWidth={Lx * 0.002}
            />
            {/* Label */}
            <text
                x={heatSource.x}
                y={heatSource.y - heatSource.size/2 - (Ly * 0.01)}
                textAnchor="middle"
                fill="#ef4444"
                fontSize={Lx * 0.03}
                fontWeight="bold"
                className="opacity-0 group-hover:opacity-100 select-none pointer-events-none transition-opacity"
            >
                Source
            </text>
          </g>
        )}
      </svg>
      
      <div className="absolute bottom-2 left-2 pointer-events-none">
          <div className="flex items-center space-x-2 text-xs text-white/50 bg-black/40 px-2 py-1 rounded">
             <Move className="w-3 h-3" />
             <span>Drag elements to move</span>
          </div>
      </div>
    </div>
  );
};
