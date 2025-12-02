import styled from 'styled-components'

// Define a styled component
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #14b8a6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 600px;
  text-align: center;
  line-height: 1.6;
`

const StatusBadge = styled.div`
  margin-top: 2rem;
  padding: 0.5rem 1.5rem;
  background: #14b8a6;
  color: #0f172a;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`
function App() {
  return (
    <Container>
      <Title>Heat Conduction Simulation</Title>
      <Subtitle>
        A 2D heat diffusion simulator. Based on explicite Finite-Difference-Method (FDM): Forward Time - Centered Space (FTCS).
      </Subtitle>
      <StatusBadge>✅ Setup Complete</StatusBadge>
    </Container>
  )
}
export default App