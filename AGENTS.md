# Dashboard de Reseñas · La Crêpe Parisienne GDL

## Estructura de archivos

```
reviews-lcp-gdl/
├── index.html              # Shell SPA. Carga módulos en orden.
├── css/
│   └── styles.css          # Identidad gráfica unificada (web + PDF).
├── js/
│   ├── data.js             # Metadatos de sucursales, mapeos, constantes, Q1_DATA.
│   ├── utils.js            # Helpers puros (fechas, estrellas, SVG, reveal, trimestres).
│   ├── charts.js           # Configuraciones reutilizables de Chart.js.
│   ├── kpis.js             # Cálculo de KPIs + cacheo en localStorage.
│   ├── data-loader.js      # Carga lazy de JSON mensuales bajo demanda.
│   ├── router.js           # Hash router SPA con soporte async.
│   ├── app.js              # Bootstrap: tema, estado global, inicio.
│   └── views/
│       ├── home.js         # Vista principal (mes en curso vs anterior + KPIs).
│       ├── branch.js       # Vista por sucursal (scorecard PDF, reseñas, problemáticas).
│       ├── quarter.js      # Vista trimestral (acordeón, ranking, comparativas).
│       └── about.js        # Acerca de, misión, metodología, descargas.
├── data/
│   ├── manifest.json       # Índice de meses disponibles por año.
│   └── 2026/
│       ├── 01.json         # Enero 2026 (184 reseñas).
│       ├── 02.json         # Febrero 2026 (94 reseñas).
│       ├── 03.json         # Marzo 2026 (112 reseñas).
│       ├── 04.json         # Abril 2026 (104 reseñas).
│       └── 05.json         # Mayo 2026 (121 reseñas, en curso).
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

## Flujo futuro: Apify → Dashboard

```
Apify Google Maps Reviews Scraper
        ↓
    CSV crudo (mensual)
        ↓
    Script Python (tú lo corres)
        ↓
    CSV limpio → JSON mensual (data/YYYY/MM.json)
        ↓
    Actualizar manifest.json (añadir mes)
        ↓
    Actualizar Q1_DATA en data.js (si es trimestre nuevo)
        ↓
    Push a repo / FTP
        ↓
    Dashboard carga datos automáticamente
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
