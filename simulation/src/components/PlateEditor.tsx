import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { type SimulationConfig } from "@/utils/types";
import { MATERIALS } from "@/utils/constants";

// ===== TypeScript Interface =====
interface PlateEditorProps {
    config: SimulationConfig;
    onUpdateInclusion: (id: string, x: number, y: number) => void;
    onUpdateHeatSource: (x: number, y: number) => void;
}

// ===== Styled Components ===== 
const EditorContainer = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: ${props => props.theme.colors.bgPrimary};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.lg};
    overflow: visible;
`;

const EditorSVG = styled.svg`
    width: 100%;
    height: 100%;
    cursor: crosshair;
    display: block;
    touch-action: none; // Prevent default touch behaviors
`;

const HeatSourceGroup = styled.g`
    .heat-source-label {
        opacity: 0;
        transition: opacity 150ms ease-in-out;
    }

    &:hover .heat-source-label {
        opacity: 1;
    }
`;

// ===== React Component =====

export const PlateEditor: React.FC<PlateEditorProps> = ({
    config,
    onUpdateInclusion,
    onUpdateHeatSource,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const { Lx, Ly, inclusions, heatSource, baseMaterial } = config;

    // Convert pointer event (mouse or touch) to physical coordinates [m]
    const getPointerPos = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();

        // Handle both mouse and touch events
        const clientX = 'touches' in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY : e.clientY;

        const px = clientX - rect.left;
        const py = clientY - rect.top;
        // Scale pixel to meters
        const scaleX = Lx / rect.width;
        const scaleY = Ly / rect.height;

        return {
            x: px * scaleX,
            y: py * scaleY
        };
    }, [Lx, Ly]);

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: string, initialX: number, initialY: number) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getPointerPos(e);
        setDragging(id);
        // Calculate offset to prevent object to snap to pointer center
        setOffset({
            x: pos.x - initialX,
            y: pos.y - initialY
        });
    };

    useEffect(() => {
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            if (!dragging || !svgRef.current) return;

            const pos = getPointerPos(e);
            let newX = pos.x - offset.x;
            let newY = pos.y - offset.y;

            if (dragging === "heatSource") {
                // Clamp to plate bounds
                newX = Math.max(0, Math.min(Lx, newX));
                newY = Math.max(0, Math.min(Ly, newY));
                onUpdateHeatSource(newX, newY);
            } else {
                // Find the inclusion which is been dragged
                const inc = inclusions.find(i => i.id === dragging);
                if (inc) {
                    // Clamp to plate bounds (top-left based)
                    newX = Math.max(0, Math.min(Lx - inc.width, newX));
                    newY = Math.max(0, Math.min(Ly - inc.height, newY));
                    onUpdateInclusion(dragging, newX, newY);
                }
            }
        };

        const handlePointerUp = () => {
            setDragging(null);
        }

        if (dragging) {
            window.addEventListener("mousemove", handlePointerMove);
            window.addEventListener("mouseup", handlePointerUp);
            window.addEventListener("touchmove", handlePointerMove, { passive: false });
            window.addEventListener("touchend", handlePointerUp);
        }
        return () => {
            window.removeEventListener("mousemove", handlePointerMove);
            window.removeEventListener("mouseup", handlePointerUp);
            window.removeEventListener("touchmove", handlePointerMove);
            window.removeEventListener("touchend", handlePointerUp);
        };
    }, [dragging, offset, Lx, Ly, inclusions, onUpdateHeatSource, onUpdateInclusion, getPointerPos]);

    const baseColor = MATERIALS[baseMaterial]?.color || "#333";
    const baseSymbol = MATERIALS[baseMaterial]?.symbol || "?";

    return (
        <EditorContainer>
            <EditorSVG ref={svgRef} viewBox={`0 0 ${Lx} ${Ly}`} preserveAspectRatio="none">
                {/* Base Plate BG*/}
                <rect x="0" y="0" width={Lx} height={Ly} fill={baseColor} opacity={0.3} pointerEvents="none"/>
                {/* Base Material Symbol Watermark */}
                <text
                    x={Lx * 0.98}
                    y={Ly * 0.025}
                    textAnchor="end"
                    dominantBaseline="hanging"
                    fill="rgba(255,255,255,0.2)"
                    fontSize={Lx * 0.04}
                    fontWeight="bold"
                    
                >
                    {baseSymbol} (Base)
                </text>
                {/* Inclusions */}
                {inclusions.map((inc) => {
                    const mat = MATERIALS[inc.materialName];
                    return (
                        <g
                            key={inc.id}
                            onMouseDown={(e) => handlePointerDown(e, inc.id, inc.x, inc.y)}
                            onTouchStart={(e) => handlePointerDown(e, inc.id, inc.x, inc.y)}
                            style={{ cursor: "move" }}
                        >
                            <rect
                                x={inc.x}
                                y={inc.y}
                                width={inc.width}
                                height={inc.height}
                                fill={mat?.color || "#666"}
                                stroke={dragging === inc.id ? "white" : "transparent"}
                                strokeWidth={Lx * 0.005}
                            />
                            {/* Drag Handle Indicator on Hover */}
                        
                            <text
                                x={inc.x + inc.width / 2}
                                y={inc.y + inc.height / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="rgba(255,255,255,0.9)"
                                fontSize={Math.min(inc.width, inc.height) * 0.4}
                                fontWeight="bold"
                                pointerEvents="none"
                                style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
                            >
                                {mat?.symbol}
                            </text>
                        </g>
                    );
                })}

                {/* Heat Source */}
                {heatSource.active && (
                    <HeatSourceGroup
                        onMouseDown={(e) => handlePointerDown(e, "heatSource", heatSource.x, heatSource.y)}
                        onTouchStart={(e) => handlePointerDown(e, "heatSource", heatSource.x, heatSource.y)}
                        style={{ cursor: "move" }}
                    >
                        {/* Hit Area (Larger than visible source for easier grabbing) */}
                        <rect
                            x={heatSource.x - Math.max(heatSource.size, Lx * 0.05) / 2}
                            y={heatSource.y - Math.max(heatSource.size, Ly * 0.05) / 2}
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
                            strokeDasharray={`${Lx * 0.01} ${Lx * 0.01}`}
                            pointerEvents="none"
                        />

                        {/* Center Point */}
                        <circle
                            cx={heatSource.x}
                            cy={heatSource.y}
                            r={Math.max(Lx * 0.005, heatSource.size / 4)}
                            fill="#ef4444"
                            stroke="white"
                            strokeWidth={Lx * 0.002}
                            pointerEvents="none"
                        />

                        {/* Label */}
                        <text
                            x={heatSource.x}
                            y={heatSource.y - heatSource.size / 2 - (Ly * 0.01)}
                            textAnchor="middle"
                            fill="#ef4444"
                            fontSize={Lx * 0.03}
                            fontWeight="bold"
                            className="heat-source-label"
                            pointerEvents="none"
                        >
                            Source
                        </text>
                    </HeatSourceGroup>
                )}
            </EditorSVG>
        </EditorContainer>
    )
}