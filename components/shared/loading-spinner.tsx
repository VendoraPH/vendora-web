import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl"
  /** Custom className */
  className?: string
  /** Loading text */
  text?: string
  /** Center in container */
  centered?: boolean
}

/**
 * Reusable Loading Spinner Component
 *
 * @example
 * <LoadingSpinner size="lg" text="Loading..." />
 * <LoadingSpinner centered />
 */
export function LoadingSpinner({
  size = "md",
  className,
  text,
  centered = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }

  const spinner = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <p className={cn("text-muted-foreground", textSizes[size])}>{text}</p>
      )}
    </div>
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * Full Page Loading Spinner
 */
export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
