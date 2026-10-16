import { useTranslation } from 'react-i18next'
import meImage from '../assets/me.webp'
import { SITE } from '../data/site'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { ArrowRightIcon, MailIcon } from '../components/ui/Icons'
import { Section } from '../components/layout/Section'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <Section id="hero" labelledBy="hero-title" className="relative overflow-hidden pt-12 sm:pt-16">
      {/* Resplandor decorativo con el color primario */}
      <div aria-hidden="true" className="glow-primary pointer-events-none absolute inset-x-0 -top-24 h-72" />

      {/*
        Movil: el mismo retrato va detras del texto, tenue y en blanco y negro.
        El degradado hacia `background` mantiene el texto legible sobre la foto.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
        <img
          src={meImage}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-y-0 right-0 h-full w-4/5 object-cover object-top opacity-50 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      </div>

      <Container className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
        <div>
          <h1
            id="hero-title"
            className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t('hero.greeting')} <span className="text-primary">{SITE.name}</span>.
            <br />
            {t('site.role')}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted text-pretty sm:text-lg">
            {t('site.tagline')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="#proyectos" size="lg">
              {t('hero.viewProjects')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
            <ButtonLink href={`mailto:${SITE.email}`} variant="outline" size="lg">
              <MailIcon className="size-4" />
              {t('hero.contact')}
            </ButtonLink>
          </div>
        </div>

        {/* En movil el retrato ya vive detras del texto, por eso solo se muestra de `lg` en adelante. */}
        <div className="mx-auto hidden w-full max-w-xs sm:max-w-sm lg:mx-0 lg:block">
          <img
            src={meImage}
            alt={`Retrato de ${SITE.name}`}
            width={1086}
            height={1448}
            loading="eager"
            decoding="async"
            className="mask-b-from-80% h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  )
}
