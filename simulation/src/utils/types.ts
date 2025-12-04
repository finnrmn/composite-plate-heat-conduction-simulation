// Type definitions for the heat conduction simulation

/**
 * Represents a material with thermal properties
 */
export interface Material {
    /** Name (e.g. "Copper", "Aluminium") */
    name: string;
    /** Thermal conductivity [W/m·K] - how well heat goes throw material */
    k: number;
    /** Specific heat capacity [J/kg·K] - how much energy needed to heat 1kg by 1K */
    cp: number;
    /** Denity [kg/m³] - mass per unit volume */
    rho: number;
    /** Display color for visulization */
    color: string;
    /** Display symbol for visulization (e.g. "Cu" for Copper, "Al" for Aluminium) */
    symbol: string;
}

/**
 * Represents a rectangular region (inclusion) in side the simulation plate
 * with a specific material composition
 */
export interface Region {
    /** Unique identifier */
    id: string;
    /** X-coorinate of bottom-left corner [m] */
    x: number;
    /** Y-coorinate of bottom-left corner [m] */
    y: number;
    /** Width of Region [m] */
    width: number;
    /** Height of Region [m] */
    height: number;
    /** Name of the material */
    materialName: string;
}

/**
 * Represents the local heat source (hotspot)
 */
export interface HeatSource {
    /** X-coordinate of center [m] */
    x: number;
    /** Y-coordinate of center [m] */
    y: number;
    /** Size of the square heat source [m] */
    size: number;
    /** Volumetric power density (q̇) [W/m³] */
    power: number;
    /** Time active [s] */
    duration: number;
    /** True if heat source currently active */
    active: boolean;
}

/**
 * Type of boundary condition applied at edges
 * - dirichlet: Fixed temerature at boundaries (simple)
 * - robin: Convective heat transfer with environment (complex) 
 */
export type BondaryCondition = "dirichlet" | "robin"; 

/**
 * Defines the complet configuration needed for a simulation run
 * Contains plate size, grid resolution, materials, and physical parameters
 */
export interface SimulationConfig {
    /** Plate width [m] */
    Lx: number;
    /** Plate height [m] */
    Ly: number;
    /** Number of grid points in X direction */
    Nx: number;
    /** Number of grid points in Y direction */
    Ny: number;
    /** Name of base material (fills the entire plate) */
    baseMaterial: string;
    /** Array of material inclusions */
    inclusions: Region[];
    /** Heat source configuration */
    heatSource: HeatSource;
    /** Ambient/inital temperature [K] */
    ambientTemp: number;
    /** Convection coefficient (h) [W/m²·K] - for robin boundary condition */
    convectionCoeff: number;
    /** Speed multiplier for visulization */
    timeStepMultiplier: number;
    /** How long to run the sim [s] */
    simulationDuration: number;
    /** Type of boundary condition */
    boundaryCondition: BondaryCondition;
}

/**
 * Statistics of live simulation
 * for real-time monitoring
 */
export interface SimulationStats {
    /** Current simulation time [s] */
    time: number;
    /** Maximum temperature at plate [K] */
    maxTemp: number;
    /** Minimum temperature at plate [K] */
    minTemp: number;
    /** Average temperature across all gird points [K] */
    avgTemp: number;
    /** Total thermal energy [J] */
    totalEnergy: number;
    /** Difference thermal energy ΔE [J] */
    deltaEnergy: number;
    /** Count of calculated steps */
    calcStepCount: number;
}

/**
 * 2D position [m]
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * 2D size [m]
 */
export interface Size {
    width: number;
    height: number;
}
