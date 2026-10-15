# Pruebas de navegador (e2e) de Étoile

Playwright sobre Chromium real, contra la app local. **No** corren en CI ni en `npm test` (necesitan la app y un usuario QA).

## Preparación (una vez por sesión)
1. App local: `npx netlify dev --offline` (queda en http://localhost:8888). Con `NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"`.
2. Navegador: Chromium de Playwright en `~/.cache/ms-playwright/chromium-1243`. `playwright-core` se toma del repo si está instalado o, si no, de `~/.cache/motion-graphic/node_modules` (`PLAYWRIGHT_CORE` lo cambia).
3. Usuario QA: `node tests/e2e/make-qa-user.js` (rol zonal, CDMX; escribe `.qa_user.json`, ignorado por git). **Al terminar: `node tests/e2e/make-qa-user.js --delete`.**

## Pruebas
| Archivo | Qué verifica |
|---|---|
| `smoke.js` | briefing nacional, orden por urgencia, Inicio (promedio → pastilla → Por atender), el cursor no cambia el hero, Comparar y Dashboards; en escritorio, móvil y oscuro |
| `tienda.js` | cuenta de tienda (cambia el perfil y lo restaura) |
| `contrast.js` | escáner WCAG de todo el texto visible (no debe subir de ~30) |
Todas: `tests/e2e/run.sh smoke tienda` (paralelo, con reintento). Las unitarias siguen en `npm test`.

## Nota de historia
Hasta 2026-10-15 las pruebas vivían en el scratchpad de la sesión y se perdieron al reiniciar el equipo; este arnés es la versión compacta y versionada. Las pruebas finas anteriores (drawer, heatmap, comparar, navegación, perfil de CPU) pueden recrearse sobre `lib.js`.
