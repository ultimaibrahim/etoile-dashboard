# Dashboard de Reseñas · La Crêpe Parisienne GDL

## Estructura de archivos

```
reviews-lcp-gdl/
├── index.html              # Shell SPA. Carga módulos en orden.
├── css/
│   └── styles.css          # Identidad gráfica unificada (web + PDF).
├── netlify/
│   └── functions/
│       ├── apify-ingest.js # Webhook seguro de ingesta desde Apify a Supabase.
│       └── diag-db.js      # Endpoint de diagnóstico de base de datos con token Bearer.
├── js/
│   ├── data.js             # Metadatos de sucursales, mapeos, constantes, Q1_DATA.
│   ├── utils.js            # Helpers puros (fechas, estrellas, SVG, reveal, trimestres).
│   ├── charts.js           # Configuraciones de Chart.js.
│   ├── kpis.js             # Cálculo de KPIs.
│   ├── data-loader.js      # Carga dinámica de reseñas desde Supabase.
│   ├── router.js           # Hash router SPA con soporte async.
│   ├── app.js              # Bootstrap: tema, Auth Supabase, inicio.
│   └── views/
│       ├── home.js         # Vista principal (mes en curso vs anterior + KPIs).
│       ├── branch.js       # Vista por sucursal (scorecard PDF, reseñas, problemáticas).
│       ├── quarter.js      # Vista trimestral (acordeón, ranking, comparativas).
│       ├── dashboards.js    # Cuadro de mando ejecutivo (4 gráficos + alertas operativas).
│       └── about.js        # Acerca de, misión, metodología, descargas y changelog.
├── data/                   # [DEPRECADO] Datos locales heredados de versiones anteriores.
└── AGENTS.md               # Este archivo.
```

## Orden de carga de scripts

1. `Chart.js` (CDN)
2. `data.js` — debe cargar primero (metadatos usados por todos).
3. `utils.js` — helpers globales.
4. `charts.js` — envoltorio de Chart.js.
5. `kpis.js` — depende de utils y data.
6. `data-loader.js` — depende de utils y data.
7. `views/*.js` — dependen de todo lo anterior.
8. `router.js` — registra vistas.
9. `app.js` — último; define estado global e inicia la app.

## Estado global

- `darkMode` — boolean, persistido en `localStorage` bajo clave `lcpDark`.
- `homeFilter` — filtro de sucursales en Home (`todas` | `alerta` | `estables`).
- `branchView` — tab activo en vista sucursal (`abril` | `mayo`).

## Schema de datos mensuales (JSON)

Cada archivo `data/YYYY/MM.json` contiene:

```json
{
  "meta": {
    "year": 2026,
    "month": 4,
    "monthName": "Abril",
    "totalReviews": 104,
    "generatedAt": "2026-05-11T00:00:00Z",
    "note": "Opcional: notas sobre datos parciales"
  },
  "reviews": [
    {
      "title": "La Crêpe Parisienne Andares",
      "stars": 5,
      "publishedAtDate": "2026-04-07T17:57:38.456Z",
      "text": "Muy ricas",
      "textTranslated": null,
      "isLocalGuide": false,
      "responseFromOwnerText": null,
      "likesCount": 0,
      "sucursal": "Andares"
    }
  ]
}
```

### Campos obligatorios

| Campo | Tipo | Descripción |
|---|---|---|
| `title` | string | Título de la reseña en Google Maps. |
| `stars` | int | 1–5. |
| `publishedAtDate` | ISO 8601 | Fecha y hora UTC del scraper. |
| `text` | string | Texto de la reseña. |
| `isLocalGuide` | bool | Si el autor es Local Guide. |
| `sucursal` | string | Nombre de sucursal (debe mapear a `SUCURSALES_META`). |

### Campos opcionales (futuro)

| Campo | Uso futuro |
|---|---|
| `responseFromOwnerText` | KPI "Tasa de respuesta" cuando se conecte Apify. |
| `likesCount` | Métrica de engagement. |
| `textTranslated` | Si se añade traducción automática. |

## Mapeo de nombres de sucursal

El campo `sucursal` en JSON debe coincidir con uno de los valores aceptados por `DataLoader.getReviewsForBranch`:

- `Andares`
- `Plaza Patria`
- `Galerías GDL` (o `Gal. GDL`)
- `Midtown`
- `Via Viva`
- `Galerías Santa Anita` (o `Sta. Anita`)
- `La Perla`
- `Forum Tlaquepaque` (o `Forum`)

## Cacheo de KPIs

- `KpiStore` guarda resultados calculados en `localStorage` con clave `lcp_kpis_YYYY_MM`.
- Meses **cerrados** (último día ya pasó): se lee cache si existe; si no, se calcula y guarda.
- Meses **en curso**: se recalcula siempre para reflejar datos nuevos.
- Último día del mes: se calcula una última vez y se guarda.

## Datos trimestrales precalculados

`Q1_DATA` en `js/data.js` contiene promedios y conteos por mes para cada sucursal (Ene–Mar 2026). Se usa en la vista trimestral para evitar recalcular sobre archivos grandes.

## Flujo de datos: Apify → Supabase → Dashboard

```
Apify Google Maps Reviews Scraper
        ↓
   Webhook POST (Header Authorization: Bearer webhook_secret)
        ↓
   Netlify Function: /netlify/functions/apify-ingest.js
        ↓ (Normaliza, valida stars/fechas, mapea sucursales y dedup por ID)
   Supabase (Tabla: `reviews`)
        ↓
   Dashboard (Carga dinámica online por región/sucursal via Supabase Client)
```

### Notas sobre Apify

- El scraper de Apify extrae `publishedAtDate` con timestamp completo (fecha + hora).
- El campo `responseFromOwnerText` indica si el dueño respondió (null = sin respuesta).
- Para implementar "Tasa de respuesta" (KPI oculto por ahora), se requiere que el scraper traiga este campo.
- La API oficial de Google Business Profile también permite leer respuestas, pero requiere OAuth y permisos de negocio.

## Rutas disponibles

| Hash | Vista |
|---|---|
| `#/` | Home (mes en curso vs anterior + KPIs) |
| `#/sucursal/:id` | Detalle de sucursal (scorecard, problemáticas, citas) |
| `#/trimestre/YYYY-QN` | Comparativa trimestral (ranking, acordeón, evolución) |
| `#/dashboards` | Cuadro de mando ejecutivo (4 gráficos integrados + alertas operativas) |
| `#/acerca` | Misión, metodología, descargas |

## Estilos y componentes (PDF → Web)

| Clase | Uso |
|---|---|
| `.badge-critical` / `.badge-attention` / `.badge-optimal` | Estados de sucursal (Crítica / Atención / Óptima). |
| `.quote-block` | Citas textuales de reseñas destacadas (mejor/peor). |
| `.scorecard` / `.scorecard-grid` | Resumen tipo tarjeta por sucursal (Rating hist, Prom actual, Δ, Q1). |
| `.data-table` | Tablas comparativas (evolución trimestral, ranking). |
| `.accordion-item` | Colapsable por sucursal en vista trimestral. |
| `.rank-badge` | Badges de ranking (oro, plata, bronce). |

## Cómo agregar un mes nuevo

1. Generar `data/YYYY/MM.json` con el schema correcto.
2. Actualizar `data/manifest.json` añadiendo el mes al array correspondiente.
3. Si es inicio de trimestre, actualizar `Q1_DATA` en `js/data.js`.
4. Subir archivos al servidor.
5. El dashboard detectará el nuevo mes automáticamente al recargar.

## Cómo correr localmente

```bash
# Python 3
python -m http.server 8000
# Abrir http://localhost:8000
```

En Windows PowerShell:
```powershell
python -m http.server 8000
```
