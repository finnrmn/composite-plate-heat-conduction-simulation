import { useRef, useEffect } from "react";
import { MATERIALS } from "@/utils/constants";
import { drawHeatMap } from "./utils/colors";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const Nx = 100;
  const Ny = 100;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Nx;
    canvas.height = Ny;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = new Float32Array(Nx * Ny);
    for (let y = 0; y < Ny; y++) {
      for (let x = 0; x < Nx; x++) {
        const dx = x - Nx / 2;
        const dy = y - Ny / 2;
        const dist2 = dx * dx + dy * dy;
        data[y * Nx + x] = 290 + 80 * Math.exp(-dist2 / 600);
      }
    }
    let min = Infinity;
    let max = -Infinity;
    for (const t of data) {
      if (t < min) min = t;
      if (t > max) max = t;
    }
    drawHeatMap(ctx, data, Nx, Ny, min, max);
  }, [Nx, Ny]);
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Material Library</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {Object.values(MATERIALS).map((mat) => (
          <div
            key={mat.name}
            style={{ padding: "1rem", background: mat.color, color: "#000", borderRadius: "10px", minWidth: "150px" }}>

            <strong>{mat.name}</strong> ({mat.symbol})

            k: {mat.k} W/(m·K)
          </div>
        ))}
      </div>
      <h2>Color Map</h2>
      <canvas
        ref={canvasRef}
        style={{
          width: 400,
          height: 400,
          imageRendering: "pixelated",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
export default App