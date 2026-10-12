# Plan: briefing de turno, identidad y movimiento (abierto 2026-10-12)

> Documento vivo. Registra lo que Ibrahim pidió, las decisiones tomadas y lo pendiente, para no perder detalle entre sesiones. Complementa `plan_v2.0.0.md` y `lineamientos_etoile.md`.

## Decisiones tomadas (Ibrahim)
- **Corte de mes**: hora de CDMX para todas las regiones. *(hecho, beta.7a)*
- **Queja** = 1–2★ **con texto**; 1–2★ sin texto se descartan como queja (de ragequit: no aportan). Pendiente: ¿también salen del promedio y del volumen? *(hoy siguen contando ahí)*
- **"La comanda" descartada** (sosa/simple). No es la dirección visual.
- **Roles**: `gerente` = tienda; `zonal` = su región; `regional` y `corporativo` = nacional (+ sección Étoile Corporativo). *(Hoy en la base el zonal ve todo: falta SQL + guardas de ruta; no ejecutado.)*
- **Turnos**: la app trabaja con horas, no con Desayuno/Comida/Cena. Realidad operativa: dos turnos de 8 h (matutino/vespertino), traslapados 14–16 h; abren 9 u 11 h, cierran servicio 21:30–22:00, salen 22:30–23:00. *(Regla de 3 turnos retirada del código y de la KB.)*
- **Briefing de turno = complemento, no sustitución**: ocupa el lugar del hero (compacto) en cada pantalla de entrada; el resto de la pantalla se conserva (sucursales de la región, sección Étoile Corporativo en `select-region`).
- **OAuth**: pasar a producción antes del 16-oct; páginas públicas en `/info/` listas; falta dominio y confirmar correo.
- Google API policy (almacenamiento ≤30 días): en revisión por Ibrahim (fork 29975f39).

## Mapa de entrada por rol
| Rol | Pantalla de entrada | Briefing arriba | Debajo |
|---|---|---|---|
| Tienda (gerente) | Inicio | Su sucursal primero | Sucursales de su región para comparar |
| Zonal | Inicio regional | Su región | Sucursales |
| Regional / corporativo | `select-region` | Nacional | Regiones por urgencia + Étoile Corporativo |

## Fases
1. **Quitar turnos** de gráficas/código/KB. *(hecho, beta.8)*
2. **Briefing, fase 1** (Inicio de tienda y de región): titular por reglas, «Por atender», hero con cifras de la sucursal. *(hecho, beta.8)* Sin incidencias persistentes (apagadas).
3. Briefing zonal y nacional; ordenar regiones por urgencia en `select-region`.
4. Incidencias (pase de turno persistente) — requiere SQL `supabase_incidents.sql` y decisión de permisos.
5. **Color**: sistema de tokens (neutros tintados, rampas por color de marca, escalas para gráficos, daltonismo, contraste calculado). Insumo: informe del agente de color.
6. **Movimiento e identidad**: reemplazar animaciones genéricas (fade/slide igual para todo, skeleton con barrido, spinner de región, pulso de alertas) por movimiento con propósito y propio de la marca; loaders; estados vacíos; mascota (bulldog francés). Insumo: informe del agente de motion.
7. Mi Sucursal / cuenta por sucursal (`profiles.sucursal` ya existe en SQL; falta front y guardas).
8. Roles v2 en SQL (zonal = región).

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
