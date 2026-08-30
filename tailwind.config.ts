import type { Config } from 'tailwindcss'

/**
 * Tokens are authored as hex in globals.css (docs/DESIGN-SYSTEM.md is the source of truth and
 * writes them that way). A bare `var(--primary)` cannot take Tailwind's `/opacity` modifier —
 * the utility is silently dropped, which is how `bg-primary/30` ended up rendering nothing at
 * all. Wrapping each token in color-mix keeps the hex authoring and makes the modifiers work.
 */
const token = (name: string) =>
  // Tailwind accepts a resolver function here at runtime, but `Config`'s type for
  // `extend.colors` only admits strings — hence the cast.
  ((({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`) as unknown as string)

// Mirrors the `tailwind.config` block the prototype inlined into every screen, so class names
// lifted from reference/screens/ resolve without translation. Values live in globals.css.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: token('--border'),
        'border-subtle': token('--border-subtle'),
        'border-hairline': token('--border-hairline'),
        'surface-muted': token('--surface-muted'),
        success: {
          DEFAULT: token('--success'),
          soft: token('--success-soft'),
          border: token('--success-border'),
        },
        warning: {
          DEFAULT: token('--warning'),
          soft: token('--warning-soft'),
          border: token('--warning-border'),
        },
        live: token('--live'),
        'surface-dark': token('--surface-dark'),
        'hero-from': token('--hero-from'),
        'hero-to': token('--hero-to'),
        input: token('--input'),
        ring: token('--ring'),
        background: token('--background'),
        foreground: token('--foreground'),
        'foreground-dim': token('--foreground-dim'),
        primary: { DEFAULT: token('--primary'), foreground: token('--primary-foreground') },
        secondary: { DEFAULT: token('--secondary'), foreground: token('--secondary-foreground') },
        destructive: { DEFAULT: token('--destructive'), foreground: token('--destructive-foreground') },
        muted: { DEFAULT: token('--muted'), foreground: token('--muted-foreground') },
        accent: {
          DEFAULT: token('--accent'),
          foreground: token('--accent-foreground'),
          soft: token('--accent-soft'),
          border: token('--accent-border'),
        },
        popover: { DEFAULT: token('--popover'), foreground: token('--popover-foreground') },
        card: { DEFAULT: token('--card'), foreground: token('--card-foreground') },
        chart: {
          '1': token('--chart-1'),
          '2': token('--chart-2'),
          '3': token('--chart-3'),
          '4': token('--chart-4'),
          '5': token('--chart-5'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: '16px', // the dominant card radius across the reference screens
        sheet: '16px',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        '2xs': 'var(--shadow-2xs)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn .3s ease-out forwards',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
