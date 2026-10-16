import bookmarksImage from '../assets/proyects/bookmarks.webp'
import codeImage from '../assets/proyects/code.webp'
import opencodeImage from '../assets/proyects/opencode.webp'

export type Project = {
  id: string
  /** Nombre visible en la card. */
  title: string
  /** Lenguaje principal, mostrado en la card. */
  language: string
  repo: string
  /** Imagen de portada de la card. */
  image: string
}

/**
 * Proyectos mostrados en la seccion #proyectos.
 * La descripcion se resuelve con i18n con la clave `projects.items.{id}`.
 */
export const PROJECTS: Project[] = [
  {
    id: 'zed-fmt-switcher',
    title: 'Zed Fmt Switcher',
    language: 'TypeScript',
    repo: 'https://github.com/steverova/zed-fmt-switcher',
    image: codeImage,
  },
  {
    id: 'bookmarks-gist',
    title: 'Bookmarks Gist Sync',
    language: 'TypeScript',
    repo: 'https://github.com/steverova/bookmarks-gist',
    image: bookmarksImage,
  },
  {
    id: 'kiro-provider',
    title: 'Kiro Provider',
    language: 'JavaScript',
    repo: 'https://github.com/steverova/kiro-provider',
    image: opencodeImage,
  },
  {
    id: 'my-php-router',
    title: 'My PHP Router',
    language: 'PHP',
    repo: 'https://github.com/steverova/my_php_router',
    image: codeImage,
  },
]
