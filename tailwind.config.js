/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  			// certainty of missing some. The values are unchanged; only the way
  			// they are referenced is.
  			//
  			// The matching CSS variables in index.css carry the same values for
  			// inline styles, which cannot use a class name.
  			brand: {
  				navy: '#1B2A4A',          // headings, body text, borders, the navbar
  				'navy-light': '#2A3F6B',  // raised surfaces on navy
  				'navy-dark': '#0F1D38',   // pressed states, the footer
  				orange: '#E8622A',        // the accent: links, prices, active states
  				'orange-dark': '#D0551F', // hover on orange
  				cream: '#F2ECD9',         // the page ground
  				'cream-dark': '#E8DFC8',  // alternating sections, card insets
  				gold: '#FFD95A',          // highlights and badges
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
  			// Heebo and Assistant both cover Hebrew. The previous heading face,
  			// Oswald, did not, so every Hebrew heading fell back silently.
  			heading: ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
  			body: ['Assistant', 'Heebo', 'system-ui', 'sans-serif'],
  			display: ['Heebo', 'Assistant', 'sans-serif'],
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
