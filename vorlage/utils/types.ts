export interface Material {
  name: string;
  k: number;   // Thermal conductivity [W/(m*K)]
  cp: number;  // Specific heat capacity [J/(kg*K)]
  rho: number; // Density [kg/m^3]
  color: string;
  symbol: string;
}

export interface Region {
  id: string;
  x: number; // meters
  y: number; // meters
  width: number; // meters
  height: number; // meters
  materialName: string;
}

export interface HeatSource {
  x: number; // meters
  y: number; // meters
  size: number; // meters (side length of square)
  power: number; // Watts per m^3 (Volumetric generation rate q_dot)
  duration: number; // seconds
  active: boolean;
}

export interface SimulationConfig {
  Lx: number; // Domain width (m)
  Ly: number; // Domain height (m)
  Nx: number; // Grid points X
  Ny: number; // Grid points Y
  baseMaterial: string;
  inclusions: Region[];
  heatSource: HeatSource;
  ambientTemp: number; // Kelvin
  convectionCoeff: number; // h [W/(m^2*K)]
  timeStepMultiplier: number; // For visualization speed
  simulationDuration: number; // Virtual seconds to run
  boundaryCondition: 'Dirichlet' | 'Robin';
}

export interface SimulationStats {
  time: number;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  centerTemp: number;
  totalEnergy: number; // Joules
}