import { Layout, type TabType, Sidebar, SplitLayout, MainArea } from '@/components/Layout';
import styled from 'styled-components';

const SetupView = styled.div`
  padding: ${props => props.theme.spacing.xl};
`;

const SimulationView = styled.div`
  padding: ${props => props.theme.spacing.xl};
`;

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: ${props => props.theme.colors.bgSecondary};
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.fontSize.lg};
`;

function App() {
  return (
    <Layout>
      {(activeTab: TabType) => {
        switch (activeTab) {
          case 'setup':
            return (
              <SetupView>
                <h2>Setup Mode</h2>
                <Placeholder>
                  Configuration UI will go here
                  <br />
                  (PlateEditor, parameter forms, etc.)
                </Placeholder>
              </SetupView>
            );

          case 'simulation':
            return (
              <SimulationView>
                <SplitLayout>
                  <Sidebar>
                      controls, stats
                  </Sidebar>
                  <MainArea>
                      Simulation
                  </MainArea>
                </SplitLayout>
              </SimulationView>
            );

          default:
            return null;
        }
      }}
    </Layout>
  );
}

export default App;