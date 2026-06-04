import { Review } from '../types';

export function starStr(n: number): string {
  const num = Math.round(Number(n) || 0);
  const safeN = Math.max(0, Math.min(5, num));
  return '★'.repeat(safeN) + '☆'.repeat(5 - safeN);
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = meses[d.getUTCMonth()];
  const anio = d.getUTCFullYear();
  return `${dia} ${mes} ${anio}`;
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const datePart = formatDate(isoString);
  const hora = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${datePart} · ${hora}:${min}`;
}

export function isMonthComplete(year: number, month: number): boolean {
  const now = new Date();
  const target = new Date(year, month, 0, 23, 59, 59);
  return now > target;
}

export function isLastDayOfMonth(): boolean {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return tomorrow.getMonth() !== now.getMonth();
}

export interface DynamicInsights {
  alertTheme: string | null;
  problemas: string[];
}

export function computeDynamicInsights(reviews: Review[]): DynamicInsights {
  if (!reviews || reviews.length === 0) return { alertTheme: null, problemas: [] };

  const negatives = reviews.filter(r => r.stars <= 3 && r.text && r.text.length > 5);
  if (negatives.length === 0) return { alertTheme: null, problemas: [] };

  const textBlock = negatives.map(r => r.text!.toLowerCase()).join(' ');
  const keywords = ['actitud', 'groser', 'servicio', 'atención', 'tiempo', 'tard', 'lento', 'frí', 'crudo', 'calidad', 'quemado', 'sucio', 'espera', 'cobro', 'ticket', 'fila'];
  
  const freqs: Record<string, number> = {};
  keywords.forEach(kw => {
    const matches = textBlock.split(kw).length - 1;
    if (matches > 0) freqs[kw] = matches;
  });

  const sorted = Object.entries(freqs).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return { 
      alertTheme: 'Comentarios diversos', 
      problemas: negatives.slice(0, 3).map(r => `"${r.text!.substring(0, 60)}..."`) 
    };
  }

  const topKw = sorted[0][0];
  let theme = 'Atención y Servicio';
  if (['tiempo', 'tard', 'lento', 'espera', 'fila'].includes(topKw)) theme = 'Tiempos de Espera';
  if (['frí', 'crudo', 'calidad', 'quemado'].includes(topKw)) theme = 'Calidad del Producto';
  if (['sucio'].includes(topKw)) theme = 'Limpieza';
  if (['cobro', 'ticket'].includes(topKw)) theme = 'Errores en Cobro';

  const problemas = negatives
    .filter(r => r.text!.toLowerCase().includes(topKw))
    .slice(0, 3)
    .map(r => `"${r.text!.substring(0, 80)}..."`);
  
  return { alertTheme: theme, problemas };
}

export function getConcludedMonthInfo(manifest: Record<string, number[]> | null): { year: number, month: number } | null {
  if (!manifest) return null;
  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1; // 1-12
  const curDay = today.getDate();
  
  // 1. Primeros 7 días: forzar mes calendario anterior
  if (curDay <= 7) {
    const targetMonth = curMonth === 1 ? 12 : curMonth - 1;
    const targetYear = curMonth === 1 ? curYear - 1 : curYear;
    
    const yStr = String(targetYear);
    if (manifest[yStr] && manifest[yStr].includes(targetMonth)) {
      return { year: targetYear, month: targetMonth };
    }
  }
  
  // 2. Día 8 en adelante: último disponible en manifest si ya concluyó cronológicamente
  const years = Object.keys(manifest).map(Number).sort((a, b) => b - a);
  if (years.length === 0) return null;
  const latestYear = years[0];
  const months = [...manifest[String(latestYear)]].sort((a, b) => b - a);
  if (months.length === 0) return null;
  const latestMonth = months[0];
  
  if (curYear > latestYear || (curYear === latestYear && curMonth > latestMonth)) {
    return { year: latestYear, month: latestMonth };
  }
  return null;
}
