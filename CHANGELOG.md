# 🛠️ Changelog Técnico — Étoile Dashboard
**La Crêpe Parisienne · Grupo MYT / Corporativo Alancar**

Este documento contiene el historial técnico completo de versiones de Étoile Dashboard con especificaciones de funciones, parámetros, arquitectura y base de datos.

---

## Generación Izar (v3.0 - v3.4.4)

Representa la era de la madurez operativa y refinamiento visual del Dashboard de Reseñas, enfocada en consolidar el control regional de incidencias, la unificación estética Crystal & Squircle y la conexión directa a base de datos en la nube.

### Version 3.4.4 Izar - Paginación en Supabase, Normalización y Exploración Histórica (Agosto 2026) [ACTUAL]
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
