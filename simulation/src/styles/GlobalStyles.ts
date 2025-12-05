import { createGlobalStyle } from "styled-components"

const GlobalStyles = createGlobalStyle`
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        
        background: ${props => props.theme.colors.bgPrimary};
        color: ${props => props.theme.colors.textPrimary};
        /* Prevent horizontal scroll */
        overflow-x: hidden;
    }
    /* Number input: hide arrows */
    input[type='number'] {
        -moz-appearance: textfield;
    }
    ::-webkit-inner-spin-button,
    ::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: ${props => props.theme.colors.bgSecondary};
    }
    ::-webkit-scrollbar-thumb {
        background: ${props => props.theme.colors.border};
        border-radius: ${props => props.theme.borderRadius.sm};
    }
    ::-webkit-scrollbar-thumb:hover {
        background: ${props => props.theme.colors.borderLight};
    }
`

export default GlobalStyles; 