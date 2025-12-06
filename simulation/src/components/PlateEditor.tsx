import React, { useEffect, useRef, useState } from "react";
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
    overflow: hidden;
`;

const EditorSVG = styled.svg`
    width: 100%;
    height: 100%;
    cursor: crosshair;
    display: block;
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

    // Comvert mouse event to physical cooridantes [m]
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

    const handleMouseDown = (e: React.MouseEvent, id: string, initialX: number, initialY: number) => {
        e.preventDefault();
        e.stopPropagation();
        const mouse = getMousePos(e);
        setDragging(id);
        // Calculate offset to prevent object to snap to mouse center
        setOffset({
            x: mouse.x - initialX,
            y: mouse.y - initialY
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging || !svgRef.current) return;

            const mouse = getMousePos(e);
            let newX = mouse.x - offset.x;
            let newY = mouse.y - offset.y;

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

        const handleMouseUp = () => {
            setDragging(null);
        }

        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, offset, Lx, Ly, inclusions, onUpdateHeatSource, onUpdateInclusion]);

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
                    fontSize={Lx * 0.02}
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
                            onMouseDown={(e) => handleMouseDown(e, inc.id, inc.x, inc.y)}
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
                        onMouseDown={(e) => handleMouseDown(e, "heatSource", heatSource.x, heatSource.y)}
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