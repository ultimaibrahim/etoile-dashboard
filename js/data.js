/**
 * data.js — Metadatos de sucursales, mapeos, constantes y datos trimestrales.
 * Los datos de reseñas mensuales viven en data/YYYY/MM.json o en Supabase.
 */

// Todos los metadatos de sucursales en todas las regiones
const SUCURSALES_META_ALL = [
  // Región Guadalajara (GDL) - 8 sucursales
  { id: 'andares', nombre: 'Andares', abr: 'Andares', historico: 4.3, q1Status: 'critical', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'patria', nombre: 'Plaza Patria', abr: 'Patria', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'midtown', nombre: 'Midtown Jalisco', abr: 'Midtown', historico: 4.5, q1Status: 'attention', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'gal-gdl', nombre: 'Galerías Guadalajara', abr: 'Gal. GDL', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'via-viva', nombre: 'Via Viva', abr: 'Via Viva', historico: 4.8, q1Status: 'attention', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'sta-anita', nombre: 'Galerías Santa Anita', abr: 'Sta. Anita', historico: 4.7, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'la-perla', nombre: 'La Perla', abr: 'La Perla', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'GDL' },
  { id: 'forum', nombre: 'Forum Tlaquepaque', abr: 'Forum', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'GDL' },

  // Región Ciudad de México (CDMX) - 14 sucursales
  { id: 'aztlan', nombre: 'Aztlán', abr: 'Aztlán', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'carso', nombre: 'Plaza Carso', abr: 'Plaza Carso', historico: 4.3, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'mexicana', nombre: 'Parque La Mexicana', abr: 'La Mexicana', historico: 4.6, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'acoxpa', nombre: 'Paseo Acoxpa', abr: 'Acoxpa', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'tepeyac', nombre: 'Tepeyac', abr: 'Tepeyac', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'polanquito', nombre: 'Polanquito', abr: 'Polanquito', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'oceania', nombre: 'Oceanía', abr: 'Oceanía', historico: 4.3, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'artz', nombre: 'Artz Pedregal', abr: 'Artz', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'arcos', nombre: 'Arcos Bosques', abr: 'Arcos', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'mitikah', nombre: 'Mitikah', abr: 'Mitikah', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'coyoacan', nombre: 'Oasis Coyoacán', abr: 'Coyoacán', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'duraznos', nombre: 'Parque Duraznos', abr: 'Duraznos', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'santa-fe', nombre: 'Centro Santa Fe', abr: 'Santa Fe', historico: 4.3, q1Status: 'critical', alertTheme: null, problemas: [], region: 'CDMX' },
  { id: 'satelite', nombre: 'Plaza Satélite', abr: 'Satélite', historico: 4.4, q1Status: 'attention', alertTheme: null, problemas: [], region: 'CDMX' },

  // Región Monterrey (MTY) - 3 sucursales
  { id: 'gal-mty', nombre: 'Galerías Monterrey', abr: 'Gal. MTY', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'MTY' },
  { id: 'valle-oriente', nombre: 'Galerías Valle Oriente', abr: 'Valle Oriente', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'MTY' },
  { id: 'fashion-drive', nombre: 'Fashion Drive', abr: 'Fashion Drive', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'MTY' },

  // Región Guanajuato / León (LEON) - 1 sucursal
  { id: 'altacia', nombre: 'Altacia', abr: 'Altacia', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'LEON' },

  // Región San Luis Potosí (SLP) - 1 sucursal
  { id: 'the-park', nombre: 'The Park', abr: 'The Park', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'SLP' },

  // Región Aguascalientes (AGS) - 1 sucursal
  { id: 'altaria', nombre: 'Altaria', abr: 'Altaria', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'AGS' },

  // Región Estado de México / Toluca / Metepec (TOL) - 2 sucursales
  { id: 'gal-metepec', nombre: 'Galerías Metepec', abr: 'Gal. Metepec', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'TOL' },
  { id: 'town-square', nombre: 'Town Square Metepec', abr: 'Town Square', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'TOL' },

  // Región Querétaro (QRO) - 1 sucursal
  { id: 'antea', nombre: 'Antea', abr: 'Antea', historico: 4.6, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'QRO' },

  // Región Cancún / Quintana Roo (CUN) - 1 sucursal
  { id: 'cancun', nombre: 'Marina Puerto Cancún', abr: 'Puerto Cancún', historico: 4.5, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'CUN' },

  // Región Tijuana / Baja California (TJ) - 1 sucursal
  { id: 'peninsula', nombre: 'Plaza Península', abr: 'Plaza Península', historico: 4.4, q1Status: 'optimal', alertTheme: null, problemas: [], region: 'TJ' }
];

// Nombres legibles de las regiones
const REGION_NAME_MAP = {
  'GDL': 'Guadalajara',
  'CDMX': 'Ciudad de México',
  'MTY': 'Monterrey',
  'LEON': 'León',
  'SLP': 'San Luis Potosí',
  'AGS': 'Aguascalientes',
  'TOL': 'Toluca / Metepec',
  'QRO': 'Querétaro',
  'CUN': 'Cancún',
  'TJ': 'Tijuana'
};

function getRegionName(region) {
  return REGION_NAME_MAP[region] || region;
}

// Región activa por defecto en el cliente
let activeRegion = 'GDL';

// Array dinámico que usarán todas las vistas y gráficos
let SUCURSALES_META = SUCURSALES_META_ALL.filter(s => s.region === activeRegion);

// Función para alternar o establecer la región activa en el frontend
function setRegionActiva(region) {
  if (REGION_NAME_MAP[region]) {
    activeRegion = region;
    let base = SUCURSALES_META_ALL.filter(s => s.region === activeRegion);
    if (typeof AppAuth !== 'undefined' && AppAuth.profile && AppAuth.profile.rol === 'gerente' && AppAuth.profile.sucursal) {
      base = base.filter(s => s.id === AppAuth.profile.sucursal);
    }
    SUCURSALES_META = base;
    return true;
  }
  return false;
}

const SUCURSAL_NAME_MAP = {
  // GDL
  'andares': 'andares',
  'Andares': 'andares',
  'Mercado Andares': 'andares',
  'patria': 'patria',
  'Plaza Patria': 'patria',
  'Patria': 'patria',
  'gal-gdl': 'gal-gdl',
  'Galerías GDL': 'gal-gdl',
  'Galerias GDL': 'gal-gdl',
  'Galerías Guadalajara': 'gal-gdl',
  'Galerias Guadalajara': 'gal-gdl',
  'midtown': 'midtown',
  'Midtown': 'midtown',
  'Midtown Jalisco': 'midtown',
  'via-viva': 'via-viva',
  'Via Viva': 'via-viva',
  'Vía Viva': 'via-viva',
  'sta-anita': 'sta-anita',
  'Galerías Santa Anita': 'sta-anita',
  'Galerias Santa Anita': 'sta-anita',
  'Santa Anita': 'sta-anita',
  'Sta. Anita': 'sta-anita',
  'la-perla': 'la-perla',
  'La Perla': 'la-perla',
  'forum': 'forum',
  'Forum Tlaquepaque': 'forum',
  'Forum': 'forum',
  'Tlaquepaque': 'forum',

  // CDMX
  'aztlan': 'aztlan',
  'Aztlán': 'aztlan',
  'Aztlan': 'aztlan',
  'carso': 'carso',
  'Plaza Carso': 'carso',
  'mexicana': 'mexicana',
  'Parque La Mexicana': 'mexicana',
  'La Mexicana': 'mexicana',
  'acoxpa': 'acoxpa',
  'Paseo Acoxpa': 'acoxpa',
  'tepeyac': 'tepeyac',
  'Tepeyac': 'tepeyac',
  'polanquito': 'polanquito',
  'Polanquito': 'polanquito',
  'oceania': 'oceania',
  'Oceanía': 'oceania',
  'Oceania': 'oceania',
  'artz': 'artz',
  'Artz Pedregal': 'artz',
  'Artz': 'artz',
  'Pedregal': 'artz',
  'arcos': 'arcos',
  'Arcos Bosques': 'arcos',
  'Arcos': 'arcos',
  'mitikah': 'mitikah',
  'Mitikah': 'mitikah',
  'coyoacan': 'coyoacan',
  'Oasis Coyoacán': 'coyoacan',
  'Oasis Coyoacan': 'coyoacan',
  'Oasis': 'coyoacan',
  'Coyoacán': 'coyoacan',
  'duraznos': 'duraznos',
  'Parque Duraznos': 'duraznos',
  'Duraznos': 'duraznos',
  'santa-fe': 'santa-fe',
  'Centro Santa Fe': 'santa-fe',
  'Santa Fe': 'santa-fe',
  'satelite': 'satelite',
  'Plaza Satélite': 'satelite',
  'Plaza Satelite': 'satelite',
  'Satélite': 'satelite',

  // MTY
  'gal-mty': 'gal-mty',
  'Galerías Monterrey': 'gal-mty',
  'Galerias Monterrey': 'gal-mty',
  'valle-oriente': 'valle-oriente',
  'Galerías Valle Oriente': 'valle-oriente',
  'Galerias Valle Oriente': 'valle-oriente',
  'Valle Oriente': 'valle-oriente',
  'fashion-drive': 'fashion-drive',
  'Fashion Drive': 'fashion-drive',

  // LEON
  'altacia': 'altacia',
  'Altacia': 'altacia',
  'plaza-mayor': 'altacia',

  // SLP
  'the-park': 'the-park',
  'The Park': 'the-park',
  'San Luis': 'the-park',
  'san-luis': 'the-park',

  // AGS
  'altaria': 'altaria',
  'Altaria': 'altaria',
  'Pocitos': 'altaria',
  'Pocitos / Centro': 'altaria',

  // TOL
  'gal-metepec': 'gal-metepec',
  'Galerías Metepec': 'gal-metepec',
  'Galerias Metepec': 'gal-metepec',
  'town-square': 'town-square',
  'Town Square Metepec': 'town-square',
  'Town Square': 'town-square',
  'TS Metepec': 'town-square',

  // QRO
  'antea': 'antea',
  'Antea': 'antea',
  'Querétaro': 'antea',
  'Queretaro': 'antea',

  // CUN
  'cancun': 'cancun',
  'Marina Puerto Cancún': 'cancun',
  'Marina Puerto Cancun': 'cancun',
  'Puerto Cancún': 'cancun',

  // TJ
  'peninsula': 'peninsula',
  'Plaza Península': 'peninsula',
  'Plaza Peninsula': 'peninsula',
  'Peninsula Tijuana': 'peninsula',
  'Tijuana': 'peninsula'
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



