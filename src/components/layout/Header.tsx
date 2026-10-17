import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import type { Route } from '../../lib/routes'
import { useSectionHref } from '../../hooks/useSectionHref'
import { NAV_ITEMS } from '../../data/navigation'
import { SITE } from '../../data/site'
import { ButtonLink } from '../ui/Button'
import { CloseIcon, MenuIcon } from '../ui/Icons'
import { Container } from '../ui/Container'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'

type HeaderProps = {
  /** Seccion visible en la home. Fuera de ella no hay ninguna activa. */
  activeSection?: Route
}

function desktopLinkClass(isActive: boolean) {
  return cn(
    'relative inline-flex h-9 items-center px-4 text-sm font-medium transition-colors',
    isActive ? 'bg-surface-raised text-foreground' : 'text-muted hover:text-foreground',
  )
}

function mobileLinkClass(isActive: boolean) {
  return cn(
    'flex h-11 items-center px-3 text-sm font-medium transition-colors',
    isActive ? 'bg-primary/10 text-primary-soft' : 'text-muted hover:bg-surface-raised hover:text-foreground',
  )
}

/** Subrayado rojo que marca la seccion visible. */
function ActiveDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
    />
  )
}

export function Header({ activeSection }: HeaderProps) {
  const { t } = useTranslation()
  const sectionHref = useSectionHref()
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
        <Link
          to={sectionHref('hero')}
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
        </Link>

        {/* Navegacion de escritorio */}
        <nav aria-label={t('nav.mainLabel')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              // Las secciones las marca el scroll-spy; las paginas, el propio NavLink.
              const sectionIsActive = item.kind === 'section' && activeSection === item.id

              return (
                <li key={item.id}>
                  {item.kind === 'section' ? (
                    <Link
                      to={sectionHref(item.id)}
                      aria-current={sectionIsActive ? 'page' : undefined}
                      className={desktopLinkClass(sectionIsActive)}
                    >
                      {t(`nav.${item.id}`)}
                      {sectionIsActive ? <ActiveDot /> : null}
                    </Link>
                  ) : (
                    <NavLink to={item.to} className={({ isActive }) => desktopLinkClass(isActive)}>
                      {({ isActive }) => (
                        <>
                          {t(`nav.${item.id}`)}
                          {isActive ? <ActiveDot /> : null}
                        </>
                      )}
                    </NavLink>
                  )}
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
            {NAV_ITEMS.map((item) => {
              const sectionIsActive = item.kind === 'section' && activeSection === item.id

              return (
                <li key={item.id}>
                  {item.kind === 'section' ? (
                    <Link
                      to={sectionHref(item.id)}
                      onClick={closeMenu}
                      aria-current={sectionIsActive ? 'page' : undefined}
                      className={mobileLinkClass(sectionIsActive)}
                    >
                      {t(`nav.${item.id}`)}
                    </Link>
                  ) : (
                    <NavLink
                      to={item.to}
                      onClick={closeMenu}
                      className={({ isActive }) => mobileLinkClass(isActive)}
                    >
                      {t(`nav.${item.id}`)}
                    </NavLink>
                  )}
                </li>
              )
            })}
          </ul>
        </Container>
      </div>
    </header>
  )
}
