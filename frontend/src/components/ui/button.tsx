import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover rounded-md",
        primary: "bg-foreground/90 text-background font-semibold hover:bg-foreground rounded-full",
        "cta-primary": "btn-gradient text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl",
        "cta-secondary": "bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl border border-border-light transition-all duration-300 transform hover:scale-105 shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        outline:
          "border border-border-light bg-background/10 backdrop-blur-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md",
        "cta-outline": "border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105",
        secondary:
          "bg-card/60 text-foreground border-border-light border hover:bg-card/80 rounded-md",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",
        blue: "bg-accent-blue text-accent-blue-foreground hover:bg-accent-blue-hover rounded-md",
        success: "bg-success-bright text-success-foreground hover:bg-success rounded-md",
        glass: "bg-background-light/20 backdrop-blur-md border border-border-glass text-foreground hover:bg-background-light/30 rounded-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        xl: "h-14 px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
