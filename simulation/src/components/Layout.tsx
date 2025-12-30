import styled from 'styled-components';
import { Settings, MonitorCog } from 'lucide-react';
import React, { useState } from 'react';

// ===== TypeScript Types =====
export type TabType = 'setup' | 'simulation';
// ===== TypeScript Interface =====
interface LayoutProps {
    children: (activeTab: TabType) => React.ReactNode;
    activeTab?: TabType;
    onTabChange?: (tab: TabType) => void;
}
// ===== Styled Components =====
const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${props => props.theme.colors.bgPrimary};

  ${props => props.theme.media.mobile} {
    height: 100dvh; // Dynamic viewport height for iOS

    @supports not (height: 100dvh) {
      height: 100vh; // Fallback for older browsers
    }
  }
`;
const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.xl};
  padding-left: max(${props => props.theme.spacing.xl}, env(safe-area-inset-left));
  padding-right: max(${props => props.theme.spacing.xl}, env(safe-area-inset-right));
  background: ${props => props.theme.colors.bgSecondary};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.md};

  ${props => props.theme.media.mobile} {
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
    padding-left: max(${props => props.theme.spacing.md}, env(safe-area-inset-left));
    padding-right: max(${props => props.theme.spacing.md}, env(safe-area-inset-right));
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.xs};
  }
`;
const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
`;
const Title = styled.h1`
  font-size: ${props => props.theme.fontSize.xl};
  font-weight: 700;
  color: ${props => props.theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};

  ${props => props.theme.media.mobile} {
    font-size: ${props => props.theme.fontSize.base};
  }
`;
const SubTitle = styled.p`
  font-size: ${props => props.theme.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 500;

  ${props => props.theme.media.mobile} {
    display: none; // Hide subtitle on mobile to save space
  }
`;
const TabBar = styled.nav`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.bgSecondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.xl};

  ${props => props.theme.media.mobile} {
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
    width: 100%;
  }
`;
const Tab = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.active
        ? props.theme.colors.bgTertiary
        : 'transparent'};
  color: ${props => props.active
        ? props.theme.colors.textPrimary
        : props.theme.colors.textMuted};
  border: none;
  border-bottom: 2px solid ${props => props.active
        ? props.theme.colors.primary
        : 'transparent'};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.bgTertiary};
    color: ${props => props.theme.colors.textPrimary};
  }

  svg {
    width: 16px;
    height: 16px;
  }

  ${props => props.theme.media.mobile} {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md};
    flex: 1; // Full width on mobile
    justify-content: center;
  }
`;
const Content = styled.main`
  flex: 1;
  overflow: hidden;
`;
// ===== Reusable Layout Elements =====
export const SplitLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 130px); // Subtract header + tabs
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};

  ${props => props.theme.media.tablet} {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    padding: ${props => props.theme.spacing.sm};
    gap: ${props => props.theme.spacing.sm};
  }
`;
export const Sidebar = styled.aside`
  background: ${props => props.theme.colors.bgSecondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  border: 1px solid ${props => props.theme.colors.border};
`;
export const MainArea = styled.section`
  background: ${props => props.theme.colors.bgSecondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
`;

// ===== React Component =====
export const Layout: React.FC<LayoutProps> = ({ children, activeTab: controlledActiveTab, onTabChange }) => {
    const [internalActiveTab, setInternalActiveTab] = useState<TabType>('setup');
    const activeTab = controlledActiveTab ?? internalActiveTab;

    const handleTabChange = (tab: TabType) => {
        if (!controlledActiveTab) {
            setInternalActiveTab(tab);
        }
        onTabChange?.(tab);
    };

    return (
        <LayoutContainer>
            <Header>
              <TitleContainer>
                <Title>HEAT CONDUCTION SIMULATION</Title>
                <SubTitle>ON A 2D COMPOSITE PLATE - EXPLICITE FTCS SCHEME</SubTitle>
              </TitleContainer>
                <TabBar>
                    <Tab
                        active={activeTab === 'setup'}
                        onClick={() => handleTabChange('setup')}
                    >
                        <Settings />
                        Setup
                    </Tab>
                    <Tab
                        active={activeTab === 'simulation'}
                        onClick={() => handleTabChange('simulation')}
                    >
                        <MonitorCog />
                        Simulation
                    </Tab>
                </TabBar>
            </Header>
            <Content>
                {children(activeTab)}
            </Content>
        </LayoutContainer>
    );
};
