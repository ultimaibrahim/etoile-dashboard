# Plan Étoile 2.0.0 — Época Eltanin (betas)

Fuente: `~/Documents/bizops/etoile-news/étoile · roadmap estratégico.md`. Marcar `[x]` al cerrar cada punto.
Versionado: `2.0.0-beta.N`, parches locales con letra (`beta.1a`). Si las betas se aprueban → `2.0.0`.
Rama: `feat/v2.0.0-eltanin`. Doble changelog en el mismo commit. Sin commit/push sin OK de Ibrahim.

## beta.1 — Cimientos ECharts (A2 parcial, A5, A8)
- [x] Build propio de ECharts con tree-shaking (`scripts/build-echarts.js`)
- [x] Chart wrapper con estados (A5)
- [x] Migrar `heroTrend` (home) como prueba
- [x] Verificado en navegador headless (bundle 732 KB / 248 KB gzip)
- [ ] Revisión de Ibrahim en `netlify dev` (hero claro/oscuro/móvil, video del login, mes por defecto, tiempos)
- [x] Videos del login restaurados (opción A)
- [x] Mes por defecto = más reciente con datos
- [x] Carga: precarga en paralelo, init+precarga en paralelo, descarga al hacer clic

## beta.2 — Resto de `charts.js` (A2)
- [x] barVolume, stackedVolume, barRanking, donutDistribution, starDistributionBar
- [x] lineTrend, branchRatingTrend, branchVolumeTrend
- [x] Tooltip "crystal" equivalente en ECharts (`.etoile-tip-card`) y línea de meta (`EC.goalLine`)
- [x] QA automatizado antes/después (claro, oscuro, móvil) y de interacción (10/10)
- [x] Bug previo: clic en volumen de dashboards (`sortedBranches`)

## beta.3 — compare.js y brand.js; retirar Chart.js
- [x] compare.js (radar), brand.js (2 gráficas)
- [x] Chart.js retirado del index.html; charts.js reducido a `destroyAll`
- [x] Bugs previos: barras negras y desborde móvil de brand

## beta.4 — Patrones, atención e inmersión (hecho, pendiente de revisión de Ibrahim)
- [x] Hora local de la tienda en 24 h en toda la app (`js/time.js`); corregido el desfase UTC y el heatmap
- [x] "¿A qué hora llegan las quejas?" por sucursal y por región, con titular y complejidad adaptativa
- [x] Reseñas Graves (`js/severity.js`) calibradas con datos reales (4.6%) + "Atención inmediata" en home y sucursal
- [x] Drawer único + tarjeta de reseña única; migrados feed, detalle, alertas, estrellas, problemas, mes concluido y brand
- [x] Titulares por reglas en cada gráfica (`js/narrative.js`), reorden de Dashboards, vínculo volumen↔ranking, pins mejor/peor mes
- [ ] Revisión de Ibrahim en `netlify dev` (claro/oscuro/móvil) y ajuste de umbrales de severidad / lista de palabras
- [ ] Podar CSS heredado ya sin uso (`.review-card`, `.sidebar-review-card`, `.review-item`, `.brand-modal-*`, `.modal-overlay`, `.modal-box`) y las envolturas-plantilla de brand
- [ ] Mover los scripts de QA (Playwright) de la sesión a `tests/` (flujo, interacción, atención, migración)

## Betas futuras (guardadas; el corte del 2.0.0 y el orden los decide Ibrahim)
- **beta.5 — Contexto**: A4 tabla `events` por sucursal-fecha (SQL lo corre Ibrahim) + B6 pantalla para anotar eventos ("cambio de gerente", "promo") + C4 tendencias con `dataZoom` y `markArea` de eventos.
- **beta.6 — Comparación**: C1 heatmap sucursal × mes (rating y volumen alternables) + C9 sparklines en cada tarjeta de sucursal.
- **beta.7 — Móvil**: A7 patrón dispatcher mobile/desktop (`home.js` → `home.mobile.js` / `home.desktop.js`, breakpoint 768 px) + G2 home móvil rediseñado.
- **Pilar F — trazar incidencias** (siguiente paso natural de "Grave"): asignar responsable, estado (nueva/en revisión/respondida/resuelta) y seguimiento por reseña; requiere tabla en Supabase (SQL lo corre Ibrahim). Con las graves ya identificadas, es lo que convierte la alerta en acción.
- **Aparte de las betas**: caché IndexedDB (SWR) de la precarga, RPC/vista con el histórico por sucursal, fase 2 del SQL de roles (`supabase_roles_corporate.sql`), pipeline P&L y delivery (B1–B3, depende de confirmar acceso a esos datos), páginas legales y paso de OAuth a producción.
- **Opciones de corte**: (a) lanzar `2.0.0` con beta.4 (base nueva, rápida, con patrones y alertas) y llevar beta.5–7 como 2.1–2.3; (b) incluir beta.5 y beta.6 en el 2.0.

## Optimización de carga (siguiente paso, si lo medido no basta)
- [x] Caché por región en memoria (TTL 5 min), precarga diferida por rol y preconnect a Supabase
- [ ] Caché IndexedDB (SWR) de la precarga por región: primera carga de cada sesión casi instantánea
- [ ] Vista/RPC en Supabase con el histórico por sucursal (avg, count) para no bajar todo el historial al login (SQL lo corre Ibrahim)
- [ ] Cargar ECharts/Chart.js de forma diferida (no bloquear el login)

## Después (pilares C y A)
- [ ] A4 anotaciones de eventos (tabla `events`) → C4 tendencias con `dataZoom` + `markArea`
- [ ] C1 heatmap sucursal × mes, C9 sparklines
- [ ] Sprint 0 pendiente de decidir: fase 2 de roles (`supabase_roles_corporate.sql`) y dispatcher mobile/desktop (A7)

## Decisiones
- ECharts sobre Chart.js: heatmap/calendar/brush/`dataZoom`/`markArea` nativos (roadmap pilar C).
- Sin bundler en producción: el bundle se genera con `npm run build:echarts` y se versiona en `js/vendor/`.
