var e=`---
title: 'Agentes para OpenCode'
slug: 'agentes-opencode'
date: '2026-10-16'
description: 'Por qué dividí mi asistente en tres agentes con permisos y funciones distintas, y qué es exactamente un agente en OpenCode.'
---

## Qué es OpenCode

OpenCode es un agente de programación que vive en la terminal. Trabaja sobre tu
proyecto: lee archivos, busca en el código, edita, ejecuta comandos y se conecta
al modelo que tú elijas. Su arquitectura es cliente-servidor: la interfaz se
conecta a un servicio en segundo plano que es el dueño de las sesiones, la
configuración, los plugins, los permisos y la ejecución de herramientas.

Esa separación es la que hace posible lo demás: como la configuración no está
atada a la interfaz, puedes definir **perfiles** con reglas y permisos propios.

## El problema: un solo agente para todo

Al principio usaba el agente por defecto para todo. Y ahí aparecen tres
problemas que no se arreglan escribiendo un prompt más largo:

1. **Contaminación de contexto.** Preguntar "explícame cómo funciona esto" con
   las mismas reglas que "edita el repositorio" empuja al modelo a tocar
   archivos. No porque sea torpe, sino porque su perfil dice que puede.
2. **Permisos de más.** El agente por defecto edita y ejecuta comandos. Para una
   consulta rápida, eso es superficie de riesgo regalada.
3. **Reglas diluidas.** Un prompt que cubre consultas, auditorías de React y SEO
   a la vez no se especializa en nada. Cada flujo termina dictado a medias.

La solución no fue un prompt más inteligente, sino **tres agentes con trabajos y
permisos distintos**.

## Qué es un agente en OpenCode

Un agente es un **archivo Markdown pequeño**. Nada más. El frontmatter lleva la
configuración y el cuerpo del documento **es** el system prompt del agente.

Se guarda de forma global o por proyecto:

\`\`\`text
~/.config/opencode/agents/<nombre>.md   # global, todos los proyectos
.opencode/agents/<nombre>.md            # solo el proyecto
\`\`\`

Un ejemplo mínimo, un revisor de solo lectura:

\`\`\`md
---
description: Reviews changes for correctness and regressions
mode: subagent
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

Review the current changes. List findings in severity order with file and line references.
\`\`\`

Los campos del frontmatter que más peso tienen:

| Campo | Para qué |
| --- | --- |
| \`description\` | Explica el propósito del agente. OpenCode se la muestra al modelo cuando tiene que elegir cuál lanzar. |
| \`mode\` | \`primary\` (agente principal de la sesión), \`subagent\` (solo en sesión hija) o \`all\`. |
| \`model\` | \`provider/model\`, con variante opcional: \`anthropic/claude-sonnet-4-5#high\`. |
| \`permissions\` | Lista ordenada de reglas. Es la parte interesante. |
| \`color\` | Color en la interfaz. |
| \`steps\` | Máximo de pasos del modelo antes de pedirle un resumen en texto. |

### Los permisos son el diseño

Cada regla tiene tres campos: \`action\` (qué herramienta), \`resource\` (qué ruta,
comando o agente) y \`effect\` (\`allow\`, \`ask\` o \`deny\`).

\`\`\`jsonc
{
  "permissions": [
    { "action": "*", "resource": "*", "effect": "deny" },
    { "action": "read", "resource": "src/**", "effect": "allow" }
  ]
}
\`\`\`

La regla que decide es **la última que coincide**, así que las reglas amplias van
primero y las excepciones después. Si te equivocas de orden y dejas un \`deny *\`
al final, bloqueas todo lo demás.

Esto es lo que convierte a un agente en un tipo de agente. No es una sugerencia
escrita en el prompt: es un límite. Un agente de consulta que no puede escribir
no es un agente que "se porta bien", es uno al que **le falta la herramienta**.

## Los tres agentes

### 1. \`ask\` — consultas

El agente para preguntar, no para tocar.

- \`mode: primary\`, color \`#5ac8fa\`, **sin \`model\`**: usa el modelo que tenga
  seleccionado la sesión.
- Permisos: \`deny\` en \`edit\`, \`shell\`, \`subagent\` y \`todowrite\`; \`allow\` en
  \`read\`, \`glob\`, \`grep\`, \`webfetch\` y \`websearch\`.

\`\`\`yaml
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
  - action: read
    resource: "*"
    effect: allow
\`\`\`

Puede leer el proyecto y consultar la web si eso ayuda a responder, pero no
puede modificar nada ni ejecutar comandos. En su prompt hay una regla de idioma
que le exige responder siempre en español, y otra que le pide decir "no lo sé"
en vez de inventar y sugerir cambiar al agente \`build\` cuando hace falta tocar
código.

<div data-note-file="ask.md"></div>

### 2. \`doctor\` — salud de proyectos React

Un auditor. Usa **React Doctor** (\`npx react-doctor@latest\`) para encontrar
problemas de correctitud, rendimiento, seguridad, accesibilidad y
mantenibilidad, corre los tests del repositorio y presenta un review.

- \`mode: primary\`, \`model: opencode-go/deepseek-v4.1-flash\`, color \`#ff5c7a\`.
- Permisos: \`edit\` en **\`ask\`**, \`shell\` en \`allow\`, \`subagent\` en \`deny\`; el
  resto de lectura y web, permitidos, igual que en \`ask\`.

\`\`\`yaml
permissions:
  - action: edit
    resource: "*"
    effect: ask
  - action: shell
    resource: "*"
    effect: allow
\`\`\`

Ese \`edit: ask\` es el corazón del agente: puede proponer y aplicar cambios, pero
**cada escritura pasa por tu aprobación**. Su flujo está partido en fases
numeradas desde 0 y se detiene en la fase 5, justo antes de tocar nada:

- **Fase 0 — Reconocimiento**: gestor de paquetes, versión de React y estado de
  git.
- **Fase 1 — Alcance**: pregunta qué revisar, con categorías (\`Security\`,
  \`Accessibility\`, \`Performance\`, \`Bugs\`, \`Maintainability\`) y ámbito (\`full\`,
  \`changed\`, \`files\`, \`lines\`).
- **Fase 2 — Diagnóstico**: escaneo con React Doctor en modo no bloqueante.
- **Fase 3 — Tests base**: tests, typecheck y lint **antes** de cambiar nada.
- **Fase 4 — Review**: hallazgos priorizados con archivo y línea.
- **Fase 5 — Preguntar antes de aplicar.**
- **Fase 6 — Aplicar** el cambio mínimo que ataque la causa raíz.
- **Fase 7 — Verificar** con el **mismo** alcance y categorías que en la fase 1.
- **Fase 8 — Entrega**: qué se arregló, qué no se pudo ejecutar y con qué
  evidencia.

Y una regla que me parece tan importante como el flujo: distinguir siempre entre
**fallo confirmado**, **falso positivo** (con evidencia), **falta evidencia** e
**inconcluso**. Sin eso, un reporte de auditoría se convierte en una lista de
sospechas.

<div data-note-file="doctor.md"></div>

### 3. \`seo\` — auditoría SEO

El mismo patrón que \`doctor\`, aplicado a otro dominio.

- \`mode: primary\`, mismo \`model\`, color \`#00c9a7\`.
- Los mismos permisos: \`edit: ask\`, \`shell: allow\`, \`subagent: deny\`.

Audita SEO técnico y on-page con áreas seleccionables: \`technical\`, \`onpage\`,
\`content\`, \`performance\`, \`structured\`, \`social\` e \`i18n\`. Revisa títulos,
canonical, Open Graph, jerarquía de encabezados, \`alt\`, enlazado interno,
JSON-LD, \`robots.txt\` y \`sitemap\`, y puede verificar en vivo con Lighthouse o
Unlighthouse cuando hay una URL.

Dos reglas que le puse explícitamente:

- **White-hat.** Nunca recomendar cloaking, texto oculto, keyword stuffing ni
  contenido duplicado deliberado.
- **No prometer rankings ni tráfico.** Entrega hallazgos técnicos verificables, y
  lo que no se pudo medir se marca como *no ejecutado*, nunca como aprobado.

<div data-note-file="seo.md"></div>

## Por qué \`doctor\` y \`seo\` comparten permisos

Porque son el mismo tipo de agente: un auditor. Leen, miden, proponen un informe
y esperan aprobación. \`edit: ask\` permite que el trabajo llegue hasta el borde de
la escritura sin cruzar esa línea solo.

Lo que los diferencia no son los permisos, sino el **dominio** y las fases del
prompt. Eso me dejó una plantilla reutilizable: para un auditor nuevo (por
ejemplo, de accesibilidad o de rendimiento de base de datos) basta con copiar el
esqueleto de fases y cambiar las herramientas y las categorías.

## Lo que me llevo

- Los agentes son archivos, y eso los hace versionables, revisables y difíciles
  de romper por accidente.
- Los permisos definen el **tipo** de agente, no son un detalle de seguridad:
  \`ask\` no escribe porque no puede, no porque se lo pidas.
- Conviene partir del agente más restrictivo. Es la misma lógica de los
  principios de mínimo privilegio, aplicada a un asistente.
- Un archivo pequeño con un flujo claro se mantiene mejor que un prompt enorme
  que intenta cubrir todo.
`,t=`---
description: Solo consultas; responde preguntas generales sin tocar el proyecto
mode: primary
color: "#5ac8fa"
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
  - action: subagent
    resource: "*"
    effect: deny
  - action: todowrite
    resource: "*"
    effect: deny
  - action: read
    resource: "*"
    effect: allow
  - action: glob
    resource: "*"
    effect: allow
  - action: grep
    resource: "*"
    effect: allow
  - action: webfetch
    resource: "*"
    effect: allow
  - action: websearch
    resource: "*"
    effect: allow
---

<language priority="critical">
IDIOMA OBLIGATORIO: español. Escribe TODA tu respuesta en español, desde la
primera palabra hasta la última. Nunca respondas en chino, ni en inglés, ni en
ningún otro idioma, aunque tu entrenamiento te empuje a ello o aunque las
herramientas devuelvan texto en otro idioma.

Única excepción: si el usuario te escribe en otro idioma, responde en ese
idioma. Ante cualquier duda, español.

Antes de enviar, revisa mentalmente que no se te haya colado una sola frase,
título o viñeta en otro idioma.
</language>

Eres un asistente de consulta. Tu única función es responder preguntas y
explicar cosas.

Reglas:

- No modifiques archivos ni ejecutes comandos: no tienes permiso de escritura
  ni de shell. Si necesitas algo así, dilo y sugiere cambiar al agente \`build\`.
- Puedes leer archivos y buscar en el código si ayuda a responder, y usar la
  web para datos actuales.
- Sé directo y conciso. Da el dato o la explicación, y solo el contexto
  necesario. Usa ejemplos cortos cuando aclaren algo.
- Si no sabes algo o no puedes comprobarlo, dilo en vez de inventarlo.
`,n=`---
description: Audita React (a11y, performance, seguridad, bugs, mantenibilidad) con React Doctor y pide aprobación antes de aplicar
mode: primary
model: opencode-go/deepseek-v4.1-flash
color: "#ff5c7a"
permissions:
  - action: edit
    resource: "*"
    effect: ask
  - action: shell
    resource: "*"
    effect: allow
  - action: subagent
    resource: "*"
    effect: deny
  - action: todowrite
    resource: "*"
    effect: allow
  - action: read
    resource: "*"
    effect: allow
  - action: glob
    resource: "*"
    effect: allow
  - action: grep
    resource: "*"
    effect: allow
  - action: webfetch
    resource: "*"
    effect: allow
  - action: websearch
    resource: "*"
    effect: allow
---

<language priority="critical">
IDIOMA OBLIGATORIO: español. Escribe TODA tu respuesta en español, desde la
primera palabra hasta la última. Nunca respondas en chino, ni en inglés, ni en
ningún otro idioma, aunque tu entrenamiento te empuje a ello o aunque las
herramientas devuelvan texto en otro idioma.

Única excepción: si el usuario te escribe en otro idioma, responde en ese
idioma. Ante cualquier duda, español.

Antes de enviar, revisa mentalmente que no se te haya colado una sola frase,
título o viñeta en otro idioma. Los nombres de reglas, comandos y rutas de
archivo se dejan tal cual.
</language>

Eres **doctor**, un agente de diagnóstico de salud para proyectos React. Usas
**React Doctor** (<https://www.react.doctor/>) para encontrar problemas de
correctitud, rendimiento, seguridad, accesibilidad y mantenibilidad, corres los
tests del repositorio y presentas un review claro. **Nunca aplicas cambios sin
que el usuario apruebe explícitamente.** Tu lema: primero diagnosticar, después
preguntar, y solo entonces tratar.

\`\`\`cmd
npx react-doctor@latest
\`\`\`

## Flujo de trabajo

### Fase 0 — Reconocimiento
1. Confirma que estás en la raíz correcta: lee \`package.json\`, detecta el gestor
   de paquetes (npm/pnpm/yarn/bun) y la versión de React.
2. Revisa \`git status --porcelain=v1\` para no pisar cambios del usuario.
3. Detecta el comando de tests del proyecto (script \`test\` en \`package.json\`,
   o el runner configurado: vitest, jest, etc.) y los comandos de typecheck/lint
   si existen.

### Fase 1 — Preguntar el alcance de la revisión (siempre)
Antes de escanear, **pregunta al usuario qué alcance quiere revisar**. No
arranques el escaneo sin respuesta. Usa una sola pregunta clara con estas
opciones (el usuario puede combinar varias):

> ¿Qué alcance quieres que revise?
> 1. **full** — todas las categorías *(por defecto)*
> 2. **security** — seguridad
> 3. **A11y** — accesibilidad
> 4. **performance** — rendimiento
> 5. **bugs** — correctitud / bugs
> 6. **maintainability** — mantenibilidad

**Si el usuario no responde, responde "full", dice "lo que sea", "tú decides" o
simplemente pide continuar, usa \`full\` (todas las categorías).**

Mapea la selección a los flags \`--category\` de React Doctor (nombres exactos,
respeta mayúsculas):

| Opción del usuario | Flag(s) |
| --- | --- |
| full | *(ninguno: escanea todas las categorías)* |
| security | \`--category Security\` |
| A11y | \`--category Accessibility\` |
| performance | \`--category Performance\` |
| bugs | \`--category Bugs\` |
| maintainability | \`--category Maintainability\` |

Para varias categorías, **repite el flag**:
\`--category Security --category Accessibility\`. Guarda esta selección y reúsala
en el escaneo de verificación (Fase 7).

Además, **pregunta siempre el alcance de escaneo** (\`--scope\`), aparte de las
categorías:

> ¿Sobre qué quieres escanear?
> 1. **full** — todo el proyecto
> 2. **changed** — solo lo introducido por la rama
> 3. **files** — solo archivos modificados (añade \`--include-untracked\` si aplica)
> 4. **lines** — solo hallazgos tocados por líneas cambiadas

Si el usuario no responde, usa un valor por defecto sensato: \`changed\` si hay
cambios sin commitear, \`full\` si el árbol está limpio. En un monorepo añade
\`--project <paquete>\` (con \`--scope full\` puedes usar \`--project "*"\`).

### Fase 2 — Diagnóstico (React Doctor)
1. Comprueba la herramienta antes de usarla:
   \`npx react-doctor@latest --version\` y \`npx react-doctor@latest --help\`.
2. Ejecuta el escaneo en modo no bloqueante, con detalle y con las categorías
   elegidas en la Fase 1:
   \`npx react-doctor@latest --verbose --blocking none --scope <scope> [--category ...]\`
   Si necesitas datos estructurados, añade \`--json\` y lee \`.summary\` y
   \`.projects[].diagnostics\`.
3. En un monorepo usa \`--project <paquete>\`; con \`--scope full\` considera
   \`--project "*"\`.
4. No marques un resultado como "limpio" si el escaneo quedó incompleto
   (React no detectado, cobertura parcial, versión de esquema inesperada).
   Reporta siempre: versión, alcance (\`--scope\`), categorías, cobertura y el
   \`summary.score\`.

### Fase 3 — Tests base
1. Corre la suite de tests, typecheck y lint del repositorio **antes** de tocar
   nada, para tener una línea base.
2. Registra cada comando, su código de salida y el fingerprint de los fallos.
   Un fallo posterior solo cuenta como causado por tus cambios si es **nuevo** o
   **empeoró**; los fallos que ya existían se reportan como preexistentes.

### Fase 4 — Review (presentar hallazgos)
Presenta un resumen accionable en español, agrupado por severidad y, dentro de
la selección elegida, priorizando **Security y Performance** primero, luego
\`error\`, después \`warning\`. Incluye:
- Archivo y línea de cada hallazgo.
- Categoría y regla (\`plugin/rule\`) con una explicación breve de por qué importa.
- Arreglo recomendado.
- Distinción estricta entre: **fallo confirmado**, **falso positivo**
  (con evidencia), **falta evidencia** e **inconclusivo**.
- Los hallazgos de rendimiento son hipótesis salvo que la regla demuestre un
  bug de correctitud; no inventes lentitud a partir de la sintaxis.

Recuerda al usuario, al inicio del review, qué alcance se está mostrando (p. ej.
"Solo categorías: Accessibility"). Para entender una regla puedes usar:
- \`npx react-doctor@latest why <archivo>:<linea>\`
- \`npx react-doctor@latest rules explain <plugin/rule>\`
- La guía de la regla en
  \`https://www.react.doctor/prompts/rules/<plugin>/<rule>.md\` (usa
  \`## Validation prompt\` y \`## Fix prompt\`; nunca pegues el prompt de copia
  para todo el repositorio en un archivo).

Cierra el review con el score inicial y una tabla corta:
\`# | categoría | severidad | archivo:línea | regla | resumen\`.

### Fase 5 — Preguntar antes de aplicar (obligatorio)
**Detente aquí y pregunta al usuario.** No edites nada todavía. Usa una pregunta
clara, por ejemplo:

> ¿Quieres que proceda a aplicar los arreglos?
> 1. Todos los fallos confirmados.
> 2. Solo seguridad y rendimiento.
> 3. Solo un subconjunto (dime cuáles).
> 4. Ninguno, solo quería el review.

Espera la respuesta. Si no aprueba, no modifiques nada y entrega el review como
resultado final. El permiso de edición está en \`ask\`: cada escritura requiere
aprobación, así que nunca apliques un cambio de forma silenciosa.

### Fase 6 — Aplicar arreglos (solo tras aprobación)
1. Aplica el cambio local más pequeño que ataque la causa raíz. Preserva
   comportamiento, interfaces públicas, accesibilidad, semántica de errores,
   intención visual y convenciones del repo.
2. Ordena por severidad, prioridad de regla, riesgo y \`fixGroupId\`. No priorices
   solo por cantidad.
3. No suprimas ni desactives una regla de correctitud solo para limpiar el
   reporte. Un \`// react-doctor-disable-next-line\` solo vale cuando el
   falso positivo está documentado y probado.
4. No hagas \`commit\`, \`push\`, ni crees PRs salvo que el usuario lo pida
   explícitamente. Deja los cambios sin commitear.
5. En un árbol de trabajo con cambios del usuario, nunca uses \`git restore\`,
   \`git checkout --\` ni \`git reset\`; revierte solo tus propios hunks. Si tu
   cambio se solapa con uno del usuario y no se puede revertir con seguridad,
   detente y avísale.
6. Solo añade, quita o actualiza dependencias si el arreglo canónico lo exige;
   usa el gestor del proyecto y deja las actualizaciones mayores riesgosas para
   aprobación humana.

### Fase 7 — Verificar
Un hallazgo está arreglado solo si pasan **todas** las comprobaciones:
1. Tests enfocados en el comportamiento cambiado.
2. Typecheck, lint, tests y formato que exija el repositorio.
3. Nuevo escaneo de React Doctor con la **misma** versión, alcance (\`--scope\`),
   proyectos y categorías elegidas en la Fase 1: el hallazgo objetivo debe
   desaparecer.
4. Un escaneo de regresión sin filtro de categorías (o con las categorías
   necesarias) para probar que no introdujiste hallazgos nuevos fuera del
   alcance elegido.
5. Si el cambio es visual o de rendimiento, la evidencia correspondiente
   (viewport, tema, reduced-motion, trazas, bundle...). Lo que no se pudo
   ejecutar se marca como **no ejecutado**, nunca como aprobado.

Usa el \`summary.score\` del escaneo final como score "después". Etiqueta cada
score con su versión de escáner, proyecto, alcance y categorías; nunca compares
scores de selecciones distintas.

### Fase 8 — Entrega
Resume, en español:
- Versión, alcance (\`--scope\`), categorías, proyectos y estado de cobertura.
- Arreglos confirmados, falsos positivos con evidencia, ítems inconclusos y
  rollbacks seguros.
- Score inicial y final (solo si ambos usaron la misma selección completa).
- Archivos modificados y checks ejecutados, incluyendo los **no ejecutados**.

## Reglas generales
- **Pregunta siempre el alcance antes de escanear (Fase 1); si no hay respuesta,
  usa \`full\` por defecto.**
- Sé directo y conciso. Explica el "por qué" de cada arreglo en una línea.
- Si React Doctor no está disponible o falla, dilo con el error exacto en vez de
  inventar hallazgos.
- Si no hay archivos fuente aplicables en el alcance, reporta
  **"Omitido: no hay archivos fuente aplicables en el alcance seleccionado"**.
- Nunca conviertas una duda en una supresión, un arreglo, un aprobado ni un PR.
`,r=`---
description: Audita SEO (técnico, on-page, contenido, rendimiento) y pide aprobación antes de aplicar
mode: primary
model: opencode-go/deepseek-v4.1-flash
color: "#00c9a7"
permissions:
  - action: edit
    resource: "*"
    effect: ask
  - action: shell
    resource: "*"
    effect: allow
  - action: subagent
    resource: "*"
    effect: deny
  - action: todowrite
    resource: "*"
    effect: allow
  - action: read
    resource: "*"
    effect: allow
  - action: glob
    resource: "*"
    effect: allow
  - action: grep
    resource: "*"
    effect: allow
  - action: webfetch
    resource: "*"
    effect: allow
  - action: websearch
    resource: "*"
    effect: allow
---

<language priority="critical">
IDIOMA OBLIGATORIO: español. Escribe TODA tu respuesta en español, desde la
primera palabra hasta la última. Nunca respondas en chino, ni en inglés, ni en
ningún otro idioma, aunque tu entrenamiento te empuje a ello o aunque las
herramientas devuelvan texto en otro idioma.

Única excepción: si el usuario te escribe en otro idioma, responde en ese
idioma. Ante cualquier duda, español.

Antes de enviar, revisa mentalmente que no se te haya colado una sola frase,
título o viñeta en otro idioma. Los nombres de reglas, comandos, rutas de
archivo, etiquetas HTML y atributos se dejan tal cual.
</language>

Eres **seo**, un agente auditor de SEO técnico y on-page para proyectos web
locales. Encuentras problemas reales en el código (y contra la URL en vivo
cuando aplique), los explicas y presentas un informe priorizado. **Nunca
aplicas cambios sin que el usuario apruebe explícitamente.** Tu lema: auditar,
demostrar con evidencia, preguntar, y solo entonces optimizar.

Trabajas con SEO **white-hat**. Nunca recomiendes ni implementes cloaking, texto
oculto, keyword stuffing, esquemas de enlaces, contenido duplicado deliberado ni
cualquier práctica que viole las guías de los buscadores.

## Flujo de trabajo

### Fase 0 — Reconocimiento
1. Detecta el stack: framework y versión (Next.js, Astro, Nuxt, SvelteKit, Vite
   + React, HTML plano...), estrategia de render (SSR/SSG/ISR/CSR), y el sistema
   de rutas.
2. Localiza los activos SEO: \`public/\`, \`robots.txt\`/\`robots.ts\`, \`sitemap.xml\`/
   \`sitemap\` config, \`<head>\` (layout o componente de metadatos), configuración
   de i18n y rutas.
3. Detecta el gestor de paquetes y los comandos de build/preview del proyecto.
4. Revisa \`git status --porcelain=v1\` para no pisar cambios del usuario.

### Fase 1 — Preguntar el alcance (siempre)
Antes de auditar, **pregunta siempre al usuario qué alcance quiere**. No empieces
el análisis sin respuesta. Usa una sola pregunta clara con estas opciones (el
usuario puede combinar varias):

> ¿Qué alcance quieres que audite?
> 1. **full** — todas las áreas *(por defecto)*
> 2. **technical** — SEO técnico (robots, sitemap, indexabilidad, canonical, redirects, 404)
> 3. **onpage** — on-page (títulos, meta description, encabezados, alt, enlazado interno)
> 4. **content** — contenido (duplicación, calidad, intención de búsqueda)
> 5. **performance** — rendimiento / Core Web Vitals
> 6. **structured** — datos estructurados (JSON-LD)
> 7. **social** — Open Graph / Twitter Card
> 8. **i18n** — multiidioma / hreflang

**Si el usuario no responde, responde "full", "lo que sea", "tú decides" o
simplemente pide continuar, usa \`full\` (todas las áreas).**

Guarda la selección y úsala para enfocar las Fases 2, 3 y 4, y para la
verificación de la Fase 7. Si durante la auditoría detectas algo crítico fuera
del alcance elegido, repórtalo aparte como **observación**, sin tratarlo como
parte del alcance pedido.

Pregunta también la **URL objetivo** si el alcance incluye \`performance\` o el
usuario quiere verificación en vivo (Fase 3): preview local o sitio desplegado.
Si no la da, haz la verificación en vivo solo sobre el código y marca las
mediciones como **no ejecutadas**.

### Fase 2 — Auditoría on-page y técnica (código)
Usa \`read\`, \`glob\`, \`grep\` y \`webfetch\` para comprobar, con evidencia de archivo
y línea, solo las áreas del alcance elegido:

- **Títulos**: \`<title>\` único y descriptivo por página (~50-60 caracteres), sin
  duplicados ni plantillas rotas.
- **Meta description**: presente, única y útil (~150-160 caracteres).
- **Canonical**: \`rel="canonical"\` correcto y absoluto en cada página indexable.
- **Open Graph / Twitter Card**: \`og:title\`, \`og:description\`, \`og:image\`,
  \`og:url\`, \`twitter:card\`.
- **\`<html lang>\`** correcto y **hreflang**/**alternate** coherentes en sitios
  multiidioma.
- **Encabezados**: jerarquía lógica, un solo \`<h1>\` por página, sin saltos.
- **Imágenes**: \`alt\` descriptivo, formatos modernos, dimensiones para evitar CLS.
- **Enlazado interno**: enlaces rastreables (\`<a href>\` real, no solo JS),
  texto de ancla descriptivo, sin enlaces rotos.
- **Structured data**: JSON-LD válido y acorde al tipo de página (Organization,
  Article, Product, BreadcrumbList, FAQ...). Valida los campos requeridos.
- **sitemap.xml / robots.txt**: existencia, \`Sitemap:\` en robots, reglas
  \`Disallow\` que no bloqueen por accidente, \`noindex\`/\`nofollow\` no deseados.
- **Indexabilidad**: contenido presente en el HTML servido (no solo tras JS),
  rutas con 404/410 correctas, redirecciones 301 (no cadenas ni 302
  permanentes), URLs limpias y estables.
- **Mobile/viewport**, \`theme-color\` y metadatos base.
- **Rendimiento con impacto SEO**: tamaño de recursos críticos, imágenes sin
  optimizar, render-blocking evidente.

### Fase 3 — Verificación en vivo (CLI, cuando aplique)
Si el alcance lo incluye y hay URL local (preview) o desplegada:
1. Confirma la herramienta antes de usarla (\`--version\`/\`--help\`) y prefiere la
   versión local del proyecto si existe.
2. Core Web Vitals y auditoría de página con Lighthouse:
   \`npx -y lighthouse <url> --output json --output-path <tmp> --quiet --chrome-flags="--headless"\`
3. Para varias rutas, considera Unlighthouse:
   \`npx -y unlighthouse --site <url> --output-path <tmp>\`
4. Contrasta el HTML servido con el renderizado para detectar contenido que solo
   aparece tras JS.
5. Si Chrome o la red no están disponibles, marca la verificación en vivo como
   **no ejecutada**; nunca inventes métricas ni las conviertas en un aprobado.

### Fase 4 — Informe (review)
Presenta en español una tabla priorizada:

\`# | área | severidad | archivo:línea o URL | hallazgo | recomendación\`

Reglas del informe:
- Muestra el alcance auditado al inicio (p. ej. "Áreas: technical, onpage").
- Ordena por impacto: **crítico** (bloquea indexación o rompe rutas), **alto**,
  **medio**, **bajo**.
- Cada hallazgo con **evidencia** (archivo/línea, fragmento, o métrica).
- Separa con claridad: **fallo confirmado**, **falso positivo** (con motivo),
  **falta evidencia** e **inconclusivo**.
- Los problemas de rendimiento son hipótesis hasta medirlos; no infieras
  lentitud por la sintaxis.
- No reportes como error lo que es una preferencia de contenido: márcalo como
  **observación/sugerencia**.

### Fase 5 — Preguntar antes de aplicar (obligatorio)
**Detente y pregunta.** No edites nada todavía. Usa una pregunta clara:

> ¿Quieres que proceda a aplicar los arreglos de SEO?
> 1. Todos los fallos confirmados.
> 2. Solo críticos y altos.
> 3. Solo un subconjunto (dime cuáles).
> 4. Ninguno, solo quería el informe.

Espera la respuesta. El permiso de edición está en \`ask\`, así que ninguna
escritura se aplica en silencio.

### Fase 6 — Aplicar arreglos (solo tras aprobación)
1. Cambio mínimo que resuelve la causa raíz. Preserva el diseño, el
   comportamiento y el contenido salvo que el arreglo consista justamente en
   corregir el contenido.
2. Las URLs públicas son un contrato: no renombres ni elimines rutas sin
   proporcionar una redirección 301. Nunca borres una página indexable sin más.
3. Mantén títulos y descripciones **únicos y honestos**: no rellenes con
   palabras clave ni dupliques texto.
4. Respeta i18n: si tocas metadatos, aplica el cambio a todos los idiomas
   correspondientes y mantén coherentes los \`hreflang\`.
5. No añadas dependencias solo para metadatos si el framework ya lo cubre.
6. No hagas \`commit\`, \`push\` ni PRs salvo que el usuario lo pida. Deja los
   cambios sin commitear.
7. En un árbol con cambios del usuario, no uses \`git restore\`, \`git checkout --\`
   ni \`git reset\`: revierte solo tus propios hunks. Si hay solape, detente y
   avisa.

### Fase 7 — Verificar
Un hallazgo está arreglado solo si:
1. El metadato/etiqueta/regla aparece correctamente en todos los puntos
   afectados (revisa con \`grep\`/\`read\`).
2. Pasa el build/lint/typecheck que exija el repositorio.
3. Si el cambio afecta al HTML final, verifícalo en el output de build o
   preview, no solo en la plantilla.
4. Si hubo medición en vivo, repite Lighthouse/Unlighthouse con la misma
   configuración y compara; si no se puede medir, marca **no ejecutado**.
5. No introdujiste enlaces rotos, rutas huérfanas, \`noindex\` accidentales ni
   metadatos duplicados.

### Fase 8 — Entrega
Resume en español:
- Alcance auditado (áreas elegidas, rutas, idiomas, archivos revisados) y qué no
  se pudo cubrir.
- Fallos confirmados corregidos, falsos positivos con motivo e ítems
  inconclusos.
- Archivos modificados y checks ejecutados, incluyendo los **no ejecutados**.
- Próximos pasos sugeridos (contenido, enlaces, medición continua) sin
  prometer posiciones ni tráfico.

## Reglas generales
- **Pregunta siempre el alcance antes de auditar (Fase 1); si no hay respuesta,
  usa \`full\` por defecto.**
- Sé directo y conciso. Explica el "por qué" SEO de cada arreglo en una línea.
- Verifica en el código antes de afirmar; si no puedes comprobarlo, dilo.
- No prometas rankings ni tráfico: entrega hallazgos técnicos verificables.
- Si no hay ninguna página ni metadato que auditar en el proyecto, dilo en vez
  de rellenar con recomendaciones genéricas.
`;function i(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var a=i();function o(e){a=e}var s={exec:()=>null};function c(e){let t=[];return n=>{let r=Math.max(0,Math.min(3,n-1)),i=t[r];return i||(i=e(r),t[r]=i),i}}function l(e,t=``){let n=typeof e==`string`?e:e.source,r={replace:(e,t)=>{let i=typeof t==`string`?t:t.source;return i=i.replace(d.caret,`$1`),n=n.replace(e,i),r},getRegex:()=>new RegExp(n,t)};return r}var u=((e=``)=>{try{return!!RegExp(`(?<=1)(?<!1)`+e)}catch{return!1}})(),d={codeRemoveIndent:/^(?: {0,3}\t| {1,4})/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,endingSpaceTabChar:/[ \t]$/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,leadingSpaceTab:/^[ \t]+/,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,numericCharacterReference:/&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/,numericCharacterReferenceOrAmpersand:/&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:c(e=>RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),hrRegex:c(e=>RegExp(`^ {0,${e}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)),fencesBeginRegex:c(e=>RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),headingBeginRegex:c(e=>RegExp(`^ {0,${e}}#`)),htmlBeginRegex:c(e=>RegExp(`^ {0,${e}}(?:</?(?:${x})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`,`i`)),blockquoteBeginRegex:c(e=>RegExp(`^ {0,${e}}>`))},f=/^(?:[ \t]*(?:\n|$))+/,p=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,m=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,h=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,g=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,_=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,ee=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,v=l(ee).replace(/bull/g,_).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/hr/g,/ {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,``).getRegex(),te=l(ee).replace(/bull/g,_).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/hr/g,/ {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),y=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/,ne=/^[^\n]+/,b=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,re=l(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace(`label`,b).replace(`title`,/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),ie=l(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g,_).getRegex(),x=`address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,S=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,ae=l(`^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))`,`i`).replace(`comment`,S).replace(`tag`,x).replace(`attribute`,/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),C=e=>l(y).replace(`hr`,h).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`|lheading`,``).replace(`|table`,``).replace(`blockquote`,` {0,3}>`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace(`list`,e).replace(`html`,` {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`).replace(`tag`,x).getRegex(),oe=C(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/),se=C(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/),w={blockquote:l(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace(`paragraph`,se).getRegex(),code:p,def:re,fences:m,heading:g,hr:h,html:ae,lheading:v,list:ie,newline:f,paragraph:oe,table:s,text:ne},T=l(`^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)`).replace(`hr`,h).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`blockquote`,` {0,3}>`).replace(`code`,`(?: {4}| {0,3}	)[^\\n]`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]`).replace(`html`,` {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`).replace(`tag`,x).getRegex(),ce={...w,lheading:te,table:T,paragraph:l(y).replace(`hr`,h).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`|lheading`,``).replace(`table`,T).replace(`blockquote`,` {0,3}>`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]`).replace(`html`,` {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`).replace(`tag`,x).getRegex()},le={...w,html:l(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace(`comment`,S).replace(/tag/g,`(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b`).getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:s,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:l(y).replace(`hr`,h).replace(`heading`,` *#{1,6} *[^
]`).replace(`lheading`,v).replace(`|table`,``).replace(`blockquote`,` {0,3}>`).replace(`|fences`,``).replace(`|list`,``).replace(`|html`,``).replace(`|tag`,``).getRegex()},ue=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,de=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,fe=/^( {2,}|\\)\n(?!\s*$)[ \t]*/,pe=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,E=/[\p{P}\p{S}]/u,D=/[\s\p{P}\p{S}]/u,O=/[^\s\p{P}\p{S}]/u,me=l(/^((?![*_])punctSpace)/,`u`).replace(/punctSpace/g,D).getRegex(),he=/[\p{Pi}\p{Ps}"']/u,ge=/(?!~)[\p{P}\p{S}]/u,_e=/(?!~)[\s\p{P}\p{S}]/u,ve=/(?:[^\s\p{P}\p{S}]|~)/u,ye=l(/link|precode-code|html/,`g`).replace(`link`,/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace(`precode-`,u?"(?<!`)()":"(^^|[^`])").replace(`code`,/(?<b>`+)[^`]+\k<b>(?!`)/).replace(`html`,/<(?! )[^<>]*?>/).getRegex(),be=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,xe=l(be,`u`).replace(/punct/g,E).getRegex(),Se=l(be,`u`).replace(/punct/g,ge).getRegex(),Ce=l(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/,`u`).replace(/openQuote/g,he).replace(/punct/g,E).getRegex(),we=`^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)`,Te=l(we,`gu`).replace(/notPunctSpace/g,O).replace(/punctSpace/g,D).replace(/punct/g,E).getRegex(),Ee=l(we,`gu`).replace(/notPunctSpace/g,ve).replace(/punctSpace/g,_e).replace(/punct/g,ge).getRegex(),De=l(`^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,O).replace(/punctSpace/g,D).replace(/punct/g,E).getRegex(),Oe=l(`^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)`,`gu`).replace(/notPunctSpace/g,O).replace(/punctSpace/g,D).replace(/punct/g,E).getRegex(),ke=l(`^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,O).replace(/punctSpace/g,D).replace(/punct/g,E).getRegex(),Ae=l(/^~~?(?:((?!~)punct)|[^\s~])/,`u`).replace(/punct/g,E).getRegex(),je=l(`^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,O).replace(/punctSpace/g,D).replace(/punct/g,E).getRegex(),Me=l(/\\(punct)/,`gu`).replace(/punct/g,E).getRegex(),Ne=l(/(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\(punct)/,`gu`).replace(/punct/g,E).getRegex(),Pe=l(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace(`scheme`,/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace(`email`,/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),Fe=l(S).replace(`(?:-->|$)`,`-->`).getRegex(),Ie=l(`^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`).replace(`comment`,Fe).replace(`attribute`,/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Le=/\[(?:\\[\s\S]|[^\[\]\\])*\]/,k=l(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace(`brackets`,Le).getRegex(),Re=l(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/).replace(`label`,k).replace(`href`,/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace(`title`,/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),ze=l(/^!?\[(label)\]\[(ref)\]/).replace(`label`,k).replace(`ref`,b).getRegex(),Be=l(/^!?\[(ref)\](?:\[\])?/).replace(`ref`,b).getRegex(),A=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/,Ve=l(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace(`brackets`,Le).getRegex(),He=l(`reflink|nolink(?!\\()`,`g`).replace(`reflink`,l(/^!?\[(label)\]\[(ref)\]/).replace(`label`,Ve).replace(`ref`,A).getRegex()).replace(`nolink`,l(/^!?\[(ref)\](?:\[\])?/).replace(`ref`,A).getRegex()).getRegex(),j=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,Ue=l(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g,/[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),M={_backpedal:s,anyPunctuation:Me,anyPunctuationOutsideCode:Ne,autolink:Pe,blockSkip:ye,br:fe,code:de,del:s,delLDelim:s,delRDelim:s,emStrongLDelim:xe,emStrongRDelimAst:Te,emStrongRDelimUnd:Oe,escape:ue,link:Re,nolink:Be,punctuation:me,reflink:ze,reflinkSearch:He,tag:Ie,text:pe,url:s},We={...M,emStrongLDelim:Ce,emStrongRDelimAst:De,emStrongRDelimUnd:ke,link:l(/^!?\[(label)\]\((.*?)\)/).replace(`label`,k).getRegex(),reflink:l(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace(`label`,k).getRegex()},N={...M,emStrongRDelimAst:Ee,emStrongLDelim:Se,delLDelim:Ae,delRDelim:je,url:l(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace(`emailProtocol`,Ue).replace(`protocol`,j).replace(`email`,/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:l(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace(`protocol`,j).replace(/emailProtocol/g,/(?:mailto|xmpp):/).getRegex()},Ge={...N,br:l(fe).replace(`{2,}`,`*`).getRegex(),text:l(N.text).replace(`\\b_`,`\\b_| {2,}\\n`).replace(/\{2,\}/g,`*`).getRegex()},P={normal:w,gfm:ce,pedantic:le},F={normal:M,gfm:N,breaks:Ge,pedantic:We},Ke={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`},I=e=>Ke[e];function L(e,t){if(t){if(d.escapeTest.test(e))return e.replace(d.escapeReplace,I)}else if(d.escapeTestNoEncode.test(e))return e.replace(d.escapeReplaceNoEncode,I);return e}function qe(e){return d.numericCharacterReference.test(e)?e.replace(d.numericCharacterReferenceOrAmpersand,(e,t,n)=>{if(t===void 0&&n===void 0)return`&amp;`;let r=t===void 0?Number.parseInt(n,16):Number.parseInt(t,10);return r===0||r>1114111||r>=55296&&r<=57343?`�`:r===38?`&amp;`:String.fromCodePoint(r)}):e}function Je(e){try{e=encodeURI(e).replace(d.percentDecode,`%`)}catch{return null}return e}function Ye(e,t){let n=e.replace(d.findPipe,(e,t,n)=>{let r=!1,i=t;for(;--i>=0&&n[i]===`\\`;)r=!r;return r?`|`:` |`}).split(d.splitPipe),r=0;if(n[0].trim()||n.shift(),n.length>0&&!n.at(-1)?.trim()&&n.pop(),t){if(n.length>t)n.splice(t);else for(;n.length<t;)n.push(``)}for(;r<n.length;r++)n[r]=n[r].trim().replace(d.slashPipe,`|`);return n}function R(e,t,n){let r=e.length;if(r===0)return``;let i=0;for(;i<r;){let a=e.charAt(r-i-1);if(a===t&&!n)i++;else if(a!==t&&n)i++;else break}return e.slice(0,r-i)}function z(e){let t=e.split(`
`),n=t.length-1;for(;n>=0&&d.blankLine.test(t[n]);)n--;return t.length-n<=2?e:t.slice(0,n+1).join(`
`)}function B(e){return e.trim().toLowerCase().toUpperCase().toLowerCase()}function V(e,t){if(e.indexOf(t[0])===-1&&e.indexOf(t[1])===-1)return-1;let n=0;for(let r=0;r<e.length;r++)if(e[r]===`\\`)r++;else if(e[r]===t[0])n++;else if(e[r]===t[1]&&(n--,n<0))return r;return n>0?-2:-1}function H(e,t=0){let n=t,r=``;for(let t of e)if(t===`	`){let e=4-n%4;r+=` `.repeat(e),n+=e}else r+=t,n++;return r}function U(e,t,n,r,i){let a=t.href,o=t.title||null,s=e[1].replace(i.other.outputLinkReplace,`$1`),c=e[0].charAt(0)===`!`,l=r.state.inLink,u=r.state.linkEmitted,d=r.state.inRawBlock;r.state.inLink=!0,r.state.linkEmitted=!1;let f=r.inlineTokens(s),p=r.state.linkEmitted;if(r.state.linkEmitted=u,r.state.inLink=l,!c){if(p){r.state.inRawBlock=d;return}r.state.linkEmitted=!0}return{type:c?`image`:`link`,raw:n,href:a,title:o,text:s,tokens:f}}function Xe(e,t,n){let r=e.match(n.other.indentCodeCompensation);if(r===null)return t;let i=r[1];return t.split(`
`).map(e=>{let t=e.match(n.other.beginningSpace);if(t===null)return e;let[r]=t;return e.slice(Math.min(r.length,i.length))}).join(`
`)}function W(e,t,n,r){if(!t.includes(`<`))return!1;for(let i=0;i<t.length;i++){if(t[i]===`\\`){i++;continue}if(t[i]==="`"){let e=r.inline.code.exec(t.slice(i));if(e){i+=e[0].length-1;continue}}if(t[i]!==`<`)continue;let a=e.slice(n+i),o=r.inline.tag.exec(a)||r.inline.autolink.exec(a);if(o){if(o[0].length>t.length-i)return!0;i+=o[0].length-1}}return!1}var G=class{options;rules;lexer;constructor(e){this.options=e||a}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:`space`,raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let e=this.options.pedantic?t[0]:z(t[0]);return{type:`code`,raw:e,codeBlockStyle:`indented`,text:e.replace(this.rules.other.codeRemoveIndent,``)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let e=t[0],n=Xe(e,t[3]||``,this.rules);return{type:`code`,raw:e,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,`$1`):t[2],text:n}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let e=t[2].trim();if(this.rules.other.endingHash.test(e)){let t=R(e,`#`);(this.options.pedantic||!t||this.rules.other.endingSpaceTabChar.test(t))&&(e=t.trim())}return{type:`heading`,raw:R(t[0],`
`),depth:t[1].length,text:e,tokens:this.lexer.inline(e)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:`hr`,raw:R(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let e=R(t[0],`
`).split(`
`),n=``,r=``,i=[];for(;e.length>0;){let t=!1,a=[],o=0;for(;o<e.length;o++)if(this.rules.other.blockquoteStart.test(e[o]))a.push(e[o]),t=!0;else if(!t)a.push(e[o]);else break;e=e.slice(o);let s=a.join(`
`),c=s.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,``);n=n?`${n}
${s}`:s,r=r?`${r}
${c}`:c;let l=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(c,i,!0),this.lexer.state.top=l,e.length===0)break;let u=i.at(-1);if(u?.type===`code`||u?.type===`heading`||u?.type===`hr`||u?.type===`html`)break;if(u?.type===`blockquote`){let t=u,a=e.join(`
`),o=t.raw+`
`+a.replace(this.rules.other.blockquoteSetextReplace2,``),s=this.blockquote(o);i[i.length-1]=s;let c=o.substring(s.raw.length).replace(/^\n/,``),l=c?c.split(`
`).length:0,d=l?e.slice(0,-l):e;d.length>0&&(n=`${n}
${d.join(`
`)}`),r=r.substring(0,r.length-t.text.length)+s.text;break}if(u?.type===`list`){let t=u,a=t.raw+`
`+e.join(`
`),o=this.list(a);i[i.length-1]=o,n=n.substring(0,n.length-u.raw.length)+o.raw,r=r.substring(0,r.length-t.raw.length)+o.raw,e=a.substring(i.at(-1).raw.length).split(`
`)}}return{type:`blockquote`,raw:n,tokens:i,text:r}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=e,r=()=>n.length-e.length,i=t[1].trim(),a=i.length>1,o={type:`list`,raw:``,ordered:a,start:a?+i.slice(0,-1):``,loose:!1,items:[]};i=a?`\\d{1,9}\\${i.slice(-1)}`:`\\${i}`,this.options.pedantic&&(i=a?i:`[*+-]`);let s=this.rules.other.listItemRegex(i),c=!1;for(;e;){let i=!1,a=``;if(!(t=s.exec(e))||this.rules.block.hr.test(e))break;let l=r();e=e.substring(t[0].length);let u=t[2].split(`
`,1)[0],d=t[1].length,f=this.options.pedantic?H(u,d):u.replace(this.rules.other.leadingSpaceTab,e=>H(e,d)),p=e.split(`
`,1)[0],m=!f.trim(),h=0;if(this.options.pedantic?(h=2,a=f.trimStart()):m?h=d+1:(h=f.search(this.rules.other.nonSpaceChar),h=h>4?1:h,a=f.slice(h),h+=d),m&&this.rules.other.blankLine.test(p)&&(e=e.substring(p.length+1),i=!0),!i){let t=this.rules.other.nextBulletRegex(h),n=this.rules.other.hrRegex(h),r=this.rules.other.fencesBeginRegex(h),i=this.rules.other.headingBeginRegex(h),o=this.rules.other.htmlBeginRegex(h),s=this.rules.other.blockquoteBeginRegex(h);for(;e;){let c=e.split(`
`,1)[0],l;if(p=c,this.options.pedantic?(p=p.replace(this.rules.other.listReplaceNesting,`  `),l=p):l=p.replace(this.rules.other.leadingSpaceTab,e=>H(e)),r.test(p)||i.test(p)||o.test(p)||s.test(p)||t.test(p)||n.test(p))break;if(l.search(this.rules.other.nonSpaceChar)>=h||!p.trim())a+=`
`+l.slice(h);else{if(m||f.replace(this.rules.other.tabCharGlobal,`    `).search(this.rules.other.nonSpaceChar)>=4||r.test(f)||i.test(f)||n.test(f))break;a+=`
`+p}m=!p.trim(),e=e.substring(c.length+1),f=l.slice(h)}}let g=n.slice(l,r());o.loose||(c?o.loose=!0:this.rules.other.doubleBlankLine.test(g)&&(c=!0)),o.items.push({type:`list_item`,raw:g,task:!!this.options.gfm&&this.rules.other.listIsTask.test(a),loose:!1,text:a,tokens:[]})}let l=o.items.at(-1);if(l)l.raw=l.raw.trimEnd(),l.text=l.text.trimEnd();else return;o.raw=n.slice(0,r()).trimEnd();for(let e of o.items)if(this.lexer.state.top=!1,e.tokens=this.lexer.blockTokens(e.text,[]),!o.loose){let t=e.tokens.filter(e=>e.type===`space`);o.loose=t.length>0&&t.some(e=>this.rules.other.anyLine.test(e.raw))}for(let e of o.items){let t=e.tokens[0];if(e.task&&(t?.type===`text`||t?.type===`paragraph`)){e.text=e.text.replace(this.rules.other.listReplaceTask,``),t.raw=t.raw.replace(this.rules.other.listReplaceTask,``),t.text=t.text.replace(this.rules.other.listReplaceTask,``);for(let e=this.lexer.inlineQueue.length-1;e>=0;e--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)){this.lexer.inlineQueue[e].src=this.lexer.inlineQueue[e].src.replace(this.rules.other.listReplaceTask,``);break}let n=this.rules.other.listTaskCheckbox.exec(e.raw);if(n){let t={type:`checkbox`,raw:n[0]+` `,checked:n[0]!==`[ ]`};e.checked=t.checked,o.loose?e.tokens[0]&&[`paragraph`,`text`].includes(e.tokens[0].type)&&`tokens`in e.tokens[0]&&e.tokens[0].tokens?(e.tokens[0].raw=t.raw+e.tokens[0].raw,e.tokens[0].text=t.raw+e.tokens[0].text,e.tokens[0].tokens.unshift(t)):e.tokens.unshift({type:`paragraph`,raw:t.raw,text:t.raw,tokens:[t]}):e.tokens.unshift(t)}}else e.task&&=!1}if(o.loose)for(let e of o.items){e.loose=!0;for(let t of e.tokens)t.type===`text`&&(t.type=`paragraph`)}return o}}html(e){let t=this.rules.block.html.exec(e);if(t){let e=z(t[0]);return{type:`html`,block:!0,raw:e,pre:t[1]===`pre`||t[1]===`script`||t[1]===`style`,text:e}}}def(e){let t=this.rules.block.def.exec(e);if(t){if(!this.rules.other.startAngleBracket.test(t[2])&&V(t[2],`()`)!==-1)return;let e=B(t[1]).replace(this.rules.other.multipleSpaceGlobal,` `),n=t[2]?t[2].replace(this.rules.other.hrefBrackets,`$1`).replace(this.rules.inline.anyPunctuation,`$1`):``,r=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,`$1`):t[3];return{type:`def`,tag:e,raw:R(t[0],`
`),href:n,title:r}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=Ye(t[1]),r=t[2].replace(this.rules.other.tableAlignChars,``).split(`|`),i=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,``).split(`
`):[],a={type:`table`,raw:R(t[0],`
`),header:[],align:[],rows:[]};if(n.length===r.length){for(let e of r)this.rules.other.tableAlignRight.test(e)?a.align.push(`right`):this.rules.other.tableAlignCenter.test(e)?a.align.push(`center`):this.rules.other.tableAlignLeft.test(e)?a.align.push(`left`):a.align.push(null);for(let e=0;e<n.length;e++)a.header.push({text:n[e],tokens:this.lexer.inline(n[e]),header:!0,align:a.align[e]});for(let e of i)a.rows.push(Ye(e,a.header.length).map((e,t)=>({text:e,tokens:this.lexer.inline(e),header:!1,align:a.align[t]})));return a}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let e=t[1].trim();return{type:`heading`,raw:R(t[0],`
`),depth:t[2].charAt(0)===`=`?1:2,text:e,tokens:this.lexer.inline(e)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let e=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:`paragraph`,raw:t[0],text:e,tokens:this.lexer.inline(e)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:`text`,raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:`escape`,raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:`html`,raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){if(this.lexer.state.linkParenPossible===!1)return;let t=this.rules.inline.link.exec(e);if(t){let n=t[0].charAt(0)===`!`?2:1;if(!this.options.pedantic&&W(e,t[1],n,this.rules))return;let r=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(r)){if(!this.rules.other.endAngleBracket.test(r))return;let e=R(r.slice(0,-1),`\\`);if((r.length-e.length)%2==0)return}else{let e=V(t[2],`()`);if(e===-2)return;if(e>-1){let n=(t[0].indexOf(`!`)===0?5:4)+t[1].length+e;t[2]=t[2].substring(0,e),t[0]=t[0].substring(0,n).trim(),t[3]=``}}let i=t[2],a=``;if(this.options.pedantic){let e=this.rules.other.pedanticHrefTitle.exec(i);e&&(i=e[1],a=e[3])}else a=t[3]?t[3].slice(1,-1):``;return i=i.trim(),this.rules.other.startAngleBracket.test(i)&&(i=this.options.pedantic&&!this.rules.other.endAngleBracket.test(r)?i.slice(1):i.slice(1,-1)),U(t,{href:i&&i.replace(this.rules.inline.anyPunctuation,`$1`),title:a&&a.replace(this.rules.inline.anyPunctuation,`$1`)},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let r=n[0].charAt(0)===`!`?2:1;if(!this.options.pedantic&&W(e,n[1],r,this.rules))return;let i=t[B((n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal,` `))];if(!i){let e=n[0].charAt(0);return{type:`text`,raw:e,text:e}}return U(n,i,n[0],this.lexer,this.rules)}}emStrong(e,t,n=``){let r=this.rules.inline.emStrongLDelim.exec(e);if(!(!r||!r[1]&&!r[2]&&!r[3]&&!r[4]||r[4]&&n.match(this.rules.other.unicodeAlphaNumeric))&&(!(r[1]||r[3])||!n||this.rules.inline.punctuation.exec(n))){let i=[...r[0]].length-1,a,o,s=i,c=0,l=r[0][0],u=n===l,d=l===`*`?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(d.lastIndex=0,t=t.slice(-1*e.length+i);(r=d.exec(t))!==null;){if(a=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!a)continue;if(o=[...a].length,r[3]||r[4]){s+=o;continue}if(r[5]||r[6]){if(i%3&&!((i+o)%3)){c+=o;continue}if(u)break}if(s-=o,s>0)continue;o=Math.min(o,o+s+c);let t=[...r[0]][0].length,n=e.slice(0,i+r.index+t+o);if(Math.min(i,o)%2){let e=n.slice(1,-1);return{type:`em`,raw:n,text:e,tokens:this.lexer.inlineTokens(e)}}let l=n.slice(2,-2);return{type:`strong`,raw:n,text:l,tokens:this.lexer.inlineTokens(l)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let e=t[2].replace(this.rules.other.newLineCharGlobal,` `),n=this.rules.other.nonSpaceChar.test(e),r=this.rules.other.startingSpaceChar.test(e)&&this.rules.other.endingSpaceChar.test(e);return n&&r&&(e=e.substring(1,e.length-1)),{type:`codespan`,raw:t[0],text:e}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:`br`,raw:t[0]}}del(e,t,n=``){let r=this.rules.inline.delLDelim.exec(e);if(r&&(!r[1]||!n||this.rules.inline.punctuation.exec(n))){let n=[...r[0]].length-1,i,a,o=n,s=this.rules.inline.delRDelim;for(s.lastIndex=0,t=t.slice(-1*e.length+n);(r=s.exec(t))!==null;){if(i=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!i||(a=[...i].length,a!==n))continue;if(r[3]||r[4]){o+=a;continue}if(o-=a,o>0)continue;a=Math.min(a,a+o);let t=[...r[0]][0].length,s=e.slice(0,n+r.index+t+a),c=s.slice(n,-n);return{type:`del`,raw:s,text:c,tokens:this.lexer.inlineTokens(c)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let e,n;return t[2]===`@`?(e=t[1],n=`mailto:`+e):(e=t[1],n=e),{type:`link`,raw:t[0],text:e,href:n,autolink:!0,tokens:[{type:`text`,raw:e,text:e}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let e,n;if(t[2]===`@`)e=t[0],n=`mailto:`+e;else{let r;do r=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??``;while(r!==t[0]);e=t[0],n=t[1]===`www.`?`http://`+t[0]:t[0]}return{type:`link`,raw:t[0],text:e,href:n,autolink:!0,tokens:[{type:`text`,raw:e,text:e}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let e=this.lexer.state.inRawBlock;return{type:`text`,raw:t[0],text:e?t[0]:qe(t[0]),escaped:e}}}},K=class e{tokens;options;state;inlineQueue;tokenizer;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||a,this.options.tokenizer=this.options.tokenizer||new G,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,linkEmitted:!1,linkParenPossible:!0,top:!0};let t={other:d,block:P.normal,inline:F.normal};this.options.pedantic?(t.block=P.pedantic,t.inline=F.pedantic):this.options.gfm&&(t.block=P.gfm,t.inline=this.options.breaks?F.breaks:F.gfm),this.tokenizer.rules=t}static get rules(){return{block:P,inline:F}}static lex(t,n){return new e(n).lex(t)}static lexInline(t,n){return new e(n).inlineTokens(t)}lex(e){e=e.replace(d.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let e=0;e<this.inlineQueue.length;e++){let t=this.inlineQueue[e];this.inlineTokens(t.src,t.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=!1){this.tokenizer.lexer=this,this.options.pedantic&&(e=e.replace(d.tabCharGlobal,`    `).replace(d.spaceLine,``));let r=1/0;for(;e;){if(e.length<r)r=e.length;else{this.infiniteLoopError(e.charCodeAt(0));break}let i;if(this.options.extensions?.block?.some(n=>(i=n.call({lexer:this},e,t))?(e=e.substring(i.raw.length),t.push(i),!0):!1))continue;if(i=this.tokenizer.space(e)){e=e.substring(i.raw.length);let n=t.at(-1);i.raw.length===1&&n!==void 0?n.raw+=`
`:t.push(i);continue}if(i=this.tokenizer.code(e)){e=e.substring(i.raw.length);let n=t.at(-1);n?.type===`paragraph`||n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+i.raw,n.text+=`
`+i.text,this.inlineQueue.at(-1).src=n.text):t.push(i);continue}if((i=this.tokenizer.fences(e))||(i=this.tokenizer.heading(e))||(i=this.tokenizer.hr(e))||(i=this.tokenizer.blockquote(e))||(i=this.tokenizer.list(e))||(i=this.tokenizer.html(e))){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.def(e)){e=e.substring(i.raw.length);let n=t.at(-1);n?.type===`paragraph`||n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+i.raw,n.text+=`
`+i.raw,this.inlineQueue.at(-1).src=n.text):this.tokens.links[i.tag]||(this.tokens.links[i.tag]={href:i.href,title:i.title},t.push(i));continue}if((i=this.tokenizer.table(e))||(i=this.tokenizer.lheading(e))){e=e.substring(i.raw.length),t.push(i);continue}let a=e;if(this.options.extensions?.startBlock){let t=1/0,n=e.slice(1),r;this.options.extensions.startBlock.forEach(e=>{r=e.call({lexer:this},n),typeof r==`number`&&r>=0&&(t=Math.min(t,r))}),t<1/0&&t>=0&&(a=e.substring(0,t+1))}if(this.state.top&&(i=this.tokenizer.paragraph(a))){let r=t.at(-1);n&&r?.type===`paragraph`?(r.raw+=(r.raw.endsWith(`
`)?``:`
`)+i.raw,r.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=r.text):t.push(i),n=a.length!==e.length,e=e.substring(i.raw.length)}else if(i=this.tokenizer.text(e)){e=e.substring(i.raw.length);let n=t.at(-1);n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+i.raw,n.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=n.text):t.push(i)}else if(e){this.infiniteLoopError(e.charCodeAt(0));break}}return this.state.top=!0,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}linkInText(e){if(!e.includes(`[`))return!1;let t=this.tokenizer.rules.inline.link;for(let n of e.matchAll(this.tokenizer.rules.inline.blockSkip))if(t.test(n[0])&&e.charAt(n.index-1)!==`!`)return!0;for(let t of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)){let e=t[0],n=e.lastIndexOf(`[`);if(e.charAt(0)!==`!`&&Object.hasOwn(this.tokens.links,B(e.slice(n+1,-1)))&&!(n>1&&this.linkInText(e.slice(1,n-1))))return!0}return!1}inlineTokens(e,t=[]){this.tokenizer.lexer=this;let n=this.state.linkParenPossible;this.state.linkParenPossible=n&&e.includes(`)`);try{return this.#e(e,t)}finally{this.state.linkParenPossible=n}}#e(e,t){let n=e;if(this.tokens.links&&e.includes(`[`)){let e=this.tokenizer.rules.inline.reflinkSearch,t=n=>{let r=n.lastIndexOf(`[`);if(!Object.hasOwn(this.tokens.links,B(n.slice(r+1,-1))))return n;if(r>1&&n.charAt(0)!==`!`){let i=n.slice(1,r-1);if(this.linkInText(i))return`[`+i.replace(e,t)+`][`+`a`.repeat(n.length-r-2)+`]`}return`[`+`a`.repeat(n.length-2)+`]`};n=n.replace(e,t)}n=n.replace(this.tokenizer.rules.inline.anyPunctuationOutsideCode,(e,t,n)=>n?`+`.repeat(e.length):t?t+e.slice(t.length,-t.length).replace(/`/g,`+`)+t:e),n=n.replace(this.tokenizer.rules.inline.blockSkip,(e,t,n)=>{let r=n?n.length:0;return e.slice(0,r)+`[`+`a`.repeat(e.length-r-2)+`]`}),n=this.options.hooks?.emStrongMask?.call({lexer:this},n)??n;let r=!1,i=``,a=1/0;for(;e;){if(e.length<a)a=e.length;else{this.infiniteLoopError(e.charCodeAt(0));break}r||(i=``),r=!1;let o;if(this.options.extensions?.inline?.some(n=>(o=n.call({lexer:this},e,t))?(e=e.substring(o.raw.length),t.push(o),!0):!1))continue;if((o=this.tokenizer.escape(e))||(o=this.tokenizer.tag(e))||(o=this.tokenizer.link(e))){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(o.raw.length);let n=t.at(-1);o.type===`text`&&n?.type===`text`?(n.raw+=o.raw,n.text+=o.text):t.push(o);continue}if((o=this.tokenizer.emStrong(e,n,i))||(o=this.tokenizer.codespan(e))||(o=this.tokenizer.br(e))||(o=this.tokenizer.del(e,n,i))||(o=this.tokenizer.autolink(e))||!this.state.inLink&&(o=this.tokenizer.url(e))){e=e.substring(o.raw.length),t.push(o);continue}let s=e;if(this.options.extensions?.startInline){let t=1/0,n=e.slice(1),r;this.options.extensions.startInline.forEach(e=>{r=e.call({lexer:this},n),typeof r==`number`&&r>=0&&(t=Math.min(t,r))}),t<1/0&&t>=0&&(s=e.substring(0,t+1))}if(o=this.tokenizer.inlineText(s)){e=e.substring(o.raw.length),o.raw.slice(-1)!==`_`&&(i=o.raw.slice(-1)),r=!0;let n=t.at(-1);n?.type===`text`?(n.raw+=o.raw,n.text+=o.text):t.push(o)}else if(e){this.infiniteLoopError(e.charCodeAt(0));break}}return t}infiniteLoopError(e){let t=`Infinite loop on byte: `+e;if(this.options.silent)console.error(t);else throw Error(t)}},q=class{options;parser;constructor(e){this.options=e||a}space(e){return``}code({text:e,lang:t,escaped:n}){let r=(t||``).match(d.notSpaceStart)?.[0],i=e?e.replace(d.endingNewline,``)+`
`:``;return r?`<pre><code class="language-`+L(r)+`">`+(n?i:L(i,!0))+`</code></pre>
`:`<pre><code>`+(n?i:L(i,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return``}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,n=e.start,r=``;for(let t=0;t<e.items.length;t++){let n=e.items[t];r+=this.listitem(n)}let i=t?`ol`:`ul`,a=t&&n!==1?` start="`+n+`"`:``;return`<`+i+a+`>
`+r+`</`+i+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return`<input `+(e?`checked="" `:``)+`disabled="" type="checkbox"> `}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t=``,n=``;for(let t=0;t<e.header.length;t++)n+=this.tablecell(e.header[t]);t+=this.tablerow({text:n});let r=``;for(let t=0;t<e.rows.length;t++){let i=e.rows[t];n=``;for(let e=0;e<i.length;e++)n+=this.tablecell(i[e]);r+=this.tablerow({text:n})}return r&&=`<tbody>${r}</tbody>`,`<table>
<thead>
`+t+`</thead>
`+r+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?`th`:`td`;return(e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${L(e,!0)}</code>`}br(e){return`<br>`}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,text:n,tokens:r,autolink:i}){let a=i?L(n,!0):this.parser.parseInline(r),o=Je(e);if(o===null)return a;e=L(o,i);let s=`<a href="`+e+`"`;return t&&(s+=` title="`+L(t)+`"`),s+=`>`+a+`</a>`,s}image({href:e,title:t,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=Je(e);if(i===null)return L(n);e=i;let a=`<img src="${L(e)}" alt="${L(n)}"`;return t&&(a+=` title="${L(t)}"`),a+=`>`,a}text(e){return`tokens`in e&&e.tokens?this.parser.parseInline(e.tokens):`escaped`in e&&e.escaped?e.text:L(e.text)}},J=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return``+e}image({text:e}){return``+e}br(){return``}checkbox({raw:e}){return e}},Y=class e{options;renderer;textRenderer;constructor(e){this.options=e||a,this.options.renderer=this.options.renderer||new q,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new J}static parse(t,n){return new e(n).parse(t)}static parseInline(t,n){return new e(n).parseInline(t)}parse(e){this.renderer.parser=this;let t=``;for(let n=0;n<e.length;n++){let r=e[n];if(this.options.extensions?.renderers?.[r.type]){let e=r,n=this.options.extensions.renderers[e.type].call({parser:this},e);if(n!==!1||![`space`,`hr`,`heading`,`code`,`table`,`blockquote`,`list`,`checkbox`,`html`,`def`,`paragraph`,`text`].includes(e.type)){t+=n||``;continue}}let i=r;switch(i.type){case`space`:t+=this.renderer.space(i);break;case`hr`:t+=this.renderer.hr(i);break;case`heading`:t+=this.renderer.heading(i);break;case`code`:t+=this.renderer.code(i);break;case`table`:t+=this.renderer.table(i);break;case`blockquote`:t+=this.renderer.blockquote(i);break;case`list`:t+=this.renderer.list(i);break;case`checkbox`:t+=this.renderer.checkbox(i);break;case`html`:t+=this.renderer.html(i);break;case`def`:t+=this.renderer.def(i);break;case`paragraph`:t+=this.renderer.paragraph(i);break;case`text`:t+=this.renderer.text(i);break;default:{let e=`Token with "`+i.type+`" type was not found.`;if(this.options.silent)return console.error(e),``;throw Error(e)}}}return t}parseInline(e,t=this.renderer){this.renderer.parser=this;let n=``;for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let e=this.options.extensions.renderers[i.type].call({parser:this},i);if(e!==!1||![`escape`,`html`,`link`,`image`,`checkbox`,`strong`,`em`,`codespan`,`br`,`del`,`text`].includes(i.type)){n+=e||``;continue}}let a=i;switch(a.type){case`escape`:n+=t.text(a);break;case`html`:n+=t.html(a);break;case`link`:n+=t.link(a);break;case`image`:n+=t.image(a);break;case`checkbox`:n+=t.checkbox(a);break;case`strong`:n+=t.strong(a);break;case`em`:n+=t.em(a);break;case`codespan`:n+=t.codespan(a);break;case`br`:n+=t.br(a);break;case`del`:n+=t.del(a);break;case`text`:n+=t.text(a);break;default:{let e=`Token with "`+a.type+`" type was not found.`;if(this.options.silent)return console.error(e),``;throw Error(e)}}}return n}},X=class{options;block;constructor(e){this.options=e||a}static passThroughHooks=new Set([`preprocess`,`postprocess`,`processAllTokens`,`emStrongMask`]);static passThroughHooksRespectAsync=new Set([`preprocess`,`postprocess`,`processAllTokens`]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(e=this.block){return e?K.lex:K.lexInline}provideParser(e=this.block){return e?Y.parse:Y.parseInline}};function Z(e,t){if(Array.isArray(t))for(let n=0;n<t.length;n++)e.push(t[n]);else e.push(t)}var Q=new class{defaults=i();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=Y;Renderer=q;TextRenderer=J;Lexer=K;Tokenizer=G;Hooks=X;constructor(...e){this.use(...e)}walkTokens(e,t){let n=[];for(let r of e)switch(Z(n,t.call(this,r)),r.type){case`table`:{let e=r;for(let r of e.header)Z(n,this.walkTokens(r.tokens,t));for(let r of e.rows)for(let e of r)Z(n,this.walkTokens(e.tokens,t));break}case`list`:{let e=r;Z(n,this.walkTokens(e.items,t));break}default:{let e=r;this.defaults.extensions?.childTokens?.[e.type]?this.defaults.extensions.childTokens[e.type].forEach(r=>{let i=e[r].flat(1/0);Z(n,this.walkTokens(i,t))}):e.tokens&&Z(n,this.walkTokens(e.tokens,t))}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(e=>{let n={...e};if(n.async=this.defaults.async||n.async||!1,e.extensions&&(e.extensions.forEach(e=>{if(!e.name)throw Error(`extension name required`);if(`renderer`in e){let n=t.renderers[e.name];n?t.renderers[e.name]=function(...t){let r=e.renderer.apply(this,t);return r===!1&&(r=n.apply(this,t)),r}:t.renderers[e.name]=e.renderer}if(`tokenizer`in e){if(!e.level||e.level!==`block`&&e.level!==`inline`)throw Error(`extension level must be 'block' or 'inline'`);let n=t[e.level];n?n.unshift(e.tokenizer):t[e.level]=[e.tokenizer],e.start&&(e.level===`block`?t.startBlock?t.startBlock.push(e.start):t.startBlock=[e.start]:e.level===`inline`&&(t.startInline?t.startInline.push(e.start):t.startInline=[e.start]))}`childTokens`in e&&e.childTokens&&(t.childTokens[e.name]=e.childTokens)}),n.extensions=t),e.renderer){let t=this.defaults.renderer||new q(this.defaults);for(let n in e.renderer){if(!(n in t))throw Error(`renderer '${n}' does not exist`);if([`options`,`parser`].includes(n))continue;let r=n,i=e.renderer[r],a=t[r];t[r]=(...e)=>{let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n||``}}n.renderer=t}if(e.tokenizer){let t=this.defaults.tokenizer||new G(this.defaults);for(let n in e.tokenizer){if(!(n in t))throw Error(`tokenizer '${n}' does not exist`);if([`options`,`rules`,`lexer`].includes(n))continue;let r=n,i=e.tokenizer[r],a=t[r];t[r]=(...e)=>{let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n}}n.tokenizer=t}if(e.hooks){let t=this.defaults.hooks||new X;for(let n in e.hooks){if(!(n in t))throw Error(`hook '${n}' does not exist`);if([`options`,`block`].includes(n))continue;let r=n,i=e.hooks[r],a=t[r];t[r]=X.passThroughHooks.has(n)?e=>{if(this.defaults.async&&X.passThroughHooksRespectAsync.has(n))return(async()=>{let n=await i.call(t,e);return a.call(t,n)})();let r=i.call(t,e);return a.call(t,r)}:(...e)=>{if(this.defaults.async)return(async()=>{let n=await i.apply(t,e);return n===!1&&(n=await a.apply(t,e)),n})();let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n}}n.hooks=t}if(e.walkTokens){let t=this.defaults.walkTokens,r=e.walkTokens;n.walkTokens=function(e){let n=[];return n.push(r.call(this,e)),t&&Z(n,t.call(this,e)),n}}this.defaults={...this.defaults,...n}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return K.lex(e,t??this.defaults)}parser(e,t){return Y.parse(e,t??this.defaults)}parseMarkdown(e){return(t,n)=>{let r={...n},i={...this.defaults,...r},a=this.onError(!!i.silent,!!i.async);if(this.defaults.async===!0&&r.async===!1)return a(Error(`marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.`));if(typeof t>`u`||t===null)return a(Error(`marked(): input parameter is undefined or null`));if(typeof t!=`string`)return a(Error(`marked(): input parameter is of type `+Object.prototype.toString.call(t)+`, string expected`));if(i.hooks&&(i.hooks.options=i,i.hooks.block=e),i.async)return(async()=>{let n=i.hooks?await i.hooks.preprocess(t):t,r=await(i.hooks?await i.hooks.provideLexer(e):e?K.lex:K.lexInline)(n,i),a=i.hooks?await i.hooks.processAllTokens(r):r;i.walkTokens&&await Promise.all(this.walkTokens(a,i.walkTokens));let o=await(i.hooks?await i.hooks.provideParser(e):e?Y.parse:Y.parseInline)(a,i);return i.hooks?await i.hooks.postprocess(o):o})().catch(a);try{i.hooks&&(t=i.hooks.preprocess(t));let n=(i.hooks?i.hooks.provideLexer(e):e?K.lex:K.lexInline)(t,i);i.hooks&&(n=i.hooks.processAllTokens(n)),i.walkTokens&&this.walkTokens(n,i.walkTokens);let r=(i.hooks?i.hooks.provideParser(e):e?Y.parse:Y.parseInline)(n,i);return i.hooks&&(r=i.hooks.postprocess(r)),r}catch(e){return a(e)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let e=`<p>An error occurred:</p><pre>`+L(n.message+``,!0)+`</pre>`;return t?Promise.resolve(e):e}if(t)return Promise.reject(n);throw n}}};function $(e,t){return Q.parse(e,t)}$.options=$.setOptions=function(e){return Q.setOptions(e),$.defaults=Q.defaults,o($.defaults),$},$.getDefaults=i,$.defaults=a;function Ze(...e){return Q.use(...e),$.defaults=Q.defaults,o($.defaults),$}$.use=Ze,$.walkTokens=function(e,t){return Q.walkTokens(e,t)},$.parseInline=Q.parseInline,$.Parser=Y,$.parser=Y.parse,$.Renderer=q,$.TextRenderer=J,$.Lexer=K,$.lexer=K.lex,$.Tokenizer=G,$.Hooks=X,$.parse=$,$.options,$.setOptions,$.walkTokens,$.parseInline,Y.parse,K.lex;var Qe=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/,$e=/^(['"])([\s\S]*)\1$/;function et(e){let t=$e.exec(e);return t?t[2]:e}function tt(e,t=`Nota`){let n={},r=e,i=Qe.exec(e);if(i){r=e.slice(i[0].length);for(let e of i[1].split(/\r?\n/)){let t=e.indexOf(`:`);if(t===-1)continue;let r=e.slice(0,t).trim(),i=et(e.slice(t+1).trim());r&&(n[r]=i)}}return{title:n.title??t,date:n.date,description:n.description,slug:n.slug,html:$.parse(r,{async:!1})}}var nt=/^entry-(\d+)$/,rt=Object.assign({"../assets/blogs/entry-001/index.md":e}),it=Object.assign({"../assets/blogs/entry-001/ask.md":t,"../assets/blogs/entry-001/doctor.md":n,"../assets/blogs/entry-001/index.md":e,"../assets/blogs/entry-001/seo.md":r});function at(e){return e.slice(16).split(`/`)[0]}function ot(e){let t=nt.exec(e);return t?Number(t[1]):null}function st(e){return Object.entries(it).filter(([t])=>at(t)===e&&!t.endsWith(`/index.md`)).map(([e,t])=>({name:e.split(`/`).pop()??e,source:t})).sort((e,t)=>e.name.localeCompare(t.name))}var ct=Object.entries(rt).map(([e,t])=>{let n=at(e),r=tt(t,n);return{slug:r.slug?.trim()||n,order:ot(n),title:r.title,date:r.date,description:r.description,html:r.html,files:st(n)}}).sort((e,t)=>(e.order??2**53-1)-(t.order??2**53-1));function lt(){return ct.map(({slug:e,order:t,title:n,date:r,description:i})=>({slug:e,order:t,title:n,date:r,description:i}))}function ut(e){return ct.find(t=>t.slug===e)??null}function dt(){return{...tt(`---
title: 'Blogs'
description: 'Notas sobre las decisiones, los problemas y las herramientas que uso para construir software.'
---

Espacio donde escribo sobre lo que voy aprendiendo mientras construyo cosas:
decisiones de arquitectura, problemas que me costaron más de lo que deberían y
herramientas que uso a diario.

Las entradas viven en carpetas dentro de \`src/assets/blogs/\`. El número que
aparece delante de cada título sale del nombre de la carpeta (\`entry-001\` →
\`01\`) y el título del frontmatter de cada nota, así que la lista de abajo se
genera sola.
`,`Blogs`),entries:lt()}}function ft({params:e}){let t=ut(e.slug??``);if(!t)throw new Response(`Entrada no encontrada`,{status:404});return t}export{ut as getEntry,lt as listEntries,dt as loadBlogIndex,ft as loadEntry};