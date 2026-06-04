/**
 * data.js — Metadatos de sucursales, mapeos, constantes y datos trimestrales.
 * Los datos de reseñas mensuales viven en data/YYYY/MM.json o en Supabase.
 */

// Todos los metadatos de sucursales en todas las regiones
const SUCURSALES_META_ALL = [
  // Región Guadalajara (GDL)
  {
    id: 'andares',
    nombre: 'Andares',
    abr: 'Andares',
    historico: 4.3,
    q1Status: 'critical',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'patria',
    nombre: 'Plaza Patria',
    abr: 'Patria',
    historico: 4.5,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'gal-gdl',
    nombre: 'Galerías GDL',
    abr: 'Gal. GDL',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'midtown',
    nombre: 'Midtown',
    abr: 'Midtown',
    historico: 4.5,
    q1Status: 'attention',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'via-viva',
    nombre: 'Via Viva',
    abr: 'Via Viva',
    historico: 4.8,
    q1Status: 'attention',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'sta-anita',
    nombre: 'Galerías Santa Anita',
    abr: 'Sta. Anita',
    historico: 4.7,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'la-perla',
    nombre: 'La Perla',
    abr: 'La Perla',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },
  {
    id: 'forum',
    nombre: 'Forum Tlaquepaque',
    abr: 'Forum',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'GDL'
  },

  // Región Ciudad de México (CDMX)
  {
    id: 'roma',
    nombre: 'Roma',
    abr: 'Roma',
    historico: 4.5,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'condesa',
    nombre: 'Condesa',
    abr: 'Condesa',
    historico: 4.6,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'polanco',
    nombre: 'Polanco',
    abr: 'Polanco',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'coyoacan',
    nombre: 'Coyoacán',
    abr: 'Coyoacán',
    historico: 4.7,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'santa-fe',
    nombre: 'Santa Fe',
    abr: 'Santa Fe',
    historico: 4.2,
    q1Status: 'critical',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'interlomas',
    nombre: 'Interlomas',
    abr: 'Interlomas',
    historico: 4.5,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'satelite',
    nombre: 'Satélite',
    abr: 'Satelite',
    historico: 4.3,
    q1Status: 'attention',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  },
  {
    id: 'del-valle',
    nombre: 'Del Valle',
    abr: 'Del Valle',
    historico: 4.6,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: [],
    region: 'CDMX'
  }
];

// Región activa por defecto en el cliente
let activeRegion = 'GDL';

// Array dinámico que usarán todas las vistas y gráficos
let SUCURSALES_META = SUCURSALES_META_ALL.filter(s => s.region === activeRegion);

// Función para alternar o establecer la región activa en el frontend
function setRegionActiva(region) {
  if (region === 'CDMX' || region === 'GDL') {
    activeRegion = region;
    SUCURSALES_META = SUCURSALES_META_ALL.filter(s => s.region === activeRegion);
    return true;
  }
  return false;
}

const SUCURSAL_NAME_MAP = {
  // GDL
  'Andares': 'andares',
  'Plaza Patria': 'patria',
  'Galerías GDL': 'gal-gdl',
  'Midtown': 'midtown',
  'Via Viva': 'via-viva',
  'Galerías Santa Anita': 'sta-anita',
  'La Perla': 'la-perla',
  'Forum Tlaquepaque': 'forum',

  // CDMX
  'Roma': 'roma',
  'Condesa': 'condesa',
  'Polanco': 'polanco',
  'Coyoacán': 'coyoacan',
  'Santa Fe': 'santa-fe',
  'Interlomas': 'interlomas',
  'Satélite': 'satelite',
  'Del Valle': 'del-valle'
};

const KpiMeta = {
  volumenMeta: 4,
  calidadTextoMeta: 0.70,
  ratingMinimo: 4.60
};

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

/* Datos trimestrales YTD precalculados */
const Q1_DATA = {
  year: 2026, quarter: 1,
  branches: {
    // GDL
    andares:   { q1Avg: 4.62, ene: {avg:5.00,count:2}, feb: {avg:5.00,count:1}, mar: {avg:4.40,count:5} },
    patria:    { q1Avg: 4.95, ene: {avg:5.00,count:7}, feb: {avg:4.92,count:12}, mar: {avg:0,count:0} },
    'gal-gdl': { q1Avg: 4.89, ene: {avg:4.20,count:5}, feb: {avg:4.88,count:16}, mar: {avg:5.00,count:35} },
    midtown:   { q1Avg: 4.75, ene: {avg:5.00,count:28}, feb: {avg:3.00,count:1}, mar: {avg:4.27,count:11} },
    'via-viva':{ q1Avg: 4.69, ene: {avg:0,count:0}, feb: {avg:5.00,count:4}, mar: {avg:4.56,count:9} },
    'sta-anita':{ q1Avg: 4.88, ene: {avg:4.69,count:13}, feb: {avg:4.86,count:28}, mar: {avg:4.97,count:36} },
    'la-perla':{ q1Avg: 4.95, ene: {avg:5.00,count:76}, feb: {avg:4.93,count:30}, mar: {avg:4.67,count:12} },
    forum:     { q1Avg: 4.98, ene: {avg:4.98,count:53}, feb: {avg:5.00,count:2}, mar: {avg:5.00,count:4} },
    
    // CDMX (Placeholders iniciales)
    roma:      { q1Avg: 4.50, ene: {avg:4.50,count:10}, feb: {avg:4.40,count:12}, mar: {avg:4.60,count:15} },
    condesa:   { q1Avg: 4.60, ene: {avg:4.60,count:8},  feb: {avg:4.50,count:14}, mar: {avg:4.70,count:10} },
    polanco:   { q1Avg: 4.40, ene: {avg:4.30,count:15}, feb: {avg:4.50,count:10}, mar: {avg:4.40,count:12} },
    coyoacan:  { q1Avg: 4.70, ene: {avg:4.60,count:12}, feb: {avg:4.80,count:18}, mar: {avg:4.70,count:20} },
    'santa-fe':{ q1Avg: 4.20, ene: {avg:4.10,count:14}, feb: {avg:4.30,count:11}, mar: {avg:4.20,count:16} },
    interlomas:{ q1Avg: 4.50, ene: {avg:4.40,count:9},  feb: {avg:4.50,count:15}, mar: {avg:4.60,count:11} },
    satelite:  { q1Avg: 4.30, ene: {avg:4.20,count:16}, feb: {avg:4.40,count:12}, mar: {avg:4.30,count:14} },
    'del-valle':{ q1Avg: 4.60, ene: {avg:4.50,count:11}, feb: {avg:4.60,count:16}, mar: {avg:4.70,count:13} }
  }
};

