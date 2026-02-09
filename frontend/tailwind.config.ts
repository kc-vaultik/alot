import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
		backgroundImage: {
			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			'gradient-custom': 'linear-gradient(135deg, hsl(var(--background-gradient-start)), hsl(var(--background-gradient-middle)), hsl(var(--background-gradient-end)))',
			'gradient-accent': 'linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))',
			'gradient-hype': 'linear-gradient(135deg, hsl(330 95% 60%), hsl(195 100% 50%))',
			'gradient-volt': 'linear-gradient(135deg, hsl(80 100% 50%), hsl(120 80% 45%))'
		},
    		colors: {
    			border: 'hsl(var(--border))',
    			'border-light': 'hsl(var(--border-light))',
    			'border-glass': 'hsl(var(--border-glass))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: {
    				DEFAULT: 'hsl(var(--background))',
    				light: 'hsl(var(--background-light))'
    			},
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				hover: 'hsl(var(--primary-hover))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			'accent-blue': {
    				DEFAULT: 'hsl(var(--accent-blue))',
    				hover: 'hsl(var(--accent-blue-hover))',
    				foreground: 'hsl(var(--accent-blue-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			warning: {
    				DEFAULT: 'hsl(var(--warning))',
    				foreground: 'hsl(var(--warning-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))',
    				light: 'hsl(var(--muted-light))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))',
    				overlay: 'hsl(var(--card-overlay))'
    			},
    			success: {
    				DEFAULT: 'hsl(var(--success))',
    				bright: 'hsl(var(--success-bright))',
    				foreground: 'hsl(var(--success-foreground))'
    			},
    			text: {
    				primary: 'hsl(var(--text-primary))',
    				secondary: 'hsl(var(--text-secondary))',
    				muted: 'hsl(var(--text-muted))',
    				accent: 'hsl(var(--text-accent))'
    			},
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
    			},
    			footer: {
    				DEFAULT: 'hsl(var(--footer-background))',
    				foreground: 'hsl(var(--footer-foreground))',
    				muted: 'hsl(var(--footer-muted))'
    			},
				// Alot! specific colors
				hype: {
					pink: 'hsl(330 95% 60%)',
					blue: 'hsl(195 100% 50%)',
					volt: 'hsl(80 100% 50%)'
				}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			},
    			'fade-in': {
    				'0%': { opacity: '0', transform: 'translateY(10px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'slide-up': {
    				'0%': { opacity: '0', transform: 'translateY(20px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'scale-in': {
    				'0%': { opacity: '0', transform: 'scale(0.95)' },
    				'100%': { opacity: '1', transform: 'scale(1)' }
    			},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(330 95% 60% / 0.4)' },
					'50%': { boxShadow: '0 0 40px hsl(330 95% 60% / 0.6)' }
				},
				shake: {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.1)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				glow: {
					'0%': { boxShadow: '0 0 5px hsl(var(--primary))' },
					'50%': { boxShadow: '0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))' },
					'100%': { boxShadow: '0 0 5px hsl(var(--primary))' }
				},
    			scroll: {
    				'0%': { transform: 'translateX(0)' },
    				'100%': { transform: 'translateX(-50%)' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-in': 'fade-in 0.3s ease-out',
    			'slide-up': 'slide-up 0.4s ease-out',
    			'scale-in': 'scale-in 0.3s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				shake: 'shake 0.5s ease-in-out',
				'bounce-in': 'bounce-in 0.5s ease-out',
    			glow: 'glow 2s ease-in-out infinite',
    			scroll: 'scroll 20s linear infinite'
    		},
    		spacing: {
    			'18': '4.5rem',
    			'88': '22rem',
    			'128': '32rem'
    		},
    		boxShadow: {
    			glow: '0 0 20px hsl(var(--primary) / 0.3)',
    			'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)',
				'glow-pink': '0 0 30px hsl(330 95% 60% / 0.5)',
				'glow-blue': '0 0 30px hsl(195 100% 50% / 0.5)',
				'glow-volt': '0 0 30px hsl(80 100% 50% / 0.5)',
				sticker: '4px 4px 0px 0px hsl(0 0% 0%)',
				'sticker-hover': '6px 6px 0px 0px hsl(0 0% 0%)',
    			card: '0 4px 12px rgba(0, 0, 0, 0.15)',
    			'card-hover': '0 8px 25px rgba(0, 0, 0, 0.25)'
    		},
    		backdropBlur: {
    			xs: '2px',
    			sm: '4px',
    			md: '8px',
    			lg: '12px',
    			xl: '16px'
    		},
    		fontFamily: {
				display: ['Bangers', 'cursive'],
    			sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    			mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;