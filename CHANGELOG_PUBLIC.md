# 🌟 Changelog Público y Operativo — Étoile Dashboard
**La Crêpe Parisienne · Grupo MYT**

Este documento contiene el historial de actualizaciones de Étoile Dashboard redactado en **lenguaje ejecutivo y de beneficio operativo**, libre de jerga técnica.

---

## Versión 2.0.0 beta 7a Eltanin — Correcciones (Octubre 2026) [PREVIEW]
* 🕐 **Cada mes empieza y termina en hora de Ciudad de México**: las reseñas de la cena del último día ya no se cuentan en el mes siguiente.
* 🔒 **Seguridad**: se reforzó cómo se muestran los textos de las reseñas para que ninguna reseña pueda ejecutar código dentro de la página.
* 🐛 El resumen trimestral marcaba el trimestre en curso equivocado; las sucursales sin reseñas ya no muestran una comparación inventada; Comparar ya no permite elegir la misma sucursal dos veces.

## Versión 2.0.0 beta 7 Eltanin — Qué atender, inicio interactivo y Comparar renovado (Octubre 2026) [PREVIEW]
* ✅ **"Qué atender"** reemplaza a las alertas escondidas: una lista corta, siempre visible y ordenada por urgencia; un toque lleva a la sucursal.
* 👆 **El inicio responde al tacto**: toca la calificación para ver cuántas reseñas hay de cada estrella; toca Reseñas, Sucursales o Negativas para ver el detalle; y en computadora, al mover el cursor por la portada, la calificación recorre los meses del año.
* ⚔️ **Comparar, rediseñado "cara a cara"**: elige dos sucursales (por defecto la mejor y la que más trabajo necesita), lee en una frase quién va mejor y en qué se separan, mira los últimos 12 meses de las dos juntas (toca un mes para verlo) y a qué hora se quejan sus clientes.

## Versión 2.0.0 beta 6 Eltanin — Comparar Sucursales mes a mes (Octubre 2026) [PREVIEW]
* 🗺️ **"¿Cómo evoluciona cada sucursal?"**: un mapa de colores con todas las tiendas de la región y los últimos 12 meses. De un vistazo se ve qué tienda arrastra problemas todo el año, cuál tuvo un solo mal mes y cuál cae justo ahora. Se puede cambiar entre calificación y volumen de reseñas, y al tocar una celda se abren las reseñas de esa tienda en ese mes. Una frase arriba resume el hallazgo y avisa de las tiendas con calificación muy baja pero pocas reseñas.
* 🐛 **Corregido (importante)**: la ficha de una sucursal podía no abrir cuando esa tienda aún no tenía reseñas en el mes elegido. Ahora abre y muestra el último mes con reseñas.
* 🐛 **Corregido**: al tocar "Ver ficha…" dentro de un panel, a veces la pantalla regresaba sola a donde estabas.
* ✨ **Las tarjetas entran una por una** al aparecer en pantalla (indicadores, insights y resúmenes).
* ⚡ **La página va mucho más fluida al desplazarse**: se quitaron los efectos de desenfoque sobre las tarjetas, que eran lo que más pesaba.
* 🎨 **Diseño más limpio y propio**: fuera las líneas de color gruesas en el borde de algunas tarjetas (ahora el estado se ve con un fondo suave y borde fino) y la tipografía decorativa solo en el nombre étoile; los títulos se leen con una letra más clara.
* 🪟 **Las ventanas de detalle ahora se abren al centro** en computadora y tableta (en el celular siguen subiendo desde abajo), ya no se desliza un panel que movía todo a un lado.
* 📅 **Resúmenes trimestrales rediseñados**: tarjeta abierta clara y con buen contraste, el texto no se mueve al abrir o cerrar, y se abre con un toque o clic (también con teclado).
* 📐 **Key Takeaways alineados** con el resto de la página.
* 🧹 Se retiró el mapa de calor de turnos dentro de cada sucursal; la gráfica de quejas por hora ya cuenta esa historia con un clic directo a las reseñas.

## Versión 2.0.0 beta 5 Eltanin — De la Alerta a la Acción (Octubre 2026)
* ✅ **Seguimiento de incidencias**: cualquier reseña grave (o queja) se puede convertir en una incidencia con responsable, estado (nueva, en revisión, respondida, resuelta) y bitácora de lo que se fue haciendo. Cuando se marca como resuelta deja de aparecer en "Atención inmediata". *(Preparado pero apagado por ahora: se activa cuando se decida y se prepare la base de datos.)*
* 👆 **Toca la gráfica y ve el detalle**: al tocar una hora en "¿A qué hora llegan las quejas?" se abren las quejas de esa hora; al tocar un mes en una tendencia, el tablero salta a ese mes. Se puede tocar en cualquier parte de la columna, no solo sobre el punto.
* 🔆 **El mapa de turnos cobra vida**: al pasar por una celda se iluminan su día y su turno, y la celda con más quejas late para llamar la atención.
* 🐛 **Corregido**: las tarjetas de reseña no se elevaban al pasar el cursor.

## Versión 2.0.0 beta 4 Eltanin — Patrones, Alertas Graves y una Sola Forma de Ver Todo (Octubre 2026)
* 🕘 **Hora de cada reseña, en formato de 24 horas y en la hora de la tienda**: antes la hora se mostraba corrida (6 horas adelantada) y las reseñas de la noche aparecían con la fecha del día siguiente. Ahora cada reseña muestra su fecha y hora reales en la zona horaria de su sucursal (Cancún y Tijuana incluidas).
* 📊 **"¿A qué hora llegan las quejas?"**: nueva gráfica por tienda y por región que muestra a qué horas se concentran las quejas y las compara con el volumen de reseñas, con una frase que explica el hallazgo. Por ejemplo, en Ciudad de México el 37% de las quejas llega entre las 20:00 y las 22:59, aunque esas horas traen solo el 26% de las reseñas. En el celular se ve una versión más sencilla.
* 🚨 **Atención inmediata**: si entra una reseña **grave** (salud, plagas, objetos en la comida, acoso o discriminación, cobros indebidos, amenazas legales…), aparece arriba del inicio y de la ficha de la tienda, con las razones por las que se marcó. Es la excepción, no la regla: solo cerca del 5% de las quejas.
* ✍️ **Cada gráfica cuenta su hallazgo**: ranking, volumen, estrellas y tendencias ahora llevan una frase que dice qué se ve y por qué importa (qué tienda va más rezagada, cuál fue el mejor y el peor mes), con aviso cuando hay pocas reseñas para concluir algo.
* ✨ **Una sola forma de ver todo**: todos los paneles de detalle (feed de reseñas, alertas, estrellas, resumen del mes, panel corporativo) ahora comparten el mismo diseño de panel lateral —en el celular sube desde abajo— y las reseñas se ven siempre igual, con una marca de "Sin respuesta" cuando una queja está pendiente.
* 🎬 **Más vida**: pasar el cursor por una tienda en el ranking la resalta también en el volumen; las gráficas marcan el mejor y el peor mes; las barras entran una por una.
* 🐛 **Corregido**: al tocar una reseña del feed no siempre abría su detalle; un panel se veía oscuro en modo claro; el resumen del mes decía "GDL" en todas las regiones.

## Versión 2.0.0 beta 3 Eltanin — Todo el Sitio con el Nuevo Motor de Gráficas (Octubre 2026)
* ✨ **El comparador de tiendas y el panel corporativo estrenan las gráficas nuevas**: el radar de 5 ejes del comparador y las gráficas por región del panel étoile corporativo ahora son más fluidas.
* 🎨 **Corregido en el panel corporativo**: las barras de "Rendimiento ajustado por región" se veían todas negras; ahora la mejor región se destaca en dorado y las demás en verde.
* 📱 **Panel corporativo en celular**: ya no se sale de la pantalla ni se corta la leyenda.
* ⚡ **Carga un poco más ligera**: se elimina la librería de gráficas anterior, que bloqueaba la carga inicial.

## Versión 2.0.0 beta 2 Eltanin — Todas las Gráficas con el Nuevo Motor (Octubre 2026)
* ✨ **Gráficas renovadas en Dashboards y en cada sucursal**: volumen de reseñas, ranking de calificación, distribución de estrellas y tendencias ahora usan el nuevo motor. Se ven igual de claras, con tarjetas flotantes al pasar el cursor que muestran el detalle de cada barra o punto.
* 🐛 **Corregido**: al tocar una barra del gráfico de volumen en Dashboards no pasaba nada; ahora abre el listado de reseñas correspondiente.
* 📱 **Mejor en el celular**: las etiquetas de los ejes se acomodan según el ancho de la pantalla para que se lean completas.

## Versión 2.0.0 beta 1 Eltanin — Arranque de Étoile 2.0 (Octubre 2026)
* 🧪 **Empieza la etapa de pruebas de Étoile 2.0**: las versiones beta se prueban con el equipo; si se aprueban, se lanza Étoile 2.0.
* 🎬 **Vuelven los videos de fondo en el inicio de sesión**: la pantalla de acceso recupera su fondo animado con las imágenes de la marca, ahora más ligeros para que carguen rápido incluso en celular.
* 📅 **Siempre lo más reciente**: al entrar, el tablero abre directamente en el mes en curso para monitorear y actuar al momento. Durante los primeros 7 días de cada mes sigue apareciendo el aviso con el resumen del mes que acaba de terminar.
* ⚡ **Entrada y cambio de región más rápidos**: iniciar sesión y entrar a una región ahora cargan sus datos en paralelo y mientras corre la animación, por lo que se espera menos y ya no se queda la pantalla de regiones "congelada" unos segundos. Se corrigió además la causa principal de que la pantalla se quedara congelada unos segundos al entrar a una región: ahora entrar toma alrededor de un segundo y medio, menos de la mitad que antes. La animación de entrada a una región ahora espera a que la pantalla esté lista, así que ya no se alcanza a ver por un instante la pantalla anterior. Además, volver a una región que ya abriste hace unos minutos es instantáneo, y quienes eligen región al entrar ya no esperan a que se cargue una que quizá no van a usar.
* ✨ **Nuevo motor de gráficas**: se prepara la base para gráficas más interactivas y visuales (zoom, eventos sobre la línea del tiempo, mapas de calor). En esta primera beta solo cambia la curva de fondo de la pantalla de inicio, que ahora es más fluida; el resto se ve igual.

## Versión 3.5.0 Zenith — Inteligencia Operativa, Heatmaps y Comparador (Septiembre 2026) [PROD]
* ⚖️ **Comparador Directo y Radar Operativo (`#/comparar`)**: Visualización intuitiva con Radar de 5 Dimensiones y Matriz Directa con badges de tienda líder. Diseñado para que cualquier colaborador entienda al primer golpe de vista las fortalezas y áreas de oportunidad sin gráficas confusas ni sobreingeniería.
* 🔢 **Totales Marginales en el Heatmap Semanal ("Show the Totals")**: El mapa de calor de turnos ahora incluye una columna de **Total Turno** a la derecha y una fila de **Total Día** en la parte inferior. De un vistazo, cualquier gerente puede saber cuál es el turno con más quejas de toda la semana sin tener que sumar casilla por casilla.
* 🎯 **Auditoría de Calidad Real (Exclusión de Reseñas Sin Texto)**: Los análisis de fricciones, quejas críticas y turnos operativos ahora procesan exclusivamente opiniones que contienen comentarios escritos. Las calificaciones vacías o sin texto únicamente se consideran para el volumen total y la nota promedio, asegurando que los reportes de servicio reflejen situaciones 100% reales y auditables.
* 👁️ **Transparencia Estadística en Standings**: En la tabla de posiciones regionales, cada puntaje ahora cuenta con un micro-indicador de certidumbre muestral, distinguiendo con honestidad a sucursales con cientos de opiniones de aquellas recién abiertas con pocas valoraciones.
* 🔌 **Reseñas directo desde Google, sin intermediarios**: Étoile ya lee las opiniones de las 33 sucursales desde la cuenta oficial de Google Business Profile. Se acabó la extracción manual y el costo de herramientas externas. Se importaron todas las reseñas nuevas (914) sin duplicar ni perder el historial ni las clasificaciones de quejas.
* 🔄 **Actualización automática**: las opiniones se refrescan solas cada pocas horas, sucursal por sucursal.
* 📅 **Fechas más exactas**: las reseñas antiguas ahora usan la fecha real que registra Google. Algunas pasaron a otro mes o trimestre, así que cifras históricas por trimestre pueden variar un poco respecto a reportes anteriores.
* 🧹 **Textos limpios**: se elimina la traducción automática al inglés que Google agrega a muchos comentarios, para que las palabras clave y las quejas se midan solo sobre lo que escribió el cliente.
* 🔐 **Cada quien ve solo lo que le corresponde, garantizado desde la base de datos**: los gerentes ven su región completa junto con su tienda, los gerentes zonales ven todas las regiones y la dirección ve todo, incluido el panel étoile corporativo. Antes esa separación solo existía en la pantalla; ahora nadie puede saltársela, y las opiniones dejaron de ser accesibles sin iniciar sesión.
* 🏪 **El gerente ahora compara su tienda con su región**: al entrar ve todas las sucursales de su región, no solo la suya, para medir su desempeño frente a las demás.
* 🏷️ **Roles más claros**: el acceso de la dirección se agrupa bajo un solo perfil "Corporativo" (todas las sucursales y el panel étoile corporativo). No cambia lo que ve nadie hoy; ordena la base para futuras vistas por rol.
* ⚡ **Actualización más ligera**: la sincronización con Google ahora solo toca lo que realmente cambió (reseñas nuevas, ediciones o respuestas), así que corre más rápido y con menos carga.
* 🧭 **Todas las quejas clasificadas**: las 396 quejas de 1 y 2 estrellas con comentario que faltaban ya tienen su categoría (servicio, calidad o valor), por lo que los reportes de fricciones ya cubren todo el historial.
* 📝 **Información al día**: la sección "Acerca de" y la documentación ya explican que las reseñas llegan directo de Google cada 30 minutos.
* 🛠️ **Publicación más segura**: se corrigió un detalle que impedía publicar la actualización y se agregó una revisión automática para que no se repita. No hubo ninguna afectación para los usuarios.
* 👁️‍🗨️ **Mayor Nitidez y Contraste Visual**: Refinamiento en la paleta de colores del modo oscuro con textos secundarios más legibles y líneas de meta más brillantes que facilitan la lectura en cualquier iluminación.
* ⚖️ **Comparador Head-to-Head de Sucursales (`#/comparar`)**: Herramienta ejecutiva split-screen para enfrentar dos tiendas frente a frente (*ej. Andares vs Galerías*), con gráfico de **Radar Operativo de 5 Dimensiones**, tabla de contraste numérico directo y veredicto ejecutivo automatizado.
* ⚡ **Carga Instantánea (<5ms)**: La plataforma abre al instante con datos guardados localmente, eliminando tiempos de espera y pantallas de carga.
* 📊 **Tarjetas Flotantes de Gráficas de Alta Definición**: Gráficos con etiquetas interactivas de cristal, tipografía editorial y micro-indicadores visuales que reemplazan los recuadros planos anteriores.
* 🔄 **Actualización Inteligente en Segundo Plano**: Al abrir el tablero, la información se muestra de inmediato mientras el sistema verifica discretamente si llegaron nuevas reseñas.
* 📶 **Modo Sin Conexión Total**: Consulta reportes, sucursales y notas históricas en zonas con baja señal o sin internet en tienda.

---

## Versión 3.4.5 Izar - Resúmenes Ejecutivos, Botón Compartir y Experiencia Celular (Septiembre 2026)
* ⚡ **Resumen Ejecutivo Inmediato (Key Takeaways)**: Nuevas tarjetas Crystal al inicio de cada reporte con los 3 puntos más importantes del mes explicados de forma clara y directa.
* 📲 **Barra Móvil Fija de Acceso Rápido**: Nueva barra inferior optimizada para celulares con acceso instantáneo a las acciones de reporte sin importar cuánto scroll hagas.
* 📤 **Botón Compartir Nativo**: Ahora puedes enviar la tarjeta de desempeño y métricas de la sucursal directo por WhatsApp, Telegram o copiar el enlace en un solo toque.
* 🔗 **Navegación por Zonas (Clusters)**: Enlaces directos para saltar con un clic entre tiendas vecinas de la misma región.
* ❓ **Centro de Preguntas Frecuentes (FAQ)**: Respuestas claras a dudas frecuentes sobre cómo se calculan las calificaciones y el tratamiento de opiniones.
* 🛡️ **Pantallas de Ayuda y Contingencia**: Diseño de nuevas pantallas amigables de error y mantenimiento para guiar al usuario sin frustración si una página no existe o si hay labores en el servidor.
* 📶 **Detección Sin Conexión**: Aviso automático en pantalla si el teléfono se queda sin señal en bodega o almacén, permitiendo seguir consultando la información cargada.
* 🔒 **Blindaje y Protección de Plataforma**: Protección reforzada de la información interna mediante políticas estrictas de seguridad web (cabeceras CSP y permisos de hardware) y optimización de velocidad de carga.
* 🔐 **Privacidad y Navegación Inteligente en Pantallas de Acceso**: Si se abre un enlace a una sección restringida o inexistente sin haber iniciado sesión, la pantalla protege la estructura interna del portal mostrando únicamente el acceso a iniciar sesión o consultar el aviso de privacidad, sin menús confusos ni redirecciones repentinas.

---

## Versión 3.4.4 Izar - Paginación, Normalización y Explorador Histórico (Agosto 2026)
* 📊 **Lectura Completa de Opiniones**: Optimización del motor de datos para mostrar el 100% de las reseñas históricas de cada sucursal (como Andares) sin recortes.
* 🗓️ **Explorador Histórico por Año y Mes**: Nueva barra de control en la pantalla principal para auditar resultados de años anteriores (2018 a 2026) por mes, región y sucursal.
* ⚖️ **Ranking Regional Equitativo**: Incorporación de Suavizado Bayesiano ($k=15$, $M=4.50\star$) en el cálculo del score ajustado para evaluar con justicia a tiendas con pocas reseñas frente a grandes complejos multitienda.
* 🔍 **Buscador Instantáneo y Filtros**: Búsqueda rápida por texto libre y filtrado directo de sucursales en estado Óptimo vs. Alerta.

---

## Versión 3.4.3 Izar - Estabilidad en la Nube y Seguridad (Junio 2026)
* ☁️ **Conexión Directa a la Nube**: Garantía de datos en tiempo real mediante conexión exclusiva con la base de datos central en PostgreSQL.
* 🔒 **Seguridad y Accesos**: Refuerzo en la protección de accesos y permisos según el rol operativo del usuario.

---

## Versión 3.4.2 Izar - Depuración y Fusión Operativa de Tiendas (Junio 2026)
* 🏢 **Unificación Operativa GDL**: Consolidación de las sucursales Andares y Mercado Andares en la ficha única "Andares" para reflejar su página oficial de opiniones.
* 🗺️ **Mapa Operativo Limpio**: Remoción de ubicaciones inactivas o no operativas para evitar tarjetas vacías en el tablero.

---

## Versión 3.4.0 Izar - Experiencia Celular y Diseño Premium (Mayo 2026)
* 📱 **Navegación Móvil Mejorada**: Adaptación de menús deslizantes inferiores (Bottom Sheets) y barras de navegación optimizadas para teléfonos móviles.
* 🎨 **Diseño Crystal & Squircle**: Actualización visual de tableros, tarjetas e indicadores con la paleta de marca y modo oscuro automático.
