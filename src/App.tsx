
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from './components/Layout';
import { MATERIALS, DEFAULT_CONFIG } from './utils/constants';
import { SimulationConfig, Region } from './utils/types';
import { PhysicsEngine } from './engine/physicsEngine';
import { HeatMapCanvas } from './components/HeatMapCanvas';
import { PlateEditor } from './components/PlateEditor'; // New Import
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';
import { Play, Pause, RotateCcw, Plus, Trash2, Zap, Clock, Thermometer, Settings, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sim' | 'edit'>('edit');
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);
  
  // Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [stats, setStats] = useState({ maxTemp: 0, minTemp: 0, avgTemp: 0, centerTemp: 0, totalEnergy: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [fps, setFps] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [targetFps, setTargetFps] = useState(60); // Target FPS limit

  // Refs for loop
  const requestRef = useRef<number | null>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const lastRenderTime = useRef<number>(0); // For FPS throttling
  const lastHistoryTime = useRef<number>(0);
  const lastSimTime = useRef<number>(0); // For physics decoupling
  const simAccumulator = useRef<number>(0); // Accumulate fractional steps for slow speeds
  const startEnergy = useRef<number>(0); // Baseline energy (E0)
  
  // FPS Counting Refs
  const fpsFrameCount = useRef<number>(0);
  const lastFpsTime = useRef<number>(0);

  // Initialize Engine
  useEffect(() => {
    if (activeTab === 'sim') {
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
      
      // Initial stats
      const initialStats = newEngine.getStats();
      setStats(initialStats);
      startEnergy.current = initialStats.totalEnergy;
      
    } else {
      setIsRunning(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [activeTab, config]);

  // Animation Loop
  const animate = useCallback((time: number) => {
    if (!engineRef.current) return;
    
    // Initialize timings on first frame
    if (lastSimTime.current === 0) {
        lastSimTime.current = time;
        lastRenderTime.current = time;
        lastFpsTime.current = time;
    }

    // --- FPS Throttling ---
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

    // --- FPS Measurement (Stable 1s Average) ---
    fpsFrameCount.current++;
    if (time - lastFpsTime.current >= 1000) {
        setFps(Math.round((fpsFrameCount.current * 1000) / (time - lastFpsTime.current)));
        fpsFrameCount.current = 0;
        lastFpsTime.current = time;
    }

    // --- Physics Decoupling with Accumulator ---
    // Calculate how much time passed since last physics update
    const deltaSim = time - lastSimTime.current;
    lastSimTime.current = time;

    // Calculate steps to run based on wall clock time to keep speed constant
    // Baseline: At 60 FPS, we used to run (multiplier * speed) steps per frame.
    // Target Steps/sec = (config.timeStepMultiplier * speed) * 60
    const targetStepsPerSec = config.timeStepMultiplier * speed * 60;
    
    // Add pending steps based on elapsed time and target rate
    simAccumulator.current += (deltaSim / 1000) * targetStepsPerSec;

    let steps = Math.floor(simAccumulator.current);
    
    // Cap steps to prevent spiral of death or huge jumps after tab switch
    // Limit to max 0.5 seconds worth of simulation processing per frame
    const maxSteps = Math.max(targetStepsPerSec * 0.5, 60); 
    
    if (steps > maxSteps) {
        steps = Math.floor(maxSteps);
        simAccumulator.current = 0; // Force reset if way behind to catch up immediately
    } else {
        simAccumulator.current -= steps; // Keep fractional part for next frame
    }

    for(let i=0; i<steps; i++) {
        engineRef.current.step();
    }
    
    // Update React State for UI
    setSimTime(engineRef.current.time);
    
    // Update stats every frame
    const currentStats = engineRef.current.getStats();
    setStats(currentStats);

    // Update history chart every ~200ms
    if (time - lastHistoryTime.current > 200) {
        lastHistoryTime.current = time;
        setHistory(prev => {
            // Delta Energy E(t) - E(0)
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
      // Reset physics timer on start so we don't jump
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
    }
  }, [isRunning, animate]);

  // --- Handlers ---

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

  const updateConfig = (key: keyof SimulationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

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

  // Direct handlers for Visual Editor drag events
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

  // Dynamic Scale Range for Visualization
  // Ensure we have at least 1 degree difference to avoid rendering artifacts when uniform
  const displayMinTemp = stats.minTemp;
  const displayMaxTemp = Math.max(stats.maxTemp, displayMinTemp + 1.0);
  
  // Format Energy for Chart
  const formatEnergy = (val: number) => {
      if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}MJ`;
      if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}kJ`;
      return `${Math.round(val)}J`;
  };

  // --- Render ---

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'edit' && (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            
            {/* Configuration Column (Left) */}
            <div 
                className="lg:w-1/2 h-full overflow-y-auto p-4 md:p-8 space-y-6 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-teal-400 flex items-center">
                        <Settings className="w-5 h-5 mr-2" /> Global Parameters
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Base Material"
                            value={config.baseMaterial}
                            onChange={(e) => updateConfig('baseMaterial', e.target.value)}
                            options={Object.keys(MATERIALS).map(m => ({ value: m, label: m }))}
                        />
                        <Select 
                            label="Boundary Condition"
                            value={config.boundaryCondition}
                            onChange={(e) => updateConfig('boundaryCondition', e.target.value)}
                            options={[
                                { value: 'Dirichlet', label: 'Simple (Dirichlet)' },
                                { value: 'Robin', label: 'Complex (Robin)' }
                            ]}
                        />
                        <Input 
                            label="Grid Size (NxN)"
                            type="number"
                            min="20"
                            max="400"
                            step="10"
                            value={config.Nx}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 20 && val <= 400) {
                                    setConfig(prev => ({ ...prev, Nx: val, Ny: val }));
                                }
                            }}
                            suffix="pts"
                        />
                        <Input 
                            label="Ambient Temp (K)"
                            type="number"
                            value={config.ambientTemp}
                            onChange={(e) => updateConfig('ambientTemp', parseFloat(e.target.value))}
                            suffix="K"
                        />
                         {config.boundaryCondition === 'Robin' && (
                            <Input 
                                label="Convection (h)"
                                type="number"
                                value={config.convectionCoeff}
                                onChange={(e) => updateConfig('convectionCoeff', parseFloat(e.target.value))}
                                suffix="W/m²K"
                            />
                        )}
                         <Input 
                            label="Sim Duration"
                            type="number"
                            value={config.simulationDuration}
                            onChange={(e) => updateConfig('simulationDuration', parseFloat(e.target.value))}
                            suffix="s"
                        />
                    </div>
                </section>

                <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-orange-400 flex items-center">
                        <Zap className="w-5 h-5 mr-2" /> Heat Source
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                         <Input 
                            label="Power Density"
                            type="number"
                            value={config.heatSource.power}
                            onChange={(e) => updateHeatSource('power', parseFloat(e.target.value))}
                            suffix="W/m³"
                        />
                         <Input 
                            label="Duration"
                            type="number"
                            value={config.heatSource.duration}
                            onChange={(e) => updateHeatSource('duration', parseFloat(e.target.value))}
                            suffix="s"
                        />
                        <Input 
                            label="Position X"
                            type="number"
                            step="0.005"
                            value={config.heatSource.x}
                            onChange={(e) => updateHeatSource('x', parseFloat(e.target.value))}
                            suffix="m"
                        />
                        <Input 
                            label="Position Y"
                            type="number"
                            step="0.005"
                            value={config.heatSource.y}
                            onChange={(e) => updateHeatSource('y', parseFloat(e.target.value))}
                            suffix="m"
                        />
                         <Input 
                            label="Size"
                            type="number"
                            step="0.001"
                            value={config.heatSource.size}
                            onChange={(e) => updateHeatSource('size', parseFloat(e.target.value))}
                            suffix="m"
                        />
                    </div>
                </section>

                <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-blue-400 flex items-center">
                            <Plus className="w-5 h-5 mr-2" /> Inclusions
                        </h2>
                        <Button size="sm" variant="secondary" onClick={addInclusion}>Add Region</Button>
                    </div>
                    
                    <div className="space-y-4">
                        {config.inclusions.length === 0 && (
                            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                                No inclusions added. Plate is uniform.
                            </div>
                        )}
                        {config.inclusions.map((inc, idx) => (
                            <div key={inc.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg relative group transition-all hover:border-slate-500">
                                <button 
                                    onClick={() => removeInclusion(inc.id)}
                                    className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Region {idx + 1}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Select 
                                        label="Material"
                                        value={inc.materialName}
                                        onChange={(e) => updateInclusion(inc.id, 'materialName', e.target.value)}
                                        options={Object.keys(MATERIALS).map(m => ({ value: m, label: m }))}
                                        className="col-span-2"
                                    />
                                    <Input 
                                        label="Pos X" type="number" step="0.005"
                                        value={inc.x}
                                        onChange={(e) => updateInclusion(inc.id, 'x', parseFloat(e.target.value))}
                                    />
                                    <Input 
                                        label="Pos Y" type="number" step="0.005"
                                        value={inc.y}
                                        onChange={(e) => updateInclusion(inc.id, 'y', parseFloat(e.target.value))}
                                    />
                                    <Input 
                                        label="Width" type="number" step="0.005"
                                        value={inc.width}
                                        onChange={(e) => updateInclusion(inc.id, 'width', parseFloat(e.target.value))}
                                    />
                                    <Input 
                                        label="Height" type="number" step="0.005"
                                        value={inc.height}
                                        onChange={(e) => updateInclusion(inc.id, 'height', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* Spacer to allow scrolling to bottom */}
                <div className="pb-12"></div>
            </div>

            {/* Visual Editor Column (Right) */}
            <div className="lg:w-1/2 h-full p-4 md:p-8 bg-slate-900/50 border-l border-slate-800 flex flex-col justify-start items-center">
                 <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg w-full max-w-xl">
                     <h2 className="text-lg font-bold mb-4 text-teal-400 flex items-center justify-between">
                        <span>Plate Editor</span>
                        <span className="text-xs font-normal text-slate-500 uppercase tracking-widest">{config.Lx * 100}cm x {config.Ly * 100}cm</span>
                     </h2>
                     <PlateEditor 
                        config={config} 
                        onUpdateInclusion={handleInclusionMove}
                        onUpdateHeatSource={handleHeatSourceMove}
                     />
                     <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-400">
                         <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 rounded-full" style={{ background: MATERIALS[config.baseMaterial]?.color }}></div>
                             <span>Base: {config.baseMaterial}</span>
                         </div>
                         <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400"></div>
                             <span>Heat Source</span>
                         </div>
                     </div>
                 </div>
                 
                 <div className="mt-6 text-center max-w-sm">
                     <p className="text-sm text-slate-500">
                        Use the panel on the left for precise adjustments.
                     </p>
                 </div>
            </div>
        </div>
      )}

      {activeTab === 'sim' && engine && (
        <div className="flex h-full">
            {/* Sidebar Controls */}
            <div className="w-80 bg-slate-800/50 border-r border-slate-700 p-6 flex flex-col space-y-6 overflow-y-auto">
                 <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Controls</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant={isRunning ? 'secondary' : 'primary'}
                            onClick={handleStartStop}
                            className="w-full"
                        >
                            {isRunning ? <><Pause className="w-4 h-4 mr-2"/> Pause</> : <><Play className="w-4 h-4 mr-2"/> Start</>}
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleReset}
                            className="w-full"
                        >
                           <RotateCcw className="w-4 h-4 mr-2"/> Reset
                        </Button>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Simulation Speed</h3>
                    <input 
                        type="range" min="0.1" max="10" step="0.1"
                        value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>0.1x</span>
                        <span>{speed.toFixed(1)}x</span>
                        <span>10x</span>
                    </div>
                 </div>

                 {/* FPS Control */}
                 <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">FPS Limit</h3>
                    <input 
                        type="range" min="1" max="100" 
                        value={targetFps} onChange={(e) => setTargetFps(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>1</span>
                        <span>{targetFps}</span>
                        <span>100</span>
                    </div>
                 </div>

                 <div className="flex-1">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Stats</h3>
                     <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm flex items-center"><Clock className="w-3 h-3 mr-2"/> Time</span>
                            <span className="font-mono text-teal-400">{simTime.toFixed(3)} s</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm flex items-center"><Thermometer className="w-3 h-3 mr-2"/> Max T</span>
                            <span className="font-mono text-red-400">{stats.maxTemp.toFixed(1)} K</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Min T</span>
                            <span className="font-mono text-blue-400">{stats.minTemp.toFixed(1)} K</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Avg T</span>
                            <span className="font-mono text-yellow-400">{stats.avgTemp.toFixed(1)} K</span>
                        </div>
                         <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                            <span className="text-slate-500 text-xs">FPS</span>
                            <span className="font-mono text-slate-500 text-xs">{fps}</span>
                        </div>
                     </div>
                 </div>
                 
                 <div className="h-48">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-400"/>
                        System Energy Change (ΔE)
                    </h3>
                    <div className="w-full h-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    tickFormatter={formatEnergy} 
                                    tick={{fontSize: 10, fill: '#94a3b8'}}
                                    width={40}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }}
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
                 </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 relative">
                <div className="relative aspect-square w-full max-w-[80vh] shadow-2xl rounded-lg">
                    {/* Use Dynamic Live Stats */}
                    <HeatMapCanvas 
                        data={engine.T} 
                        width={config.Nx} 
                        height={config.Ny} 
                        minTemp={displayMinTemp} 
                        maxTemp={displayMaxTemp} 
                        heatSource={config.heatSource}
                        Lx={config.Lx}
                        Ly={config.Ly}
                        inclusions={config.inclusions}
                        baseMaterial={config.baseMaterial}
                    />
                    
                    {/* Overlay Info */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs text-slate-300 border border-white/10 pointer-events-none z-10">
                        Grid: {config.Nx}x{config.Ny}
                    </div>
                </div>

                <div className="mt-6 flex space-x-8">
                     <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono text-blue-400">{displayMinTemp.toFixed(1)} K</span>
                        {/* Inferno Legend Gradient (Updated with 11 steps for accuracy) */}
                        <div 
                            className="w-32 h-4 rounded-full border border-slate-700" 
                            style={{ background: 'linear-gradient(to right, rgb(0,0,4), rgb(27,12,65), rgb(65,15,117), rgb(107,25,111), rgb(147,38,103), rgb(186,54,85), rgb(221,81,58), rgb(243,110,27), rgb(252,165,10), rgb(244,217,34), rgb(252,255,164))' }}
                        ></div>
                        <span className="text-xs font-mono text-red-400">{displayMaxTemp.toFixed(1)} K</span>
                     </div>
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
}
