import { useTranslation } from 'react-i18next'
import { PROJECTS } from '../data/projects'
import { SITE } from '../data/site'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ExternalLinkIcon } from '../components/ui/Icons'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Section } from '../components/layout/Section'

export function ProjectsSection() {
  const { t } = useTranslation()

  return (
    <Section id="proyectos" labelledBy="proyectos-title">
      <Container>
        <SectionHeader
          id="proyectos-title"
          title={t('projects.title')}
          description={t('projects.description')}
        />

        <ul className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <li key={project.id} className="flex">
              <Card
                interactive
                padded={false}
                className="group relative aspect-square w-full overflow-hidden has-[a:focus-visible]:border-primary"
              >
                <img
                  src={project.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
                />

                {/* Unifica el brillo (unas imagenes son claras y otras oscuras) y se aclara al hover */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-background/50 transition-opacity duration-300 group-hover:opacity-0"
                />

                {/* Duotono con el rojo de marca al pasar el cursor */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-primary opacity-0 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                />

                {/* Legibilidad del texto sobre la imagen */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/85 to-transparent"
                />

                <div className="relative flex h-full flex-col justify-end p-5">
                  <h3 className="text-lg font-semibold tracking-tight text-balance">
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('projects.codeAria', { title: project.title })}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {project.title}
                    </a>
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t(`projects.items.${project.id}`)}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                    <span className="font-mono text-xs text-muted">{project.language}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:text-primary-soft">
                      {t('projects.viewCode')}
                      <ExternalLinkIcon />
                    </span>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <ButtonLink href={`mailto:${SITE.email}`} variant="outline">
            {t('projects.cta')}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  )
}
