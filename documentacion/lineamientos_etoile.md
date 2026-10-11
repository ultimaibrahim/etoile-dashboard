# Lineamientos de Étoile — borrador v0 (2026-10-11)

> Documento vivo y **fuente única** de los lineamientos del producto. Las copias en el core de Ibrahim (`ibrahim-agent-core`, KB de AGY) se sincronizan desde aquí. Lo marcado **[propuesta]** aún no está aprobado por Ibrahim; lo marcado **[decidido]** sí.

## 1. Para quién es y para qué
- **Usuarios**: dirección y marketing (consolidado nacional), gerentes zonales (todas las regiones), gerentes de tienda (su región, con benchmarking).
- **Propósito**: monitorear **lo último de lo último** y decidir qué hacer después. No es un reporte bonito: cada vista debe llevar a una acción. **[decidido]**
- **Mes por defecto**: el más reciente con datos (el mes en curso). Durante los primeros 7 días de cada mes, un aviso arriba del hero ("El mes X ha terminado…") da acceso al resumen del mes cerrado. **[decidido]**

## 2. Principio de las gráficas: sentido primero **[decidido, redacción por afinar]**
Ninguna gráfica entra "por poner gráficas". Cada una debe tener:
1. **La pregunta que responde** (ej. "¿cuál es la queja más común este mes?").
2. **La acción que habilita** (ej. "revisar el turno de cena en Tepeyac").
3. **Un titular de una frase** generado por reglas, sin LLM (el insight escrito, no solo el dibujo). Es el *storytelling*.
4. **Una versión simple para móvil** cuando la completa no se lee bien en pantalla chica.

**Reinterpretación de la regla de simplicidad**: la regla "si un niño de 6 años no distingue quién va ganando, no entra" se aplica a la **lectura de cada pieza** (titular + dato principal deben entenderse al instante), no prohíbe visualizaciones ricas en escritorio. Lo que sí queda prohibido: gráficas que requieren explicación técnica para entender su conclusión.

## 2b. Un solo sistema de interfaz **[decidido, implementado en beta.4]**
- **Un solo drawer** (`Drawer`): toda ventana secundaria (feed, detalle, alertas, estrellas, problemas, resumen de mes, panel corporativo) es el mismo panel lateral —hoja inferior en móvil—, con el mismo scroll, cierre (Esc, clic fuera, botón "atrás") y animación. Prohibido crear modales propios.
- **Una sola tarjeta de reseña** (`ReviewCard`): sucursal, fecha y hora local en 24 h, estrellas, texto, respuesta; insignia **Grave** con sus razones; marca **Sin respuesta** en quejas pendientes.
- Todo componente nuevo se construye sobre estos; si una pantalla necesita algo distinto, se extiende el componente, no se duplica.
- **Hora**: siempre la hora local de la tienda en 24 h (`BranchTime`), nunca UTC ni la del navegador.

## 2c. Reseñas "Graves" **[decidido, umbrales ajustables]**
- Una reseña grave es la excepción (~5% de las quejas), no la regla; se llama **Grave** (no "crítica", que ya significa ≤ 2★). Reglas explícitas y explicables en `js/severity.js`; cada razón muestra la palabra que la disparó. Se valida contra datos reales antes de cambiar umbrales o palabras. Aparecen en "Atención inmediata" (últimos 14 días).

## 3. Responsive adaptativo: complejidad según el espacio **[decidido el criterio; los cortes por afinar]**
- Mobile-first, pero **no** "lo mismo en pequeño": según el ancho disponible se muestra la versión simple o la rica. Un gerente en piso necesita 3 datos en 3 segundos; un director en escritorio quiere profundidad.
- Corte base: `768 px` (decisión del roadmap, patrón dispatcher). Las gráficas deciden con el ancho de su contenedor, no solo con el de la ventana. **[propuesta]** un segundo corte ≥ 1200 px para las más ricas.
- Cada gráfica define su variante móvil y su variante escritorio (ej. heatmap sucursal × mes con scroll horizontal en móvil; en escritorio, además, resaltado y anotaciones).

### Preguntas que Étoile debe poder contestar **[propuesta, a validar con Ibrahim]**
| Pregunta (director / marketing) | Datos | Hoy |
|---|---|---|
| ¿Cuál es la queja más común y dónde se concentra? | texto + clasificación (servicio/calidad/valor) × sucursal | ✅ solo reseñas |
| ¿Cuál es el halago más común? | texto de 4–5★ | ✅ (requiere extracción de temas) |
| ¿En qué turno y día se concentran las quejas? | fecha/hora × clasificación | ✅ heatmap existente |
| ¿Qué temas suben o bajan mes a mes? | temas × tiempo | ✅ |
| ¿Responder mejora algo? (respuesta vs calificación posterior) | respuesta del dueño × historial | ✅ |
| ¿La longitud del texto anticipa severidad? | longitud × estrellas | ✅ |
| ¿Qué sucursales se separan del patrón regional? | z-score por sucursal | ✅ |
| ¿Rating y ticket promedio / ventas se mueven juntos? | P&L mensual | ⛔ requiere P&L |
| ¿Quejas de entrega vs tiempo de delivery? | scorecard de delivery | ⛔ requiere delivery |

## 4. Reglas de datos (vigentes)
- **Regla LCP #11**: las reseñas sin texto solo cuentan para volumen bruto y promedio global; jamás en heatmap, quejas críticas ni análisis de temas.
- **Turnos reales**: Desayuno 09:00–12:59 · Comida 13:00–16:59 · Cena 17:00–22:00.
- **Fuente**: API oficial de Google Business Profile (sync cada 30 min). Sin scrapers (Apify retirado).
- **Clasificación**: motor local sin LLM; las quejas ≤ 2★ con texto se clasifican al ingresar.

## 5. Diseño
- Paleta LCP (verde `#3D5A47`, sage `#7A9E8A`, crema `#F5EFE6`; oro `#B8902F`); **jamás** mezclar con la identidad personal de Ibrahim.
- Crystal & Squircle: radios 10–16 px, glassmorphism en superficies flotantes, tooltip crystal (`.etoile-tip-card`), sin controles nativos toscos.
- Claro y oscuro siempre probados. Mobile-first a 375 px. Cierre de modales y dropdowns al hacer clic fuera.

## 6. Versionado y épocas **[decidido]**
- **Sistema de épocas**: cada proyecto elige una letra, la inicial de su nombre; cada `MAJOR` recibe una estrella real que empiece con esa letra. Étoile → **E**: `2.x` **Eltanin**. Reserva: Elnath, Electra, Enif. (Mise → M, se define aparte.)
- Épocas previas (Fundacional, 2.x, Izar, Zenith) se conservan en los changelogs como **línea previa**.
- Betas `2.0.0-beta.N`; parches locales con letra (`beta.1a`). Si las betas se aprueban, se lanza `2.0.0`.
- `MINOR`/`MAJOR`: justificación técnica y aprobación explícita antes de subir versión o hacer commit.
- **Doble changelog** en el mismo commit: técnico (`CHANGELOG.md`) y público/operativo (`CHANGELOG_PUBLIC.md`, beneficio sin jerga). Nunca se reescribe el historial.
- Cero `git commit`/`git push` sin el OK de Ibrahim; sin `Co-Authored-By`.

## 7. Acceso y seguridad
- Roles: `corporate` (nacional + `#/brand`), `zonal` (todas las regiones), `gerente` (su región). Lectura impuesta por RLS en la base (`visible_location_ids()`), sin lectura anónima.
- Nunca valores de `.env` ni credenciales en archivos versionables ni en la KB (el escaneo de Netlify rompe el build).

## 8. Tecnología
- Frontend vanilla JS modular + ECharts (build propio con tree-shaking en `js/vendor/`), Netlify Functions, Supabase. Sin bundler en producción.
- Librerías nuevas: solo con aprobación explícita (ECharts fue aprobada en el roadmap).
- Todo se construye como capas aditivas, modular y extensible; nada que obligue a reescribir al añadir sucursales o features.

## 9. QA antes de entregar
- `node tests/qa-audit.js` y `node tests/gbp-sync.test.js` en verde.
- Recorrido automatizado (Playwright): flujo login → región, tooltips y clics de cada gráfica, capturas en claro, oscuro y móvil. *(Hoy los scripts viven fuera del repo; pendiente moverlos a `tests/`.)*
- Con cada entrega: versión, archivos tocados y comprobación de dark mode y móvil.

## 10. Por definir
- [ ] Ideas anotadas por Ibrahim (recuperar y volcar aquí).
- [ ] Validar con Ibrahim la lista de palabras y los umbrales de "Grave" (`CRITICAL_SCORE` 6, texto ≥ 500).
- [ ] Pilar F: trazar incidencias (responsable, estado, seguimiento) a partir de las graves.
- [ ] Qué visualizaciones "ricas" entran para escritorio y con qué titular generado.
- [ ] Métricas de éxito del propio producto (tiempo de respuesta, decisiones atribuidas a Étoile, usuarios activos).
- [ ] Nombre de la época de Mise (letra M) y sincronizar la regla en su documentación.
- [ ] Actualizar la skill `luxury-dataviz-craft` a ECharts y sincronizar las copias de la KB del core.
