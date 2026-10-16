import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type StyleOptions = {
  variant?: Variant
  size?: Size
  className?: string
}

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-none font-semibold whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-soft active:bg-primary-strong',
  outline:
    'border border-border bg-transparent text-foreground hover:border-primary hover:bg-primary/10 hover:text-white',
  ghost: 'bg-transparent text-muted hover:bg-surface-raised hover:text-foreground',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm sm:text-base',
  lg: 'h-12 px-7 text-base',
}

function buttonStyles({ variant = 'primary', size = 'md', className }: StyleOptions) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className)
}

type ButtonProps = StyleOptions & {
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: () => void
  'aria-label'?: string
}

export function Button({ type = 'button', ...props }: ButtonProps) {
  const { children, variant, size, className, ...rest } = props

  return (
    <button type={type} className={buttonStyles({ variant, size, className })} {...rest}>
      {children}
    </button>
  )
}

type ButtonLinkProps = StyleOptions & {
  children: ReactNode
  href: string
  /** Abre en una pestana nueva (anade rel de seguridad de forma automatica). */
  external?: boolean
  'aria-label'?: string
}

export function ButtonLink({ children, href, external, variant, size, className, ...rest }: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={buttonStyles({ variant, size, className })}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}
