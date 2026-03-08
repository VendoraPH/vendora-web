import { cn } from "@/lib/utils"

interface LogoProps {
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl"
  /** Show icon only (no text) */
  iconOnly?: boolean
  /** Custom className */
  className?: string
  /** Color variant */
  variant?: "default" | "light" | "dark"
}

/**
 * Reusable Logo Component
 *
 * @example
 * <Logo size="lg" />
 * <Logo iconOnly size="md" />
 * <Logo variant="light" />
 */
export function Logo({
  size = "md",
  iconOnly = false,
  className,
  variant = "default",
}: LogoProps) {
  const sizeClasses = {
    sm: iconOnly ? "h-6 w-6" : "h-6",
    md: iconOnly ? "h-8 w-8" : "h-8",
    lg: iconOnly ? "h-12 w-12" : "h-12",
    xl: iconOnly ? "h-16 w-16" : "h-16",
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }

  const variantClasses = {
    default: "text-primary",
    light: "text-white",
    dark: "text-black",
  }

  return (
    <div className={cn("flex items-center gap-2", sizeClasses[size], className)}>
      {/* Icon/Symbol */}
      <div
        className={cn(
          "rounded-lg flex items-center justify-center font-bold",
          variantClasses[variant],
          iconOnly ? sizeClasses[size] : "aspect-square"
        )}
      >
        V
      </div>

      {/* Text */}
      {!iconOnly && (
        <span className={cn("font-bold", textSizes[size], variantClasses[variant])}>
          Vendora
        </span>
      )}
    </div>
  )
}
