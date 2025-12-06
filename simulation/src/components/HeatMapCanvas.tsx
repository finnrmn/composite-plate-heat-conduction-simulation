import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { drawHeatMap } from "@/utils/colors";
import { MATERIALS } from "@/utils/constants";
import { type Region, type HeatSource } from "@/utils/types";

// ===== TypeScript Interface =====
interface HeatMapCanvasProps {
    tempData: Float32Array;
    width: number;      // Grid width (Nx)
    height: number;     // Grid height (Ny)
    minTemp: number;
    maxTemp: number;
    // Special Props for SVG overlay 
    heatSource?: HeatSource;
    Lx?: number;
    Ly?: number;
    inclusions?: Region[];
    baseMaterial?: string;
}

// ===== Styled Components =====
const CanvasContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: ${props => props.theme.borderRadius.lg};
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid ${props => props.theme.colors.border};
    background: black;
`;

const StyledCanvas = styled.canvas`
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
`;

const OverlaySVG = styled.svg`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
`;

const Watermark = styled.text`
    fill: ${props => props.theme.colors.textMuted};
    opacity: 0.3;
    font-size: 4px;
    font-weight: bold;
    textShadow: '0px 0px 2px rgba(0,0,0,0.8)';
`;

// ===== React Component =====
export const HeatMapCanvas: React.FC<HeatMapCanvasProps> = ({
    tempData,
    width,
    height,
    minTemp,
    maxTemp,
    heatSource,
    Lx = 0.1,
    Ly = 0.1,
    inclusions = [],
    baseMaterial = "Basalt",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Set canvas size to match plate grid
        canvas.width = width;
        canvas.height = height;
        // Get the drawable context of HTML-Canvas-Element
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        // Draw heatmap to canvas using optimized draw function from @/utils/colors.ts
        drawHeatMap(ctx, tempData, width, height, minTemp, maxTemp);
    }, [tempData, width, height, minTemp, maxTemp]);

    

    return (
        <CanvasContainer>
            <StyledCanvas ref={canvasRef} />

            <OverlaySVG viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Base material watermark */}
                <Watermark x="98" y="5" textAnchor="end" >
                    {MATERIALS[baseMaterial]?.symbol || baseMaterial}
                </Watermark>

                {/* Draw inclusions outlines */}
                {inclusions.map((inc) => {
                    const materialSymbol = MATERIALS[inc.materialName]?.symbol || "?";
                    // Calculate SVG coords based on physical dimensions
                    const xPerc = (inc.x / Lx) * 100;
                    const yPerc = (inc.y / Ly) * 100;
                    const wPerc = (inc.width / Lx) * 100;
                    const hPerc = (inc.height / Ly) * 100;
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
                                x={xPerc + wPerc / 2}
                                y={yPerc + hPerc / 2 + 1}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.6)"
                                fontSize="4"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none', textShadow: '0px 0px 2px rgba(0,0,0,0.8)' }}
                            >
                                {materialSymbol}
                            </text>
                        </g>
                    );
                })}
                {/* Draw heat source marker */}
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
                            cx={heatSource.x / Lx * 100}
                            cy={heatSource.y / Ly * 100}
                            r="0.5"
                            fill="rgba(255, 50, 50, 0.9)"
                        />
                    </g>
                )}
            </OverlaySVG>
        </CanvasContainer>
    );
};



