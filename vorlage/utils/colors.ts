// Inferno Color Map Control Points (High Fidelity)
// We use a Lookup Table (LUT) for performance and smoothness.

const INFERNO_STOPS = [
  { t: 0.000, r: 0,   g: 0,   b: 4 },
  { t: 0.100, r: 27,  g: 12,  b: 65 },
  { t: 0.200, r: 65,  g: 15,  b: 117 },
  { t: 0.300, r: 107, g: 25,  b: 111 },
  { t: 0.400, r: 147, g: 38,  b: 103 },
  { t: 0.500, r: 186, g: 54,  b: 85 },
  { t: 0.600, r: 221, g: 81,  b: 58 },
  { t: 0.700, r: 243, g: 110, b: 27 },
  { t: 0.800, r: 252, g: 165, b: 10 },
  { t: 0.900, r: 244, g: 217, b: 34 },
  { t: 1.000, r: 252, g: 255, b: 164 }
];

// Generate a 256-color Lookup Table (LUT)
const LUT_SIZE = 256;
export const COLOR_LUT = new Uint8Array(LUT_SIZE * 3);

function initLUT() {
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    
    // Find segment
    let start = INFERNO_STOPS[0];
    let end = INFERNO_STOPS[INFERNO_STOPS.length - 1];
    
    for (let j = 0; j < INFERNO_STOPS.length - 1; j++) {
      if (t >= INFERNO_STOPS[j].t && t <= INFERNO_STOPS[j+1].t) {
        start = INFERNO_STOPS[j];
        end = INFERNO_STOPS[j+1];
        break;
      }
    }

    const range = end.t - start.t;
    const localT = (t - start.t) / range;
    
    const r = Math.floor(start.r + localT * (end.r - start.r));
    const g = Math.floor(start.g + localT * (end.g - start.g));
    const b = Math.floor(start.b + localT * (end.b - start.b));
    
    const idx = i * 3;
    COLOR_LUT[idx] = r;
    COLOR_LUT[idx+1] = g;
    COLOR_LUT[idx+2] = b;
  }
}

// Initialize immediately
initLUT();

export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  minTemp: number,
  maxTemp: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // Cache inverse range for performance (avoid div by zero)
  const range = maxTemp - minTemp;
  const invRange = range > 1e-5 ? 1 / range : 0;
  
  const len = data.length;

  for (let i = 0; i < len; i++) {
    const temp = data[i];
    
    // Normalize to 0..1
    let t = (temp - minTemp) * invRange;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    
    // Map to LUT index (0..255)
    // Using bitwise OR 0 is a fast way to floor positive numbers
    const lutIdx = (t * 255) | 0; 
    const colorIdx = lutIdx * 3;

    const pixIdx = i * 4;
    pixels[pixIdx]     = COLOR_LUT[colorIdx];     // R
    pixels[pixIdx + 1] = COLOR_LUT[colorIdx + 1]; // G
    pixels[pixIdx + 2] = COLOR_LUT[colorIdx + 2]; // B
    pixels[pixIdx + 3] = 255; // Alpha (Opaque)
  }

  ctx.putImageData(imgData, 0, 0);
}
