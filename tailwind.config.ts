import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
  				foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
  				subtle: 'hsl(var(--destructive-subtle) / <alpha-value>)',
  				'subtle-foreground': 'hsl(var(--destructive-subtle-foreground) / <alpha-value>)'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success) / <alpha-value>)',
  				foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
  				subtle: 'hsl(var(--success-subtle) / <alpha-value>)',
  				'subtle-foreground': 'hsl(var(--success-subtle-foreground) / <alpha-value>)'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
  				foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
  				subtle: 'hsl(var(--warning-subtle) / <alpha-value>)',
  				'subtle-foreground': 'hsl(var(--warning-subtle-foreground) / <alpha-value>)'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info) / <alpha-value>)',
  				foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
  				subtle: 'hsl(var(--info-subtle) / <alpha-value>)',
  				'subtle-foreground': 'hsl(var(--info-subtle-foreground) / <alpha-value>)'
  			},
  			/* AI features only — the purple family */
  			ai: {
  				DEFAULT: 'hsl(var(--ai) / <alpha-value>)',
  				foreground: 'hsl(var(--ai-foreground) / <alpha-value>)',
  				subtle: 'hsl(var(--ai-subtle) / <alpha-value>)',
  				'subtle-foreground': 'hsl(var(--ai-subtle-foreground) / <alpha-value>)'
  			},
  			border: {
  				DEFAULT: 'hsl(var(--border))',
  				strong: 'hsl(var(--border-strong))'
  			},
  			/* Tertiary foreground (metadata / captions) — text-tertiary */
  			tertiary: 'hsl(var(--text-3))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			/* Categorical palette — consumed only by the Tag/Avatar primitives */
  			cat: {
  				'1': 'hsl(var(--cat-1) / <alpha-value>)',
  				'2': 'hsl(var(--cat-2) / <alpha-value>)',
  				'3': 'hsl(var(--cat-3) / <alpha-value>)',
  				'4': 'hsl(var(--cat-4) / <alpha-value>)',
  				'5': 'hsl(var(--cat-5) / <alpha-value>)',
  				'6': 'hsl(var(--cat-6) / <alpha-value>)'
  			}
  		},
  		borderRadius: {
  			sm: 'calc(var(--radius) - 4px)',
  			md: 'calc(var(--radius) - 2px)',
  			lg: 'var(--radius)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 8px)'
  		},
  		boxShadow: {
  			/* Editorial elevation scale (resting → hover/dropdown → modal) */
  			'elevation-1': 'var(--shadow-1)',
  			'elevation-2': 'var(--shadow-2)',
  			'elevation-3': 'var(--shadow-3)',
  			'ring-soft': 'var(--ring-soft)',
  			cta: 'var(--cta-shadow)',
  			'ai-cta': 'var(--ai-shadow)'
  		},
  		backgroundImage: {
  			cta: 'var(--cta-grad)',
  			'cta-hover': 'var(--cta-grad-hover)',
  			'ai-cta': 'var(--ai-grad)',
  			'ai-cta-hover': 'var(--ai-grad-hover)'
  		},
  		fontSize: {
  			/* sub-12px steps so tiny labels stop reaching for text-[10px]/[11px] */
  			'3xs': ['0.625rem', { lineHeight: '0.875rem' }],
  			'2xs': ['0.6875rem', { lineHeight: '1rem' }],
  			/* Editorial sans scale: caption 12 · small 13 · body 15 ·
  			   heading 18 · title 24 · display 32 */
  			caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
  			small: ['0.8125rem', { lineHeight: '1.15rem' }],
  			body: ['0.9375rem', { lineHeight: '1.5rem' }],
  			heading: ['1.125rem', { lineHeight: '1.6rem' }],
  			title: ['1.5rem', { lineHeight: '1.9rem' }],
  			display: ['2rem', { lineHeight: '2.25rem' }],
  			/* Serif hero statistics (dashboard stat cards, analytics KPIs) */
  			stat: ['2.5rem', { lineHeight: '1' }],
  			/* Oversized serif display (404, empty-state heroes) */
  			hero: ['4rem', { lineHeight: '1' }]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
