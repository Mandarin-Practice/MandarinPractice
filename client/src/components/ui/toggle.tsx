import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        switch: "relative rounded-full h-6 w-10 bg-gray-300 dark:bg-gray-600 data-[state=on]:bg-primary",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))
Toggle.displayName = TogglePrimitive.Root.displayName

const ToggleSwitch = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  Omit<ToggleProps, "variant"> & { label?: string }
>(({ className, size, label, ...props }, ref) => (
  <div className="flex justify-between items-center mb-4">
    {label && (
      <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
    )}
    <div className="relative inline-block align-middle select-none">
      <TogglePrimitive.Root
        ref={ref}
        className={cn(toggleVariants({ variant: "switch", size, className }), "peer")}
        {...props}
      >
        <span className="absolute block h-6 w-6 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out left-0 top-0 data-[state=on]:translate-x-4" />
      </TogglePrimitive.Root>
    </div>
  </div>
))
ToggleSwitch.displayName = "ToggleSwitch"

export { Toggle, ToggleSwitch, toggleVariants }