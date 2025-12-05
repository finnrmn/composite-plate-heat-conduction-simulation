import styled from 'styled-components';
import React from 'react';

// ===== TypeScript Interface =====
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Array<{ value: string; label: string }>;
}

// ===== Styled Components =====
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.xs};
`;
const Label = styled.label`
  font-size: ${props => props.theme.fontSize.xs};
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
const StyledSelect = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};

  background: ${props => props.theme.colors.bgSecondary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};

  color: ${props => props.theme.colors.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
  font-family: inherit;

  cursor: pointer;
  transition: all 0.15s ease-in-out;

  /* Custom arrow (hide default) */
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${props => props.theme.spacing.md} center;
  padding-right: 2rem;

  /* Focus state */
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Options */
  option {
    background: ${props => props.theme.colors.bgSecondary};
    color: ${props => props.theme.colors.textPrimary};
  }
`;

// ===== React Component ===== 
export const Select: React.FC<SelectProps> = ({
    label,
    options,
    ...props
}) => {
    return (
        <Container>
            <Label>{label}</Label>
            <StyledSelect {...props}>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </StyledSelect>
        </Container>
    );
};

