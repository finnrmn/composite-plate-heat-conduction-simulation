
export const theme = {
    colors: {
        // Primary 
        primary: '#14b8a6',
        primaryHover: '#0d9488',
        primaryDark: '#0f766e',
        // Background
        bgPrimary: '#232427ff',
        bgSecondary: '#36393dff',
        bgTertiary: '#4e5258ff',
        // Text
        textPrimary: '#f1f5f9',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        // Borders
        border: '#777f8aff',
        borderLight: '#79818dff',
        // States
        danger: '#ef4444',
        dangerHover: '#dc2626',
        success: '#10b981',
        warning: '#f59e0b',
        // Panels Header
        panelOrange: '#fb923c',
        panelBlue: '#60a5fa',
        // Extras
        heatSource: '#ef4444',
        graphIcon: '#34d399',
    },
    spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        xxl: '3rem',     // 48px
    },
    fontSize: {
        xs: '0.75rem',   // 12px
        sm: '0.875rem',  // 14px
        base: '1rem',    // 16px
        lg: '1.125rem',  // 18px
        xl: '1.25rem',   // 20px
        xxl: '1.5rem', // 24px
        xxxl: '1.875rem', // 30px
    },
    borderRadius: {
        sm: '0.25rem',   // 4px
        md: '0.375rem',  // 6px
        lg: '0.5rem',    // 8px
        full: '9999px',  // Pill shape
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 25px 50px -12px rgba(0 0 0, 025)',
    },
} as const;

export type Theme = typeof theme;
