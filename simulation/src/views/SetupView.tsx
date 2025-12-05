import React from "react";
import styled from "styled-components";
import { type SimulationConfig, type Region } from "@/utils/types";
import { MATERIALS } from "@/utils/constants";
import { Panel } from "@/components/Panel";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Settings, Zap, Plus, Trash2 } from "lucide-react";
import type { theme } from "@/styles/theme";
//import { PlateEditor } from "@/components/PlateEditor";

// ===== TypeScript Interface =====
interface SetupViewProps {
    config: SimulationConfig;
    onUpdateConfig: (key: keyof SimulationConfig, value: any) => void;
    onUpdateHeatSource: (key: string, value: any) => void;
    onUpdateInclusion: (id: string, field: keyof Region, value: any) => void;
    onAddInclusion: () => void;
    onRemoveInclusion: (id: string) => void;
    onInclusionMove: (id: string, x: number, y: number) => void;
    onHeatSourceMove: (x: number, y: number) => void;
}
// ===== Styled Components =====
const SetupContainer = styled.div`
    display: flex;
    height: 100%;
    overflow: hidden;
    

    @media (max-width: 1024px){
        flex-direction: column;
    }
`;
const ConfigColumn = styled.div`
    width: 50%;
    height: 100%;
    overflow-y: auto;
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xxl};
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.lg};
    /* Hidden scrollbar for clean look */
    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */

    @media (max-width: 1024px) {
        width: 100%;
    }
`;
const EditorColumn = styled.div`
    width: 50%;
    height: 100%;
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xxl};
    background: ${props => props.theme.colors.bgPrimary}80;
    border-left: 1px solid ${props => props.theme.colors.border};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    @media (max-width: 1024px) {
        width: 100%;
        border-left: none;
        border-top: 1px solid ${props => props.theme.colors.border};
    }
`;
const EditorPanel = styled.div`
    background: ${props => props.theme.colors.bgSecondary};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.lg};
    padding: ${props => props.theme.spacing.md};
    width: 100%;
    max-width: 600px;
`;
const EditorTitle = styled.h2`
    font-size: ${props => props.theme.fontSize.lg};
    font-weight: 700;
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.primary};
    display: flex;
    align-items: center;
    justify-content: space-between;
`;
const EditorDimensions = styled.span`
    font-size: ${props => props.theme.fontSize.xs};
    font-weight: 400;
    color: ${props => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.1em;
`;
const Legend = styled.div`
    margin-top: ${props => props.theme.spacing.md};
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.fontSize.xs};
    color: ${props => props.theme.colors.textMuted};
`;
const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
`;
const ColorDot = styled.div<{ color: string }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.color};
`;
const InclusionBlock = styled.div`
    background: ${props => props.theme.colors.bgSecondary}80;
    border: 1px solid ${props => props.theme.colors.border};
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
    position: relative;
    transition: border-color 0.2s;

    &:hover {
        border-color: ${props => props.theme.colors.primaryHover};
    }
`;
const RemoveButton = styled.button`
    position: absolute;
    top: ${props => props.theme.spacing.sm};
    right: ${props => props.theme.spacing.sm};
    background: transparent;
    border: none;
    color: ${props => props.theme.colors.textMuted};
    cursor: pointer;
    padding: ${props => props.theme.spacing.xs};
    transition: color 0.2s;

    &:hover {
        color: ${props => props.theme.colors.danger};
    }

    svg {
        width: 16px;
        height: 16px;
    }
`;
const InclusionTitle = styled.h3`
    font-size: ${props => props.theme.fontSize.sm};
    font-weight: 500;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: ${props => props.theme.spacing.sm};
`;
const InclusionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.sm};
`;
const EmptyState = styled.div`
    text-align: center;
    padding: ${props => props.theme.spacing.xxl};
    color: ${props => props.theme.colors.textMuted};
    border: 2px dashed ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
`;
const Spacer = styled.div`
    padding-bottom: ${props => props.theme.spacing.xxl};
`;
const PanelActions = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.md};
`;
const PanelTitle = styled.h2`
    font-size: ${props => props.theme.fontSize.xl};
    font-weight: 600;
    color: ${props => props.theme.colors.panelBlue};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    svg {
        width: 20px;
        height: 20px;
    }
`;
const InclusionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
`;
// ===== React Component =====
export const SetupView: React.FC<SetupViewProps> = ({
    config,
    onUpdateConfig,
    onUpdateHeatSource,
    onUpdateInclusion,
    onAddInclusion,
    onRemoveInclusion,
    onInclusionMove,
    onHeatSourceMove,
}) => {
    return (
        <SetupContainer>
            {/* LEFT: Configuration Column */}
            <ConfigColumn>
                {/* Panel 1: Global Parameter*/}
                <Panel title="Global Parameters" icon={<Settings />} accent="primary">
                    <Select
                        label=" Base Material"
                        value={config.baseMaterial}
                        onChange={(e) => onUpdateConfig('baseMaterial', e.target.value)}
                        options={Object.keys(MATERIALS).map(m => ({ value: m, label: m }))}
                    />

                    <Select
                        label="Boundary Condition"
                        value={config.boundaryCondition}
                        onChange={(e) => onUpdateConfig('boundaryCondition', e.target.value)}
                        options={[
                            { value: 'dirichlet', label: 'Simple (Direchlet)' },
                            { value: 'robin', label: 'Complex (Robin)' }
                        ]}
                    />

                    <Input
                        label="Grid Size N×N"
                        type="number"
                        min="20"
                        max="400"
                        step="10"
                        value={config.Nx}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 20 && val <= 400) {
                                onUpdateConfig('Nx', val);
                                onUpdateConfig('Ny', val);
                            }
                        }}
                        suffix="pts"
                    />

                    <Input
                        label="Ambient Temp (K)"
                        type="number"
                        value={config.ambientTemp}
                        onChange={(e) => onUpdateConfig('ambientTemp', parseFloat(e.target.value))}
                        suffix="K"
                    />

                    {config.boundaryCondition === 'robin' && (
                        <Input
                            label="Convection (h)"
                            type="number"
                            value={config.convectionCoeff}
                            onChange={(e) => onUpdateConfig('convectionCoeff', parseFloat(e.target.value))}
                            suffix="W/m²K"
                        />
                    )}

                    <Input
                        label="Sim Duration"
                        type="number"
                        value={config.simulationDuration}
                        onChange={(e) => onUpdateConfig('simulationDuration', parseFloat(e.target.value))}
                        suffix="s"
                    />
                </Panel>
                {/* Panel 2: Heat Source */}
                <Panel title="Heat Source" icon={<Zap />} accent="warning">
                    <Input
                        label="Power Density"
                        type="number"
                        value={config.heatSource.power}
                        onChange={(e) => onUpdateHeatSource('power', parseFloat(e.target.value))}
                        suffix="W/m³"
                    />

                    <Input
                        label="Duration"
                        type="number"
                        value={config.heatSource.duration}
                        onChange={(e) => onUpdateHeatSource('duration', parseFloat(e.target.value))}
                        suffix="s"
                    />

                    <Input
                        label="Position X"
                        type="number"
                        step="0.005"
                        value={config.heatSource.x}
                        onChange={(e) => onUpdateHeatSource('x', parseFloat(e.target.value))}
                        suffix="m"
                    />

                    <Input
                        label="Position Y"
                        type="number"
                        step="0.005"
                        value={config.heatSource.y}
                        onChange={(e) => onUpdateHeatSource('y', parseFloat(e.target.value))}
                        suffix="m"
                    />

                    <Input
                        label="Size"
                        type="number"
                        step="0.001"
                        value={config.heatSource.size}
                        onChange={(e) => onUpdateHeatSource('size', parseFloat(e.target.value))}
                        suffix="m"
                    />
                </Panel>
                {/* Panel 3: Inclusions */}
                <div>
                    <PanelActions>
                        <PanelTitle>
                            <Plus />
                            Inclusions
                        </PanelTitle>
                        <Button size="sm" variant="secondary" onClick={onAddInclusion}>
                            Add Region
                        </Button>
                    </PanelActions>

                    <InclusionsList>
                        {config.inclusions.length === 0 && (
                            <EmptyState>
                                No inclusions added. Plate is uniform.
                            </EmptyState>
                        )}

                        {config.inclusions.map((inc, idx) => (
                            <InclusionBlock key={inc.id}>
                                <RemoveButton onClick={() => onRemoveInclusion(inc.id)}>
                                    <Trash2 />
                                </RemoveButton>

                                <InclusionTitle>Region {idx + 1}</InclusionTitle>

                                <InclusionGrid>
                                    <Select
                                        label="Material"
                                        value={inc.materialName}
                                        onChange={(e) => onUpdateInclusion(inc.id, 'materialName', e.target.value)}
                                        options={Object.keys(MATERIALS).map(m => ({ value: m, label: m }))}
                                        style={{ gridColumn: 'span 2' }}
                                    />

                                    <Input
                                        label="Pos X"
                                        type="number"
                                        step="0.005"
                                        value={inc.x}
                                        onChange={(e) => onUpdateInclusion(inc.id, 'x', parseFloat(e.target.value))}
                                        suffix="m"
                                    />

                                    <Input
                                        label="Pos Y"
                                        type="number"
                                        step="0.005"
                                        value={inc.y}
                                        onChange={(e) => onUpdateInclusion(inc.id, 'y', parseFloat(e.target.value))}
                                        suffix="m"
                                    />

                                    <Input
                                        label="Width"
                                        type="number"
                                        step="0.005"
                                        value={inc.width}
                                        onChange={(e) => onUpdateInclusion(inc.id, 'width', parseFloat(e.target.value))}
                                        suffix="m"
                                    />

                                    <Input
                                        label="Height"
                                        type="number"
                                        step="0.005"
                                        value={inc.height}
                                        onChange={(e) => onUpdateInclusion(inc.id, 'height', parseFloat(e.target.value))}
                                        suffix="m"
                                    />
                                </InclusionGrid>
                            </InclusionBlock>
                        ))}
                    </InclusionsList>
                </div>

                {/* Spacer for scroll breathing room */}
                <Spacer />
            </ConfigColumn>
            {/* RIGHT: Visual Editor Column (Fixed) */}
            <EditorColumn>
                <EditorPanel>
                    <EditorTitle>
                        <span>Plate Editor</span>
                        <EditorDimensions>
                            {config.Lx * 100}cm × {config.Ly * 100}cm
                        </EditorDimensions>
                    </EditorTitle>

                    {/* TODO: Implement PlateEditor component in next tutorial */}
                    <div style={{
                        aspectRatio: '1',
                        background: '#1e293b',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        fontSize: '14px'
                    }}>
                        PlateEditor SVG will go here
                        <br />
                        (See Tutorial 08: PlateEditor)
                    </div>

                    <Legend>
                        <LegendItem>
                            <ColorDot color={MATERIALS[config.baseMaterial]?.color || '#888'} />
                            <span>Base: {config.baseMaterial}</span>
                        </LegendItem>
                        <LegendItem>
                            <ColorDot color={"#ef4444"} />
                            <span>Heat Source</span>
                        </LegendItem>
                    </Legend>
                </EditorPanel>

                <p style={{
                    marginTop: '10px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#64748b',
                }}>
                    Drag and drop to move items or use the panel on the left for precise adjustments.
                </p>
            </EditorColumn>
        </SetupContainer>
    );
};
