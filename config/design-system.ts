/**
 * Vendora Design System Configuration
 * Intentional design choices to avoid generic AI aesthetics
 *
 * This configuration enforces:
 * - Bold, memorable typography
 * - Purpose-driven color palette
 * - Consistent spacing system
 * - Unique visual identity
 */

export const designSystem = {
  /**
   * Typography Scale
   * Using Poppins for headings (bold, impactful)
   * Using Inter for body (readable, professional)
   */
  typography: {
    display: 'text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tight',
    h1: 'text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight',
    h2: 'text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight',
    h3: 'text-2xl md:text-3xl lg:text-4xl font-display font-semibold',
    h4: 'text-xl md:text-2xl lg:text-3xl font-display font-semibold',
    h5: 'text-lg md:text-xl lg:text-2xl font-display font-medium',
    body: 'text-base leading-relaxed',
    bodyLarge: 'text-lg leading-relaxed',
    bodySmall: 'text-sm leading-normal',
    caption: 'text-xs leading-tight',
  },

  /**
   * Color Palette
   * Purpose-driven colors, not generic blues
   */
  colors: {
    // Primary: Business actions and branding
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',  // Main primary
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },

    // Accent: Highlights and secondary CTAs
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',  // Main accent
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Surface colors
    surface: {
      light: '#ffffff',
      default: '#f8fafc',
      dark: '#0f172a',
    },
  },

  /**
   * Spacing Scale
   * Consistent 4px base grid
   */
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  /**
   * Animation Timing
   */
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  /**
   * Border Radius
   * Consistent rounding strategy
   */
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  /**
   * Shadows
   * Purposeful depth
   */
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
}

/**
 * Component Variants
 * Reusable component styling patterns
 */
export const componentVariants = {
  button: {
    primary: `
      bg-gradient-to-r from-primary-600 to-accent-600
      text-white font-bold
      px-6 py-3 rounded-xl
      hover:from-primary-700 hover:to-accent-700
      transform hover:scale-105
      transition-all duration-300
      shadow-lg shadow-primary-600/30
    `,
    secondary: `
      bg-white text-primary-700 border-2 border-primary-600
      font-semibold px-6 py-3 rounded-xl
      hover:bg-primary-50
      transition-all duration-300
    `,
    ghost: `
      text-gray-700 font-medium
      px-4 py-2
      hover:bg-gray-100
      transition-colors duration-200
    `,
  },

  card: {
    default: `
      bg-white rounded-2xl
      border border-gray-200
      shadow-md
      hover:shadow-xl
      transition-shadow duration-300
    `,
    featured: `
      relative overflow-hidden
      bg-gradient-to-br from-white via-primary-50/50 to-white
      border-2 border-primary-600/20
      rounded-2xl
      shadow-lg shadow-primary-600/10
      hover:shadow-xl hover:shadow-primary-600/20
      transition-all duration-300
    `,
  },

  input: {
    default: `
      w-full px-4 py-3
      border-2 border-gray-200
      rounded-xl
      focus:border-primary-600 focus:ring-4 focus:ring-primary-600/20
      transition-all duration-200
    `,
  },
}
