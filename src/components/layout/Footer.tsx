import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSectionHref } from '../../hooks/useSectionHref'
import { NAV_ITEMS } from '../../data/navigation'
import { SITE } from '../../data/site'
import { Container } from '../ui/Container'
import { GithubIcon, LinkedinIcon, MailIcon } from '../ui/Icons'

// Se calcula una sola vez, fuera del render (evita impurezas al re-renderizar).
const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  const { t } = useTranslation()
  const sectionHref = useSectionHref()

  const socials = [
    { href: `mailto:${SITE.email}`, label: t('footer.sendMail'), Icon: MailIcon },
    { href: SITE.socials.github, label: 'GitHub', Icon: GithubIcon },
    { href: SITE.socials.linkedin, label: 'LinkedIn', Icon: LinkedinIcon },
  ]

  return (
    <footer className="border-t border-border/70 bg-surface/40">
      <Container className="flex flex-col gap-8 py-10 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-semibold tracking-tight">{SITE.name}</p>
            <p className="mt-1 text-sm text-muted">{t('site.role')}</p>
          </div>

          <nav aria-label={t('nav.footerLabel')}>
            <h2 className="font-mono text-xs tracking-[0.2em] text-muted uppercase">{t('footer.sections')}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  {item.kind === 'section' ? (
                    <a
                      href={sectionHref(item.id)}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {t(`nav.${item.id}`)}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {t(`nav.${item.id}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-xs tracking-[0.2em] text-muted uppercase">{t('footer.contact')}</h2>
            <ul className="mt-3 flex items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    {...(href.startsWith('mailto:')
                      ? {}
                      : { target: '_blank', rel: 'noopener noreferrer' })}
                    className="grid size-10 place-items-center border border-border text-muted transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/70 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.rights', { year: CURRENT_YEAR, name: SITE.name })}</p>
          <p className="font-mono">{t('footer.built')}</p>
        </div>
      </Container>
    </footer>
  )
}
