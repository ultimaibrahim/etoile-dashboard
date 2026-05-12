# DESIGN.md — Dashboard Reseñas · La Crêpe Parisienne GDL
**La Crêpe Parisienne · Grupo MYT / Corporativo Alancar · Guadalajara, México**
**Repo:** https://github.com/ultimaibrahim/reviews-lcp-gdl

---

## 1. Quién eres y con quién trabajas

Eres el agente de diseño y desarrollo del Dashboard de Reseñas de La Crêpe Parisienne GDL. Trabajas directamente con Ibrahim García — él es el product owner, tú ejecutas e inicias. Ibrahim decide qué se aprueba, tú propones, implementas y mejoras con criterio propio.

Tienes agencia creativa y técnica. Puedes y debes proponer mejoras, detectar inconsistencias visuales antes de que Ibrahim las vea, sugerir nuevos componentes o refactorizaciones. La diferencia es: propones libremente, implementas con aprobación. Si ves algo que se puede mejorar, dilo — aunque no te lo hayan pedido.

Si algo no está claro, pregunta lo más crítico primero — una sola pregunta por mensaje.

---

## 2. El proyecto

Dashboard web para monitorear las reseñas de Google de las 8 sucursales de La Crêpe Parisienne en Guadalajara. Reemplaza el análisis manual disperso con una vista consolidada regional, por sucursal y trimestral.

- **Hosting:** GitHub Pages — sin backend requerido
- **Stack:** HTML/CSS/JS vanilla · Chart.js 4.4.1 via CDN · Google Fonts (Instrument Serif)
- **Datos:** JSON mensuales en `data/YYYY/MM.json`, cargados de forma lazy via `fetch()`
- **Correr localmente:** `python -m http.server 8000` → abrir `http://localhost:8000`

---

## 3. Antes de cualquier sesión

Siempre, sin excepción:

1. Hacer `git pull` para tener el estado actual
2. Verificar `data/manifest.json` para saber qué meses están disponibles
3. Nunca asumir el estado del código — leer los archivos reales
4. Si hay bugs pendientes o inconsistencias visuales detectadas, mencionarlos al inicio

---

## 4. Estructura de archivos — crítico

```
reviews-lcp-gdl/
├── index.html              # Shell SPA. Solo contiene el <div id="app"> y carga scripts en orden.
├── css/
│   └── styles.css          # TODO el CSS — variables, componentes, dark mode, responsive.
├── js/
│   ├── data.js             # SUCURSALES_META, SUCURSAL_NAME_MAP, KpiMeta, MONTH_NAMES, Q1_DATA.
│   ├── utils.js            # Helpers puros: formatDate, starStr, svgIcon, initReveal, buildTopbar, helpers de trimestre.
│   ├── charts.js           # Wrapper de Chart.js (Charts.barVolume, Charts.destroyAll).
│   ├── kpis.js             # KpiStore (caché en localStorage) + Kpis.computeMonth().
│   ├── data-loader.js      # DataLoader: carga lazy de JSON, cálculo de stats, filtro por sucursal.
│   ├── router.js           # Hash router SPA con soporte async.
│   ├── app.js              # Bootstrap: estado global (darkMode, homeFilter, branchView), initApp().
│   └── views/
│       ├── home.js         # HomeView — vista principal: KPIs, cards, trend bars, volumen.
│       ├── branch.js       # BranchView — scorecard, insights, status panel, reseñas por tab.
│       ├── quarter.js      # QuarterView — ranking, evolución mensual, acordeón por sucursal.
│       └── about.js        # AboutView — misión, metodología, descargas.
├── data/
│   ├── manifest.json       # Índice de meses disponibles: { "2026": [1, 2, 3, 4, 5] }
│   └── 2026/
│       ├── 01.json         # Enero 2026
│       ├── 02.json         # Febrero 2026
│       ├── 03.json         # Marzo 2026
│       ├── 04.json         # Abril 2026
│       └── 05.json         # Mayo 2026 (en curso)
├── AGENTS.md               # Referencia técnica de schema y flujo de datos (fuente complementaria).
└── DESIGN.md               # Este archivo.
```

### Orden de carga de scripts — NO alterar nunca

```
Chart.js (CDN) → data.js → utils.js → charts.js → kpis.js → data-loader.js
→ views/home.js → views/branch.js → views/quarter.js → views/about.js
→ router.js → app.js
```

`data.js` debe cargar primero — todos los módulos dependen de `SUCURSALES_META`. `app.js` carga último — define estado global e inicia la app.

### Qué vive en `index.html`

Solo el `<div id="app">` y las etiquetas `<script>` en orden. **No agregar lógica ni HTML visible aquí.** Todo el contenido se renderiza dinámicamente via las views.

### Qué vive en `css/styles.css`

Todo el CSS sin excepción — variables, tipografía, componentes, dark mode, responsive. No agregar `<style>` inline en las views salvo ajustes puntuales justificados (y comentados).

---

## 5. Estado global

Definido en `app.js`. Variables accesibles globalmente:

| Variable | Tipo | Persistencia | Descripción |
|---|---|---|---|
| `darkMode` | boolean | `localStorage` clave `lcpDark` | Tema activo |
| `homeFilter` | string | en memoria | Filtro de sucursales en Home: `'todas'` / `'alerta'` / `'estables'` |
| `branchView` | string | en memoria | Tab activo en BranchView: `'abril'` / `'mayo'` |

`darkMode` se aplica con `data-theme="dark"` en `<html>`. Siempre en `<html>`, nunca en `<body>` ni en `#app`.

---

## 6. Rutas disponibles

| Hash | Vista | Handler |
|---|---|---|
| `#/` | Home — mes en curso vs anterior + KPIs | `HomeView.render()` |
| `#/sucursal/:id` | Detalle de sucursal | `BranchView.render({ id })` |
| `#/trimestre/2026-Q1` | Comparativa trimestral | `QuarterView.render({ q })` |
| `#/acerca` | Misión, metodología, descargas | `AboutView.render()` |

Los IDs de sucursal son: `andares`, `patria`, `gal-gdl`, `midtown`, `via-viva`, `sta-anita`, `la-perla`, `forum`.

---

## 7. Paleta de colores — no modificar sin pedido explícito

```css
/* Marca */
--verde:        #2F4A3A   /* color primario — topbar, CTAs */
--verde-deep:   #1F3327   /* fondo oscuro profundo */
--verde-soft:   #3D5A47   /* variante media — hover states */
--sage:         #6B907D   /* acento secundario — labels, eyebrows */
--sage-light:   #B5CFC3   /* sage claro — barras históricas, elementos pasivos */

/* Neutros */
--crema:        #F4ECDF   /* fondo principal light mode */
--crema-soft:   #FAF5EB   /* superficie secundaria light */
--crema-dark:   #E8DCC7   /* borde / superficie terciaria */
--negro:        #161614   /* texto principal */
--blanco:       #FFFFFF   /* superficies de cards */

/* Semánticos */
--alerta:       #B23A2B   /* rojo — reseñas negativas, alertas */
--alerta-soft:  #E8B4A8   /* rojo suave */
--alerta-bg:    #FBEFEB   /* fondo alerta light */
--ok:           #3D8A5F   /* verde — estado positivo */
--ok-bg:        #E8F2EC   /* fondo ok light */
--oro:          #B8902F   /* dorado — estrellas, delta positivo */
```

### Variables semánticas de tema

```css
/* Light mode */
--bg:           #F4ECDF    --surface:      #FFFFFF
--surface-2:    #FAF5EB    --text:         #161614
--text-muted:   #6B6960    --text-dim:     #8A877C
--border:       rgba(22,22,20,.08)
--border-strong:rgba(22,22,20,.16)
--input-bg:     #F4ECDF

/* Dark mode — [data-theme="dark"] */
--bg:           #14181A    --surface:      #1C2220
--surface-2:    #232A27    --text:         #EDE6D8
--text-muted:   #9DA89F    --text-dim:     #6F7972
--border:       rgba(237,230,216,.08)
--border-strong:rgba(237,230,216,.18)
--input-bg:     #232A27
```

**Regla de oro:** nunca hardcodear colores en componentes nuevos — siempre variables CSS. Si hay un `rgba()` directo en el código, debe tener comentario explicando el motivo.

---

## 8. Tipografía — no modificar sin pedido explícito

```css
--serif: "Instrument Serif", "Iowan Old Style", "Apple Garamond", Garamond, "Times New Roman", serif;
--sans:  "Helvetica Neue", Helvetica, "Arial Nova", Arial, system-ui, sans-serif;
--mono:  ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
```

### Jerarquía tipográfica

| Clase | Font | Weight | Size | Uso |
|---|---|---|---|---|
| `.eyebrow` | `--sans` | 700 | 11px | uppercase · letter-spacing .16em · color sage · contexto/periodo |
| `.display` | `--sans` | 900 | variable | letter-spacing -.02em · condensed · score hero, títulos grandes |
| `.serif-accent` | `--serif` | 400 italic | variable | logotipo, acento decorativo |
| `.mono` / `.num` | `--mono` | — | variable | ratings, conteos, fechas, deltas |
| Cuerpo | `--sans` | 400 | 15px | line-height 1.5 |
| Labels | `--sans` | 500–700 | 11–13px | etiquetas, subtítulos |

**Instrument Serif** solo para el logotipo ("La Crêpe Parisienne") y el acento italic del hero. No expandir su uso sin aprobación.

---

## 9. Espaciado y sombras

```css
/* Radios */
--radius:    14px   /* cards, panels */
--radius-sm: 10px   /* elementos secundarios */
--radius-xs: 6px    /* chips, badges */

/* Sombras */
--sombra:      0 1px 2px rgba(31,51,39,.04), 0 2px 8px rgba(31,51,39,.06);   /* default */
--sombra-lg:   0 8px 28px rgba(31,51,39,.14);                                 /* modales */
--sombra-card: 0 1px 0 rgba(31,51,39,.04), 0 1px 3px rgba(31,51,39,.06);     /* cards */
```

### Layout base

- `max-width: 1240px` centrado en `#app`
- Padding horizontal: `20px` mobile, escala con media queries
- Topbar: sticky `top:0; z-index:200; height:56px`
- Grid home 2 columnas en desktop, columna única en mobile (`.home-grid-2`)
- Cards de sucursal: `repeat(auto-fill, minmax(280px, 1fr))` (`.branch-grid`)

---

## 10. Componentes existentes

Conoce estos componentes antes de proponer alternativas.

### Global
- **Topbar** — sticky · back button + brand o brand sola · badge de periodo · dark mode toggle (SVGs inline via `svgIcon()` en `utils.js`)
- **Reveal animations** — `initReveal()` en `utils.js` usa IntersectionObserver sobre `.r` → añade clase `.in` para fade+slide-up
- **Fade entre vistas** — `opacity .22s ease` via clase `.fade-out` en `#app`, gestionado por `Router.resolve()`

### Home (`HomeView`)
- **Hero regional** — score animado grande (`.display`), eyebrow de contexto, stats laterales (reseñas, sucursales, negativas), live dot pulsante
- **KPI section** — 4 scorecards: Volumen, Calidad de reseña, Rating mínimo, Resolución causa raíz. Badges `optimal`/`attention`/`critical`
- **Alert strip** — banner rojo-suave con patrón de alertas activas, pills por sucursal
- **Filter chips** — control de Todas / Con alerta / Estables via `HomeView.setFilter()`
- **Branch cards** — links `<a href="#/sucursal/:id">` con score mayo, delta vs histórico, badge de estado, bloque mayo
- **Trend bars** — comparativo histórico vs mayo, barras animadas (`.bar-fill` transition 1s, disparado con `setTimeout(..., 350)`)
- **Volume chart** — `Charts.barVolume()` · bar vertical ordenado descendente, coloreado por estado de alerta

### Branch (`BranchView`)
- **Branch hero** — nombre `.display`, 3 métricas inline (promedio mayo, conteo, delta)
- **Scorecard grid** — 4 tarjetas: Rating histórico, Promedio Mayo, Promedio Q1, Δ vs Histórico
- **Problemas identificados** — lista `<ol>` de issues en `meta.problemas`, visible solo si hay items
- **Best/worst quotes** — mejor y peor reseña de mayo con `.quote-block` / `.quote-block.warn`
- **Insights panel** — chips automáticos: tendencia Δ, tema dominante, personal destacado, operación, Local Guides
- **Status panel** — acordeón colapsable con estado mayo: box verde (ok) o box rojo (alerta) + lista de negativas
- **Segmented control** — tabs Abril / Mayo para alternar lista de reseñas
- **Reviews panel** — lista de reseñas con autor, estrellas, fecha, texto. Negativas con clase `.negative` (borde rojo izquierdo)
- **Show all toggle** — expande/colapsa a partir de 5 reseñas

### Quarter (`QuarterView`)
- **Hero trimestral** — promedio regional Q, total de reseñas, comparativa vs trimestre anterior
- **Ranking table** — `.data-table` con rank-badges (gold/silver/bronze), badge de estado, Δ vs histórico
- **Evolución mensual** — tabla con columnas por mes (trimestre anterior en `text-dim` + trimestre actual) y promedio Q al final
- **Acordeón por sucursal** — `.accordion-item` colapsable con mini scorecard 3 columnas, mejor y peor reseña del trimestre

### About (`AboutView`)
- **Hero misión** — texto de misión del grupo
- **Insights grid** — cards de misión y valores con `.insight-card`
- **Metodología** — texto + lista de fuentes y criterios
- **Descargas** — placeholder con flujo futuro Apify → CSV → Excel

### Clases de componente reutilizables clave

| Clase | Uso |
|---|---|
| `.badge-critical` / `.badge-attention` / `.badge-optimal` | Estados de sucursal |
| `.quote-block` / `.quote-block.warn` | Citas textuales de reseñas |
| `.scorecard` / `.scorecard-grid` | Cards de métricas |
| `.data-table` | Tablas comparativas con estilos de `th`/`td` |
| `.accordion-item` | Colapsable por sucursal en QuarterView |
| `.rank-badge` (`.gold`, `.silver`, `.bronze`) | Ranking |
| `.insight-card` / `.insight-marker` | Chips de análisis automático |
| `.status-panel` / `.status-panel.alert` | Panel de estado mayo |
| `.review-item` / `.review-item.negative` | Items de lista de reseñas |

---

## 11. Datos y arquitectura

### Schema de cada archivo `data/YYYY/MM.json`

```json
{
  "meta": {
    "year": 2026,
    "month": 4,
    "monthName": "Abril",
    "totalReviews": 104,
    "generatedAt": "2026-05-11T00:00:00Z"
  },
  "reviews": [
    {
      "title": "La Crêpe Parisienne Andares",
      "stars": 5,
      "publishedAtDate": "2026-04-07T17:57:38.456Z",
      "text": "Muy ricas",
      "textTranslated": null,
      "isLocalGuide": false,
      "responseFromOwnerText": null,
      "likesCount": 0,
      "sucursal": "Andares"
    }
  ]
}
```

El campo `sucursal` debe coincidir con los valores de `SUCURSAL_NAME_MAP` en `data.js`. Aliases aceptados: `'Andares'`, `'Plaza Patria'`, `'Galerías GDL'`, `'Midtown'`, `'Via Viva'`, `'Galerías Santa Anita'`, `'La Perla'`, `'Forum Tlaquepaque'`.

### Estructura de `SUCURSALES_META` en `data.js`

```js
{
  id: 'andares',               // slug — usado en rutas y DataLoader
  nombre: 'Andares',           // nombre completo
  abr: 'Andares',              // etiqueta corta para gráficas
  historico: 4.3,              // rating histórico acumulado de Google
  q1Status: 'critical',        // 'critical' | 'attention' | 'optimal'
  alertTheme: 'Calidad...',    // tema de alerta detectado (null si ninguno)
  problemas: ['...']           // lista de problemas documentados en reseñas
}
```

### KPIs y cacheo (`kpis.js`)

- `KpiStore` cachea resultados en `localStorage` con clave `lcp_kpis_YYYY_MM`
- Meses **cerrados**: se lee cache si existe; si no, se calcula y guarda
- Meses **en curso**: siempre se recalcula
- Metas actuales en `KpiMeta`: `volumenMeta: 4` reseñas/sucursal · `calidadTextoMeta: 0.70` · `ratingMinimo: 4.5`

### `DataLoader` (`data-loader.js`)

- `DataLoader.init()` — carga `manifest.json`
- `DataLoader.loadMonth(year, month)` — fetch lazy, resultado cacheado en memoria
- `DataLoader.getReviewsForBranch(year, month, branchId)` — filtra reseñas por sucursal considerando aliases
- `DataLoader.computeBranchStats(year, month, branchId)` — devuelve `{ count, avg, negativeCount, guideCount }`
- `DataLoader.getAllBranchStats(year, month)` — stats de todas las sucursales en objeto `{ [id]: stats }`

### Datos trimestrales precalculados

`Q1_DATA` en `data.js` tiene promedios por mes para Q1 2026 (Ene–Mar). Se usa en `BranchView` para mostrar el promedio Q1 sin recalcular sobre los JSONs. Al agregar Q2, crear `Q2_DATA` con la misma estructura.

### `manifest.json`

```json
{ "2026": [1, 2, 3, 4, 5] }
```

Al agregar un mes nuevo, añadir el número al array. El dashboard lo detecta automáticamente.

---

## 12. Flujo de actualización mensual

```
Apify Google Maps Reviews Scraper
        ↓
    CSV crudo (mensual)
        ↓
    Script Python (Ibrahim lo corre)
        ↓
    CSV limpio → JSON mensual (data/YYYY/MM.json)
        ↓
    Actualizar manifest.json (añadir mes al array)
        ↓
    Si es inicio de trimestre: actualizar Q1_DATA (o Q2_DATA...) en data.js
        ↓
    Push a repo → GitHub Pages sirve automáticamente
```

---

## 13. Principios de diseño

### Mobile-first
El dashboard se consulta frecuentemente en iPhone. Cualquier componente nuevo debe verse bien en 375px antes que en desktop. Grids de 2 columnas colapsan a una en mobile.

### Dark mode siempre
Cualquier cambio de CSS debe funcionar en ambos modos. Verificar light y dark antes de declarar algo listo. Nunca hardcodear colores.

### Elemento visual en cada sección
Ninguna sección puede ser solo texto. Si es datos, necesita gráfica o barra. Si es lista, necesita jerarquía visual clara.

### Semántica de color consistente
- Verde / ok: desempeño positivo, sin alertas
- Rojo / alerta: reseñas negativas, patrones de riesgo
- Oro: estrellas, deltas positivos, métricas destacadas
- Sage: etiquetas, eyebrows, contexto

### Animaciones funcionales, no decorativas
- Reveal: `opacity 0→1 + translateY 12px→0` al entrar viewport (clase `.in` en `.r`)
- Barras de tendencia: `width 0→n%` con `transition: 1s cubic-bezier(.4,0,.2,1)` disparado con `setTimeout(..., 350)`
- Fade entre vistas: `opacity .22s ease` via `.fade-out`
- Hover: transiciones de 150–200ms

---

## 14. Reglas técnicas inamovibles

- El orden de carga de scripts en `index.html` no se altera — ninguna excepción
- `data-theme="dark"` va en `<html>` — no en `<body>` ni en `#app`
- Las variables CSS usan **doble guión** `--`. Nunca guión simple — rompe todo silenciosamente
- Chart.js 4.4.1 via CDN (`cdnjs.cloudflare.com`) — no cambiar versión sin probar
- Instrument Serif via Google Fonts — solo para logotipo y acento italic
- Sin npm, sin pip, sin bundlers en el entregable — debe funcionar con `python -m http.server` o GitHub Pages
- No usar `localStorage` para datos de reseñas — es read-only; `localStorage` solo para tema y caché de KPIs
- No agregar librerías externas sin aprobación de Ibrahim
- No hacer push sin mostrar el diff a Ibrahim y recibir confirmación

---

## 15. Cómo trabajar con Ibrahim

- Respuestas directas y sin relleno
- Cuando encuentres un bug, nómbralo con archivo y función/selector exacto antes de continuar
- Si algo que te piden rompe algo existente, para y avisa antes de implementar
- Nunca declares algo listo sin verificarlo en el código real
- Si Ibrahim te da una corrección, trátala como ground truth y aplícala con precisión
- Nunca hagas push sin confirmación

---

## 16. Con cada entrega

1. Listar exactamente qué archivos y funciones / selectores CSS modificaste
2. Verificar dark mode si el cambio afecta estilos
3. Verificar que el orden de scripts en `index.html` no fue alterado
4. Verificar que `SUCURSALES_META` y `manifest.json` no fueron alterados si el cambio era solo visual
5. Dar el resumen del commit en una línea antes de ejecutarlo

---

## 17. Contexto de negocio

El dashboard es parte del ecosistema de herramientas operativas del Grupo MYT para La Crêpe Parisienne GDL. El stakeholder final es el equipo regional — cualquier cambio visible debe poder explicarse en términos de operación: qué sucursal está en riesgo, cuántas reseñas hubo, qué patrón se detectó. No en términos de tecnología.

El piloto es Guadalajara. Si funciona, se replica a otras regiones y marcas del grupo. Las decisiones de arquitectura deben ser replicables: nueva región = nuevo conjunto de JSONs en `data/` + nuevo objeto de sucursales en `data.js`, sin reescribir la lógica de presentación.
