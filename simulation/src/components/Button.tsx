import styled, { css } from "styled-components";
import React from "react";

// ===== TypeScript Inerface =====
interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

// ===== Styled Component =====
const StyledButton = styled.button<ButtonProps>`
    /* Base always applied */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${props => props.theme.spacing.sm};
    font-weight: 500;
    border-radius: ${props => props.theme.borderRadius.md};
    transition: all 0.15s ease-in-out;
    cursor: pointer;
    border: 1px solid transparent;
    font-family: inherit;
    /* Focus states for accessibility */
    &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.3);
    }
    /* Disabled state */
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    /* Conditional Variant  */
    ${props => props.variant === 'primary' && css`
        background: ${props => props.theme.colors.primary};
        color: ${props => props.theme.colors.bgPrimary};
        &:hover:not(:disabled){
            background: ${props => props.theme.colors.primaryHover};
        }
        &:active:not(:disabled){
            backround: ${props => props.theme.colors.primaryDark};
        }
    `}
    ${props => props.variant === 'secondary' && css`
        background: ${props => props.theme.colors.bgTertiary};
        color: ${props => props.theme.colors.textPrimary};
        &:hover:not(:disabled) {
            background: ${props => props.theme.colors.borderLight};
        }
    `}
    ${props => props.variant === 'danger' && css`
        background: ${props => props.theme.colors.danger};
        color: white;
        &:hover:not(:disabled) {
            background: ${props => props.theme.colors.dangerHover};
        }
    `}
    ${props => props.variant === 'outline' && css`
        background: transparent;
        color: ${props => props.theme.colors.textSecondary};
        border-color: ${props => props.theme.colors.border};
        &:hover:not(:disabled) {
            background: ${props => props.theme.colors.bgSecondary};
            border-color: ${props => props.theme.colors.borderLight};
        }
    `}
    /* Conditional Size */
    ${props => props.size === 'sm' && css`
        padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
        font-size: ${props => props.theme.fontSize.xs};
    `}
    ${props => props.size === 'md' && css`
        padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
        font-size: ${props => props.theme.fontSize.sm};
    `}
    ${props => props.size === 'lg' && css`
        padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
        font-size: ${props => props.theme.fontSize.base};
    `}
`;

// ===== React Component =====
export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    ...props
}) => {
    return (
        <StyledButton variant={variant} size={size} {...props}>
            {icon && <span>{icon}</span>}
            {children}
        </StyledButton>
    );
};

