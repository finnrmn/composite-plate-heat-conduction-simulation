import styled from 'styled-components';
import React from 'react';

// ===== TypeScript Interface =====
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    suffix?: string;  // e.g., "°C", "W/m³"
}

// ===== Styled Components =====
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  width: 100%;
`;

const Label = styled.label`
  font-size: ${props => props.theme.fontSize.xs};
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input<{ hasError?: boolean; hasSuffix?: boolean }>`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  padding-right: ${props => props.hasSuffix ? '3rem' : props.theme.spacing.md};

  background: ${props => props.theme.colors.bgSecondary};
  border: 1px solid ${props => props.hasError
        ? props.theme.colors.danger
        : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};

  color: ${props => props.theme.colors.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
  font-family: inherit;

  transition: all 0.15s ease-in-out;

  /* Placeholder */
  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }

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
    background: ${props => props.theme.colors.bgTertiary};
  }
`;

const Suffix = styled.span`
  position: absolute;
  right: ${props => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
  pointer-events: none;  /* Click through to input */
`;

const ErrorText = styled.p`
  font-size: ${props => props.theme.fontSize.xs};
  color: ${props => props.theme.colors.danger};
  margin: 0;
`;

// ===== React Component =====
export const Input: React.FC<InputProps> = ({
    label,
    error,
    suffix,
    ...props
}) => {
    return (
        <Container>
            <Label>{label}</Label>
            <InputWrapper>
                <StyledInput
                    hasError={!!error}
                    hasSuffix={!!suffix}
                    {...props}
                />
                {suffix && <Suffix>{suffix}</Suffix>}
            </InputWrapper>
            {error && <ErrorText>{error}</ErrorText>}
        </Container>
    );
};