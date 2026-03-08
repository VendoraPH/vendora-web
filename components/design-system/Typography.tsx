import { designSystem } from '@/config/design-system'
import { cn } from '@/lib/utils'

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

/**
 * Display text - Largest, most impactful text
 * Use for hero sections and major headings
 */
export function DisplayText({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(designSystem.typography.display, className)}>
      {children}
    </h1>
  )
}

/**
 * H1 - Primary page heading
 */
export function Heading1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(designSystem.typography.h1, className)}>
      {children}
    </h1>
  )
}

/**
 * H2 - Secondary heading
 */
export function Heading2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(designSystem.typography.h2, className)}>
      {children}
    </h2>
  )
}

/**
 * H3 - Tertiary heading
 */
export function Heading3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn(designSystem.typography.h3, className)}>
      {children}
    </h3>
  )
}

/**
 * H4 - Section heading
 */
export function Heading4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn(designSystem.typography.h4, className)}>
      {children}
    </h4>
  )
}

/**
 * H5 - Subsection heading
 */
export function Heading5({ children, className }: TypographyProps) {
  return (
    <h5 className={cn(designSystem.typography.h5, className)}>
      {children}
    </h5>
  )
}

/**
 * Body text - Regular paragraph text
 */
export function BodyText({ children, className }: TypographyProps) {
  return (
    <p className={cn(designSystem.typography.body, className)}>
      {children}
    </p>
  )
}

/**
 * Body large - Emphasized paragraph text
 */
export function BodyLarge({ children, className }: TypographyProps) {
  return (
    <p className={cn(designSystem.typography.bodyLarge, className)}>
      {children}
    </p>
  )
}

/**
 * Body small - Secondary paragraph text
 */
export function BodySmall({ children, className }: TypographyProps) {
  return (
    <p className={cn(designSystem.typography.bodySmall, className)}>
      {children}
    </p>
  )
}

/**
 * Caption - Smallest text for labels and captions
 */
export function Caption({ children, className }: TypographyProps) {
  return (
    <span className={cn(designSystem.typography.caption, className)}>
      {children}
    </span>
  )
}
