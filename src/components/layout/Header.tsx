import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { hrefForRoute, type Route } from '../../lib/routes'
import { NAV_ITEMS } from '../../data/navigation'
import { SITE } from '../../data/site'
import { ButtonLink } from '../ui/Button'
import { CloseIcon, MenuIcon } from '../ui/Icons'
import { Container } from '../ui/Container'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'

type HeaderProps = {
  activeSection: Route
}

export function Header({ activeSection }: HeaderProps) {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  // Cerrar con la tecla Escape (accesibilidad).
  useEffect(() => {
    if (!isMenuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a
          href={hrefForRoute('hero')}
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label={t('nav.homeAria', { name: SITE.name })}
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center bg-primary text-sm font-bold text-white"
          >
            {SITE.name.charAt(0)}
          </span>
          <span className="hidden text-sm sm:inline">{SITE.name}</span>
        </a>

        {/* Navegacion de escritorio */}
        <nav aria-label={t('nav.mainLabel')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((id) => {
              const isActive = activeSection === id

              return (
                <li key={id}>
                  <a
                    href={hrefForRoute(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative inline-flex h-9 items-center px-4 text-sm font-medium transition-colors',
                      isActive ? 'bg-surface-raised text-foreground' : 'text-muted hover:text-foreground',
                    )}
                  >
                    {t(`nav.${id}`)}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
                      />
                    ) : null}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <ButtonLink href={`mailto:${SITE.email}`} size="sm" className="hidden sm:inline-flex">
            {t('hero.contact')}
          </ButtonLink>

          {/* Boton de menu movil */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="grid size-10 place-items-center rounded-none border border-border text-foreground transition-colors hover:bg-surface-raised md:hidden"
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>

      {/* Navegacion movil */}
      <div id="mobile-nav" hidden={!isMenuOpen} className="border-t border-border/70 md:hidden">
        <Container className="py-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((id) => {
              const isActive = activeSection === id

              return (
                <li key={id}>
                  <a
                    href={hrefForRoute(id)}
                    onClick={closeMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-11 items-center px-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary-soft'
                        : 'text-muted hover:bg-surface-raised hover:text-foreground',
                    )}
                  >
                    {t(`nav.${id}`)}
                  </a>
                </li>
              )
            })}
          </ul>
        </Container>
      </div>
    </header>
  )
}
