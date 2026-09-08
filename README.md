# 🌟 Étoile Dashboard · Hospitality Customer Intelligence & Operations
> **Plataforma Integral de Analítica de Reseñas, Detección de Fricciones en Servicio y Auditoría Operativa Multi-Sucursal para Hospitalidad y Restauración.**

[![Status](https://img.shields.io/badge/status-production--ready-2E7D32.svg?style=flat-square)](#)
[![Deployment](https://img.shields.io/badge/deployed%20on-Netlify%20Serverless-00C7B7.svg?style=flat-square&logo=netlify&logoColor=white)](#)
[![Backend](https://img.shields.io/badge/database-Supabase%20%28PostgreSQL%29-3ECF8E.svg?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Scraper](https://img.shields.io/badge/data%20pipeline-Apify%20Actor-00A699.svg?style=flat-square&logo=apify&logoColor=white)](https://apify.com)
[![Design](https://img.shields.io/badge/design%20system-Crystal%20%26%20Squircle-6366F1.svg?style=flat-square)](#)

---

## 🧭 Visión General

**Étoile Dashboard** es una solución de Business Intelligence orientada al sector de la hospitalidad y gastronomía retail. Transforma miles de opiniones y calificaciones públicas de Google Maps en tableros operacionales accionables, permitiendo a directores de operaciones y gerentes de sucursal:
- Detectar caídas inmediatas en el NPS y calidad de atención.
- Categorizar automáticamente las quejas en tres ejes críticos: **Servicio / Atención**, **Calidad de Producto** y **Percepción de Valor / Precio**.
- Monitorear en tiempo real el tiempo de respuesta ante reseñas negativas desatendidas.
- Auditar métricas históricas comparativas mes a mes y trimestre a trimestre.

---

## 🏛️ Arquitectura del Sistema

La arquitectura está concebida bajo un modelo **Zero-Secret Client / Jamstack Serverless**, donde el frontend estático jamás expone llaves maestras y delega la orquestación y enriquecimiento de datos a Netlify Functions y Supabase:

```mermaid
flowchart TD
    subgraph INGEST ["Ingesta Asíncrona"]
        GM["Google Maps Reviews"] -->|Crawler| AP["Apify Webhook Engine"]
        AP -->|POST Ingest| NF_INGEST["Netlify: apify-ingest.js"]
        NF_INGEST -->|Procesamiento & Deduplicación| DB[("Supabase PostgreSQL")]
    end

    subgraph ENRICH ["Enriquecimiento & Diagnóstico"]
        DB <-->|Clasificación Semántica| NF_CLASS["Netlify: classify-review.js"]
        NF_DIAG["Netlify: diag-db.js"] -->|Auditoría Bearer Token| DB
    end

    subgraph CLIENT_UI ["Capa Cliente: Crystal & Squircle UI"]
        CLI["Navegador / Dispositivo Gerencial"] -->|GET config| NF_CONF["Netlify: get-config.js"]
        NF_CONF -->|URL & Anon Key| CLI
        CLI -->|Consultas Seguras RLS| DB
        CLI -->|Render Reactivo Vanilla ES6+| UI["Dashboard / Drilldowns / Scorecards"]
    end
```

---

## ⚡ Capacidades Principales

1. **Scorecards Operativos y Umbrales Críticos**:
   - Mapeo visual de estado de sucursales según rangos de desempeño: *Sobresaliente* (≥4.80), *Objetivo Regional* (4.60-4.79) y *Crítico* (<4.30).
2. **Motor de Clasificación de Fricciones**:
   - Pipeline de categorización heurística y semántica que aísla palabras clave de quejas (`servicio`, `calidad`, `valor`) reconociendo negaciones y contexto.
3. **Drill-Down de Sucursal**:
   - Vistas detalladas por unidad de negocio con análisis de palabras frecuentes del equipo, colaboradores mencionados y tendencias temporales.
4. **Seguridad y Resiliencia**:
   - Autenticación con Supabase Auth y persistencia segura en cookies.
   - Acceso a endpoints diagnósticos protegido vía `Bearer DIAG_SECRET`.

---

## 🛠️ Stack Tecnológico

- **Frontend**: Vanilla JavaScript (ES6+ modular), HTML5 Semántico, CSS3 Custom Properties (Crystal & Squircle Design System, Giaza Typography).
- **Serverless Compute**: Netlify Functions (Node.js 18+ runtime).
- **Base de Datos & Auth**: Supabase (PostgreSQL, Row Level Security, Realtime).
- **Data Pipelines**: Apify Actor Tasks & Webhook endpoints.

---

## 🚀 Despliegue y Configuración Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/ultimaibrahim/etoile-dashboard.git
   cd etoile-dashboard
   ```
2. Configura las variables de entorno en Netlify o en tu archivo `.env`:
   ```bash
   cp .env.example .env
   ```
3. Llena los valores correspondientes en `.env`:
   - `SUPABASE_URL`: URL del proyecto en Supabase.
   - `SUPABASE_ANON_KEY`: Clave pública anon de Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio para funciones administrativas.
   - `APIFY_TOKEN`: Token para la API de Apify.
   - `DIAG_SECRET`: Token para endpoints de auditoría.
4. Ejecuta localmente con Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```

---

## 👨‍💻 Autor & Arquitectura

Diseñado y construido por **Ibrahim García** ([@ultimaibrahim](https://github.com/ultimaibrahim)) · Guadalajara, México.