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
- [ ] barVolume, stackedVolume, barRanking, donutDistribution, starDistributionBar
- [ ] lineTrend, branchRatingTrend, branchVolumeTrend
- [ ] Tooltip "crystal" equivalente en ECharts (hoy `crystalTooltipHandler`) y plugins `targetLine` / otros

## beta.3 — compare.js y brand.js; retirar Chart.js
- [ ] compare.js (3 gráficas), brand.js (2)
- [ ] Quitar `chart.umd.min.js` del index.html y `charts.js` legacy

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
