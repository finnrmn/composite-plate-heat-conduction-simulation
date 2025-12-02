import { Material, SimulationConfig } from './types';

// Table 2.1 from PDF
export const MATERIALS: Record<string, Material> = {
  Diamond: { name: 'Diamond', k: 1000, cp: 506, rho: 3500, color: '#b9f2ff', symbol: 'C' },
  Silver: { name: 'Silver', k: 426.77, cp: 236, rho: 10500, color: '#c0c0c0', symbol: 'Ag' },
  Copper: { name: 'Copper', k: 397.48, cp: 385, rho: 8940, color: '#b87333', symbol: 'Cu' },
  Gold: { name: 'Gold', k: 317.98, cp: 128, rho: 19300, color: '#ffd700', symbol: 'Au' },
  Aluminium: { name: 'Aluminium', k: 225.94, cp: 921, rho: 2698, color: '#848789', symbol: 'Al' },
  Bronze: { name: 'Bronze', k: 54.392, cp: 377, rho: 8750, color: '#cd7f32', symbol: 'Brz' },
  Basalt: { name: 'Basalt', k: 2.55, cp: 800, rho: 2850, color: '#4a4a4a', symbol: 'Bst' }, // Avg values
  Water: { name: 'Water', k: 0.6, cp: 4181, rho: 997.05, color: '#3498db', symbol: 'H₂O' },
  Fiberglass: { name: 'Fiberglass', k: 0.176, cp: 1130, rho: 1230, color: '#e67e22', symbol: 'FG' },
  Air: { name: 'Air', k: 0.0025, cp: 1004, rho: 1.29, color: '#ecf0f1', symbol: 'Air' },
};

export const DEFAULT_CONFIG: SimulationConfig = {
  Lx: 0.1, // 10cm
  Ly: 0.1, // 10cm
  Nx: 100,
  Ny: 100,
  baseMaterial: 'Basalt',
  inclusions: [
    {
      id: 'default-inc-1',
      x: 0.04,
      y: 0.04,
      width: 0.02,
      height: 0.02,
      materialName: 'Aluminium'
    }
  ],
  heatSource: {
    x: 0.02,
    y: 0.05,
    size: 0.005, // 5mm
    power: 5e7, // High volumetric heat to see effect quickly
    duration: 10.0,
    active: true,
  },
  ambientTemp: 293, // 20°C
  convectionCoeff: 50, // Typical natural convection
  timeStepMultiplier: 10, // Speed up sim
  simulationDuration: 60,
  boundaryCondition: 'Robin',
};