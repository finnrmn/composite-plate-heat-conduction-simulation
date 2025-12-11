import React from "react";
import styled from "styled-components";
import { type SimulationConfig, type SimulationStats } from "@/utils/types";
import { PhysicsEngine } from "@/engine/physicsEngine";
import { Button } from "@/components/Button";
import { Play, Pause, RotateCcw, Clock, Thermometer, Activity, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { HeatMapCanvas } from "@/components/HeatMapCanvas";

// ===== TypeScript Interface =====
interface SimulationViewProps {
    config: SimulationConfig;
    engine: PhysicsEngine;
    isRunning: boolean;
    stats: SimulationStats;
    history: Array<{ time: string; energy: number }>
    fps: number;
    speed: number;
    targetFps: number;
    onStartStop: () => void;
    onReset: () => void
    onSpeedChange: (speed: number) => void;
    onTargetFpsChange: (fps: number) => void;
}

// ===== Styled Components =====
const SimulationContainer = styled.div`
    display: flex;
    height: 100%;
    overflow: hidden;

    @media (max-width: 1024px){
        flex-direction: column;
    }
`;

const Sidebar = styled.aside`
    width: 320px;
    background: ${props => props.theme.colors.bgSecondary}80;
    border-right: 1px solid ${props => props.theme.colors.border};
    padding: ${props => props.theme.spacing.lg};
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.lg};
    overflow-y: auto;
`;

const CanvasArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: ${props => props.theme.colors.bgPrimary};
    padding: ${props => props.theme.spacing.xxl};
    position: relative;
`;

const HeatMapWrapper = styled.div`
    position: relative;
    width: min(83vh, 80vw);
    aspect-ratio: 1/1;
    box-shadow: ${props => props.theme.shadows.xl};
    border-radius: ${props => props.theme.borderRadius.lg};
`;

const SectionHeader = styled.h3`
    font-size: ${props => props.theme.fontSize.sm};
    font-weight: 700;
    color: ${props => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: ${props => props.theme.spacing.md};
`;

const ButtonGroup = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.sm};
`;

const SliderContainer = styled.div``;

const Slider = styled.input.attrs({ type: "range" })`
    width: 100%;
    height: 8px;
    background: ${props => props.theme.colors.bgTertiary};
    border-radius: ${props => props.theme.borderRadius.full};
    appearance: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: ${props => props.theme.colors.primary};
        border-radius: 50%;
        cursor: pointer;
    }

    &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: ${props => props.theme.colors.primary};
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }
`;

const SliderLabels = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: ${props => props.theme.fontSize.xs};
    color: ${props => props.theme.colors.textMuted};
    margin-top: ${props => props.theme.spacing.xs};
`;

const StatsPanel = styled.div`
    background: ${props => props.theme.colors.bgPrimary}80;
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
    border: 1px solid ${props => props.theme.colors.border};
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
`;

const StatItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: ${props => props.theme.fontSize.sm};

    &:not(:last-child) {
        padding-bottom: ${props => props.theme.spacing.sm};
    }

    &:nth-last-child(1) {
        padding-top: ${props => props.theme.spacing.sm};
        border-top: 1px solid ${props => props.theme.colors.border};
    }
`;

const StatLabel = styled.span`
    color: ${props => props.theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.xs};

    svg {
        width: 12px;
        height: 12px;
    }
`;

const StatValue = styled.span<{ color?: string }>`
    font-family: 'Courier New', monospace;
    color: ${props => props.color || props.theme.colors.textPrimary};
    font-weight: 600;
`;

const GraphContainer = styled.div`
    height: 192px; 
`;

const GraphHeading = styled.h3`
  font-size: ${props => props.theme.fontSize.xs};
  font-weight: 700;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  svg {
    width: 12px;
    height: 12px;
    color: ${props => props.theme.colors.graphIcon}
  }
`;

const GridInfo = styled.div`
    position: absolute;
    top: ${props => props.theme.spacing.lg};
    right: ${props => props.theme.spacing.lg};
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    border-radius: ${props => props.theme.borderRadius.sm};
    font-size: ${props => props.theme.fontSize.xs};
    color: ${props => props.theme.colors.textSecondary};
    border: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 10;
`;

const ColorLegend = styled.div`
    margin-top: ${props => props.theme.spacing.lg};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
`;

const ColorBar = styled.div`
    width: 128px;
    height: 16px;
    border-radius: ${props => props.theme.borderRadius.full};
    border: 1px solid ${props => props.theme.colors.border};
    background: linear-gradient(to right,
        rgb(0,0,4),
        rgb(27,12,65),
        rgb(65,15,117),
        rgb(107,25,111),
        rgb(147,38,103),
        rgb(186,54,85),
        rgb(221,81,58),
        rgb(243,110,27),
        rgb(252,165,10),
        rgb(244,217,34),
        rgb(252,255,164)
    );
`;

const LegendLabel = styled.span`
    font-size: ${props => props.theme.fontSize.xs};
    color: ${props => props.color || props.theme.colors.textMuted};
`;

// ===== React Component =====
export const SimulationView: React.FC<SimulationViewProps> = ({
    config,
    engine,
    isRunning,
    stats,
    history,
    fps,
    speed,
    targetFps,
    onStartStop,
    onReset,
    onSpeedChange,
    onTargetFpsChange,
}) => {
    // Format energy for chart tool
    const formatEnergy = (val: number) => {
        if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}MJ`;
        if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}kJ`;
        return `${Math.round(val)}J`;
    };
    // Dynamic temerature range
    const displayMinTemp = stats.minTemp;
    const displayMaxTemp = Math.max(stats.maxTemp, displayMinTemp + 1.0);

    return (
        <SimulationContainer>
            {/* LEFT: Sidebar Controls */}
            <Sidebar>
                {/* Controls Section */}
                <div>
                    <SectionHeader>Controls</SectionHeader>
                    <ButtonGroup>
                        <Button
                            variant={isRunning ? "secondary" : "primary"}
                            onClick={onStartStop}
                        >
                            {isRunning ? (
                                <>
                                    <Pause style={{ width: 16, height: 16, marginRight: 8 }} />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play style={{ width: 16, height: 16, marginRight: 8 }} />
                                    Start
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={onReset}>
                            <RotateCcw style={{ width: 16, height: 16, marginRight: 8 }} />
                            Reset
                        </Button>
                    </ButtonGroup>
                </div>
                {/* Speed Slider */}
                <SliderContainer>
                    <SectionHeader>Simulation Speed</SectionHeader>
                    <Slider
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={speed}
                        onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    />
                    <SliderLabels>
                        <span>0.1x</span>
                        <span>{speed.toFixed(1)}x</span>
                        <span>10x</span>
                    </SliderLabels>
                </SliderContainer>
                {/* FPS Limit Slider */}
                <SliderContainer>
                    <SectionHeader>FPS Limit</SectionHeader>
                    <Slider
                        min={1}
                        max={100}
                        step={1}
                        value={targetFps}
                        onChange={(e) => onTargetFpsChange(parseInt(e.target.value))}
                    />
                    <SliderLabels>
                        <span>1</span>
                        <span>{targetFps}</span>
                        <span>100</span>
                    </SliderLabels>
                </SliderContainer>
                {/* Live Stats Panel */}
                <div style={{ flex: 1 }}>
                    <SectionHeader>Live Stats</SectionHeader>
                    <StatsPanel>
                        <StatItem>
                            <StatLabel>
                                <Clock />
                                Time
                            </StatLabel>
                            <StatValue color="#14b8a6">{stats.time.toFixed(3)} s</StatValue>
                        </StatItem>

                        <StatItem>
                            <StatLabel>
                                <Thermometer />
                                Max T
                            </StatLabel>
                            <StatValue color="#f87171">{stats.maxTemp.toFixed(1)} K</StatValue>
                        </StatItem>

                        <StatItem>
                            <StatLabel>
                                <Thermometer />
                                Min T</StatLabel>
                            <StatValue color="#60a5fa">{stats.minTemp.toFixed(1)} K</StatValue>
                        </StatItem>

                        <StatItem>
                            <StatLabel>
                                <Thermometer />
                                Avg T</StatLabel>
                            <StatValue color="#facc15">{stats.avgTemp.toFixed(1)} K</StatValue>
                        </StatItem>
                        <StatItem>
                            <StatLabel>
                                <Calculator />
                                Calculated Steps
                            </StatLabel>
                            <StatValue color="#94a3b8">{stats.calcStepCount}</StatValue>
                        </StatItem>
                        <StatItem>
                            <StatLabel style={{ fontSize: '11px' }}>FPS</StatLabel>
                            <StatValue style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {fps}
                            </StatValue>
                        </StatItem>
                    </StatsPanel>
                </div>
                {/* Energy Graph (fixed height 192px) */}
                <GraphContainer>
                    <GraphHeading>
                        <Activity />
                        System Energy Change (ΔE)
                    </GraphHeading>
                    <div style={{ width: '100%', height: '100%', marginLeft: '-16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#334155"
                                    opacity={0.5}
                                    vertical={false}
                                />
                                <XAxis dataKey="time" hide />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    tickFormatter={formatEnergy}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        borderColor: '#334155',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val: number) => [formatEnergy(val), 'ΔE']}
                                    labelFormatter={(label) => `t = ${label}s`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="energy"
                                    stroke="#34d399"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GraphContainer>
            </Sidebar>

            {/* RIGHT: Canvas Area */}
            <CanvasArea>
                <HeatMapWrapper>
                    <HeatMapCanvas
                        tempData={engine.T}
                        width={engine.Nx}
                        height={engine.Ny}
                        minTemp={displayMinTemp}
                        maxTemp={displayMaxTemp}
                        Lx={0.1}
                        Ly={0.1}
                        inclusions={config.inclusions}
                        heatSource={config.heatSource}
                        baseMaterial={config.baseMaterial}
                    />
                </HeatMapWrapper>
                <GridInfo>
                    Grid: {config.Nx}×{config.Ny}
                </GridInfo>

                <ColorLegend>
                    <LegendLabel >{displayMinTemp.toFixed(1)} K</LegendLabel>
                    <ColorBar />
                    <LegendLabel >{displayMaxTemp.toFixed(1)} K</LegendLabel>
                </ColorLegend>
            </CanvasArea>
        </SimulationContainer >
    )
}


