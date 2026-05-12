/**
 * data.js — Metadatos de sucursales, mapeos, constantes y datos trimestrales.
 * Los datos de reseñas mensuales viven en data/YYYY/MM.json
 */

const SUCURSALES_META = [
  {
    id: 'andares',
    nombre: 'Andares',
    abr: 'Andares',
    historico: 4.3,
    q1Status: 'critical',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'patria',
    nombre: 'Plaza Patria',
    abr: 'Patria',
    historico: 4.5,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'gal-gdl',
    nombre: 'Galerías GDL',
    abr: 'Gal. GDL',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'midtown',
    nombre: 'Midtown',
    abr: 'Midtown',
    historico: 4.5,
    q1Status: 'attention',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'via-viva',
    nombre: 'Via Viva',
    abr: 'Via Viva',
    historico: 4.8,
    q1Status: 'attention',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'sta-anita',
    nombre: 'Galerías Santa Anita',
    abr: 'Sta. Anita',
    historico: 4.7,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'la-perla',
    nombre: 'La Perla',
    abr: 'La Perla',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: []
  },
  {
    id: 'forum',
    nombre: 'Forum Tlaquepaque',
    abr: 'Forum',
    historico: 4.4,
    q1Status: 'optimal',
    alertTheme: null,
    problemas: []
  }
];

const SUCURSAL_NAME_MAP = {
  'Andares': 'andares',
  'Plaza Patria': 'patria',
  'Galerías GDL': 'gal-gdl',
  'Midtown': 'midtown',
  'Via Viva': 'via-viva',
  'Galerías Santa Anita': 'sta-anita',
  'La Perla': 'la-perla',
  'Forum Tlaquepaque': 'forum'
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

/* Datos trimestrales Q1 2026 (pre-calculados del CSV) */
const Q1_DATA = {
  year: 2026, quarter: 1,
  branches: {
    andares:   { q1Avg: 4.62, ene: {avg:5.00,count:2}, feb: {avg:5.00,count:1}, mar: {avg:4.40,count:5} },
    patria:    { q1Avg: 4.95, ene: {avg:5.00,count:7}, feb: {avg:4.92,count:12}, mar: {avg:0,count:0} },
    'gal-gdl': { q1Avg: 4.89, ene: {avg:4.20,count:5}, feb: {avg:4.88,count:16}, mar: {avg:5.00,count:35} },
    midtown:   { q1Avg: 4.75, ene: {avg:5.00,count:28}, feb: {avg:3.00,count:1}, mar: {avg:4.27,count:11} },
    'via-viva':{ q1Avg: 4.69, ene: {avg:0,count:0}, feb: {avg:5.00,count:4}, mar: {avg:4.56,count:9} },
    'sta-anita':{ q1Avg: 4.88, ene: {avg:4.69,count:13}, feb: {avg:4.86,count:28}, mar: {avg:4.97,count:36} },
    'la-perla':{ q1Avg: 4.95, ene: {avg:5.00,count:76}, feb: {avg:4.93,count:30}, mar: {avg:4.67,count:12} },
    forum:     { q1Avg: 4.98, ene: {avg:4.98,count:53}, feb: {avg:5.00,count:2}, mar: {avg:5.00,count:4} }
  }
};
