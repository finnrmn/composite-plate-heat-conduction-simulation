import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, type TabType } from '@/components/Layout';
import { MATERIALS, DEFAULT_CONFIG } from '@/utils/constants';
import { type SimulationConfig, type Region } from '@/utils/types';
import { PhysicsEngine } from '@/engine/physicsEngine';
import { SetupView } from '@/views/SetupView';
//import { SimulationView } from '@/views/SimulationView';

export default function App() {
  // ===== State Management =====
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);

  // ===== Event Handlers =====


  // ==== Editor Update Functions =====
  const updateConfig = (key: keyof SimulationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  const updateHeatSource = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      heatSource: { ...prev.heatSource, [key]: value }
    }));
  };

  const addInclusion = () => {
    setConfig(prev => ({
      ...prev,
      inclusions: [
        ...prev.inclusions,
        {
          id: `inc-${Date.now()}`,
          x: 0.04,
          y: 0.04,
          width: 0.02,
          height: 0.02,
          materialName: 'Aluminium'
        }
      ]
    }));
  };
  const removeInclusion = (id: string) => {
    setConfig(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter(inc => inc.id !== id)
    }));
  };

  const updateInclusion = (id: string, field: keyof Region, value: any) => {
    setConfig(prev => ({
      ...prev,
      inclusions: prev.inclusions.map(inc =>
        inc.id === id ? { ...inc, [field]: value } : inc
      )
    }));
  };

  const handleInclusionMove = (id: string, x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      inclusions: prev.inclusions.map(inc =>
        inc.id === id ? { ...inc, x, y } : inc
      )
    }));
  };

  const handleHeatSourceMove = (x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      heatSource: { ...prev.heatSource, x, y }
    }));
  };

  // ===== Render React Components =====
  return (
    <Layout>
      {(activeTab: TabType) => {
        if (activeTab === 'setup') {
          return (
            <SetupView
              config={config}
              onUpdateConfig={updateConfig}
              onUpdateHeatSource={updateHeatSource}
              onUpdateInclusion={updateInclusion}
              onAddInclusion={addInclusion}
              onRemoveInclusion={removeInclusion}
              onInclusionMove={handleInclusionMove}
              onHeatSourceMove={handleHeatSourceMove}
            />
          );
        }
        if (activeTab === 'simulation' && engine) {
          return (
            <SetupView
              config={config}
              onUpdateConfig={updateConfig}
              onUpdateHeatSource={updateHeatSource}
              onUpdateInclusion={updateInclusion}
              onAddInclusion={addInclusion}
              onRemoveInclusion={removeInclusion}
              onInclusionMove={handleInclusionMove}
              onHeatSourceMove={handleHeatSourceMove}
            />
          );
        }
      }}
    </Layout>
  )
}