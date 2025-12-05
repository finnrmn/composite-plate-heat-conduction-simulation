import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, type TabType } from '@/components/Layout';
import { MATERIALS, DEFAULT_CONFIG } from '@/utils/constants';
import { type SimulationConfig, type Region } from '@/utils/types';
import { PhysicsEngine } from '@/engine/physicsEngine';
import { SetupView } from '@/views/SetupView';
import { SimulationView } from '@/views/SimulationView';

export default function App() {
  // ===== State Management =====
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);
  // Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [stats, setStats] = useState({
    time: 0,
    maxTemp: 0,
    minTemp: 0,
    avgTemp: 0,
    totalEnergy: 0,
    deltaEnergy: 0,
    calcStepCount: 0,
  });
  const [history, setHistory] = useState<Array<{ time: string; energy: number }>>([]);
  const [fps, setFps] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [targetFps, setTargetFps] = useState(60);

  // ===== Refs for Animation Loop =====
  const requestRef = useRef<number | null>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const lastRenderTime = useRef<number>(0);
  const lastHistoryTime = useRef<number>(0);
  const lastSimTime = useRef<number>(0);
  const simAccumulator = useRef<number>(0);
  const startEnergy = useRef<number>(0);
  // FPS Counting
  const fpsFrameCount = useRef<number>(0);
  const lastFpsTime = useRef<number>(0);

  // ===== Initialize Engine on Tab Switch =====
  useEffect(() => {
    if (engine) {
      const newEngine = new PhysicsEngine(config);
      setEngine(newEngine);
      engineRef.current = newEngine;
      setSimTime(0);
      setHistory([]);
      setIsRunning(false);
      lastHistoryTime.current = 0;
      lastRenderTime.current = 0;
      lastSimTime.current = 0;
      simAccumulator.current = 0;
      lastFpsTime.current = performance.now();
      fpsFrameCount.current = 0;

      const initialStats = newEngine.getStats();
      setStats(initialStats);
      startEnergy.current = initialStats.totalEnergy;
    }
  }, [config]);

  // Create initial engine placeholder
  useEffect(() => {
    const initialEngine = new PhysicsEngine(config);
    setEngine(initialEngine);
    engineRef.current = initialEngine;
    const initialStats = initialEngine.getStats();
    setStats(initialStats);
    startEnergy.current = initialStats.totalEnergy;
  }, []);
  // ===== Animation Loop =====
  const animate = useCallback((time: number) => {
    if (!engineRef.current) return;

    // Initialize timings on first frame
    if (lastSimTime.current === 0) {
      lastSimTime.current = time;
      lastRenderTime.current = time;
      lastFpsTime.current = time;
    }

    // FPS Throttling
    const fpsInterval = 1000 / targetFps;
    const deltaRender = time - lastRenderTime.current;

    if (deltaRender < fpsInterval) {
      if (isRunning) {
        requestRef.current = requestAnimationFrame(animate);
      }
      return;
    }

    // Update render time (snap to grid to avoid drift)
    lastRenderTime.current = time - (deltaRender % fpsInterval);

    // FPS Measurement (stable 1s average)
    fpsFrameCount.current++;
    if (time - lastFpsTime.current >= 1000) {
      setFps(Math.round((fpsFrameCount.current * 1000) / (time - lastFpsTime.current)));
      fpsFrameCount.current = 0;
      lastFpsTime.current = time;
    }

    // Physics Decoupling with Accumulator
    const deltaSim = time - lastSimTime.current;
    lastSimTime.current = time;

    const targetStepsPerSec = (config.timeStepMultiplier || 1) * speed * 60;
    simAccumulator.current += (deltaSim / 1000) * targetStepsPerSec;

    let steps = Math.floor(simAccumulator.current);

    // Cap steps to prevent spiral of death
    const maxSteps = Math.max(targetStepsPerSec * 0.5, 60);

    if (steps > maxSteps) {
      steps = Math.floor(maxSteps);
      simAccumulator.current = 0;
    } else {
      simAccumulator.current -= steps;
    }

    for (let i = 0; i < steps; i++) {
      engineRef.current.step();
    }

    // Update React State for UI
    setSimTime(engineRef.current.time);

    const currentStats = engineRef.current.getStats();
    setStats(currentStats);

    // Update history chart every ~200ms
    if (time - lastHistoryTime.current > 200) {
      lastHistoryTime.current = time;
      setHistory(prev => {
        const deltaE = currentStats.totalEnergy - startEnergy.current;
        const newHist = [...prev, { time: currentStats.time.toFixed(1), energy: deltaE }];
        if (newHist.length > 50) return newHist.slice(newHist.length - 50);
        return newHist;
      });
    }

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, config.timeStepMultiplier, speed, targetFps]);

  useEffect(() => {
    if (isRunning) {
      lastSimTime.current = 0;
      lastRenderTime.current = 0;
      lastFpsTime.current = performance.now();
      fpsFrameCount.current = 0;
      simAccumulator.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, animate]);

  // ===== Event Handlers =====
  const handleStartStop = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setIsRunning(false);
    const newEngine = new PhysicsEngine(config);
    setEngine(newEngine);
    engineRef.current = newEngine;
    setSimTime(0);
    setHistory([]);
    simAccumulator.current = 0;

    const initialStats = newEngine.getStats();
    setStats(initialStats);
    startEnergy.current = initialStats.totalEnergy;
  };


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
            <SimulationView
              config={config}
              engine={engine}
              isRunning={isRunning}
              simTime={simTime}
              stats={stats}
              history={history}
              fps={fps}
              speed={speed}
              targetFps={targetFps}
              onStartStop={handleStartStop}
              onReset={handleReset}
              onSpeedChange={setSpeed}
              onTargetFpsChange={setTargetFps}
            />
          );
        }
        return null;
      }}
    </Layout>
  );
}