import type { Material, SimulationConfig } from "./types";

/**
 * Material libarary with thermal properties
 * Data sources: matmake.com, thermtest.com, wikipedia.com
 * 
 * @see Material for detailed properties describtion
 */
export const MATERIALS: Record<string, Material> = {
    // Metals (high conductivity)
    Diamond: {
        name: "Diamond",
        k: 1000,
        cp: 506,
        rho: 3500,
        color: "#b9f2ff",
        symbol: "C"
    },
    Silver: {
        name: "Silver",
        k: 426.77,
        cp: 236,
        rho: 10500,
        color: "#c0c0c0",
        symbol: "Ag",
    },
    Copper: {
        name: 'Copper',
        k: 397.48,
        cp: 385,
        rho: 8940,
        color: '#b87333',
        symbol: 'Cu'
    },
    Gold: {
        name: 'Gold',
        k: 317.98,
        cp: 128,
        rho: 19300,
        color: '#ffd700',
        symbol: 'Au'
    },
    Aluminium: {
        name: 'Aluminium',
        k: 225.94,
        cp: 921,
        rho: 2698,
        color: '#848789',
        symbol: 'Al'
    },
    Bronze: {
        name: 'Bronze',
        k: 54.392,
        cp: 377,
        rho: 8750,
        color: '#cd7f32',
        symbol: 'Brz'
    },
    // Non-metals (lower conductivity)
    Basalt: {
        name: 'Basalt',
        k: 2.55,
        cp: 800,
        rho: 2850,
        color: '#4a4a4a',
        symbol: 'Bst'
    },
    Water: {
        name: 'Water',
        k: 0.6,
        cp: 4181,
        rho: 997.05,
        color: '#3498db',
        symbol: 'H₂O'
    },
    Fiberglass: {
        name: 'Fiberglass',
        k: 0.176,
        cp: 1130,
        rho: 1230,
        color: '#e67e22',
        symbol: 'FG'
    },
    Air: {
        name: 'Air',
        k: 0.0025,
        cp: 1004,
        rho: 1.29,
        color: '#ecf0f1',
        symbol: 'Air'
    },
};

/**
 * Default simulation configuration
 * Basic setup: Plate (base) = Basalt (Bst) with inlcusion = Aluminium (Al)
 */
export const DEFAULT_CONFIG: SimulationConfig = {
    // Plate geometry - 10cm×10cm
    Lx: 0.1,   
    Ly: 0.1,   
    // Grid resulution - 100×100 = 10000 points
    Nx: 100,
    Ny: 100,
    // Materials 
    baseMaterial: "Basalt",
    inclusions: [
        {
            id: "default-inc-1",
            x: 0.04,      // 4cm from left               
            y: 0.04,      // 4cm from bottom
            width: 0.02,  // 2cm×2cm square
            height: 0.02,
            materialName: "Aluminium"
        }
    ],
    // Heat source (hotspot)
    heatSource: {
        x: 0.02,          // 2cm from left
        y: 0.05,          // 5cm from bottom
        size: 0.005,      // 5mm×5mm sqare
        power: 5e7,       // 50 MW/m³ (high power)
        duration: 10.0,   // 10s
        active: true,
    },
    // Boundary conditions
    ambientTemp: 293,     // 20°C = 293.15K
    convectionCoeff: 50,  // 50 W/m²·K (models heat lost to surrounding air)
    boundaryCondition: "robin",   
    // Simulation control
    timeStepMultiplier: 2.0, // 2× speed (for visualization)
    simulationDuration: 60,  // Run for 60 virtual seconds
};
