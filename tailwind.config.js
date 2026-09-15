/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'4xl': '2rem'
  		},
  		// Dark mode. The brand colours above stay fixed hex values, but the few
  		// that change with the theme are read through CSS variables per use:
  		// navy as a background (the footer, dark panels) and navy as text swap
  		// differently - in dark mode the text turns light while a navy panel
  		// only deepens - so each kind of utility gets its own variable. The
  		// variables are set in index.css, under :root and html.dark.
  		backgroundColor: {
  			white: 'rgb(var(--c-surface) / <alpha-value>)',
  			brand: {
  				navy: 'rgb(var(--c-navy-bg) / <alpha-value>)',
  				'navy-light': 'rgb(var(--c-navy-light-bg) / <alpha-value>)',
  				mist: 'rgb(var(--c-mist) / <alpha-value>)',
  				'mist-dark': 'rgb(var(--c-mist-dark) / <alpha-value>)',
  				line: 'rgb(var(--c-line) / <alpha-value>)',
  				'orange-soft': 'rgb(var(--c-orange-soft) / <alpha-value>)',
  			},
  		},
  		// The soft bands at the top of pages fade from mist to the page colour.
  		gradientColorStops: {
  			white: 'rgb(var(--c-surface) / <alpha-value>)',
  			brand: {
  				mist: 'rgb(var(--c-mist) / <alpha-value>)',
  			},
  		},
  		textColor: {
  			brand: {
  				navy: 'rgb(var(--c-ink) / <alpha-value>)',
  				'orange-ink': 'rgb(var(--c-orange-ink) / <alpha-value>)',
  			},
  		},
  		borderColor: {
  			brand: {
  				navy: 'rgb(var(--c-ink) / <alpha-value>)',
  				line: 'rgb(var(--c-line) / <alpha-value>)',
  			},
  		},
  		ringColor: {
  			brand: {
  				navy: 'rgb(var(--c-ink) / <alpha-value>)',
  				line: 'rgb(var(--c-line) / <alpha-value>)',
  			},
  		},
  		// Soft, wide shadows in the navy's own hue rather than black, so cards
  		// lift off a white page without the grey smudge a neutral shadow leaves.
  		boxShadow: {
  			card: '0 1px 2px rgba(27, 42, 74, 0.04), 0 10px 30px -10px rgba(27, 42, 74, 0.14)',
  			lift: '0 2px 6px rgba(27, 42, 74, 0.06), 0 24px 48px -16px rgba(27, 42, 74, 0.26)',
  			float: '0 10px 40px -10px rgba(15, 29, 56, 0.28)',
  			cta: '0 10px 24px -10px rgba(232, 98, 42, 0.7)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',

  			// The shop's palette. Every customer-facing colour is defined once,
  			// here, and nowhere else. Change a value and the whole shop follows.
  			//
  			// These used to be written as bare hex values in class names -
  			// `bg-[#1B2A4A]` and so on, 1,092 times across 63 files - which meant
  			// a change of shade was a sweep through the codebase and a near
  			// certainty of missing some.
  			//
  			// The matching CSS variables in index.css carry the same values for
  			// inline styles, which cannot use a class name.
  			brand: {
  				navy: '#1B2A4A',          // headings, body text, the footer
  				'navy-light': '#2A3F6B',  // raised surfaces on navy
  				'navy-dark': '#0F1D38',   // pressed states, overlays
  				orange: '#E8622A',        // the accent: buttons, highlights, badges
  				'orange-dark': '#D0551F', // hover on orange, the foot of the button gradient
  				'orange-ink': '#C2501C',  // orange as text on white, 4.7:1 where the accent is 3.4:1
  				'orange-soft': '#FDF1EB', // the ground of a selected chip or option
  				cream: '#F2ECD9',         // the old page ground, kept for pages not yet redesigned
  				'cream-dark': '#E8DFC8',  // the same
  				gold: '#FFD95A',          // product badges
  				mist: '#F3F5F8',          // quiet surfaces: search, fields, accordions
  				'mist-dark': '#E8ECF2',   // hover on mist, alternate table rows
  				line: '#E3E7EE',          // dividers and card outlines
  			},

  			// The admin area's own darker palette. Deliberately not the shop's:
  			// it is a dense internal tool, not the storefront, and it was already
  			// referenced by name rather than by hex.
  			pitch: '#0C0D0E',
  			chalk: '#F9FAF7',
  			varnish: '#8E8E8E',
  			redcard: '#FF3B30',
  			// Same value as brand.orange. Kept because 266 admin class names use
  			// it; the shop should use brand-orange.
  			turf: '#E8622A',
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
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			// One family for the whole shop. Heebo covers Hebrew and Latin with the
  			// same proportions, so a shirt name that mixes the two ("חולצת PSG")
  			// reads as one line of type rather than two fonts side by side.
  			heading: ['Heebo', 'system-ui', 'sans-serif'],
  			body: ['Heebo', 'system-ui', 'sans-serif'],
  			display: ['Heebo', 'system-ui', 'sans-serif'],
  			mono: ['Space Mono', 'ui-monospace', 'monospace']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
