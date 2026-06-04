import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Topbar from '../components/Topbar';
import Icon from '../components/Icon';
import { Star, Download, Mail, MessageSquare } from 'lucide-react';

interface ChangelogVersion {
  v: string;
  date: string;
  items: string[];
}

interface EpochGroup {
  name: string;
  description: string;
  versions: ChangelogVersion[];
}

const CHANGELOG_EPOCAS: EpochGroup[] = [
  {
    name: 'Altair',
    description: `
      Representa la era de la madurez operativa y refinamiento visual del Dashboard de Reseñas. Se enfoca en consolidar el control regional de incidencias y la unificación estética.
    `,
    versions: [
      {
        v: 'v3.5.0.altair', date: 'Junio 2026',
        items: [
          'Integración de Lucide React: Refactorización completa del componente Icon y de todas las vistas (Home, Branch, Dashboards, About, Login, SelectRegion) reemplazando todos los SVGs inline por componentes optimizados de lucide-react.',
          'Corrección de Tipos en SelectRegion: Añadido soporte de tipado para regiones_permitidas en el perfil de usuario y tipado estricto en la selección regional para resolver errores de compilación.'
        ]
      },
      {
        v: 'v3.4.2.altair', date: 'Junio 2026',
        items: [
          'Exclusión de Cinemex y Cumbres: Remoción definitiva del mapa y de las configuraciones del Dashboard de las 8 ubicaciones en complejos Cinemex y de la sucursal Cumbres de Monterrey para evitar ruido visual y tarjetas vacías.',
          'Unificación Operativa GDL: Fusión formal de las sucursales Andares y Mercado Andares en la sucursal única "andares", compartiendo su única página de Google Reviews.',
          'Lista de Place IDs Oficiales: Generación de la lista depurada de 33 Place IDs únicos para alimentar el scraper de Apify.',
          'Ajustes de Sincronización: Actualizado el webhook de Netlify (apify-ingest) para reflejar la unificación de Andares y eliminar los mapeos de Cinemex y Cumbres.'
        ]
      },
      {
        v: 'v3.4.1.altair', date: 'Junio 2026',
        items: [
          'Unificación Regional: Se unificaron las sucursales duplicadas de San Luis y The Park (SLP) en la sucursal única the-park, y de Pocitos y Altaria (AGS) en la sucursal única altaria.',
          'Consolidación de MTY: Monterrey configurado con 4 sucursales activas (Galerías MTY, Galerías Valle Oriente, Fashion Drive y Galerías Cumbres).',
          'Soporte Cinemex Completo: Añadido tag visual especial, animación perimetral y fondo con marca de agua SVG traslúcida de cine en las tarjetas y vista de detalle de las sucursales ubicadas dentro de complejos Cinemex (Artz, Plaza Mayor, The Park y Landmark Tijuana).',
          'Tijuana y Landmark: Se restauró la sucursal Landmark Tijuana en lugar de la genérica y se conserva Plaza Península como las dos ubicaciones oficiales de Tijuana.',
          'Sincronización Ingesta: Actualizado el webhook de Netlify (apify-ingest) para unificar de forma automática los mapeos de San Luis y Pocitos.',
          'Alineación con P&L Oficial: Se añadieron las sucursales del P&L oficial, incluyendo Cumbres (MTY), Mercado Andares (GDL, separada de Andares) y las nuevas Cinemex (Artz, Insurgentes, Antara, Reforma 222, Patriotismo y Cinemex The Park), y se removió la sucursal inactiva Aeropuerto.'
        ]
      },
      {
        v: 'v3.4.0.altair', date: 'Mayo 2026',
        items: [
          'Consolidación Tipográfica: Unificado el sistema de fuentes tipográficas para usar Plus Jakarta Sans, Playfair Display y JetBrains Mono por defecto en todos los modos.',
          'Botones y Safe Areas: Soporte completo para env(safe-area-inset-bottom) en la barra de navegación móvil y adaptaciones de padding para evitar conflictos con la barra de gestos de iOS.',
          'Bottom Sheet Drawers: Implementado un menú deslizante inferior (Bottom Sheet) premium para selectores en móvil en lugar de los desplegables flotantes tradicionales.',
          'Compact KPIs: Reorganizada la cuadrícula de scorecards de KPIs regionales a un formato de 2x2 en dispositivos móviles para ahorrar espacio vertical.',
          'Optimización de Autoplay: El carrusel de opiniones recientes respeta la directiva prefers-reduced-motion y deshabilita el auto-scroll si el usuario lo solicita.',
          'Responsividad de Ejes en Gráficos: Títulos y leyendas de ejes Chart.js optimizados para pantallas pequeñas (ocultando descripciones repetitivas en móvil) y padding dinámico en gráficos de clasificación.'
        ]
      },
      {
        v: 'v3.3.1.altair', date: 'Mayo 2026',
        items: [
          'Dual Y-Axis en Volumen: Gráfico de volumen de opiniones optimizado para usar doble eje Y agrupado, destacando quejas negativas en el eje derecho y evitando el aplastamiento por escala.',
          'Etiquetas de Desviación en Ranking: Visualización del puntaje exacto y su desviación con respecto a la meta (ej. +0.20 / -0.40) al final de cada barra en el ranking de sucursales, junto con una línea vertical de meta en 4.60.',
          'Línea de Meta en Tendencia YTD: Ajustado el rango del eje Y de 4.5 a 5.0 y añadida la línea de meta horizontal en 4.60.',
          'Distribución de Estrellas Horizontal: Barra horizontal interactiva que reemplaza la dona anterior, mostrando cantidades y porcentajes directamente sin recortes.'
        ]
      },
      {
        v: 'v3.3.0.altair', date: 'Mayo 2026',
        items: [
          'Cuadro de Mando Macro: Rediseño completo de la sección de dashboards con un layout de 4 gráficos interactivos (Volumen Apilado, Ranking de Calificación, Distribución de Estrellas y Tendencia Regional YTD).',
          'Alertas Proactivas: Nuevo de módulo de visualización ejecutiva en dashboards para identificar de forma proactiva caídas de rating, bajo desempeño, focos de incidencias y quejas desatendidas.',
          'Eliminación de Respuestas de IA: Remoción definitiva de la funcionalidad de borradores de respuesta asistidos por inteligencia artificial en el modal de detalles.',
          'Mejora de Contraste Premium: Ajustes de opacidad en superficies glassmorphic y color de fondo en tema oscuro para asegurar legibilidad bajo la interfaz Crystal.'
        ]
      },
      {
        v: 'v3.2.5.altair', date: 'Mayo 2026',
        items: [
          'UI Premium: Estética Crystal & Squircle condicional activada con atributo html[data-ui-premium="true"] (tipografías Plus Jakarta Sans y Playfair Display, radios de 20px, y efectos glassmorphic con blur de 14px).',
          'Botón flotante premium: Integración de control en la esquina inferior derecha con transición de barrido radial animada (radial clip-path sweep) al cambiar de tema.',
          'Previsualizador interactivo: Widget comparador Antes vs Después (split card con slider deslizante) en la vista Acerca de para evaluar la nueva propuesta gráfica.',
          'Interacciones y Modal: Habilitada la apertura de la ficha detallada de reseñas al hacer clic en las tarjetas del carrusel, la barra de búsqueda lateral y la vista mensual por sucursal.'
        ]
      },
      {
        v: 'v3.2.4.altair', date: 'Mayo 2026',
        items: [
          'Alineación estética: Reemplazada la línea divisoria punteada/discontinua en la tarjeta de Alerta Activa por una línea divisoria sutil, idéntica a la empleada en la sección de Destacados.',
          'Glow perimetral: Corregido el efecto hover en las tarjetas de Alerta Activa y Lo más destacado para que emitan un destello (glow) y color de borde congruentes con su color respectivo (rojo para alerta y amarillo/oro para destacado) en lugar de verde.'
        ]
      },
      {
        v: 'v3.2.3.altair', date: 'Mayo 2026',
        items: [
          'Corrección de transición: Subsanado el error que causaba que la vista de dashboards quedara en blanco al cambiar el mes del selector de periodo al re-inicializar el IntersectionObserver.',
          'Alineación de márgenes: Ajustada la anchura máxima del selector de periodo a 1196px para que mantenga perfecta sintonía y alineación con los márgenes del resto de los elementos y gráficas de la página.'
        ]
      },
      {
        v: 'v3.2.2.altair', date: 'Mayo 2026',
        items: [
          'Reporte Especial: Correccion del contraste de color y legibilidad en el texto "Resumen Trimestral" (Reporte Especial) dentro del hero de dashboards, independientemente del modo claro o oscuro.',
          'Agrupamiento visual: Reemplazo del boton del reporte especial por un boton pill estilizado y optimizacion del icono de calendario del fondo para evitar colores distorsionados por fill/stroke conflictivos.',
          'Selector de periodo: Incorporacion de una nueva barra de controles con selector de mes premium personalizado (custom select organico) para el filtrado de estadisticas y volumen de la seccion de dashboards con cierre dinamico al hacer clic fuera.'
        ]
      },
      {
        v: 'v3.2.1.altair', date: 'Mayo 2026',
        items: [
          'Optimización de Alertas: Rediseño estético y de dimensiones de los botones de copiado de alertas (tanto individual como consolidado) a formato centrado y compacto para evitar bloques masivos en la interfaz.',
          'Emblema Local Guide: Ajuste sutil del distintivo de Local Guide en la vista de detalle de reseña, limitando el tamaño del icono de estrella SVG para prevenir desbordamientos y saltos de línea indeseados en el texto.'
        ]
      },
      {
        v: 'v3.2.0.altair', date: 'Mayo 2026',
        items: [
          'Evaluación de sucursales: Calificación con estrellas de color oro ubicada ahora al lado del nombre de la sucursal en las tarjetas de la pantalla de inicio y en la cabecera de la vista de sucursal.',
          'Dropdowns personalizados: Sustitución de todos los selectores HTML nativos restantes por selectores orgánicos y estilizados de diseño premium, incluyendo el selector de mes del Hero, los filtros de sentimiento y sucursal de la barra lateral, y el selector de mes de la vista de sucursal.',
          'Interacciones y UX: Implementación de cierre automático al hacer clic fuera del dropdown para todos los nuevos selectores orgánicos y resguardo del estado del filtro de la barra lateral en memoria.'
        ]
      },
      {
        v: 'v3.1.0.altair', date: 'Mayo 2026',
        items: [
          'Agrupación e informes: Unificación de alertas regionales con la capacidad de ver el feed completo de reseñas críticas desde un botón general.',
          'Consolidación de reportes: Botón para copiar al portapapeles el resumen de incidencias estructurado para envío directo a Marketing.',
          'Dashboard Scorecards: Ajustes de altura fija y alineación interna vertical (margin-top: auto en barra de progreso) para evitar desalineaciones en móviles.',
          'Ajustes de UI: Centrado vertical y alineación del icono indicador en las tarjetas de sucursal, y transiciones fluidas en hover.',
          'Estados de alerta: Subsanada la evaluación de hover para marcar en color naranja sucursales que tengan alertas pero promedio igual o superior a la meta de 4.60, y en rojo únicamente si está por debajo.',
          'Carrusel de Actividad: Movimiento continuo fluido (0.6px/frame) con pausa inteligente en hover, clic y eventos táctiles.',
          'Responsividad del Carrusel: Ocultamiento completo de flechas en pantallas móviles para desplazamiento táctil nativo sin interferir con el texto, y gutters laterales de 48px en escritorio.',
          'Detalle de Reseñas: Modal emergente premium con desenfoque de fondo (backdrop-filter) para leer reseñas completas al hacer clic en las tarjetas del carrusel, con congelamiento de scroll del body y reanudación automática del carrusel al cerrar.',
          'Recorte de texto: Limitación visual estricta a 3 líneas de texto con puntos suspensivos en las tarjetas del carrusel, asegurando una visualización uniforme de las reseñas.'
        ]
      },
      {
        v: 'v3.0', date: 'Mayo 2026',
        items: [
          'Controles de Sucursal: Rediseño completo de búsqueda, filtros y ordenación con dropdown customizado orgánico y chips integrados de forma fluida.',
          'Evaluación de Sucursales: Gradiente interactivo en hover según desempeño (verde si todo OK, naranja si hay alertas y promedio ≥ regional, rojo si hay alertas y promedio < regional).',
          'Identidad Visual: Eliminación total de emojis en toda la plataforma, reemplazados por iconos SVG vectoriales responsivos y consistentes.',
          'Optimización Dark Mode: Ajustes en los contrastes y legibilidad del texto en modo oscuro, con transiciones fluidas en todas las vistas.'
        ]
      }
    ]
  },
  {
    name: 'Sirius',
    description: `
      Etapa de revolución arquitectónica e infraestructura técnica del Dashboard. Introdujo modularidad y rendimiento optimizado para el uso diario.
    `,
    versions: [
      {
        v: 'v2.9', date: 'Mayo 2026',
        items: [
          'Month Dropdown: Se traslada el selector de meses al Hero con un dropdown de diseño premium integrado.',
          'Actividad Reciente: Rediseño del feed en formato carrusel con scroll horizontal y efecto de difuminado lateral.',
          'Alertas sin texto: Se filtran las alertas para mostrar únicamente reseñas negativas con comentarios escritos.',
          'Modal de Alertas: Cierre al hacer clic fuera del recuadro, bloqueo de scroll en el fondo y simplificación de botones de acción.'
        ]
      },
      {
        v: 'v2.8', date: 'Mayo 2026',
        items: [
          'Sincronización de Meses: El selector de mes ahora se sincroniza globalmente entre la pantalla principal y las vistas de sucursal.',
          'Lo más destacado: Se restaura la sección de reseñas 5 estrellas destacadas con autoplay aleatorio al lado del banner de alertas.',
          'Font loading: Se corrige la ruta de carga de la tipografía Giaza.otf y se aplica a todas las marcas étoile en footer.'
        ]
      },
      {
        v: 'v2.7', date: 'Mayo 2026',
        items: [
          'KPIs: Mapeo de métricas accionables (ej. "negativas sin responder" y listado de sucursales faltantes).',
          'Alertas: Sistema de seguimiento con chips de sucursales y opción de marcar como atendido persistente.',
          'Actividad Reciente: Nuevo feed de reseñas con 3 cards destacadas (mix positivo/negativo) y análisis de causa raíz.',
          'Feed Completo: Drawer lateral deslizable con filtros avanzados por sentimiento y sucursal.',
          'Mes Navegable: Selector de mes en el topbar header con flechas para actualización total reactiva.',
          'Scorecard Hero: Animación de conteo animado para el promedio regional con gradiente dorado.',
          'Surfaces: Profundidad visual mejorada en modo oscuro (#0B0C15, #151725, #1E2132).'
        ]
      },
      {
        v: 'v2.6', date: 'Mayo 2026',
        items: [
          'Dashboards: Charts dinámicos y responsive al 100% en pantallas móviles.',
          'Corrección definitiva del bottom nav móvil (fixed edge-to-edge sin espacios).',
          'Home: Nuevo botón "Siguiente reseña" en card Destacado con transición suave.',
          'Refinamiento de grid layout: espaciados consistentes y heights balanceados.',
          'Changelog: El botón de versión se convierte en easter egg sin estilo de link.',
          'Fix de inicialización de animaciones .r en primera carga.'
        ]
      },
      {
        v: 'v2.5', date: 'Mayo 2026',
        items: [
          'Filtrado visual de reseñas sin texto (KPI no afectado).',
          'Sección "Nuestro Propósito" alineada a la derecha con cita completa.',
          'Tooltip de gráfica se auto-oculta a los 5 segundos en móvil.',
          'Grid de dashboards responsive (1 col móvil → 2 col desktop).',
          'Hero sections full-width en resoluciones grandes (fix huecos laterales).',
          'About: card de Ibrahim al final, versión con changelog interactivo.',
          'Modal de alertas: animación de entrada + cierre con Escape.',
          'Texto normal (no italic) en sección de valores y modal.'
        ]
      },
      {
        v: 'v2.4', date: 'Mayo 2026',
        items: [
          'Restauración de identidad "Acerca de": misión, valores, propósito.',
          'Card de Product Owner con bio, email y WhatsApp actualizados.',
          'Reseñas sin texto ocultas visualmente (no afectan KPI).',
          'Botón "Mostrar todas" también filtra solo reseñas con texto.',
          'Corrección de padding-bottom móvil (botones no recortados).',
          'About: card de Ibrahim al final, versión con changelog interactivo.'
        ]
      },
      {
        v: 'v2.3', date: 'Abril–Mayo 2026',
        items: [
          'KPI "Calidad de reseña": fix ReferenceError (positivasConTexto).',
          'Fix error crítico en styles.css (bloque body no cerrado → página en blanco).',
          'Overflow-x hidden en html (scroll fantasma móvil eliminado).',
          'Dashboards: hero con dos columnas, acceso a Reporte Trimestral Q1.',
          'Watermark de estrellas posicionadas esquina inferior-derecha.',
          'Auto-hide tooltip en gráfica de barras tras 5s en touch.'
        ]
      },
      {
        v: 'v2.2', date: 'Abril 2026',
        items: [
          'Dark mode: data-theme en <html> (no en body).',
          'Tarjetas alert-box-sunken y highlight-box con watermark de estrellas.',
          'Ruta #/trimestre/2026-Q1 accesible desde hero de Dashboards.',
          'Eliminación de emojis decorativos (reemplazados por SVG).',
          'Mobile-first: bottom nav 6 tabs, topbar responsive.'
        ]
      },
      {
        v: 'v2.1', date: 'Marzo 2026',
        items: [
          'Sistema de roles: LEADERSHIP_ROLES vs gerente.',
          'Carga lazy de datos JSON por mes/año.',
          'KpiStore con caché localStorage.',
          'Hash router SPA async (#/, #/sucursal/:id, #/trimestre/:id, #/acerca).',
          'Vista Quarter con acordeón trimestral.'
        ]
      },
      {
        v: 'v2.0', date: 'Febrero 2026',
        items: [
          'Refactor completo: modularización en js/views/.',
          'DataLoader unificado con manifest.json.',
          'Sistema de Chart.js 4.4.1 CDN (barVolume + stackedVolume).',
          'Paleta de color LCP: --verde, --sage, --crema, --oro.'
        ]
      }
    ]
  },
  {
    name: 'v1.0 (Orígenes)',
    description: `
      Cimientos fundacionales del ecosistema. Se definió la identidad de marca, la paleta semántica inicial y los primeros flujos de datos operativos.
    `,
    versions: [
      {
        v: 'v1.0', date: 'Enero 2026',
        items: [
          'Arquitectura Base: Estructura del DOM inicial, maquetación adaptada a gerentes (mobile-first en iPhone).',
          'Variables CSS: Creación de la paleta semántica base (verde LCP, sage, crema, oro y alertas).',
          'Lecturas y Datos: Carga inicial de datos desde las hojas de cálculo de Google Sheets para reportes básicos.'
        ]
      }
    ]
  }
];

export const About: React.FC = () => {
  const { activeRegion, sucursalesMeta } = useApp();
  const [changelogOpen, setChangelogOpen] = useState(false);

  const toggleChangelog = () => {
    setChangelogOpen(prev => !prev);
    if (!changelogOpen) {
      setTimeout(() => {
        document.getElementById('changelogPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <>
      <Topbar />

      {/* HERO */}
      <section className="hero r" style={{ padding: '48px 22px' }}>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-label-row">
              <span className="eyebrow" style={{ color: 'rgba(245,239,230,.55)' }}>Acerca de este portal</span>
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,6vw,48px)', color: '#FAF5EB', lineHeight: '1.1', marginBottom: '14px', marginTop: '10px' }}>
              Dashboard de <span style={{ fontStyle: 'italic', color: 'var(--sage)' }}>Reseñas</span>
            </h1>
            <p style={{ color: 'rgba(245,239,230,.75)', fontSize: '15px', lineHeight: '1.6', maxWidth: '460px', margin: 0 }}>
              Herramienta operativa para el seguimiento y análisis de reseñas de Google Maps de las sucursales de La Crêpe Parisienne en la región {activeRegion}.
            </p>
          </div>
          <div className="hero-right">
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,239,230,.45)', marginBottom: '6px' }}>Versión actual</div>
                <button 
                  id="versionBtn" 
                  onClick={toggleChangelog} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '20px', fontWeight: 700, color: '#FAF5EB', letterSpacing: '.04em' }} 
                  title="Ver Changelog"
                >
                  étoile - Altair
                </button>
              </div>
              <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,239,230,.45)', marginBottom: '6px' }}>Cobertura</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#FAF5EB' }}>{sucursalesMeta.length} sucursales · Región {activeRegion}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHANGELOG COLLAPSIBLE */}
      <div 
        id="changelogPanel" 
        style={{ 
          display: changelogOpen ? 'block' : 'none', 
          overflow: 'hidden', 
          transition: 'max-height 0.4s ease', 
          padding: '0 20px' 
        }}
      >
        <section className="section">
          <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">Changelog <span className="accent">de versiones</span></div>
            <button 
              onClick={() => setChangelogOpen(false)} 
              style={{ background: 'none', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              Ocultar ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {CHANGELOG_EPOCAS.map(group => (
              <div className="epoch-group" key={group.name}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '22px', color: 'var(--verde)', fontWeight: 700, margin: 0 }}>
                    {group.name}
                  </h3>
                </div>
                <div 
                  style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}
                  dangerouslySetInnerHTML={{ __html: group.description }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px' }}>
                  {group.versions.map((entry, vIdx) => (
                    <div 
                      key={entry.v} 
                      className="chart-card" 
                      style={{ borderLeft: `3px solid ${(group.name === 'Altair' && vIdx === 0) ? 'var(--verde)' : 'var(--border)'}` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '14px', color: (group.name === 'Altair' && vIdx === 0) ? 'var(--verde)' : 'var(--text-muted)' }}>
                          {entry.v}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '.06em' }}>{entry.date}</span>
                        {(group.name === 'Altair' && vIdx === 0) && (
                          <span style={{ fontSize: '10px', background: 'rgba(61,90,71,0.12)', color: 'var(--verde)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, letterSpacing: '.08em' }}>
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {entry.items.map((item, idx) => (
                          <li key={idx} style={{ fontSize: '13px', color: 'var(--text)', paddingLeft: '18px', position: 'relative', lineHeight: '1.5' }}>
                            <span style={{ position: 'absolute', left: 0, color: 'var(--sage)' }}>›</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* PROPÓSITO */}
      <section className="hero r" style={{ background: 'var(--verde-deep)', padding: '56px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', gap: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,239,230,0.4)' }}>
            Nuestro Propósito
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,6vw,52px)', color: '#FAF5EB', lineHeight: '1.1', maxWidth: '720px', margin: 0 }}>
            &ldquo;Crear, operar y crecer modelos innovadores de restaurantes que hagan la vida mejor y más divertida para nosotros y nuestros invitados.&rdquo;
          </h2>
        </div>
      </section>

      {/* MISIÓN Y VALORES */}
      <section className="section r in">
        <div className="section-head">
          <div className="section-title">Misión <span className="accent">y valores</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Hospitalidad y Excelencia', text: 'Creamos historias de hospitalidad memorable. Documentamos nuestros estándares y los seguimos con orgullo. Entrenamos continuamente para hacer cada día mejor.' },
            { label: 'Innovación Continua', text: 'Buscamos constantemente nuevas formas de sorprender a nuestros invitados, optimizar operaciones y adoptar tecnología que potencie a nuestro equipo.' },
            { label: 'Datos como Cultura', text: 'Cada reseña es una conversación. Escuchamos, medimos y actuamos — porque la mejora continua empieza en entender qué piensan quienes nos visitan.' },
          ].map((v, idx) => (
            <div className="chart-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '18px 22px' }} key={idx}>
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                <Star size={18} fill="var(--oro)" color="var(--oro)" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {v.label}
                </div>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text)', margin: 0 }}>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DESCARGAS */}
      <section className="section r in">
        <div className="section-head">
          <div className="section-title">Descargas <span className="accent">próximamente</span></div>
        </div>
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(61,90,71,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Download size={24} color="var(--verde)" />
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--negro)', marginBottom: '8px' }}>Formatos y Reportes PDF</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px' }}>El módulo para exportar los reportes de KPIs mensuales en PDF está en desarrollo.</div>
        </div>
      </section>

      {/* PRODUCT OWNER */}
      <section className="section r in">
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(61,90,71,0.1)', color: 'var(--verde)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '15px', flexShrink: 0, border: '1px solid rgba(61,90,71,0.2)', textAlign: 'center', lineHeight: '40px', fontWeight: 'bold' }}>
              IG
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Ibrahim García</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product Owner · Dashboard de Reseñas LCP GDL</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a 
              href="mailto:ultima.ibrahim@proton.me"
              className="about-contact-link"
              style={{
                textDecoration: 'none',
                background: 'var(--surface-2)',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Mail size={12} />
              ultima.ibrahim@proton.me
            </a>
            <a 
              href="https://wa.me/5213333223998" 
              target="_blank"
              rel="noopener noreferrer"
              className="about-contact-link"
              style={{
                textDecoration: 'none',
                background: 'var(--surface-2)',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={12} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span className="brand" style={{ textTransform: 'none', fontFamily: 'var(--giaza)', fontSize: '18px' }}>étoile</span> · Grupo MYT / Corporativo Alancar<br />
        Dashboard de Reseñas · Región {activeRegion} · v3.4.2.altair · 2026
      </footer>
    </>
  );
};

export default About;
