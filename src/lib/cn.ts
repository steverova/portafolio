/**
 * Une clases condicionales en un string.
 * Ej: cn('px-4', isActive && 'bg-primary', undefined) -> 'px-4 bg-primary'
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
