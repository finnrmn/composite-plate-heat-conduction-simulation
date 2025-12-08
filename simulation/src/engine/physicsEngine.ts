import type { SimulationConfig, SimulationStats } from "@/utils/types";
import { MATERIALS } from "@/utils/constants";


/**
 * Main class of physical calculation for the simulation.
 * 
 * Performs the following calculations:
 *  - Heat Update                   (docs/simulation_documentation.pdf | section 4.3 | formula 4.17)
 *  - Dirichlet Boundary Condition  (docs/simulation_documentation.pdf | section 4.3 | formula 4.18)
 *  - Robin Boundary Condition      (docs/simulation_documentation.pdf | section 4.3 | formula 4.24-27)
 *  - CLF Stability Condition       (docs/simulation_documentation.pdf | section 4.4 | formula 4.29)
 *  - Total Energy of Plate         (docs/simulation_documentation.pdf | section 4.5 | formula 4.30,31)
 * 
 * Uses:
 *  - Grid Arrays (Float32Array) for better performance 
 *  - Row-major order: j * Nx + i (j=row, i=column)
 */
export class PhysicsEngine {
    // ===== Grid Arrays =====
    /** Current timestep temperature filed [K] */
    public T: Float32Array;
    /** Next timestep temperature field [K] */
    public T_new: Float32Array;
    /** Thermal conductivity field - k [J/(m·K)] */
    public k: Float32Array;
    /** Volumetric heat capacity - ρ·cp [J/m³·K] */
    public rho_cp: Float32Array;
    /** Heat source map - q̇ [W/m³] */
    public q_source: Float32Array;

    // ===== Grid Parameters ===== 
    /** Grid points in X-direction */
    public Nx: number;
    /** Grid points in Y-direction */
    public Ny: number;
    /** Grid spacing in X-direction [m] */
    public dx: number;
    /** gird spacing in Y-direction [m] */
    public dy: number;

    // ===== Simulation Time =====
    /** Timestep [s] - calculated by CFL condition */
    public dt: number;
    /** Current simulation time [s] */
    public time: number;
    /** Flag inidactes if simulation is unstable */
    public isUnstable: boolean;

    // ==== Simulation Stats ====
    /** Step counts */
    public steps: number;
    /** Total energy at current time step [J] */
    public E: number;
    /** Initial energy E⁰ for ΔE plots [J] */
    private E0: number;

    // ===== Configuration =====
    private config: SimulationConfig;

    constructor(config: SimulationConfig) {
        this.config = config;
        this.Nx = config.Nx;
        this.Ny = config.Ny;
        this.steps = 0;
        this.time = 0;
        this.E = 0;
        this.isUnstable = false;
        // Calculate grid spacing
        this.dx = config.Lx / (this.Nx - 1);
        this.dy = config.Ly / (this.Ny - 1);
        // Allocate arrays with total grid size
        const size = this.Nx * this.Ny;
        // Init temperature to ambient temp
        this.T = new Float32Array(size).fill(config.ambientTemp);
        this.T_new = new Float32Array(size).fill(config.ambientTemp);
        // Allocate material properties
        this.k = new Float32Array(size);
        this.rho_cp = new Float32Array(size);
        // Allocate heat source
        this.q_source = new Float32Array(size).fill(0);
        // Init material property grids
        this.initMaterials();
        // Init heat source region
        this.initHeatSource();
        // Calc init energy 
        this.E = this.calcEnergy();
        this.E0 = this.E;
        // Calculate cfl timestep size
        this.dt = this.calcStableTimeStep();
    }

    /**
     * Convert 2D grid coordinates to 1D array index
     * Row-major order: idx = j * Nx + i
     *
     * @param i - X index (column, 0 to Nx-1)
     * @param j - Y index (row, 0 to Ny-1)
    */
    private getIndex(i: number, j: number) {
        return j * this.Nx + i;
    }

    private initMaterials() {
        // Step 1: Fill entire domain with base material
        const baseMat = MATERIALS[this.config.baseMaterial];
        for (let i = 0; i < this.T.length; i++) {
            this.k[i] = baseMat.k;
            this.rho_cp[i] = baseMat.rho * baseMat.cp;
        }
        // Step 2: Overlay inclusions (if overlapping -> last one wins)
        this.config.inclusions.forEach(inc => {
            const mat = MATERIALS[inc.materialName];
            if (!mat) return;
            // Convert physical coords to grid indicies
            // Exmple: x = 0.04m, width = 0.02, dx = 0.001m -> i = 40 to 60 
            const i_start = Math.floor(inc.x / this.dx);
            const i_end = Math.floor((inc.x + inc.width) / this.dx);
            const j_start = Math.floor(inc.y / this.dy);
            const j_end = Math.floor((inc.y + inc.height) / this.dy);
            // Fill rect region
            for (let j = j_start; j <= j_end; j++) {
                for (let i = i_start; i <= i_end; i++) {
                    // Bound check
                    if (i >= 0 && i < this.Nx && j >= 0 && j < this.Ny) {
                        const idx = this.getIndex(i, j);
                        this.k[idx] = mat.k;
                        this.rho_cp[idx] = mat.rho * mat.cp;
                    }
                }
            }
        });
    }

    private initHeatSource() {
        const hs = this.config.heatSource;
        if (!hs.active) return; // heat source currently not active
        // Calculate heat source square (centered at hs.x, hs.y)
        const halfSize = hs.size / 2;
        const x_start = hs.x - halfSize;
        const x_end = hs.x + halfSize;
        const y_start = hs.y - halfSize;
        const y_end = hs.y + halfSize;
        // Convert physical coords to grid indicies
        const i_start = Math.max(0, Math.floor(x_start / this.dx));
        const i_end = Math.min(this.Nx - 1, Math.ceil(x_end / this.dx));
        const j_start = Math.max(0, Math.floor(y_start / this.dy));
        const j_end = Math.min(this.Ny - 1, Math.ceil(y_end / this.dy));
        // Set heat generation rate in all cells within the heat source region
        for (let j = j_start; j <= j_end; j++) {
            for (let i = i_start; i <= i_end; i++) {
                const idx = this.getIndex(i, j);
                this.q_source[idx] = hs.power;
            }
        }
    }

    /**
     * Calculate stable timestep using CFL condition
     * Heat must not "jump" more than one grid cell per timestep
     * 
     * Based on Neumann stability (simple 2D terms)
     * 
     * Formula: 
     *  - dt ≤ 0.5 / (α_max * (1/dx² + 1/dy²)), α_max = maxᵢⱼ αᵢⱼ, αᵢⱼ = kᵢⱼ / ρᵢⱼ · cpᵢⱼ 
     *  - Safty factor: 0.9
     * 
     * Example:
     *  - Material: Aluminium (α ≈ 9.1 × 10⁻⁵ m²/s)
     *  - Grid: dx = dy = 0.001m (1mm)
     *  - Result: dt ≈ 0.0025s (2.5 ms)
     */
    private calcStableTimeStep(): number {
        // (1) αᵢⱼ = kᵢⱼ / ρᵢⱼ · cpᵢⱼ (2) α_max = maxᵢⱼ αᵢⱼ
        let alphaMax = 0;
        for (let i = 0; i < this.k.length; i++) {
            const alpha = this.k[i] / this.rho_cp[i]
            if (alpha > alphaMax) alphaMax = alpha;
        }
        // (3) 0.5 / (α_max * (1/dx² + 1/dy²))  
        const inverseDx2 = 1 / (this.dx * this.dx);
        const inverseDy2 = 1 / (this.dy * this.dy);
        const dt = 0.9 * 0.5 / (alphaMax * (inverseDx2 + inverseDy2));
        // Safty check
        if (dt <= 0 || !isFinite(dt)) {
            console.warn("Invalid timestep calculated, using fallback");
            return 1e-5; // 10μs 
        }
        return dt;
    }
    /**
     * Main Function: Calculates one step of the FTCS
     * 
     * Formula:
     *  -  Tⁿ⁺¹ᵢⱼ = Tⁿᵢⱼ + (Δt / (ρᵢⱼ · cₚᵢⱼ)) · ( [∇·(k ∇T)]ⁿᵢⱼ + q̇ⁿᵢⱼ )
     * 
     * Includes:
     *  - dirichlet bondary calculation
     *  - robin boundary calculation
     * 
     * @ref docs/simulation_documentation.pdf | chaper 4 
     */
    public step() {
        if (this.isUnstable) return;

        const Nx = this.Nx;
        const Ny = this.Ny;
        const dx2 = this.dx * this.dx;
        const dy2 = this.dy * this.dy;
        const dt = this.dt;

        // check if heat source is should be active 
        const isHeatActive = this.time < this.config.heatSource.duration;

        // ===== INNER POINTS (FTCS Upate) =====
        // Loop over all interior points 
        for (let j = 1; j < Ny - 1; j++) {
            for (let i = 1; i < Nx - 1; i++) {
                const idx = j * Nx + i;

                // Get neighbor indicies
                const i_next = idx + 1;
                const i_prev = idx - 1;
                const j_next = idx + Nx;
                const j_prev = idx - Nx;

                // ===== Calculate ∇·(k ∇T) =====
                // ref: Equation 4.9, 4.10
                const ki_next = 0.5 * (this.k[i_next] + this.k[idx]);
                const ki_prev = 0.5 * (this.k[i_prev] + this.k[idx]);
                const kj_next = 0.5 * (this.k[j_next] + this.k[idx]);
                const kj_prev = 0.5 * (this.k[j_prev] + this.k[idx]);
                // ref: Equation 4.11
                const diff_x = (
                    ki_next * (this.T[i_next] - this.T[idx]) -
                    ki_prev * (this.T[idx] - this.T[i_prev])
                ) / dx2;
                const diff_y = (kj_next * (this.T[j_next] - this.T[idx]) -
                    kj_prev * (this.T[idx] - this.T[j_prev])
                ) / dy2;
                const diff = diff_x + diff_y;

                const q_vol = isHeatActive ? this.q_source[idx] : 0;
                // ===== Update Formula =====
                // ref: Equation 4.17
                const deltaT = (dt / this.rho_cp[idx]) * (diff + q_vol);
                this.T_new[idx] = this.T[idx] + deltaT;
            }
        }

        // ===== Boundary Conditions =====
        const T_amb = this.config.ambientTemp;

        if (this.config.boundaryCondition === "dirichlet") {
            // ref: Equation 4.18 (fixed temp at all boundaries)
            // Left (i=0) & Right (i=Nx-1) edges
            for (let j = 0; j < Ny; j++) {
                this.T_new[j * Nx] = T_amb;              // Left edge
                this.T_new[j * Nx + (Nx - 1)] = T_amb;   // Right edge
            }

            // Bottom (j=0) & Top (j=Ny-1) edges
            for (let i = 0; i < Nx; i++) {
                this.T_new[i] = T_amb;                   // Bottom edge
                this.T_new[(Ny - 1) * Nx + i] = T_amb;   // Top edge
            }
        } else {
            // Robin boundary condition
            // ref: Equations 4.24-4.27
            const h = this.config.convectionCoeff;
            const h_dx = h * this.dx;
            const h_dy = h * this.dy;

            // Right edge (i=Nx) Eqaution 4.24
            for (let j = 0; j < Ny; j++) {
                const idx = j * Nx + (Nx - 1);
                const idx_inner = j * Nx + (Nx - 2);
                const k = this.k[idx];
                this.T_new[idx] = (k / (k + h_dx)) * this.T[idx_inner] + (h_dx / (k + h_dx)) * T_amb;
            }
            // Left edge (i=0) Equation 4.25
            for (let j = 0; j < Ny; j++) {
                const idx = j * Nx + 0;
                const idx_inner = j * Nx + 1;
                const k = this.k[idx];
                this.T_new[idx] = (k / (k + h_dx)) * this.T[idx_inner] + (h_dx / (k + h_dx)) * T_amb;
            }
            // Bottom edge (j=0) Equation 4.26
            for (let i = 0; i < Nx; i++) {
                const idx = 0 * Nx + i;
                const idx_inner = 1 * Nx + i;
                const k = this.k[idx];
                this.T_new[idx] = (k / (k + h_dy)) * this.T[idx_inner] + (h_dy / (k + h_dy)) * T_amb;
            }
            // Top edge (j=Ny) Equation 4.27
            for (let i = 0; i < Nx; i++) {
                const idx = (Ny - 1) * Nx + i;
                const idx_inner = (Ny - 2) * Nx + i;
                const k = this.k[idx];
                this.T_new[idx] = (k / (k + h_dy)) * this.T[idx_inner] + (h_dy / (k + h_dy)) * T_amb;
            }
        }
        // ===== BUFFER SWAP =====
        const temp = this.T;
        this.T = this.T_new;
        this.T_new = temp;
        // Advance simulation time & counter
        this.time += dt;
        this.steps += 1;

        // ===== STABILITY CHECK =====
        const centerIdx = Math.floor(this.T.length / 2);
        if (isNaN(this.T[centerIdx]) || !isFinite(this.T[0])) {
            this.isUnstable = true;
            console.error("Simulation became unstable!");
        }
    }
    /**
     * Calculation of Energy E [J]
     * 
     * Used in getStats() for ΔE plot
     * 
     * Formula:
     *  - Eⁿ ≈ Σᵢ₌₀ⁿˣ Σⱼ₌₀ⁿʸ ρᵢⱼ · cₚᵢⱼ · Tⁿᵢⱼ · ΔV
     *  - ΔV = eΔxΔy
     *  - ΔEⁿ = Eⁿ - E⁰
     * 
     * @ref docs/simulation_documentation.pdf | section 4.5 
     */
    private calcEnergy(): number {
        // ΔV Equation 4.30
        const dV = this.dx * this.dy * 1.0;
        // Eⁿ Equation 4.31
        const T = this.T;
        const rho_cp = this.rho_cp;
        let E = 0;

        for (let idx = 0; idx < T.length; idx++) {
            E += rho_cp[idx] * T[idx] * dV;
        }
        return E;
    }

    public getStats(): SimulationStats {
        const T = this.T;

        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let sumTemp = 0;

        for (let i = 0; i < T.length; i++) {
            const val = T[i];
            if (val < minTemp) minTemp = val;
            if (val > maxTemp) maxTemp = val;
            sumTemp += val;
        }

        const avgTemp = sumTemp / T.length;

        const totalEnergy = this.calcEnergy();
        this.E = totalEnergy;

        const deltaEnergy = totalEnergy - this.E0;

        return {
            time: this.time,
            maxTemp,
            minTemp,
            avgTemp,
            totalEnergy,
            deltaEnergy,
            calcStepCount: this.steps,
        };
    }
}