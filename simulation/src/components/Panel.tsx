import styled from 'styled-components';
import React from 'react';
import type { StackId } from 'recharts/types/util/ChartUtils';

// ===== TypeScrpt Interface =====
interface PanelProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    accent?: 'primary' | 'secondary' | 'warning';
    className?: string;
}
// ===== Styled Components =====
const PanelContainer = styled.section`
    background: ${props => props.theme.colors.bgSecondary}80;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.lg};
    padding: ${props => props.theme.spacing.lg};
`;
const PanelHeader = styled.h2`
    font-size: ${props => props.theme.fontSize.xl};
    font-weight: 600;
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => {
        switch (props.$accent) {
            case 'primary': return props.theme.colors.primary;
            case 'warning': return props.theme.colors.panelOrange;
            case 'danger': return props.theme.colors.danger;
            case 'secondary': return props.theme.colors.panelBlue;
            default: return props.theme.colors.textPrimary;
        }
    }};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    svg {
        width: 20px;
        height: 20px;
    }
`;
const PanelContent = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.md};
`;
// ===== React Component =====
export const Panel: React.FC<PanelProps> = ({
    title,
    icon,
    children,
    accent = 'primary',
    className
}) => {
    return (
        <PanelContainer className={className}>
            <PanelHeader $accent={accent}>
                {icon}
                {title}
            </PanelHeader>
            <PanelContent>
                {children}
            </PanelContent>
        </PanelContainer>
    );
}; 
