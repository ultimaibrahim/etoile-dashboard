# Pruebas de navegador (e2e) de Étoile

Playwright sobre Chromium real, contra la app local. **No** corren en CI ni en `npm test` (necesitan la app y un usuario QA).

## Preparación (una vez por sesión)
1. App local: `npx netlify dev --offline` (queda en http://localhost:8888). Con `NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"`.
2. Navegador: Chromium de Playwright en `~/.cache/ms-playwright/chromium-1243`. `playwright-core` se toma del repo si está instalado o, si no, de `~/.cache/motion-graphic/node_modules` (`PLAYWRIGHT_CORE` lo cambia).
3. Usuario QA: `node tests/e2e/make-qa-user.js` (rol regional = corporativo, región CDMX; escribe `.qa_user.json`, ignorado por git). **Al terminar: `node tests/e2e/make-qa-user.js --delete`.**

## Pruebas
| Archivo | Qué verifica |
|---|---|
| `smoke.js` | briefing nacional, orden por urgencia, Inicio (promedio → pastilla → Por atender), el cursor no cambia el hero, Comparar y Dashboards; en escritorio, móvil y oscuro |
| `acceso.js` | sin sesión: raíz → página de inicio (`/info/`), enlace profundo → `/login/`; el login es su propia página, manda a cada rol a su pantalla, y cerrar sesión regresa al login |
| `roles.js` | entrada y alcance de gerente (su tienda, explorar su región, bloqueos) y zonal (su región, otras regiones, sin Étoile Corporativo); cambia el perfil y lo restaura |
| `incidencias.js` | el gerente abre/actualiza una incidencia de su tienda, persiste, y la base le niega otra tienda (escribe en la base real y limpia con `clean-incidents.js`) |
| `vistas.js` | drawer (Enter abre, Esc cierra, el foco vuelve), celda del heatmap, ⇄ de Comparar y navegación con anuncio de vista |
| `contrast.js` | escáner WCAG de todo el texto visible (no debe subir de ~30) |
Todas: `tests/e2e/run.sh acceso smoke roles incidencias vistas` (una tras otra, con reintento). Las unitarias siguen en `npm test`.

## Nota de historia
Hasta 2026-10-15 las pruebas vivían en el scratchpad de la sesión y se perdieron al reiniciar el equipo; este arnés es la versión compacta y versionada. Las pruebas finas (drawer, heatmap, comparar, navegación) se recrearon en `vistas.js`. **Rendimiento**: el A/B de scroll en Chromium headless de esta máquina rasteriza por software y da 1–33 % de cuadros > 33 ms en la MISMA página según la corrida; no sirve para decidir cambios (2026-10-15). Medir en un equipo real con GPU.
