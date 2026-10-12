# 🛠️ Changelog Técnico — Étoile Dashboard
**La Crêpe Parisienne · Grupo MYT / Corporativo Alancar**

Este documento contiene el historial técnico completo de versiones de Étoile Dashboard con especificaciones de funciones, parámetros, arquitectura y base de datos.

---

## Época Eltanin (v2.0.0 beta - Presente) [PREVIEW]

Nueva línea de numeración: las betas `2.0.0-beta.N` (parches locales con letra: `beta.1a`, `beta.1b`) validan Étoile 2.0; si se aprueban, se lanza `2.0.0`. El historial 1.x–3.5.0j (Fundacional, 2.x, Izar, Zenith) es la línea previa y se conserva intacto. Foco: sistema de inteligencia operativa interactivo y visual sobre ECharts.

### Version 2.0.0-beta.7a Eltanin - Correcciones de la auditoría (Octubre 2026) [ACTUAL]
* **Una sola definición de «queja» (`js/metrics.js`, decisión de Ibrahim)**: reseña de 1–2★ **con texto**; las de 1–2★ sin texto se descartan como queja (calificación suelta que no aporta nada accionable). Antes cada vista contaba distinto (Inicio exigía texto; KPIs, Marca, Dashboards, Trimestre y la vista SQL no), con cifras que no cuadraban (CDMX: 392 vs 343; enero: 9/10/11). Ahora 28 conteos en `data-loader`, `kpis`, `utils`, `home`, `branch`, `dashboards` y `brand` usan `Metrics.isComplaint`; la mejor/peor reseña del trimestre se elige entre reseñas con texto; `supabase_quarterly_view.sql` cuenta `negative_reviews` con texto (**Ibrahim debe ejecutarlo**). `Metrics` incluye `weightedAvg` (promedio ponderado, nunca de promedios). Verificado en navegador: las tres rutas de cálculo dan la misma cifra (oct 3/3/3, ene 10/10/10). `tests/metrics.test.js` (11) y guarda en `qa-audit` que ninguna vista vuelva a contar `stars <= 2` por su cuenta. **Pendiente de decidir**: si esas reseñas también salen del promedio y del volumen (hoy siguen contando ahí, como la Regla #11).
* **Corte de mes en hora de CDMX (decisión de Ibrahim)**: antes los límites de mes se fijaban a 00:00 UTC y las reseñas de la cena del último día (≈1.65 % en CDMX) caían en el mes siguiente. Ahora `BranchTime.monthStartIso/monthOf/nowMonth` cortan siempre en `America/Mexico_City` para todas las regiones (zona IANA, también cuadra con el horario de verano previo a 2022); lo usan las dos consultas de `data-loader.js`, el agrupado por mes y el «mes en curso» de Inicio, Dashboards y Sucursal. `supabase_quarterly_view.sql` actualizado con `at time zone 'America/Mexico_City'` (**Ibrahim debe ejecutarlo** para que los trimestres cuadren). 5 pruebas nuevas en `time`.
* **Seguridad (XSS almacenado, reproducido por el auditor)**: el texto de reseñas (contenido de terceros) se insertaba sin escapar en `quarter.js` (mejor/peor reseña del mes) y `home.js` (detalle de reseña del carrusel); ahora pasa por `escapeHtml`. `qa-audit` verifica que ninguna plantilla HTML interpole `r.text`/`rev.text` sin escapar. Pendiente: quitar `unsafe-inline` de la CSP (requiere migrar `onclick` en línea).
* **"Trimestre en curso"** calculaba mal el trimestre (`getMonth()` es 0-based: en octubre decía Q3); ahora `floor(mes/3)+1`.
* Tarjetas de sucursal sin reseñas ya no muestran un delta ficticio "vs hist" (dicen "sin reseñas"); Comparar ya no admite A = B.

### Version 2.0.0-beta.7 Eltanin - Qué Atender, Hero Interactivo y Comparar Cara a Cara (Octubre 2026)
* **"Qué atender" (Dashboards)** sustituye a "Alertas Operativas Proactivas": lista corta (4 + "Ver las N" en el Drawer) solo con lo accionable, ordenada por gravedad (crítico → atención), con punto de estado y clic a la ficha de la sucursal; los destacados (≥ 4.80★) pasan a una línea de contexto. Desaparecen el botón que escondía el bloque, `toggleAlerts` y el "General GDL" fijo. La tercera viñeta de takeaways cuenta solo lo accionable. Las reglas de detección (caída vs. histórico > 0.20★, bajo el mínimo, foco de incidencias, quejas sin respuesta) **no cambiaron**.
* **Hero del inicio interactivo**: Reseñas, Sucursales y Negativas activas son botones (`role="button"`, teclado, flecha al pasar el cursor) que abren el feed, un Drawer con las sucursales ordenadas por calificación (clic → ficha) y el feed de quejas; la calificación grande abre un Drawer de desglose por estrellas con titular contra la meta; con puntero fino, al pasar el cursor por el hero la calificación **viaja por los meses del año** (`_initHeroScrub`) y vuelve al salir.
* **Comparar rehecha ("Cara a cara")**: por defecto la mejor y la peor sucursal de la región (con ≥ 5 reseñas); intercambio A⇄B; titular por reglas (`Narrative.compare`: quién supera y por cuánto, qué más las separa —quejas o respuesta— y meses sobre la meta, avisando cuando la muestra es chica); filas de contraste con barras espejo; duelo de 12 meses (`EtoileCharts.compareDuel`, clic en un mes cambia el periodo); quejas por hora lado a lado (`compareHours`) con titular por sucursal. Se retiró el radar de "5 dimensiones": sus índices se derivaban de expresiones regulares con constantes arbitrarias (`100 − tasa × 150`, 85 por defecto).
* **Pruebas**: `narrative` 36; QA en navegador: comparar 9/9, hero y Qué atender 9/9 y regresión completa.

### Version 2.0.0-beta.6 Eltanin - Comparación entre Sucursales en el Tiempo y Entrada Escalonada (Octubre 2026) [ACTUAL]
* **Heatmap sucursal × mes (roadmap C1)**: "¿Cómo evoluciona cada sucursal?" en Dashboards, 12 meses × sucursales de la región (`Patterns.branchMonthMatrix`/`monthSpan`, `EtoileCharts.branchMonthHeatmap`). Color frente a la meta (≥ 4.60 verde, 4.40–4.60, 4.00–4.39, < 4.00 rojo) o intensidad por volumen (selector Calificación/Volumen); las celdas con < 3 reseñas se atenúan (poca muestra). Titular por reglas (`Narrative.matrix`): sucursales bajo la meta, mayor caída y mayor mejora frente al mes anterior, solo con muestra suficiente (≥ 5) y con aviso **"A vigilar (pocas reseñas)"** para calificaciones muy bajas con muestra chica (p. ej. Plaza Carso 2.33★, 3 reseñas, que la regla de muestra dejaba fuera del titular). Clic en una celda abre en el drawer único las reseñas de esa sucursal y mes (peores primero) con acceso a la ficha de ese mes. **Complejidad adaptativa**: en angosto, últimos 6 meses, etiquetas de mes cortas y sin números en las celdas.
* **Bug de navegación corregido (`ModalManager.closeAllThen`, `Drawer.navigate`)**: al "cerrar y navegar" desde un panel, `ModalManager.close()` llama a `history.back()` (asíncrono) y el retroceso **deshacía la navegación** recién hecha (afectaba "Ver ficha…" del detalle, el botón de brand y el nuevo del heatmap). Ahora se cierran todos los paneles apilados con un solo `history.go(-n)` y se navega al terminar el retroceso.
* **Bug crítico de la ficha de sucursal corregido**: `BranchView.render` declaraba `const activeMonth` y lo reasignaba cuando la sucursal no tiene reseñas en el mes elegido (`Assignment to constant variable`), por lo que **la ficha no cargaba**. Pasó inadvertido mientras la app abría en el mes anterior; con "abrir en el mes en curso" (beta.1) afectaba a las sucursales aún sin reseñas del mes (9 de 14 en CDMX en octubre). Ahora salta al mes más reciente con datos.
* **Entrada escalonada de rejillas (`initStagger`)**: scorecards, insights, takeaways, indicadores de brand y comparador entran tarjeta por tarjeta al aparecer en pantalla; activada por JS (si no corre, nada queda oculto) y respeta `prefers-reduced-motion`.
* **Layout**: `.chart-card--auto` / `.chart-wrap { flex: none }`: la rejilla de Dashboards asume tarjetas de alto fijo y un contenedor con `flex: 1` medía 0 en una tarjeta de altura automática.
* **Seguimiento de incidencias apagado por defecto** (`Incidents.ENABLED = false`, sin 404 ni UI) a petición de Ibrahim; queda listo para activarse.
* **Rendimiento (scroll y pintado)**: A/B en navegador (scroll continuo) mostró que el culpable era `backdrop-filter`/`filter: blur` sobre tarjetas, no JS: Inicio pasó de 79 % de cuadros lentos (> 33 ms) a 0 %, Dashboards y ficha de 13 % a 0 %. Se retiró el desenfoque de `.chart-card/.scorecard/.alert-strip` (regla `data-ui-premium`), `.hero-stat`, `.hero-diagnosis`, `.reporte-especial-card`, `.comp-layer.after`, `.topbar-nav`/`.mobile-sticky-bar` (ahora `--nav-bg` .97) y 10 bloques de `brand.js`. Solo quedan overlays y flotantes (`.sidebar-overlay`, `.cmd-palette-backdrop`, tooltip, onboarding, login, banner offline). `BranchTime.parts` memoizado por (zona, instante) (era el mayor consumo de JS en Dashboards, ~70 ms). Podado el CSS heredado sin referencias (`.review-card`, `.sidebar-review-card`, `.review-item`, `.modal-*` antiguos; 169 → 163 KB). `tests/qa-audit.js` vigila que no vuelva el desenfoque ni los acentos laterales.
* **Diseño — fuera lo "vibecoded"**: sin acentos de borde de un solo lado (`hero-diagnosis`, `alert-strip`, `alert-box-sunken`, `highlight-box`, `compare-branch-card`, `quote-block`, `rv-card.neg/.crit`, `story-line`…): el estado se marca con borde completo de 1 px + tinte de fondo (`color-mix`) y texto; sin brillos (`box-shadow` de color) ni degradados de fondo en alertas; "Atención inmediata" sin latido infinito ni destello. Investigación de rasgos "AI slop" resumida en `documentacion/lineamientos_etoile.md` §5.
* **Giaza solo en marca**: queda en el logotipo (barra superior, footer, carga, login); los títulos de lectura (`.section-title`, `.sidebar-title`, títulos de región, brand y privacidad, "Atención inmediata") pasan a Playfair Display por legibilidad (v/e se confundían).
* **Sin panel lateral en escritorio/tableta**: el `Drawer` es un diálogo centrado (≤ 760 px, máx. 86 vh, entrada con fundido y escala); la hoja inferior se conserva solo en móvil (≤ 640 px).
* **Key takeaways alineados**: la tarjeta usaba márgenes propios y quedaba más ancha que el resto; ahora comparte los de `.section` y `.alert-strip` (simétrica 22 px / 14 px en móvil). Icono sin círculo.
* **Acordeón de resúmenes trimestrales rediseñado**: panel abierto en crema sólido sobre el hero verde (antes translúcido: chocaba); el contenido tiene ancho fijo y la tarjeta solo lo revela, así el texto **ya no se reacomoda** al abrir/cerrar (medido: 240 px constantes durante la animación); animación con `flex-grow`/`flex-basis` y curva `cubic-bezier(.22,1,.36,1)`; ya no se activa con el cursor encima (movía el layout bajo el puntero), solo clic, Enter o Espacio (`role="button"`, `aria-expanded`, foco visible); métricas en filas etiqueta/valor; en móvil se apila y cambia de altura.
* **Heatmap de turnos de la ficha de sucursal retirado** (el de día × turno): la hora de las quejas (`hourComplaints`) ya responde "cuándo" con clic a las reseñas y titular; el heatmap sucursal × mes de Dashboards se conserva. Se eliminaron `_buildShiftHeatmap` y `_initHeatmapFocus` (quedan `filterShift`/`clearShiftFilter` sin disparador, pendientes de limpiar).
* **Pruebas**: `qa-audit` (nuevas guardas de diseño), `patterns` 18, `narrative` 30, `incidents` 20. QA en navegador: heatmap 10/10 (claro, móvil, oscuro), navegación 6/6, entrada escalonada 4/4, rediseño 18/18 (acordeón estable y accesible, takeaways simétricos y sin acentos laterales en claro, oscuro y móvil), regresión interact/attn/mig_home/mig_all/incidents_ui.

### Version 2.0.0-beta.5 Eltanin - Acciones desde las Gráficas, Heatmap con Vida y Seguimiento de Incidencias (Octubre 2026)
* **De la gráfica a la acción**: clic en una hora de "¿A qué hora llegan las quejas?" abre en el drawer único las quejas de esa hora (`components/hour-drawer.js`; `Patterns.hourly` ahora conserva `negReviews` por hora), y clic en un mes de cualquier tendencia (regional o de sucursal) cambia el periodo. El área de clic es la **columna entera** del eje X (`EC.columnClick`, con `convertFromPixel`), no solo la barra o el punto de 8 px (antes el clic cerca del punto no hacía nada, y en móvil era inusable); cursor `pointer` y pie del tooltip "Clic: …" donde hay acción.
* **Heatmap de turnos con vida (`BranchView._initHeatmapFocus`)**: entrada escalonada celda por celda, "mira de cruz" (al pasar o enfocar una celda se encienden su día y su turno y se atenúa el resto) y pulso en la celda con más quejas (si hay ≥ 2). Accesible por teclado (`focusin`).
* **Bug de animación corregido**: `animation-fill-mode: both` dejaba `transform: none` fijo del último fotograma y **anulaba el `:hover` de elevación** de las tarjetas de reseña y de Atención inmediata; ahora `backwards`.
* **Seguimiento de incidencias (pilar F)**: `supabase_incidents.sql` (NO ejecutado: tabla `review_incidents` con estado nueva → en revisión → respondida → resuelta, responsable, severidad grave/queja y bitácora JSONB; RLS con `visible_location_ids()`, sin borrado desde la app; idempotente y con rollback) y `js/incidents.js`. En la tarjeta de reseña: botón "Dar seguimiento" en las graves (y en toda queja ≤ 2★ del drawer) o el estado con su responsable; el drawer del seguimiento tiene estado, responsable, nota y bitácora con hora de 24 h; el estado se actualiza en sitio en las tarjetas visibles; una grave **resuelta** sale de "Atención inmediata"; el encabezado ofrece "Seguimiento (N)" con la lista de abiertas y, sin graves nuevas pero con incidencias abiertas, queda una franja discreta. **Si la tabla no existe el módulo se apaga solo** (`PGRST205`) y la interfaz no muestra nada; se carga en paralelo con los datos al iniciar sesión y se limpia al salir.
* **Apagado por defecto (`Incidents.ENABLED = false`)**: por decisión de Ibrahim el seguimiento queda para después; el módulo no consulta la tabla, no muestra botones y no genera ruido en consola. Para activarlo: ejecutar `supabase_incidents.sql` y poner `ENABLED = true`.
* **Pruebas**: `tests/incidents.test.js` (19, cliente de Supabase simulado: tabla inexistente, abrir, actualizar con bitácora, resolver, reabrir, filtros, errores y escape de HTML); `npm test` corre 7 suites. QA en navegador: acciones y heatmap 12/12; seguimiento 13/13 (comportamiento real sin tabla + flujo completo con la tabla simulada en la página: la RLS real queda por probar al ejecutar el SQL); regresión de interacción 10/10, atención 10/10, home migrado 13/13, modales 20/20 y flujo de región sin parpadeos.

### Version 2.0.0-beta.4 Eltanin - Patrones, Atención Inmediata y Un Solo Sistema de Interfaz (Octubre 2026)
* **Hora local de la tienda, en 24 h (`js/time.js`, `tests/time.test.js`)**: `formatDate`/`formatDateTime` mostraban la hora en **UTC** (6 h adelantada; toda reseña posterior a las 18:00 aparecía con la fecha del día siguiente) y el heatmap de turnos usaba `getHours()`/`getDay()` del navegador (dependía de dónde se mirara). Ahora todo pasa por `BranchTime` con `Intl.DateTimeFormat` y el huso de cada sucursal: Ciudad de México por defecto, Cancún (`America/Cancun`, UTC-5) y Tijuana (`America/Tijuana`, con horario de verano). `reviewWhen(r, 'short'|'long'|'date'|'time')` sustituye a los 14 puntos donde se pintaba una fecha; todas las reseñas muestran `9 oct · 21:47`.
* **¿A qué hora llegan las quejas? (`js/patterns.js`, `EtoileCharts.hourComplaints`)**: quejas ≤ 2★ con texto por hora local (Regla LCP #11), últimos 12 meses, en la ficha de sucursal y a nivel región en Dashboards. Titular por reglas: ventana pico de 3 h, % de quejas frente a % de reseñas de esa franja ("ahí se concentra el problema") o "siguen el ritmo del volumen"; con < 5 quejas no afirma ningún patrón. **Complejidad adaptativa por ancho**: móvil = barras + pico; ≥ 560 px = además franjas de turno (tinte alterno) y tasa de queja por hora. Dato real de CDMX: 37% de las quejas llega entre 20:00 y 22:59 con solo 26% de las reseñas.
* **Reseñas "Graves" (`js/severity.js`, `tests/severity.test.js`)**: reglas explícitas y explicables (sin LLM): 1★ +2, 2★ +1, texto ≥ 500 caracteres +1, categorías GRAVES (+5, bastan solas: salud, plagas, objeto extraño, legal, acoso/discriminación, cobro/estafa) y SERIAS (+2: higiene, trato); crítica si ≥ 6. Cada razón guarda la palabra que la disparó. Validada contra las 807 quejas reales: la primera calibración marcaba el 28.7% (falsos positivos: "por *demanda* uno tiene que…", "me *tocó* un cabello", "es un *robo*" por precio); recalibrada marca el 4.6% (37). Se llama **"Grave"** en la interfaz para no chocar con las "quejas críticas" (todas las ≤ 2★) que ya existen.
* **Atención inmediata (`components/attention-card.js`)**: tarjeta arriba del home (región) y de la sucursal con las reseñas graves de los últimos 14 días; solo aparece si hay alguna; "Ver las N" abre el drawer.
* **Un solo drawer (`components/drawer.js`) y una sola tarjeta de reseña (`components/review-card.js`)**: el diseño del drawer del feed se vuelve componente (panel lateral en escritorio, hoja inferior con agarre en móvil, sobre `ModalManager`: Esc, botón "atrás", scroll). Sustituye a tres sistemas de modal (`modal-overlay`, `brand-modal-overlay`, drawer del feed) y a cinco variantes de tarjeta (`review-card`, `sidebar-review-card`, `review-item`, `modal-rev-card`, tarjeta de sucursal). Migrados: feed, detalle de reseña, alertas por sucursal y consolidadas, estrellas (Dashboards), problemas (sucursal), resumen de mes concluido y los 5 modales de brand (adaptador `_showModalHtml`, con drill-down y "Volver" dentro del mismo panel). La tarjeta única añade la hora de 24 h, la insignia Grave con razones y la marca "Sin respuesta" en quejas sin contestar.
* **Titulares por reglas en cada gráfica (`js/narrative.js`, `tests/narrative.test.js`)**: ranking ("2 de 9 sucursales están bajo la meta… la más rezagada… poca muestra"), volumen, distribución, tendencia de calificación (mejor/peor mes, mes en curso) y de volumen. Dashboards se reordena por importancia: ranking y tendencia primero; volumen, distribución y horas después.
* **Inmersión**: `EC.linkHover` vincula volumen y ranking (pasar el cursor por una sucursal la resalta y atenúa el resto en la otra); mejor y peor mes marcados con pin en las tendencias (se añade `MarkPointComponent` al build propio, sin él ECharts ignoraba la opción en silencio); entrada escalonada de barras; tarjetas de gráfica con elevación al pasar el cursor; tarjeta de reseña con entrada escalonada y punto que late en las graves.
* **Bugs previos corregidos**: el `globalId` de la precarga usaba la posición en todo el historial y `getReviewByGlobalId` no encontraba la reseña (clic en el feed no abría el detalle); el modal de problemas de sucursal tenía un fondo verde oscuro fijo incluso en modo claro; el drawer del feed era translúcido sin desenfoque (se veía gris sobre el overlay) y ahora tiene fondo sólido; casilla "Solo pendientes" apilada y centrada; carrusel y feed no coincidían en qué es "negativa" (≤ 3★ vs ≤ 2★); resumen de mes concluido decía "GDL" fijo en cualquier región; `corporate` sin etiqueta en la ficha de sucursal.
* **Pruebas**: `npm test` corre ahora 6 suites (89 pruebas unitarias nuevas: `time` 15, `patterns` 12, `severity` 23, `narrative` 19 y las existentes). QA automatizado en navegador (Playwright): interacción 10/10, atención y drawer 10/10, home migrado 13/13, modales migrados 20/20, flujo de región sin parpadeos; capturas en claro, oscuro y móvil. Todos los scripts con `?v=2.0.0-beta.4` para invalidar caché.

### Version 2.0.0-beta.3 Eltanin - Chart.js Retirado: Radar de Compare y Gráficas de Brand en ECharts (Octubre 2026)
* **Radar de `compare.js` migrado** (`EtoileCharts.radar`, módulos `RadarChart`/`RadarComponent` añadidos al build propio: 743 KB, 257 KB gzip): mismos 5 ejes 0-100, serie A dorada y B verde punteada, etiquetas y rejilla por tema. Se fijan `clockwise: true` y el orden de dibujo (la serie A encima), porque ECharts gira en sentido antihorario por defecto y el radar salía reflejado respecto a Chart.js. Tooltip crystal con los 5 valores de la serie.
* **Gráficas de `brand.js` migradas**: `EtoileCharts.barScore` (rendimiento ajustado por región) y `donutDistribution` ahora configurable (`decimals`, `unit`, tamaño de leyenda) para la participación de volumen.
* **Chart.js 4.4.1 retirado**: se quita la carga bloqueante desde cdnjs de `index.html`; `charts.js` queda con solo `Charts.destroyAll()` (libera los `ChartWrapper`); se elimina el CSS muerto `.crystal-tooltip-float`. Ya no hay ningún `new Chart` en el repo.
* **Bug previo corregido (brand)**: las barras de "Rendimiento ajustado por región" se dibujaban **todas en negro** porque se pasaban `var(--oro)` y `var(--verde-soft)` como color de canvas, que no los entiende. Ahora `EC.cssVar()` resuelve la variable a su valor real: la primera región en dorado y las demás en verde, como se pretendía.
* **Bug previo corregido (brand en móvil)**: la rejilla forzaba columnas de mínimo 450 px y desbordaba horizontalmente en pantallas de 390 px (leyenda de la rosca cortada); ahora `minmax(min(450px, 100%), 1fr)`.
* **QA automatizado**: capturas antes/después contra el commit anterior servido en otro puerto (compare y brand, claro/oscuro/móvil), 0 errores de consola; suites de interacción de beta.2 repetidas sin regresiones.

### Version 2.0.0-beta.2 Eltanin - Migración Completa de las Gráficas a ECharts (Octubre 2026)
* **Las 8 gráficas de `charts.js` migradas a ECharts (`js/charts-echarts.js`)**, con las mismas firmas: `stackedVolume`, `barRanking`, `starDistributionBar` y `lineTrend` (dashboards), `branchRatingTrend` y `branchVolumeTrend` (sucursal), más `barVolume` y `donutDistribution` (sin llamadas hoy, portadas por completitud). Las vistas pasan de `<canvas>` a contenedores `<div>` y de `Charts.*` a `EtoileCharts.*`.
* **Helpers compartidos (`EC`)**: paleta por tema, ejes con el estilo de Étoile, `goalLine` (equivale al plugin `targetLine`: línea de meta punteada con etiqueta), etiquetas del eje X adaptativas (se rotan 30° solo cuando no caben, como hacía Chart.js) y ocultado del tooltip táctil a los 5 s.
* **Tooltip crystal en HTML (`.etoile-tip-card`, `css/styles.css`)**: misma tarjeta que `crystalTooltipHandler`, con indicador por serie, título serif dorado y pie con el total en la apilada.
* **Interacciones conservadas**: clic en segmento de la apilada → feed de reseñas, clic en barra del ranking → ficha de sucursal, clic en cualquier punto de una fila de la distribución → modal de reseñas (como el modo `index` de Chart.js), cursor `pointer` donde hay clic.
* **Detalles de fidelidad**: la tendencia regional conserva la rejilla y las etiquetas solo hasta 5.0 (el eje llega a 5.15); las barras del ranking llevan la etiqueta `★ (desviación)` dentro; la meta de la tendencia de rating de sucursal se dibuja bajo la línea para no pisar la serie; la meta de volumen siempre queda dentro del eje (antes podía quedar fuera).
* **Bug previo corregido**: el clic en la gráfica de volumen de `dashboards` lanzaba `ReferenceError: sortedBranches is not defined` (la variable nunca existió; la lista correcta es `sortedVol`), por lo que nunca abría el feed.
* **Layout**: `.home-grid-2 > .section { width: 100% }`: sin el canvas de Chart.js ya nada ensanchaba la sección y las tarjetas se encogían al contenido (335 px en vez de 590 px).
* **`charts.js` de 875 a 88 líneas**: quedan solo el tooltip global de Chart.js, `Charts.instances` y `Charts.destroyAll()` (también libera los `ChartWrapper`), porque `brand.js` y `compare.js` siguen en Chart.js hasta `beta.3`.
* **QA automatizado (Playwright + Chromium, fuera del repo)**: comparación de capturas antes/después en claro, oscuro y móvil (390 px); 10/10 comprobaciones de interacción (4 tooltips de dashboards, 2 de sucursal, 3 clics, cambio de tema) y 0 errores de consola; `compare` (Chart.js) verificado sin regresiones.

### Version 2.0.0-beta.1 Eltanin - Cimientos ECharts: Build Propio, Chart Wrapper y Gráfica Hero Migrada (Octubre 2026)
* **Build propio de ECharts 6 con tree-shaking real** (`src/echarts-entry.js` + `scripts/build-echarts.js`, esbuild): solo línea, barra, pie, scatter, heatmap y los componentes de grid, tooltip, leyenda, `dataZoom`, `markArea`/`markLine`, `visualMap`, calendario y brush, con render canvas. Sale a `js/vendor/echarts.custom.min.js` (versionado, sin CDN: la CSP no cambia y el sitio sigue sin paso de build en producción).
* **Chart wrapper (roadmap A5, `js/components/chart-wrapper.js`)**: contenedor único con estados `ready`/`loading`/`empty`/`error`, `ResizeObserver` y limpieza (`disposeAll`, enganchado a `Charts.destroyAll`).
* **Primera gráfica migrada (`js/charts-echarts.js`)**: `heroTrend` del home pasa de Chart.js a ECharts (el `<canvas>` es ahora un contenedor `<div>`). Chart.js 4.4.1 sigue cargado para las demás gráficas hasta `beta.3`.
* **Fondo de video del login restaurado**: el commit `29f4065` (8-jul) sacó `videos/*.mp4` del repo y `*.mp4` quedó en `.gitignore`; `19ca7f7` borró además los `<video>` y la playlist de `login.js`, por lo que en producción el fondo nunca cargaba. Se revierte esa parte de `19ca7f7` (playlist aleatoria sin repetición, doble `<video>` con precarga e intercambio al terminar) y los 4 videos se recomprimen sin audio (H.264, CRF 30, `faststart`: de 13.7 MB a 7.2 MB) con excepción `!videos/*.mp4` en `.gitignore`. `media-src 'self'` de la CSP ya los permite.
* **Mes por defecto = el más reciente con datos** (`select-region.js` → `getDefaultPeriod`): ya no abre en el "mes cerrado" (mes calendario anterior); monitorea siempre lo último. El aviso "el mes X ha terminado" de los primeros 7 días (`getConcludedMonthInfo`) no cambia.
* **Carga más rápida (login y cambio de región)**: causa medida: `preloadAllReviews()` descargaba el historial completo de la región en páginas de 1000 **en serie** (GDL 1,227 ms, CDMX 1,349 ms solo de red) y todo el flujo era secuencial.
  - `preloadAllReviews`: página 0 con `count: 'exact'` y el resto de páginas en paralelo (`Promise.all`), con respaldo secuencial si no hay total. Mismas filas que antes (2,194 / 4,775); GDL 700 ms, CDMX 823 ms.
  - `DataLoader.init()` (manifiesto) y `computeHistoricalRatings()` corren en paralelo en `AppAuth.login`, el arranque (`app.js`) y `switchRegion`.
  - **Caché por región con TTL de 5 min** (`DataLoader._regionStore`): `switchRegion` reutiliza sin red una región ya precargada (en el waterfall real, CDMX se descargaba dos veces: en el login y al elegirla, 5 páginas / ~428 KB c/u). Reelegir una región cargada: 6 ms y 0 consultas; vencida o nueva: recarga. El almacén se vacía al iniciar y cerrar sesión (cada rol tiene alcance distinto por RLS).
  - **Precarga diferida por rol**: `select-region` solo usa el manifiesto, no la precarga pesada. Los roles que aterrizan ahí (admin/corporate/regional/zonal) solo corren `init()` en el login y al refrescar en `#/select-region` o `#/brand`; el gerente (entra directo a su región) conserva la precarga completa.
  - **Causa raíz de la UI "trabada" (medida con QA automatizado, Playwright + Chromium)**: `_applyHistoricalRatings()` bloqueaba el hilo principal **~2.5 s** en cada entrada a una región (tarea larga de 2,526 ms, incluso con la región en caché y 0 peticiones). Para cada una de las ~33 sucursales recorría las 4,775 reseñas de CDMX llamando dos veces a `resolveBranchMeta`, que normalizaba (NFD + regex) todos los ids/nombres en cada llamada (>300 mil llamadas). `resolveBranchMeta` ahora se memoiza por entrada (`_rbmCache`, invalidada si cambia `SUCURSALES_META_ALL`) y el resultado es idéntico. `_applyHistoricalRatings`: 2,500 ms → ~40 ms; `switchRegion` con caché: ~2,500 ms → ~45 ms; clic → home: ~3.9 s → ~1.5 s (800 ms de animación + 150 ms del Router + render). Beneficia además a todo lo que usa `isSameBranch`.
  - **Loader de región atado al render** (`showRegionTransitionLoader`): causa del parpadeo de `select-region` y de la UI "trabada" al entrar y salir de una región: el callback corría a los 800 ms y el telón subía a los 1100 ms **fijos**, aunque la descarga o el render tardaran más. Ahora el telón espera (mínimo 1100 ms) a que el callback termine y a que el Router emita el nuevo evento `etoile:route-rendered` (tope de seguridad de 10 s); un error en la transición ya no deja el telón atorado.
  - **Caché corporativa independiente (`_brandCache`, TTL 5 min)**: `loadBrandData` (octubre/septiembre de todas las regiones, usado por `select-region` y `brand`) vivía en `cache`, que se reemplaza al cambiar de región; por eso se volvía a pedir cada vez que se regresaba al selector (2 consultas, ~66 KB). Se vacía al iniciar y cerrar sesión.
  - `<link rel="preconnect">` a Supabase en `index.html` (handshake TLS en paralelo con la carga de scripts).
  - `SelectRegionView.handleSelect`: la descarga de la región arranca al hacer clic y corre mientras dura la animación del loader; el callback solo espera la promesa. Antes empezaba al terminar la animación (el desfase de 2–3 s con la pantalla de regiones visible).
* **Plan**: `documentacion/plan_v2.0.0.md`. `package.json` pasa a `2.0.0-beta.1`.

## Generación Zenith (v3.5.0 - v3.5.0j)

Representa la era de la perfección en rendimiento, inmediatez absoluta y estética de alta dirección. Introduce el motor de almacenamiento reactivo SWR, Command Palette universal y herramientas analíticas avanzadas.

### Version 3.5.0j Zenith - Rol `corporate` con Migración en Dos Fases (Octubre 2026) [PROD]
* **Roadmap A10**: el frontend (`utils.js`, `home.js`, `brand.js`, `select-region.js`) reconoce el rol `corporate` (acceso nacional + `#/brand`, etiqueta "Corporativo") y conserva `admin`/`regional`/`director` como alias, por lo que se puede desplegar antes de tocar la base.
* **`supabase_roles_corporate.sql` (no ejecutado)**: fase 1 amplía `profiles_rol_check` y `visible_location_ids()` para aceptar `corporate` junto a los roles actuales; fase 2 (comentada, tras el deploy) migra `admin`/`regional` a `corporate` y retira los alias, dejando `corporate`/`zonal`/`gerente`. Resuelve de paso `director`, que el código usaba pero la base nunca admitió.

### Version 3.5.0i Zenith - Retiro de Apify, Sync Incremental y Backlog de Clasificación (Octubre 2026)
* **Retiro de Apify**: `README.md` (insignia, diagrama de ingesta, stack y variables de entorno) y la FAQ de `js/views/about.js` describen ahora la API oficial de Google Business Profile con sync cada 30 min. `classify-review.js` ya no acepta `APIFY_WEBHOOK_SECRET` como respaldo: su único secreto es `DIAG_SECRET`. Las entradas históricas del changelog que nombran Apify se conservan. Pendiente fuera del repo (Ibrahim): borrar `APIFY_TOKEN` y `APIFY_WEBHOOK_SECRET` en Netlify; desactivar Schedules y webhook y revocar el token en console.apify.com.
* **Sync incremental (`gbp-sync.js`)**: sin `?full=true` ya no lee toda la sucursal; `loadLinkedReviews` trae solo las filas vinculadas a los `reviewId` recibidos (`raw_gbp_payload->>reviewId`, en bloques de 100). Una reseña sin vínculo es nueva, porque el historial de Apify se concilió en la carga inicial (3.5.0f). `?full=true` conserva la lectura completa y la conciliación difusa.
* **Sin reescrituras innecesarias**: `isUnchanged` compara estrellas, texto, respuesta, autor y fechas (`published_at`, `updated_at`, `reply_published_at`) y omite del upsert lo que no cambió; las filas históricas aún sin vincular sí se escriben para quedar vinculadas. Dry-run en Antea (antes 1,707 filas leídas por corrida): 50 leídas, 50 sin cambios, 0 escrituras, 2.7 s. La respuesta del endpoint añade `unchanged` por sucursal.
* **Backlog de clasificación (`scripts/classify-backlog.js`)**: clasifica con el motor local las quejas de 1-2★ con texto cuya `classification` es `NULL` (nunca pisa existentes). Ejecutado: 396 clasificadas, 0 pendientes (antes ~47%).
* **Pruebas**: `tests/gbp-sync.test.js` suma 3 casos de `isUnchanged` (20 en total).

### Version 3.5.0h Zenith - Hotfix: Build de Netlify Detenido por el Escaneo de Secretos (Octubre 2026)
* **Causa**: al cargar `GBP_ACCOUNT_ID` como variable de entorno, el escaneo de secretos de Netlify encontró su valor escrito en `CHANGELOG.md` y `supabase_gbp_mappings.sql` y abortó el build (`exit code 2` en "building site"). El deploy fallido no se publica, así que producción no se vio afectada.
* **Corrección**: se elimina el identificador de cuenta de los archivos versionables (`CHANGELOG.md` usa `<ID_DE_CUENTA>`); `supabase_gbp_mappings.sql` es un artefacto generado por `gbp-setup.js --sync-mappings` y deja de versionarse (`.gitignore`); `GBP_ACCOUNT_ID` se agrega a `SECRETS_SCAN_OMIT_KEYS` en `netlify.toml` por no ser un secreto.
* **Prevención (`tests/qa-audit.js`)**: nueva comprobación que cruza todos los valores del `.env` contra los archivos versionables, replicando el escaneo de Netlify antes de subir.

### Version 3.5.0g Zenith - Acceso por Alcance Impuesto en la Base (RLS) y Gerente con Vista Regional (Octubre 2026)
* **Lectura por alcance en Supabase (`supabase_rls_scoped.sql`)**: la matriz de roles que antes solo se aplicaba en el navegador ahora la impone la base. `admin`/`director`/`regional` y `zonal` leen las 33 sucursales; `gerente` lee las sucursales de su región asignada más su propia tienda; sin sesión, sin perfil o con rol desconocido no se lee nada (falla cerrado). El acceso al panel `étoile corporativo` (`#/brand`) sigue siendo una puerta de interfaz (`admin`/`director`/`regional`), ya que consume los mismos datos que puede leer un `zonal`.
* **Cierre de la lectura anónima**: se retira la política pública de `reviews_core` y `locations`, se revoca `SELECT` a `anon` y las vistas `reviews`, `quarterly_stats` y `review_months` pasan a `security_invoker`, por lo que aplican las políticas de quien consulta. Una sola función (`visible_location_ids()`, `SECURITY DEFINER`) concentra la regla y se evalúa una vez por consulta. Las funciones de Netlify usan `service_role` y no se ven afectadas.
* **Verificación con sesiones reales**: gerente de Andares → 8 sucursales (GDL); gerente de Aztlán → 14 (CDMX); zonal, regional y admin → 33; `anon` bloqueado en todas las tablas y vistas.
* **Frontend (`js/data.js`, `js/utils.js`)**: se elimina el recorte que dejaba al gerente solo con su tienda; ahora `setRegionActiva` expone todas las sucursales de su región y el texto de bienvenida lo refleja. La tienda asignada sigue disponible con `AppAuth.getUserSucursal()`.
* **Nota de datos**: `profiles_rol_check` solo admite `admin`, `regional`, `zonal` y `gerente`; `director` no existe en la base y por ahora los directores y el único regional usan el rol `admin`.

### Version 3.5.0f Zenith - Ingesta en Producción desde Google Business Profile, Conciliación de Historial y Sync Programado (Octubre 2026)
* **Acceso a la API oficial verificado de punta a punta**: token OAuth renovado (`scripts/gbp-auth.js`), cuenta `accounts/<ID_DE_CUENTA>`, 45 ubicaciones listadas y reseñas leídas con éxito en las 45 (Google My Business API v4 habilitada en el proyecto de Cloud).
* **Vinculación de sucursales (`scripts/gbp-setup.js --sync-mappings`)**: empata por nombre normalizado las 33 sucursales de `locations` con su `gbp_location_id`, descartando fichas duplicadas (`metadata.duplicateLocation`), cerradas permanentemente y sin acceso. Genera `supabase_gbp_mappings.sql` para auditoría. Alias: `Plaza Península Tijuana → peninsula`, `The Park San Luis Potosí → the-park` (la ficha "San Luis" es una ficha vieja y no se sincroniza).
* **Conciliación con el historial de Apify (`netlify/functions/gbp-reconcile.js`)**: los IDs de Apify (`Ci9D…`) no coinciden con los `reviewId` de Google (`AbFvOq…`), por lo que un upsert directo duplicaba ~10 mil filas y perdía las clasificaciones. La conciliación empata cada reseña, en orden de confianza, por: (1) `raw_gbp_payload.reviewId` ya vinculado, (2) estrellas + marca de tiempo ±2 s, (3) estrellas + texto normalizado, (4) sin texto + estrellas + ±1 día, (5) mismo texto aunque cambien las estrellas (reseña editada). Conserva el `id` histórico y no envía `classification`, por lo que el upsert no la pisa.
* **Carga inicial ejecutada**: 10,398 reseñas leídas de Google; 9,485 empatadas con el historial, 914 nuevas insertadas; 0 filas viejas perdidas; 5,232 clasificaciones intactas; 0 IDs duplicados. Respaldo previo en `backups/` (ignorado por git).
* **Fechas exactas**: las filas empatadas adoptan el `createTime` oficial de Google. 927 reseñas cambiaron de fecha (Apify aproximaba las antiguas con fechas relativas); 115 cruzaron de trimestre, por lo que los acumulados trimestrales históricos pueden variar ligeramente.
* **Endurecimiento de `gbp-sync.js`**: paginación con `nextPageToken` (`?full=true` historial completo, por defecto las 50 más recientes por `updateTime`), estrellas desconocidas se omiten en lugar de inventarse como 5★, `is_local_guide` ya no se infiere (la API no lo expone), limpieza de la traducción automática de Google anexada al comentario (77% de los textos), texto vacío guardado como `NULL`, pausa entre llamadas para respetar la cuota.
* **Sync programado (`netlify/functions/gbp-sync-cron.js`)**: cada 30 min procesa 1/6 de las sucursales (`?slot=&slots=`), refrescando cada sucursal cada 3 h dentro del límite de tiempo de Netlify. Protegido con `GBP_SYNC_SECRET`.
* **Clasificación (`classify-review.js`)**: escribía en la vista `reviews` una columna inexistente (`classification_status`); ahora escribe en `reviews_core`. El sync solo clasifica quejas (≤2★ con texto) nuevas o sin clasificar, con el clasificador local (sin LLM), y nunca re-clasifica el historial.
* **Reparaciones SQL (`supabase_gbp_fixes.sql`)**: `review_months` apuntaba a la tabla vieja renombrada y terminaba en agosto 2026, por lo que el calendario del frontend no mostraría septiembre ni octubre. Incluye además, comentado, el endurecimiento de lectura anónima de `reviews`/`reviews_core` (`security_invoker`).
* **QA**: `tests/gbp-sync.test.js` (17 pruebas unitarias de conciliación, limpieza y parseo) integrado a `tests/qa-audit.js`, junto con verificación de sintaxis del pipeline, del cron en `netlify.toml` y escaneo de secretos en archivos versionables.

### Version 3.5.0e Zenith - Arquitectura Oficial Google Business Profile (GBP API) y Reestructuración de Supabase (Septiembre 2026)
* **Deshabilitación Definitiva de Scraping vía Apify (`netlify/functions/apify-ingest.js`)**:
  - Endpoint legado retirado formalmente respondiendo HTTP `410 Gone`, cancelando consumo de scrapers externos y migrando el pipeline hacia la API oficial de Google Business Profile.
* **Reestructuración de Base de Datos en Supabase (`supabase_gbp_migration.sql`)**:
  - Creación de tabla relacional normalizada `locations` con catálogo de las 33 sucursales de La Crêpe Parisienne, vinculación a regiones y slots para `gbp_account_id`, `gbp_location_id` y `google_place_id`.
  - Creación de tabla `reviews_core` con tipado estricto (`SMALLINT`, `TIMESTAMPTZ`, llaves foráneas a `locations.id` y payload crudo `raw_gbp_payload` para auditoría).
  - Migración idempotente de todo el histórico de reseñas preexistentes en `reviews` a `reviews_core`.
  - Capa de retrocompatibilidad absoluta mediante vista `CREATE VIEW reviews AS ...` y `quarterly_stats` para garantizar 0 roturas en `DataLoader` y en las vistas del frontend.
  - Blindaje con Row Level Security (RLS) habilitando `SELECT` público e `INSERT/UPDATE` reservado a `service_role`.
* **Módulo Oficial de Ingestión GBP (`netlify/functions/gbp-sync.js`)**:
  - Pipeline de sincronización directa con Google OAuth2 (`GBP_REFRESH_TOKEN`), paginación nativa de Google Business Profile API y mapeo atómico hacia `reviews_core`.
  - Detección e ingestión de respuestas del propietario en tiempo real (`reviewReply`) y clasificación semántica de quejas (1-2★).
* **Herramienta CLI de Inicialización y Diagnóstico GBP (`scripts/gbp-setup.js`)**:
  - Script administrativo para listar cuentas, consultar ubicaciones de Google y diagnosticar el estado de vinculación de las sucursales con Supabase.
* **Suite de QA Reforzada (`tests/qa-audit.js`)**:
  - Validación sintáctica y estructural de los nuevos artefactos de base de datos y backend (77/77 pruebas aprobadas con 0 errores).

### Version 3.5.0d Zenith - Totales Marginales en Heatmap, Contraste AAA y Óptica Ejecutiva (Septiembre 2026)
* **Claridad Visual Absoluta y Erradicación de Gráficos Confusos (`js/views/compare.js`)**:
  - Eliminación de gráficos abstractos o sobrepuestos en la vista comparativa; enfoque estricto en el **Radar de 5 Ejes** con paleta contrastada (Oro Champagne `#E5B842` vs Salvia Esmeralda `#5CE1A6`) y la **Tabla de Contraste Directo con Insignias de Ganador**, garantizando legibilidad instantánea sin requerir conocimientos técnicos.
* **Totales Marginales en Heatmap Operativo ("Show the Totals" de Chartosaur) (`js/views/branch.js`)**:
  - Incorporación de columna marginal derecha (`Total Turno`) para identificar el turno más conflictivo de toda la semana y fila marginal inferior (`Total Día`) para auditar la carga diaria.
  - Celda de Gran Total semanal consolidado en esquina inferior derecha.
  - Apego estricto a la Regla Inamovible LCP #11: todos los marginales excluyen rigurosamente reseñas sin texto.
* **Micro-Intervalo de Incertidumbre Bayesiana (`js/views/select-region.js`)**:
  - Incorporación de micro-indicador visual de certidumbre muestral ($w = \text{count} / (\text{count} + 15)$) en la columna de puntajes ajustados de la tabla de Standings regionales.
  - Proporciona transparencia estadística inmediata sobre tiendas con pocas reseñas frente a grandes complejos.
* **Refinamiento Cromático y Óptica de Alto Contraste AAA (`css/styles.css`, `js/charts.js`)**:
  - Elevación de contraste de texto secundario en modo oscuro `--text-dim: #8E9D93` (ratio 5.4:1 WCAG AAA).
  - Incorporación de tokens `--dv-oro` y `--dv-sage` para visualizaciones de alta fidelidad.
  - Resplandor luminoso difuso (`shadowBlur: 5`) en líneas de meta regional (`TargetLinePlugin`).
  - Atenuación de gridlines redundantes (anti-distracción) en gráficos de ranking y volumen.
  - Suite de pruebas de QA ampliada en `tests/qa-audit.js` (69/69 pruebas aprobadas con 0 errores).

### Version 3.5.0c Zenith Intelligence - Heatmap Operativo (3 Turnos), Comparador Head-to-Head y Exclusión Estricta de Reseñas Sin Texto (Septiembre 2026)
* **Heatmap Operativo de Fricciones por Turnos Reales (`js/views/branch.js`)**:
  - Matriz visual e interactiva de 7 días de la semana × 3 turnos operativos oficiales de restaurante (Desayuno `09:00 - 12:59`, Comida `13:00 - 16:59` y Cena `17:00 - 22:00+`), eliminando la franja obsoleta de merienda.
  - Algoritmo de ponderación de criticidad por turno basado en incidencias de ≤2★ y cálculo de promedio por celda.
  - Filtrado reactivo en 1 clic: al pulsar una celda, la tabla de opiniones inferior filtra instantáneamente las reseñas correspondientes a ese turno específico, con pill banner y botón de restablecimiento.
* **Regla Inamovible LCP: Exclusión Estricta de Reseñas Sin Texto (`branch.js`, `compare.js`)**:
  - Las opiniones sin texto descriptivo (`!r.text || r.text.trim().length === 0`) se contabilizan estrictamente para volumen bruto (`count`) y promedio global (`avg`).
  - Quedan 100% omitidas del Heatmap Operativo, quejas críticas, tasa de fricción y análisis temático (servicio, calidad, precio) para garantizar diagnósticos procesables sin ruido ni quejas vacías.
* **Comparador Head-to-Head de Sucursales (`js/views/compare.js`, ruta `#/comparar`)**:
  - Módulo analítico split-screen con selectores squircle para contrastar libremente dos sucursales (soporta precarga mediante hash `#/comparar?a=andares&b=gal-gdl`).
  - Gráfico de **Radar Operativo de 5 Dimensiones** en Chart.js (CSAT General, Servicio, Calidad, Valor y Tasa de Respuesta).
  - Píldora flotante con cálculo automatizado de deltas en rating y volumen mensual.
  - Tabla matriz directa parámetro por parámetro con insignias dinámicas de tienda líder.
  - Generador automatizado de Veredicto Ejecutivo de Desempeño.
* **Blindaje de Estabilidad y Desactivación de Atajo Global**:
  - Desactivación de atajos conflictivos de teclado para garantizar 100% de estabilidad y rendimiento óptimo en todas las vistas.
  - Integración de ruta `#/comparar` en `Router.match` y `Router.updateRouteMeta` con metadatos reactivos.
  - Enlaces de navegación incorporados en la Topbar, menú móvil y acceso rápido en la cabecera de cada sucursal.
  - Suite de pruebas de QA actualizada en `tests/qa-audit.js` (61/61 pruebas aprobadas con 0 errores).

### Version 3.5.0b Zenith UI - Atmósfera Crystal, Tooltips HTML y Command Palette (Septiembre 2026)
* **Command Palette Universal Omnibox (`js/components/command-palette.js`)**:
  - Modal flotante accesible vía `Ctrl + K` (Windows/Linux) y `Cmd + K` (macOS), o toque en el nuevo botón squircle `⌘K` del Topbar.
  - Búsqueda difusa instantánea (<1ms) con soporte para todas las sucursales nacionales, rutas del sistema, periodos y acciones globales.
  - Navegación asistida 100% por teclado (`↑` / `↓` para enfocar, `Enter` para ejecutar, `Esc` para salir).
* **Tooltips HTML Flotantes Crystal para Chart.js (`js/charts.js`)**:
  - Desacoplamiento total del tooltip de Canvas predeterminado mediante el callback `external: crystalTooltipHandler`.
  - Tarjetas flotantes DOM `.crystal-tooltip-float` con glassmorphism (`backdrop-filter: blur(16px)`), tipografía editorial *Playfair Display*, bordes de oro champagne y micro-indicadores circulares de categoría.
* **Atmósfera Cinematográfica y Spotlight Tracking (`css/styles.css`, `js/utils.js`)**:
  - Inyección de micro-capa procedural SVG `feTurbulence` (`.grain-overlay`) para erradicar el color banding en pantallas OLED.
  - Efecto de seguimiento de cursor en tiempo real (`.spotlight-card`) con halo radial difuso dorado de 400px en GPU sin layout thrashing.
  - Suite de pruebas de QA actualizada en `tests/qa-audit.js` (56/56 pruebas superadas).

### Version 3.5.0a Zenith Core - Motor Reactivo IndexedDB y Stale-While-Revalidate (Septiembre 2026)
* **Arquitectura de Persistencia Local (`js/etoile-cache.js`)**:
  - Motor autónomo basado en **IndexedDB nativo** (`etoile_zenith_db`, v1) con 3 almacenes segregados: `reviews_cache`, `manifest_cache` y `stats_cache`.
  - Fallback transparente a mapas en memoria volátil si el cliente navega en Modo Incógnito estricto con almacenamiento bloqueado.
* **Patrón Stale-While-Revalidate en DataLoader (`js/data-loader.js`)**:
  - Carga instantánea de reseñas y manifiestos en **<5ms** desde IndexedDB sin mostrar spinners de espera.
  - Validación y sincronización asíncrona de fondo con Supabase (`_revalidateMonth`, `_revalidateQuarter`).
  - Emisión de evento reactivo `etoile:data-synced` para actualizar las vistas discretamente en caso de cambios nocturnos en el backend sin recargar la página.
* **Actualización de Suite de Pruebas y Cache-Busting**:
  - Integración de `js/etoile-cache.js` en `tests/qa-audit.js` (51 pruebas superadas con 0 errores).
  - Inyección de identificador de versión `?v=3.5.0a` en `index.html`.

---

## Generación Izar (v3.0 - v3.4.5)

Representa la era de la madurez operativa y refinamiento visual del Dashboard de Reseñas, enfocada en consolidar el control regional de incidencias, la unificación estética Crystal & Squircle y la conexión directa a base de datos en la nube.

### Version 3.4.5 Izar - Suite SEO, UX Móvil, Web Share y LLMO (Septiembre 2026)
* **Metatítulos y Metadescripciones Reactivos**: Integración de `updateRouteMeta` en `Router.resolve()`, actualizando dinámicamente `document.title`, `<meta name="description">` y Open Graph en cada transición de pantalla SPA según la sucursal o vista activa.
* **Semántica HTML5 y Único H1 por Pantalla**: Estandarización de jerarquía con exactamente un solo `<h1>` semántico por vista (`home`, `branch`, `dashboards`, `about`, `login`, `privacy`), seguido de secciones `<h2>` y tarjetas `<h3>`.
  - *Nota de Diseño (Hero Regional en `home.js`)*: Cuenta con documentación inline para reversión ágil o estilización `visually-hidden` si en el futuro se prefiere prescindir del título textual intermedio y volver a la composición minimalista original.
* **Cápsula Crystal Squircle de Key Takeaways (TL;DR)**: Componente interactivo `.key-takeaways-card` ubicado al inicio de las vistas ejecutivas y de sucursal con los 3 hallazgos críticos del periodo.
* **Barra de Acción Móvil Fija (`MobileStickyBarManager`)**: Barra inferior flotante (`.mobile-sticky-bar`) con backdrop blur, soporte para Safe Area en iOS y botones directos de acción rápida.
* **Botón Nativo para Compartir (`ShareManager`)**: Integración con la **Web Share API** (`navigator.share`) para envío directo de scorecards por WhatsApp/Telegram con fallback automático a copia en portapapeles.
* **Clusters Regionales Interlinkeados**: Inyección de `.cluster-nav-wrap` en la ficha de tienda para navegación rápida en un clic entre sucursales de la misma región.
* **Preguntas Frecuentes y Schemas JSON-LD**: Sección interactiva de FAQ con microdatos `@type: "FAQPage"`, schema `@type: "Bakery"` / `"Restaurant"` en fichas de sucursal y `@type: "Organization"` en la raíz.
* **Suite de Contingencia y Páginas de Error (`404.html`, `500.html`)**:
  - `404.html`: Pantalla nativa de Netlify con estética Crystal & Squircle, branding LCP y temporizador de retorno asistido al Dashboard.
  - `500.html`: Pantalla institucional serena para estados de mantenimiento de red o base de datos.
  - `OfflineManager`: Detector reactivo de conectividad (`window.onoffline` / `window.ononline`) que alerta en tiempo real al usuario en tienda sin congelar la interfaz.
* **Blindaje de Vistas de Contingencia 404 y 403 SPA (`views/not-found.js`)**:
  - Supresión de fuga de arquitectura: Cuando el usuario no está autenticado, la barra de navegación omite todos los accesos directos a módulos privados (`Inicio`, `Dashboards`, `Acerca de`) desplegando una cabecera minimalista.
  - Mensajería adaptativa: Detección inteligente del estado de sesión en pantallas 403 (solicitud de credenciales operativas vs. permisos insuficientes por rol).
  - Erradicación de rebotes ciegos: Botones de acción contextualizados (`Iniciar Sesión` y `Aviso de Privacidad` en estados no autenticados, y retorno asistido al Dashboard para usuarios autenticados).
  - Eliminación de dependencia de scroll reveal `.r` para visibilidad inmediata con opacidad al 100%.
* **Router Dinámico y Validación de Catálogo (`js/router.js`)**:
  - Despacho 404 instantáneo para sucursales no registradas en `SUCURSALES_META_ALL` y trimestres inválidos (`q < 1` o `q > 4`), evitando rebotes a login o navegación errónea a home.
  - Soporte para resolución dinámica de rutas registradas vía `Router.register()`.
  - Normalización de URLs con limpieza automática de parámetros de consulta y barras finales (`/`).
* **Cache-Busting y Eliminación de Auto-Redirección**:
  - `index.html`: Inyección de identificador de versión `?v=3.4.5b` en todas las etiquetas `<script>` para forzar a navegadores locales y clientes móviles a descartar cachés obsoletas.
  - `404.html`: Remoción de la cuenta regresiva de redirección automática forzada a los 8 segundos, preservando la pantalla estática sin saltos bruscos.
* **Seguridad y Blindaje de Código Fuente**:
  - `netlify.toml`: Bloqueo estricto con código 404 forzado y cabecera `X-Robots-Tag: noindex, nofollow` para cualquier archivo de mapa de desarrollo (`/*.map`), así como inyección de cabeceras HTTP de grado industrial (`Content-Security-Policy` estricta y `Permissions-Policy`) para alcanzar la máxima postura de seguridad.
  - `index.html`: Inyección de `<noscript>` semántico rico en datos de cobertura para evitar el síntoma de *"viewsource empty"* en rastreadores antiguos o navegadores sin JS.


### Version 3.4.4 Izar - Paginación en Supabase, Normalización y Exploración Histórica (Agosto 2026)
* **Resolución de Truncamiento en Supabase**: Implementación de consultas paginadas por bloques (`.range`) y filtrado directo por región (`.eq`) en `DataLoader`, garantizando la carga completa de reseñas históricas sin sufrir por el tope predeterminado de 1,000 filas de PostgREST.
* **Normalización de Sucursales**: Incorporación de `normalizeBranchToken` para resolver coincidencia de sucursales insensible a tildes, mayúsculas y caracteres especiales en todas las vistas e ingesta serverless.
* **Panel de Control Histórico (`#/select-region`)**: Adición de la barra de exploración histórica por **Año (2018–2026)**, **Mes**, **Estado de Región** (`< 4.50 ★` / `≥ 4.50 ★`), **Criterios de Ordenamiento** (Rating, Volumen, Crecimiento) y **Buscador Instantáneo** por texto libre.
* **Algoritmo de Ranking Bayesiano (Standings)**: Incorporación de Suavizado Bayesiano ($k=15$, $M=4.50\star$) y escala multitienda en `select-region.js` para eliminar sesgos por muestra pequeña y balancear equitativamente el ranking regional.
* **Ingesta e Indexación Masiva**: Sincronización e indexación completa de **8,944 reseñas históricas** del dataset de Apify hacia Supabase para las 33 sucursales del país.

### Version 3.4.3 Izar - Conexión Exclusiva Supabase y Seguridad Backend (Junio 2026)
* **Conexión Exclusiva a Supabase**: Eliminación definitiva de fallbacks locales a `manifest.json` y `data/*.json`, asegurando que todos los datos provengan únicamente de la base de datos PostgreSQL en la nube.
* **Eliminación de Credenciales en Código**: Remoción total del modo demo y cuentas/correos `@lacrepeparisienne.com` hardcodeados en el código de autenticación.
* **Seguridad en Endpoints**: Protección del endpoint de diagnóstico `diag-db.js` mediante Bearer token y método POST con cuerpo de confirmación para acciones destructivas.
* **Degradación Segura de Privilegios**: Corrección del fallo de seguridad que promovía privilegios a administrador ante fallas de conexión con Supabase.

### Version 3.4.2 Izar - Depuración y Fusión Operativa de Sucursales (Junio 2026)
* **Exclusión de Complejos No Operativos**: Remoción definitiva del mapa y de las configuraciones del Dashboard de las 8 ubicaciones en complejos Cinemex y de la sucursal Cumbres de Monterrey para evitar ruido visual y tarjetas vacías.
* **Unificación Operativa GDL**: Fusión formal de las sucursales Andares y Mercado Andares en la sucursal única `"andares"`, compartiendo su página oficial de Google Reviews.
* **Depuración de Place IDs**: Generación de la lista oficial de 33 Place IDs únicos para alimentar el scraper de Apify.
* **Ajustes de Sincronización en Webhook**: Actualización de la Netlify Function (`apify-ingest`) para reflejar la unificación de Andares y eliminar los mapeos de Cinemex y Cumbres.

### Version 3.4.1 Izar - Consolidación Regional y Cobertura Cinemex (Junio 2026)
* **Unificación Regional de Puntos de Venta**: Fusión de sucursales duplicadas en San Luis Potosí (San Luis y The Park en `"the-park"`) y Aguascalientes (Pocitos y Altaria en `"altaria"`).
* **Consolidación de Monterrey**: Configuración oficial de MTY con 4 sucursales activas (Galerías MTY, Galerías Valle Oriente, Fashion Drive y Galerías Cumbres).
* **Soporte Visual Completo Cinemex**: Incorporación de tag visual especial, animación perimetral y fondo con marca de agua SVG traslúcida de cine en las tarjetas y vistas detalladas de sucursales dentro de complejos Cinemex.
* **Estructura de Cobertura en Tijuana**: Restauración de la sucursal Landmark Tijuana junto a Plaza Península como las dos ubicaciones oficiales de Tijuana.
* **Sincronización de Ingesta Serverless**: Actualización del webhook `apify-ingest` para unificar automáticamente los mapeos de San Luis y Pocitos.
* **Alineación con P&L Corporativo**: Adición de las sucursales del P&L oficial y remoción de la ubicación inactiva Aeropuerto.

### Version 3.4.0 Izar - Consolidación Tipográfica y Experiencia Móvil (Mayo 2026)
* **Consolidación Tipográfica**: Unificación del sistema tipográfico para utilizar Plus Jakarta Sans, Playfair Display y JetBrains Mono por defecto en todos los modos.
* **Soporte de Safe Areas en iOS**: Implementación de `env(safe-area-inset-bottom)` en la barra de navegación inferior móvil para evitar superposiciones con la barra de gestos de iOS.
* **Bottom Sheet Drawers**: Integración de menús deslizantes inferiores (Bottom Sheets) para selectores en dispositivos móviles en reemplazo de desplegables flotantes tradicionales.
* **Compact KPIs en Celular**: Reorganización del layout de scorecards de KPIs regionales a una cuadrícula de 2x2 en pantallas pequeñas.
* **Optimización de Accesibilidad y Gráficos**: Respeto a la directiva `prefers-reduced-motion` en carruseles y optimización de ejes en Chart.js para evitar textos recortados en teléfonos.

### Version 3.3.1 Izar - Visualización y Métricas Avanzadas (Mayo 2026)
* **Doble Eje Y en Gráfico de Volumen**: Optimización de la gráfica de volumen de opiniones para utilizar doble eje Y agrupado, destacando quejas negativas en el eje derecho sin distorsionar la escala.
* **Etiquetas de Desviación en Ranking**: Visualización del puntaje exacto y desviación con respecto al objetivo (ej. `+0.20` / `-0.40`) al final de cada barra en el ranking de sucursales, con línea vertical indicadora en `4.60`.
* **Línea de Meta en Tendencia YTD**: Ajuste del rango del eje Y de `4.5` a `5.0` con línea de objetivo horizontal en `4.60`.
* **Barra de Distribución de Estrellas**: Sustitución del gráfico circular por una barra horizontal interactiva que muestra porcentajes y conteos de calificaciones.

### Version 3.3.0 Izar - Rediseño de Cuadro de Mando Ejecutivo (Mayo 2026)
* **Cuadro de Mando Macro**: Rediseño completo de la sección de dashboards con una distribución de 4 gráficos interactivos (Volumen Apilado, Ranking de Calificación, Distribución de Estrellas y Tendencia Regional YTD).
* **Alertas Proactivas de Desempeño**: Módulo de visualización ejecutiva para identificar caídas de rating, bajo desempeño regional y quejas desatendidas.
* **Depuración de Funciones Deprecadas**: Remoción definitiva de asistentes asistidos por inteligencia artificial en el modal de detalles para enfocar la herramienta en métricas reales.
* **Mejora de Contraste Crystal**: Ajustes de opacidad en superficies glassmorphic y temas oscuros.

### Version 3.2.5 Izar - Interfaz Premium Crystal & Squircle (Mayo 2026)
* **Activación de UI Premium**: Implementación de estética Crystal & Squircle (Plus Jakarta Sans, Playfair Display, radios de 20px y desenfoque glassmorphic de 14px).
* **Barrido Radial de Tema**: Integración de control flotante con transición de barrido radial animada (`radial clip-path sweep`) al alternar entre modo claro y oscuro.
* **Widget Comparador**: Previsualizador interactivo de comparación gráfico en la vista Acerca De.
* **Navegación Fluida a Detalles**: Habilitada la apertura directa de la ficha detallada de reseñas desde el feed principal, la barra lateral y las vistas mensuales.

---

## Generación 2.x.x (v2.0 - v2.9)

Etapa de revolución arquitectónica e infraestructura técnica del Dashboard. Introdujo modularidad, navegación asíncrona SPA y rendimiento optimizado para uso operativo diario.

### Version 2.7 - Version 2.9 (Mayo 2026)
* **Navegación SPA por Hash Router**: Implementación de enrutamiento asíncrono en cliente sin recargas de página (`#/`, `#/sucursal/:id`, `#/trimestre/:id`, `#/acerca`).
* **Carga Perezosa (Lazy Fetch)**: Consumo a demanda de archivos de datos mensuales y almacenamiento en caché de métricas en `KpiStore` via `localStorage`.
* **Carrusel de Actividad y Drawer Lateral**: Feed dinámico de opiniones recientes y menú lateral deslizable para filtros avanzados por sentimiento y sucursal.
* **Sincronización Global de Periodo**: Conexión reactiva del selector de mes entre la pantalla principal y las vistas por sucursal.

### Version 2.1 - Version 2.6 (Marzo - Mayo 2026)
* **Control de Acceso por Roles**: Sistema de permisos diferenciado para roles ejecutivos (Leadership) y gerencia operativa.
* **Manejo Responsive de Dashboards**: Adaptación de gráficos Chart.js a layouts dinámicos (1 columna en dispositivos móviles, 2 columnas en escritorio).
* **Optimización Mobile-First**: Barra de navegación inferior fija para acceso rápido desde teléfonos inteligentes.

### Version 2.0 (Febrero 2026)
* **Refactorización Modular**: Separación de la aplicación en módulos JavaScript independientes (`js/views/`, `js/charts.js`, `js/kpis.js`).
* **Lector Unificado DataLoader**: Centralización de la carga de archivos de datos mediante manifiesto.
* **Integración Chart.js 4.4.1**: Implementación del motor de gráficas para análisis de tendencias y volumen.

---

## Generación Fundacional (v1.0)

Cimientos del ecosistema. Se definió la identidad de marca, la paleta semántica inicial y los primeros flujos de datos operativos.

### Version 1.0 (Enero 2026)
* **Arquitectura Base**: Maquetación HTML/CSS inicial adaptada al consumo desde dispositivos móviles de gerentes de sucursal.
* **Sistema de Diseño Base**: Definición de la paleta corporativa La Crêpe Parisienne (Verde Corporativo `#3D5A47`, Sage `#7A9E8A`, Crema `#F5EFE6` y Oro `#B8902F`).
* **Conexión Inicial de Datos**: Estructuración del consumo inicial de datos de servicio para reportes básicos.
