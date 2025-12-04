import { Layout, type TabType, Sidebar, SplitLayout, MainArea } from '@/components/Layout';
import { Section, SectionHeader, SectionTitle,SectionContent} from '@/components/Section';
import styled from 'styled-components';
import { Thermometer } from 'lucide-react';


function App() {
  return (
    <Layout>
      {(activeTab: TabType) => {
        switch (activeTab) {
          case 'setup':
            return (
              <Section>
                <SplitLayout>
                  <Sidebar>
                      <Section>
                        <SectionHeader>
                          <SectionTitle>
                            <Thermometer/>
                            Heat Source
                          </SectionTitle>
                        </SectionHeader>
                        <SectionContent>Hier steteh sachen</SectionContent>
                      </Section>
                      <Section>
                        <SectionHeader>
                          <SectionTitle>
                            <Thermometer/>
                            Heat Source
                          </SectionTitle>
                        </SectionHeader>
                        <SectionContent>Hier steteh sachen</SectionContent>
                      </Section>
                  </Sidebar>
                  <MainArea>
                      <Section>
                        <SectionTitle></SectionTitle>
                      </Section>
                  </MainArea>
                </SplitLayout>
              </Section>
            );

          case 'simulation':
            return (
              <Section>
                <SplitLayout>
                  <Sidebar>
                      c
                  </Sidebar>
                  <MainArea>
                      Simulation
                  </MainArea>
                </SplitLayout>
              </Section>
            );

          default:
            return null;
        }
      }}
    </Layout>
  );
}

export default App;