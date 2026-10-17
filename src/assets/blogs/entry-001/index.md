---
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

```text
~/.config/opencode/agents/<nombre>.md   # global, todos los proyectos
.opencode/agents/<nombre>.md            # solo el proyecto
```

Un ejemplo mínimo, un revisor de solo lectura:

```md
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
```

Los campos del frontmatter que más peso tienen:

| Campo | Para qué |
| --- | --- |
| `description` | Explica el propósito del agente. OpenCode se la muestra al modelo cuando tiene que elegir cuál lanzar. |
| `mode` | `primary` (agente principal de la sesión), `subagent` (solo en sesión hija) o `all`. |
| `model` | `provider/model`, con variante opcional: `anthropic/claude-sonnet-4-5#high`. |
| `permissions` | Lista ordenada de reglas. Es la parte interesante. |
| `color` | Color en la interfaz. |
| `steps` | Máximo de pasos del modelo antes de pedirle un resumen en texto. |

### Los permisos son el diseño

Cada regla tiene tres campos: `action` (qué herramienta), `resource` (qué ruta,
comando o agente) y `effect` (`allow`, `ask` o `deny`).

```jsonc
{
  "permissions": [
    { "action": "*", "resource": "*", "effect": "deny" },
    { "action": "read", "resource": "src/**", "effect": "allow" }
  ]
}
```

La regla que decide es **la última que coincide**, así que las reglas amplias van
primero y las excepciones después. Si te equivocas de orden y dejas un `deny *`
al final, bloqueas todo lo demás.

Esto es lo que convierte a un agente en un tipo de agente. No es una sugerencia
escrita en el prompt: es un límite. Un agente de consulta que no puede escribir
no es un agente que "se porta bien", es uno al que **le falta la herramienta**.

## Los tres agentes

### 1. `ask` — consultas

El agente para preguntar, no para tocar.

- `mode: primary`, color `#5ac8fa`, **sin `model`**: usa el modelo que tenga
  seleccionado la sesión.
- Permisos: `deny` en `edit`, `shell`, `subagent` y `todowrite`; `allow` en
  `read`, `glob`, `grep`, `webfetch` y `websearch`.

```yaml
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
```

Puede leer el proyecto y consultar la web si eso ayuda a responder, pero no
puede modificar nada ni ejecutar comandos. En su prompt hay una regla de idioma
que le exige responder siempre en español, y otra que le pide decir "no lo sé"
en vez de inventar y sugerir cambiar al agente `build` cuando hace falta tocar
código.

<div data-note-file="ask.md"></div>

### 2. `doctor` — salud de proyectos React

Un auditor. Usa **React Doctor** (`npx react-doctor@latest`) para encontrar
problemas de correctitud, rendimiento, seguridad, accesibilidad y
mantenibilidad, corre los tests del repositorio y presenta un review.

- `mode: primary`, `model: opencode-go/deepseek-v4.1-flash`, color `#ff5c7a`.
- Permisos: `edit` en **`ask`**, `shell` en `allow`, `subagent` en `deny`; el
  resto de lectura y web, permitidos, igual que en `ask`.

```yaml
permissions:
  - action: edit
    resource: "*"
    effect: ask
  - action: shell
    resource: "*"
    effect: allow
```

Ese `edit: ask` es el corazón del agente: puede proponer y aplicar cambios, pero
**cada escritura pasa por tu aprobación**. Su flujo está partido en fases
numeradas desde 0 y se detiene en la fase 5, justo antes de tocar nada:

- **Fase 0 — Reconocimiento**: gestor de paquetes, versión de React y estado de
  git.
- **Fase 1 — Alcance**: pregunta qué revisar, con categorías (`Security`,
  `Accessibility`, `Performance`, `Bugs`, `Maintainability`) y ámbito (`full`,
  `changed`, `files`, `lines`).
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

### 3. `seo` — auditoría SEO

El mismo patrón que `doctor`, aplicado a otro dominio.

- `mode: primary`, mismo `model`, color `#00c9a7`.
- Los mismos permisos: `edit: ask`, `shell: allow`, `subagent: deny`.

Audita SEO técnico y on-page con áreas seleccionables: `technical`, `onpage`,
`content`, `performance`, `structured`, `social` e `i18n`. Revisa títulos,
canonical, Open Graph, jerarquía de encabezados, `alt`, enlazado interno,
JSON-LD, `robots.txt` y `sitemap`, y puede verificar en vivo con Lighthouse o
Unlighthouse cuando hay una URL.

Dos reglas que le puse explícitamente:

- **White-hat.** Nunca recomendar cloaking, texto oculto, keyword stuffing ni
  contenido duplicado deliberado.
- **No prometer rankings ni tráfico.** Entrega hallazgos técnicos verificables, y
  lo que no se pudo medir se marca como *no ejecutado*, nunca como aprobado.

<div data-note-file="seo.md"></div>

## Por qué `doctor` y `seo` comparten permisos

Porque son el mismo tipo de agente: un auditor. Leen, miden, proponen un informe
y esperan aprobación. `edit: ask` permite que el trabajo llegue hasta el borde de
la escritura sin cruzar esa línea solo.

Lo que los diferencia no son los permisos, sino el **dominio** y las fases del
prompt. Eso me dejó una plantilla reutilizable: para un auditor nuevo (por
ejemplo, de accesibilidad o de rendimiento de base de datos) basta con copiar el
esqueleto de fases y cambiar las herramientas y las categorías.

## Lo que me llevo

- Los agentes son archivos, y eso los hace versionables, revisables y difíciles
  de romper por accidente.
- Los permisos definen el **tipo** de agente, no son un detalle de seguridad:
  `ask` no escribe porque no puede, no porque se lo pidas.
- Conviene partir del agente más restrictivo. Es la misma lógica de los
  principios de mínimo privilegio, aplicada a un asistente.
- Un archivo pequeño con un flujo claro se mantiene mejor que un prompt enorme
  que intenta cubrir todo.
