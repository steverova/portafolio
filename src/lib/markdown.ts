import { marked } from 'marked'

export type Note = {
  title: string
  date?: string
  description?: string
  /** Slug opcional del frontmatter; si falta, quien carga decide el suyo. */
  slug?: string
  /** HTML ya renderizado, listo para inyectar en la pagina. */
  html: string
}

/** Frontmatter opcional: un bloque entre `---` con lineas `clave: valor`. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Comillas envolventes (YAML permite `'texto'` o `"texto"`); se quitan. */
const QUOTED = /^(['"])([\s\S]*)\1$/

function parseValue(raw: string): string {
  const match = QUOTED.exec(raw)
  return match ? match[2] : raw
}

/**
 * Convierte una nota en Markdown (con frontmatter simple) en los datos que
 * necesita la ruta. El contenido es propio del repo y se empaqueta en el build,
 * no viene de fuera, asi que el HTML se puede inyectar sin sanitizar.
 */
export function parseNote(source: string, fallbackTitle = 'Nota'): Note {
  const frontmatter: Record<string, string> = {}
  let body = source

  const match = FRONTMATTER.exec(source)

  if (match) {
    body = source.slice(match[0].length)

    for (const line of match[1].split(/\r?\n/)) {
      const separator = line.indexOf(':')
      if (separator === -1) continue

      const key = line.slice(0, separator).trim()
      const value = parseValue(line.slice(separator + 1).trim())

      if (key) frontmatter[key] = value
    }
  }

  return {
    title: frontmatter.title ?? fallbackTitle,
    date: frontmatter.date,
    description: frontmatter.description,
    slug: frontmatter.slug,
    html: marked.parse(body, { async: false }),
  }
}
