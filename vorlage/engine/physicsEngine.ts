import { SimulationConfig } from '../utils/types';
import { MATERIALS } from '../utils/constants';

export class PhysicsEngine {
    // Grid Arrays (Row-major order: index = y * Nx + x)
    // We use Float32Array for performance
    public T: Float32Array;      // Temperature field (Current)
    public T_new: Float32Array;  // Temperature field (Next step)
    public k: Float32Array;      // Conductivity field
    public rho_cp: Float32Array; // Volumetric heat capacity (rho * cp)
    public q_source: Float32Array; // Heat source map

    public Nx: number;
    public Ny: number;
    public dx: number;
    public dy: number;
    public dt: number;
    public time: number;
    public isUnstable: boolean;

    private config: SimulationConfig;

    constructor(config: SimulationConfig) {
        this.config = config;
        this.Nx = config.Nx;
        this.Ny = config.Ny;
        this.dx = config.Lx / (this.Nx - 1);
        this.dy = config.Ly / (this.Ny - 1);
        this.time = 0;
        this.isUnstable = false;

        const size = this.Nx * this.Ny;
        this.T = new Float32Array(size).fill(config.ambientTemp);
        this.T_new = new Float32Array(size).fill(config.ambientTemp);
        this.k = new Float32Array(size);
        this.rho_cp = new Float32Array(size);
        this.q_source = new Float32Array(size).fill(0);

        this.initializeMaterials();
        this.initializeHeatSource();
        this.dt = this.calculateStableTimeStep();
    }

    private getIndex(x: number, y: number): number {
        return y * this.Nx + x;
    }

    private initializeMaterials() {
        // Fill base material
        const baseMat = MATERIALS[this.config.baseMaterial];
        for (let i = 0; i < this.T.length; i++) {
            this.k[i] = baseMat.k;
            this.rho_cp[i] = baseMat.rho * baseMat.cp;
        }

        // Fill inclusions (Last one on top)
        this.config.inclusions.forEach(inc => {
            const mat = MATERIALS[inc.materialName];
            if (!mat) return;

            // Convert physical coordinates to grid indices
            const i_start = Math.floor(inc.x / this.dx);
            const i_end = Math.floor((inc.x + inc.width) / this.dx);
            const j_start = Math.floor(inc.y / this.dy);
            const j_end = Math.floor((inc.y + inc.height) / this.dy);

            for (let j = j_start; j <= j_end; j++) {
                for (let i = i_start; i <= i_end; i++) {
                    if (i >= 0 && i < this.Nx && j >= 0 && j < this.Ny) {
                        const idx = this.getIndex(i, j);
                        this.k[idx] = mat.k;
                        this.rho_cp[idx] = mat.rho * mat.cp;
                    }
                }
            }
        });
    }

    private initializeHeatSource() {
        const hs = this.config.heatSource;
        if (!hs.active) return;

        const halfSize = hs.size / 2;
        const x_start = hs.x - halfSize;
        const x_end = hs.x + halfSize;
        const y_start = hs.y - halfSize;
        const y_end = hs.y + halfSize;

        const i_start = Math.max(0, Math.floor(x_start / this.dx));
        const i_end = Math.min(this.Nx - 1, Math.ceil(x_end / this.dx));
        const j_start = Math.max(0, Math.floor(y_start / this.dy));
        const j_end = Math.min(this.Ny - 1, Math.ceil(y_end / this.dy));

        for (let j = j_start; j <= j_end; j++) {
            for (let i = i_start; i <= i_end; i++) {
                const idx = this.getIndex(i, j);
                this.q_source[idx] = hs.power;
            }
        }
    }

    // Calculate CFL condition for stability
    private calculateStableTimeStep(): number {
        let alphaMax = 0;
        for (let i = 0; i < this.k.length; i++) {
            const alpha = this.k[i] / this.rho_cp[i];
            if (alpha > alphaMax) alphaMax = alpha;
        }

        const inverseDx2 = 1 / (this.dx * this.dx);
        const inverseDy2 = 1 / (this.dy * this.dy);

        // Stability condition: dt <= 1 / (2 * alpha * (1/dx^2 + 1/dy^2))
        // We take a safety factor of 0.9
        const dt = 0.9 * 0.5 / (alphaMax * (inverseDx2 + inverseDy2));

        if (dt <= 0 || !isFinite(dt)) return 1e-5; // Fallback
        return dt;
    }

    public step() {
        if (this.isUnstable) return;

        const Nx = this.Nx;
        const Ny = this.Ny;
        const dx2 = this.dx * this.dx;
        const dy2 = this.dy * this.dy;
        const dt = this.dt;

        // Check heat source duration
        const isHeatActive = this.time < this.config.heatSource.duration;

        // Inner points calculation (Equation 4.17 with 4.11)
        for (let j = 1; j < Ny - 1; j++) {
            for (let i = 1; i < Nx - 1; i++) {
                const idx = j * Nx + i;

                // Neighbors
                const idx_left = idx - 1;
                const idx_right = idx + 1;
                const idx_down = idx - Nx;
                const idx_up = idx + Nx;

                // Harmonic or Arithmetic mean for k at interfaces? 
                // PDF Eq 4.9 uses Arithmetic mean.
                const k_right = 0.5 * (this.k[idx] + this.k[idx_right]);
                const k_left = 0.5 * (this.k[idx] + this.k[idx_left]);
                const k_up = 0.5 * (this.k[idx] + this.k[idx_up]);
                const k_down = 0.5 * (this.k[idx] + this.k[idx_down]);

                // Divergence terms
                const diff_x = (k_right * (this.T[idx_right] - this.T[idx]) - k_left * (this.T[idx] - this.T[idx_left])) / dx2;
                const diff_y = (k_up * (this.T[idx_up] - this.T[idx]) - k_down * (this.T[idx] - this.T[idx_down])) / dy2;

                const q_vol = isHeatActive ? this.q_source[idx] : 0;

                // Update
                const deltaT = (dt / this.rho_cp[idx]) * (diff_x + diff_y + q_vol);
                this.T_new[idx] = this.T[idx] + deltaT;
            }
        }

        // Apply Boundary Conditions
        const T_inf = this.config.ambientTemp;

        if (this.config.boundaryCondition === 'Dirichlet') {
            // Dirichlet: Fixed temperature at boundaries
            // Left (i=0) & Right (i=Nx-1)
            for (let j = 0; j < Ny; j++) {
                this.T_new[j * Nx] = T_inf;
                this.T_new[j * Nx + (Nx - 1)] = T_inf;
            }
            // Bottom (j=0) & Top (j=Ny-1)
            for (let i = 0; i < Nx; i++) {
                this.T_new[i] = T_inf;
                this.T_new[(Ny - 1) * Nx + i] = T_inf;
            }
        } else {
            // Robin: Convection
            const h = this.config.convectionCoeff;
            const h_dx = h * this.dx;
            const h_dy = h * this.dy;

            // We only update boundaries AFTER the inner loop
            // Left (i=0)
            for (let j = 0; j < Ny; j++) {
                const idx = j * Nx + 0;
                const idx_inner = j * Nx + 1;
                const k = this.k[idx];
                // Eq 4.25
                this.T_new[idx] = (k * this.T[idx_inner] + h_dx * T_inf) / (k + h_dx);
            }
            // Right (i=Nx-1)
            for (let j = 0; j < Ny; j++) {
                const idx = j * Nx + (Nx - 1);
                const idx_inner = j * Nx + (Nx - 2);
                const k = this.k[idx];
                // Eq 4.24
                this.T_new[idx] = (k * this.T[idx_inner] + h_dx * T_inf) / (k + h_dx);
            }
            // Bottom (j=0)
            for (let i = 0; i < Nx; i++) {
                const idx = 0 * Nx + i;
                const idx_inner = 1 * Nx + i;
                const k = this.k[idx];
                // Eq 4.26
                this.T_new[idx] = (k * this.T[idx_inner] + h_dy * T_inf) / (k + h_dy);
            }
            // Top (j=Ny-1)
            for (let i = 0; i < Nx; i++) {
                const idx = (Ny - 1) * Nx + i;
                const idx_inner = (Ny - 2) * Nx + i;
                const k = this.k[idx];
                // Eq 4.27
                this.T_new[idx] = (k * this.T[idx_inner] + h_dy * T_inf) / (k + h_dy);
            }
        }

        // Swap buffers
        const temp = this.T;
        this.T = this.T_new;
        this.T_new = temp;

        this.time += dt;

        // Basic stability check
        if (isNaN(this.T[Math.floor(this.T.length / 2)]) || !isFinite(this.T[0])) {
            this.isUnstable = true;
        }
    }

    public getStats() {
        let max = -Infinity;
        let min = Infinity;
        let sum = 0;
        let totalEnergy = 0;

        const cellVolume = this.dx * this.dy * 1.0; // Assuming 1m thickness as standard 2D approx

        for (let i = 0; i < this.T.length; i++) {
            const val = this.T[i];
            if (val > max) max = val;
            if (val < min) min = val;
            sum += val;

            // Energy = (rho * cp) * T * Volume
            // rho_cp[i] stores (rho * cp)
            totalEnergy += this.rho_cp[i] * val * cellVolume;
        }

        const centerIdx = Math.floor(this.Ny / 2) * this.Nx + Math.floor(this.Nx / 2);

        return {
            time: this.time,
            maxTemp: max,
            minTemp: min,
            avgTemp: sum / this.T.length,
            centerTemp: this.T[centerIdx],
            totalEnergy: totalEnergy
        };
    }
}