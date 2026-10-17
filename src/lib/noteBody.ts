/**
 * Marcador que el markdown usa para pedir un archivo en un punto concreto:
 * `<div data-note-file="ask.md"></div>`.
 * `marked` deja los bloques de HTML crudo tal cual, asi que sobrevive al render.
 */
const FILE_MARKER = /<div data-note-file="([^"]+)"><\/div>/g

/** Trozo del cuerpo: HTML ya renderizado o la peticion de un archivo. */
export type BodySegment =
  | { type: 'html'; html: string }
  | { type: 'file'; name: string }

/**
 * Trocea el HTML del cuerpo por los marcadores, para poder intercalar los
 * componentes justo donde el markdown los pide.
 * `split` con grupo de captura deja los nombres en los indices impares.
 */
export function splitBody(html: string): BodySegment[] {
  const segments: BodySegment[] = []

  for (const [index, part] of html.split(FILE_MARKER).entries()) {
    if (index % 2 === 1) {
      segments.push({ type: 'file', name: part })
    } else if (part !== '') {
      segments.push({ type: 'html', html: part })
    }
  }

  return segments
}

/** Nombres de archivo que el markdown coloca en linea, en orden. */
export function filesInBody(html: string): string[] {
  return splitBody(html).flatMap((segment) => (segment.type === 'file' ? [segment.name] : []))
}
