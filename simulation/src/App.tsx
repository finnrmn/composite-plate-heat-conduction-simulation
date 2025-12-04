import styled from 'styled-components';
import { useRef, useEffect } from "react";
import { Play, Pause, Settings } from 'lucide-react';

import { MATERIALS } from "@/utils/constants";
import { drawHeatMap } from "./utils/colors";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from '@/components/Select';

const Container = styled.div`
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xxl};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;
const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;
const Title = styled.h2`
  font-size: ${props => props.theme.fontSize.xxl};
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;
const Row = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

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
    <Container>
      <Section>
        <Title>Material Library</Title>
        <Row>
          {Object.values(MATERIALS).map((mat) => (
            <div
              key={mat.name}
              style={{ padding: "1rem", background: mat.color, color: "#000", borderRadius: "10px", minWidth: "150px" }}>

              <strong>{mat.name}</strong> ({mat.symbol})

              k: {mat.k} W/(m·K)
            </div>
          ))}
        </Row>
      </Section>
      <Section>
        <Title>Color Map</Title>
        <canvas
          ref={canvasRef}
          style={{
            width: 400,
            height: 400,
            imageRendering: "pixelated",
            border: "1px solid #ccc",
          }}
        />
      </Section>
      <Section>
        <Title>Buttons</Title>
        <Row>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row>
          <Button icon={<Play size={16} />}>Play</Button>
          <Button icon={<Pause size={16} />} variant="secondary">Pause</Button>
          <Button disabled>Disabled</Button>
        </Row>
      </Section>

      <Section>
        <Title>Inputs</Title>
        <Row>
          <Input
            label="Temperature"
            type="number"
            placeholder="Enter temperature"
            suffix="°C"
            style={{ maxWidth: '300px' }}
          />
        </Row>
        <Row>
          <Input
            label="Power"
            type="number"
            placeholder="Enter power"
            suffix="W/m³"
            style={{ maxWidth: '300px' }}
          />
        </Row>
        <Row>
          <Input
            label="With Error"
            type="text"
            error="This field is required"
            style={{ maxWidth: '300px' }}
          />
        </Row>
      </Section>
      <Section>
        <Title>Select</Title>
        <Select
          label="Material"
          options={[
            { value: 'copper', label: 'Copper' },
            { value: 'aluminium', label: 'Aluminium' },
            { value: 'basalt', label: 'Basalt' },
          ]}
          style={{ maxWidth: '300px' }}
        />
      </Section>
    </Container>
  );
}
export default App;