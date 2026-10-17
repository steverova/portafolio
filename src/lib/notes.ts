import type { LoaderFunctionArgs } from 'react-router'
import blogIndexSource from '../assets/blogs/index.md?raw'
import { parseNote, type Note } from './markdown'

/** Un archivo extra de la entrada: sus definiciones, sus ejemplos... */
export type NoteFile = {
  /** Nombre del archivo con extension (`ask.md`). */
  name: string
  source: string
}

/** Lo justo para listar una entrada, sin su cuerpo. */
export type EntrySummary = {
  slug: string
  /** Numero derivado de la carpeta `entry-<n>`; `null` si no sigue la convencion. */
  order: number | null
  title: string
  date?: string
  description?: string
}

/** Entrada completa: resumen, cuerpo renderizado y archivos extra. */
export type Entry = EntrySummary & {
  html: string
  files: NoteFile[]
}

/** Portada del blog: el `index.md` de la raiz mas la lista de entradas. */
export type BlogIndex = Note & {
  entries: EntrySummary[]
}

const BLOGS_DIR = '../assets/blogs/'
const ENTRY_FOLDER = /^entry-(\d+)$/

/*
 * El contenido se empaqueta en el build (no hay peticiones de red), pero estos
 * globs viven en un modulo que solo importa la ruta diferida del blog, asi que
 * todo esto viaja en el chunk del blog y no en el de la home.
 */
const entrySources = import.meta.glob('../assets/blogs/entry-*/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const fileSources = import.meta.glob('../assets/blogs/entry-*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** `../assets/blogs/entry-001/index.md` -> `entry-001` */
function folderOf(key: string): string {
  return key.slice(BLOGS_DIR.length).split('/')[0]
}

function orderOf(folder: string): number | null {
  const match = ENTRY_FOLDER.exec(folder)
  return match ? Number(match[1]) : null
}

/** Archivos extra de una entrada (todo lo que no sea su `index.md`). */
function filesOf(folder: string): NoteFile[] {
  return Object.entries(fileSources)
    .filter(([key]) => folderOf(key) === folder && !key.endsWith('/index.md'))
    .map(([key, source]) => ({ name: key.split('/').pop() ?? key, source }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/*
 * Catalogo armado una sola vez: leer todos los `index.md` en el arranque del
 * chunk del blog es barato (unos pocos KB) y evita re-parsear en cada loader.
 */
const CATALOG = Object.entries(entrySources)
  .map(([key, source]) => {
    const folder = folderOf(key)
    const note = parseNote(source, folder)

    return {
      // El `slug` del frontmatter manda; la carpeta es el respaldo.
      slug: note.slug?.trim() || folder,
      order: orderOf(folder),
      title: note.title,
      date: note.date,
      description: note.description,
      html: note.html,
      files: filesOf(folder),
    }
  })
  .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))

/** Entradas del blog, ordenadas por el numero de su carpeta. */
export function listEntries(): EntrySummary[] {
  return CATALOG.map(({ slug, order, title, date, description }) => ({
    slug,
    order,
    title,
    date,
    description,
  }))
}

/** Entrada concreta, o `null` si el slug no corresponde a ninguna. */
export function getEntry(slug: string): Entry | null {
  return CATALOG.find((entry) => entry.slug === slug) ?? null
}

/** Loader de `/blogs`: portada del blog y lista de entradas. */
export function loadBlogIndex(): BlogIndex {
  return { ...parseNote(blogIndexSource, 'Blogs'), entries: listEntries() }
}

/** Loader de `/blogs/:slug`. */
export function loadEntry({ params }: LoaderFunctionArgs): Entry {
  const entry = getEntry(params.slug ?? '')

  if (!entry) throw new Response('Entrada no encontrada', { status: 404 })

  return entry
}
