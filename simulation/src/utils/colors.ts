/**
 * Inferno - Scientific standard colormap.
 * 
 * Dark (cold) ⭢ Purple ⭢ Red ⭢ Orange ⭢ Yellow ⭢ Bright (hot)
 * 
 * Based on: Matplotlib plot_color_gradients()
 */
const INFERNO_STOPS = [
    { t: 0.000, r: 0,   g: 0,   b: 4 },    // Dark blue-black
    { t: 0.100, r: 27,  g: 12,  b: 65 },   // Deep blue
    { t: 0.200, r: 65,  g: 15,  b: 117 },  // Purple
    { t: 0.300, r: 107, g: 25,  b: 111 },  // Magenta
    { t: 0.400, r: 147, g: 38,  b: 103 },  // Red-purple
    { t: 0.500, r: 186, g: 54,  b: 85 },   // Red
    { t: 0.600, r: 221, g: 81,  b: 58 },   // Orange-red
    { t: 0.700, r: 243, g: 110, b: 27 },   // Orange
    { t: 0.800, r: 252, g: 165, b: 10 },   // Yellow-orange
    { t: 0.900, r: 244, g: 217, b: 34 },   // Yellow
    { t: 1.000, r: 252, g: 255, b: 164 },  // Bright yellow-white
];

/**
 * Pre-computed lookup table (LUT) for faster color mapping: 
 * 256 colors × 3 channels (RGB) = 768 bytes
 */
const LUT_SIZE = 256;
export const COLOR_LUT = new Uint8Array(LUT_SIZE * 3);
/**
 * LUT init: interpolating between control points
 */
function initLUT(){
    for (let i = 0; i < LUT_SIZE; i++){
        // Normalize index to 0..1
        const t = i / (LUT_SIZE -1);
        // find the segment t falls to 
        let start = INFERNO_STOPS[0];
        let end = INFERNO_STOPS[INFERNO_STOPS.length - 1];

        for (let j = 0; j < INFERNO_STOPS.length - 1; j++){
            if (t >= INFERNO_STOPS[j].t && t <= INFERNO_STOPS[j+1].t){
                start = INFERNO_STOPS[j];
                end = INFERNO_STOPS[j+1];
                break;
            }
        }
        // Linear interpolation between start and end
        const range = end.t - start.t;
        const localT = (t - start.t) / range;

        const r = Math.floor(start.r + localT * (end.r - start.r));
        const g = Math.floor(start.g + localT * (end.g - start.g));
        const b = Math.floor(start.b + localT * (end.b - start.b));
        // Store in LUT (3 values per color: R, G, B)
        const idx = i * 3;
        COLOR_LUT[idx]   = r;
        COLOR_LUT[idx+1] = g;
        COLOR_LUT[idx+2] = b;
    }
}
// Initialize LUT imediately when module loads 
initLUT()

/**
 * Draw the temperature field to the canvas using the Inferno colormap
 * @param ctx - Canvas for 2D context
 * @param data - Temperature field (row-major order)
 * @param width - Gird width (Nx)
 * @param height - Grid height (Ny)
 * @param minTemp - Minimum temperature for color scaling
 * @param maxTemp - Maximum temperature for color scaling
 */
export function drawHeatMap(
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number,
    minTemp: number,
    maxTemp: number
){
    // Create image data buffer
    const imgData = ctx.getImageData(0,0,width,height);
    const pixels = imgData.data;  // Uint8ClampedArray<ArrayBuffer> (RGBA)
    // Pre-compute inverse range
    const range = maxTemp - minTemp;
    const invRange = range > 1e-5 ? 1 / range : 0;   // avoid divide by zero in loop

    const len = data.length;
    // Main loop: map temperature ⭢ color
    for (let i = 0; i < len; i++) {
        const temp = data[i];
        // Normalize temperature (0..1)
        let t = (temp - minTemp) * invRange;
        // clamp to valid range
        if (t<0) t = 0;
        if (t>1) t = 1;
        // Map to LUT index (0..255)
        const lutIdx = (t*255) | 0;
        const colorIdx = lutIdx * 3;
        // Set pixel color (RGBA-Format)
        const pixIdx = i * 4;
        pixels[pixIdx]   = COLOR_LUT[colorIdx];
        pixels[pixIdx+1] = COLOR_LUT[colorIdx+1];
        pixels[pixIdx+2] = COLOR_LUT[colorIdx+2];
        pixels[pixIdx+3] = 255
    }
    // Wirte pixels to canvas
    ctx.putImageData(imgData,0,0);
}