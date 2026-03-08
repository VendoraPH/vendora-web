import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon
  /** Title */
  title: string
  /** Description */
  description?: string
  /** Action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Custom className */
  className?: string
  /** Custom children */
  children?: ReactNode
}

/**
 * Reusable Empty State Component
 *
 * @example
 * <EmptyState
 *   icon={ShoppingCart}
 *   title="No products in cart"
 *   description="Start adding products to your cart"
 *   action={{ label: "Browse Products", onClick: () => router.push('/products') }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-muted">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-xl md:text-2xl font-semibold mb-2">{title}</h3>

      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}

      {children}
    </div>
  )
}
