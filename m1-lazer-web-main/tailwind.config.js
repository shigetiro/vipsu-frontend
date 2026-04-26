/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Primary brand colors (extended palette)
        'osu-pink': 'var(--osu-pink, #ED8EA6)',
        'profile-color': 'var(--profile-color, #ED8EA6)',
        'primary': 'var(--primary, #8B7DDE)',
        'primary-dark': 'var(--primary-dark, #6d28d9)',
        'accent-purple': 'var(--primary, #8B7DDE)',
        'accent-teal': 'var(--tertiary, #7DD5D4)',
        'secondary': 'var(--primary, #8B7DDE)',

        // Extended Color Scales
        'primary-50': 'var(--color-primary-50)',
        'primary-100': 'var(--color-primary-100)',
        'primary-200': 'var(--color-primary-200)',
        'primary-300': 'var(--color-primary-300)',
        'primary-400': 'var(--color-primary-400)',
        'primary-500': 'var(--color-primary-500)',
        'primary-600': 'var(--color-primary-600)',
        'primary-700': 'var(--color-primary-700)',
        'primary-800': 'var(--color-primary-800)',
        'primary-900': 'var(--color-primary-900)',

        'secondary-50': 'var(--color-secondary-50)',
        'secondary-100': 'var(--color-secondary-100)',
        'secondary-200': 'var(--color-secondary-200)',
        'secondary-300': 'var(--color-secondary-300)',
        'secondary-400': 'var(--color-secondary-400)',
        'secondary-500': 'var(--color-secondary-500)',
        'secondary-600': 'var(--color-secondary-600)',
        'secondary-700': 'var(--color-secondary-700)',
        'secondary-800': 'var(--color-secondary-800)',
        'secondary-900': 'var(--color-secondary-900)',

        'tertiary-50': 'var(--color-tertiary-50)',
        'tertiary-100': 'var(--color-tertiary-100)',
        'tertiary-200': 'var(--color-tertiary-200)',
        'tertiary-300': 'var(--color-tertiary-300)',
        'tertiary-400': 'var(--color-tertiary-400)',
        'tertiary-500': 'var(--color-tertiary-500)',
        'tertiary-600': 'var(--color-tertiary-600)',
        'tertiary-700': 'var(--color-tertiary-700)',
        'tertiary-800': 'var(--color-tertiary-800)',
        'tertiary-900': 'var(--color-tertiary-900)',

        // Semantic colors
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
        'info': 'var(--color-info)',

        // Neutrals
        'neutral-50': 'var(--neutral-50)',
        'neutral-100': 'var(--neutral-100)',
        'neutral-200': 'var(--neutral-200)',
        'neutral-300': 'var(--neutral-300)',
        'neutral-400': 'var(--neutral-400)',
        'neutral-500': 'var(--neutral-500)',
        'neutral-600': 'var(--neutral-600)',
        'neutral-700': 'var(--neutral-700)',
        'neutral-800': 'var(--neutral-800)',
        'neutral-900': 'var(--neutral-900)',

        // Design token colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-color': 'var(--border-color)',
        'border-hover': 'var(--border-hover)',
        'card-bg': 'var(--card-bg)',
        'card-bg-hover': 'var(--card-bg-hover)',
        'btn-bg': 'var(--btn-bg)',
        'btn-bg-hover': 'var(--btn-bg-hover)',
        'float-panel-bg': 'var(--float-panel-bg)',

        // Surface layers
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',

        // Rank grade colors
        'grade-xh': '#FFD700',
        'grade-x': '#FFD700',
        'grade-sh': '#C0C0C0',
        'grade-s': '#FFD700',
        'grade-a': '#66cc66',
        'grade-b': '#88aaee',
        'grade-c': '#FF9966',
        'grade-d': '#FF6666',
        'grade-f': '#FF3333',
      },

      backgroundColor: {
        'card': 'var(--card-bg)',
        'card-hover': 'var(--card-bg-hover)',
        'float-panel': 'var(--float-panel-bg)',
        'navbar': 'var(--navbar-bg)',
        'page': 'var(--page-bg)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
      },

      borderColor: {
        'default': 'var(--border-color)',
        'hover': 'var(--border-hover)',
        'subtle': 'var(--border-subtle)',
        'accent': 'var(--border-accent)',
      },

      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'glow': 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
        'purple-glow': 'var(--shadow-purple-glow)',
        'pink':    '0 4px 16px rgba(237, 142, 166, 0.30)',
        'pink-lg': '0 8px 32px rgba(237, 142, 166, 0.35)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-slow': 'bounce 2.5s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'gradient-shift': 'gradient-shift 5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'spin-smooth': 'spin 0.8s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite',
        // New animations
        'gradient-move': 'gradient-move 15s ease infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(237, 142, 166, 0.20)' },
          '50%': { boxShadow: '0 0 32px rgba(237, 142, 166, 0.40)' },
        },
        'gradient-move': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-osu': 'linear-gradient(135deg, var(--osu-pink, #ED8EA6) 0%, #8B7DDE 60%, #7DD5D4 100%)',
        'gradient-card': 'linear-gradient(135deg, var(--surface-1) 0%, var(--surface-2) 100%)',
        // New brand gradients
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-button': 'var(--gradient-button)',
        'gradient-animated': 'var(--gradient-animated)',
      },

      fontFamily: {
        'sans': ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'ui-monospace', 'monospace'],
        'display': ['Clash Display', 'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.01em' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
        'base': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0em' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.02em' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.03em' }],
        '5xl':  ['3rem',     { lineHeight: '1',       letterSpacing: '-0.03em' }],
        '6xl':  ['3.75rem',  { lineHeight: '1',       letterSpacing: '-0.04em' }],
        // New display font sizes
        'heading-1': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }],
        'heading-2': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }],
        'heading-3': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }],
        'heading-4': ['1.25rem', { lineHeight: '1.2', letterSpacing: '0em', fontFamily: 'var(--font-body)', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
      },

      borderRadius: {
        'sm':   '0.25rem',
        'md':   '0.375rem',
        DEFAULT: '0.5rem',
        'lg':   '0.625rem',
        'xl':   '0.75rem',
        '2xl':  '1rem',
        '3xl':  '1.25rem',
        '4xl':  '1.5rem',
        'full': '9999px',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        DEFAULT: '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },

      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
    },
  },
  plugins: [],
}
