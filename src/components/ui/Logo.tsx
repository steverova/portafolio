import { cn } from '../../lib/cn'

type LogoProps = {
  src: string
  /** Por defecto vacio: el nombre visible al lado ya describe el elemento. */
  alt?: string
  className?: string
}

/** Logotipo de una herramienta o tecnologia dentro de su recuadro. */
export function Logo({ src, alt = '', className }: LogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('size-full object-contain', className)}
    />
  )
}
