# Plan: briefing de turno, identidad y movimiento (abierto 2026-10-12)

> Documento vivo. Registra lo que Ibrahim pidió, las decisiones tomadas y lo pendiente, para no perder detalle entre sesiones. Complementa `plan_v2.0.0.md` y `lineamientos_etoile.md`.

## Decisiones tomadas (Ibrahim)
- **Corte de mes**: hora de CDMX para todas las regiones. *(hecho, beta.7a)*
- **Queja** = 1–2★ **con texto**; 1–2★ sin texto se descartan como queja (de ragequit: no aportan). Pendiente: ¿también salen del promedio y del volumen? *(hoy siguen contando ahí)*
- **"La comanda" descartada** (sosa/simple). No es la dirección visual.
- **Roles** *(precisado 2026-10-15; hecho)*: `gerente` = entra a su tienda, con botón para explorar las demás de su región (limitado a su región); `zonal` = entra a su región y puede ver otras; corporativo (`admin`, `regional`) = todo lo anterior + Étoile Corporativo. El zonal NO se restringe por RLS a su región.
- **Incidencias** *(2026-10-15)*: ver = alcance de lectura; abrir/actualizar = zonal y corporativo en lo que ven, gerente solo su tienda.
- **CSP sin `unsafe-inline`**: pospuesta para después de la 2.0 (opción B; `escapeHtml` cubre el XSS principal).
- **Turnos**: la app trabaja con horas, no con Desayuno/Comida/Cena. Realidad operativa: dos turnos de 8 h (matutino/vespertino), traslapados 14–16 h; abren 9 u 11 h, cierran servicio 21:30–22:00, salen 22:30–23:00. *(Regla de 3 turnos retirada del código y de la KB.)*
- **Briefing de turno = complemento, no sustitución**: ocupa el lugar del hero (compacto) en cada pantalla de entrada; el resto de la pantalla se conserva (sucursales de la región, sección Étoile Corporativo en `select-region`).
- **OAuth**: pasar a producción antes del 16-oct; páginas públicas en `/info/` listas; falta dominio y confirmar correo.
- Google API policy (almacenamiento ≤30 días): en revisión por Ibrahim (fork 29975f39).

## Mapa de entrada por rol
| Rol | Pantalla de entrada | Briefing arriba | Debajo |
|---|---|---|---|
| Tienda (gerente) | Inicio | Su sucursal primero | Sucursales de su región para comparar |
| Zonal | Inicio regional (su región) | Su región | Sucursales; «Regiones» para ver otras |
| Regional / corporativo | `select-region` | Nacional | Regiones por urgencia + Étoile Corporativo |

## Fases
1. **Quitar turnos** de gráficas/código/KB. *(hecho, beta.8)*
2. **Briefing, fase 1** (Inicio de tienda y de región): titular por reglas, «Por atender», hero con cifras de la sucursal. *(hecho, beta.8)* Sin incidencias persistentes (apagadas).
3. Briefing zonal y nacional; ordenar regiones por urgencia en `select-region`. *(hecho, beta.8)*
4. Incidencias (pase de turno persistente). *(hecho, beta.8: SQL ejecutado, permisos decididos)*
5. **Color**: sistema de tokens (tintas legibles, escalas para gráficos, contraste calculado). *(hecho en beta.8; falta revisión visual de Ibrahim y las rampas completas si se quieren más tonos)*
6. **Movimiento e identidad**: reemplazar animaciones genéricas (fade/slide igual para todo, skeleton con barrido, spinner de región, pulso de alertas) por movimiento con propósito y propio de la marca; loaders; estados vacíos; mascota (bulldog francés). *(primer pase hecho en beta.8: estrella en transición y carga, sin animaciones infinitas, sello «Atendida»; falta loader de crepa y mascota con arte oficial)*
7. Mi Sucursal / cuenta por sucursal. *(hecho, beta.8)*
8. Roles: entrada por rol. *(hecho, beta.8; sin cambio de RLS)*

## Restricciones y criterios (míos, para discutir)
- Conservar colores de marca como anclas; los de **estado** (ok/atención/crítico) se tratan aparte y deben distinguirse en escala de grises y para daltonismo.
- Animar solo `transform`/`opacity`; respetar `prefers-reduced-motion`; medir con el A/B de scroll (0 % de cuadros >33 ms) antes de aceptar un efecto.
- La mascota exige el **arte oficial** de la marca (Ibrahim lo provee); no se genera ni se copia. No aparece en quejas graves.
- Sin librerías nuevas sin aprobación.
- Hora de una reseña = cuándo se escribió, no cuándo fue la visita: no atribuir culpas a un turno.

## Backlog de ideas (sin priorizar)
- Salud por franja horaria (solo horas) y "hora culpable" cuando una baja se concentra.
- Severidad auditable con corrección manual de reglas.
- Digest semanal por rol (plantillas, sin LLM).
- Alertas push/WhatsApp solo para severidad alta o ráfaga, con tope diario.
- Comparar contra el propio histórico y contra la región por defecto (suavizado para muestras chicas).
- Instrumentar uso (qué abren, qué ignoran) para decidir con datos (enfoque "Edison").
- Cada insight enlaza a su reseña.
- Auditoría pendiente: foco visible/teclado, contraste, `<main>`/aria-live, logout limpia caché, `ORDER BY` en paginación, GBP "última sincronización" visible, CSP sin `unsafe-inline`.

## Estado al 2026-10-15 (para retomar en un chat nuevo)
**Rama** `feat/v2.0.0-eltanin`, versión `2.0.0-beta.8`, todo commiteado y subido a GitHub; `main` no tiene nada de esto (no se ha hecho merge ni deploy a producción).

**Hecho desde el 12-oct** (detalle en `CHANGELOG.md`): corte de mes en hora de CDMX; queja = 1–2★ con texto y las 1–2★ sin texto se descartan del todo (`js/metrics.js`); XSS del texto de reseñas cerrado; horas en lugar de turnos; briefing (Inicio de tienda/región y nacional en `select-region`, `js/briefing.js`); Por atender con graves primero; sistema de color con tintas legibles; Comparar «cara a cara»; Qué atender en Dashboards; páginas públicas `/info/`; sync de Google cada 5 min (cada sucursal cada 30); hero con promedio protagonista y briefing en pastilla; rendimiento de Inicio (carrusel, `BranchTime.parts`).

**Pendiente, con dueño:**
- *Ibrahim*: OAuth de Google a producción **antes del 16-oct** (token en «Prueba» caduca a los 7 días; si hay `invalid_grant`: `node scripts/gbp-auth.js` y actualizar `GBP_REFRESH_TOKEN` en Netlify); dominio verificado para las páginas `/info/` y confirmar el correo `helloultima@ultimaibrahim.dev`; arte oficial del perrito (antes hablar con MKT); revisar a ojo el sistema de color; decidir la política de Google (conclusión del fork 29975f39); borrar el usuario QA viejo de Supabase (`qa.etoile.*@example.com`, id `7745de35…`, credenciales perdidas: borrar por id con service role).
- *Código*: loader de crepa y mascota (cuando haya arte oficial); CSP sin `unsafe-inline` (después de la 2.0); rendimiento: medir el scroll en un equipo real con GPU (el headless de esta máquina no discrimina); pendientes del handoff GBP (limpieza de Apify, clasificar el historial de quejas, rol `director` inexistente en la base, 8 cuentas vs 7 perfiles). El SQL se ejecuta con el MCP de Supabase.

**Cómo trabajar** (ver `tests/e2e/README.md`): `npm test` (unitarias); `npx netlify dev --offline`; `node tests/e2e/make-qa-user.js` → `tests/e2e/run.sh smoke tienda` → `node tests/e2e/make-qa-user.js --delete`. Reglas: sin commit/push sin OK (salvo lote autorizado), sin `Co-Authored-By`, doble changelog en el mismo commit, nada de `.env` en archivos versionados. La base de conocimiento de los agentes (`~/.gemini/config/rules/knowledge_base/reviews_lcp_gdl_AGENTS.md`) ya tiene las reglas de cifras.
