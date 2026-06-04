import { DataLoader } from './dataLoader';
import { KpiMeta, SUCURSALES_META_ALL } from '../lib/data';
import { isMonthComplete } from '../utils';

export const KpiStore = {
  prefix: 'lcp_kpis_v3_',

  _key(year: number, month: number) {
    return `${this.prefix}${year}_${String(month).padStart(2, '0')}`;
  },

  get(year: number, month: number) {
    try {
      const raw = localStorage.getItem(this._key(year, month));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  set(year: number, month: number, data: any) {
    try {
      localStorage.setItem(this._key(year, month), JSON.stringify(data));
    } catch (e) {
      console.warn('KPI cache failed:', e);
    }
  },

  shouldCompute(year: number, month: number) {
    if (!isMonthComplete(year, month)) {
      const cached = this.get(year, month);
      if (cached && cached.computedAt) {
        const cachedDate = new Date(cached.computedAt).toISOString().split('T')[0];
        const todayDate = new Date().toISOString().split('T')[0];
        if (cachedDate === todayDate) return false;
      }
      return true; // Mes en curso: recalcular si no es del mismo día
    }
    if (!this.get(year, month)) return true; // Mes cerrado sin cache: calcular
    return false; // Mes cerrado con cache: usar cache
  }
};

export const Kpis = {
  async computeMonth(year: number, month: number, activeRegion: string, sucursalesList: { id: string }[]) {
    await DataLoader.loadMonth(year, month, activeRegion);
    const data = DataLoader.getMonth(year, month);
    const reviews = data ? data.reviews : [];

    const cached = KpiStore.get(year, month);
    if (cached && cached.global && cached.global.totalReviews === reviews.length) {
      return cached;
    }

    const allStats = DataLoader.getAllBranchStats(year, month, sucursalesList);
    const global = DataLoader.getGlobalStats(year, month);

    // Volumen
    const volumenOk = Object.entries(allStats).filter(([_, s]) => s.count >= KpiMeta.volumenMeta).length;
    const volumenTotal = sucursalesList.length;

    // Calidad de texto
    const positivas = reviews.filter(r => r.stars >= 4);
    const positivasConTexto = positivas.filter(r => r.text && r.text.trim().length > 5).length;
    const calidadRatio = positivas.length ? positivasConTexto / positivas.length : 0;

    // Rating mínimo
    const ratings = Object.entries(allStats).map(([id, s]) => ({ id, avg: s.avg }));
    const belowMin = ratings.filter(r => r.avg > 0 && r.avg < KpiMeta.ratingMinimo);

    // Negativas
    const negativasReviews = reviews.filter(r => r.stars <= 2);
    const totalNegativas = negativasReviews.length;

    // Tasa de respuesta
    const negativasConRespuesta = negativasReviews.filter(r => r.responseText !== null && r.responseText !== undefined);
    const tasaRespuesta = totalNegativas ? negativasConRespuesta.length / totalNegativas : 1;

    const result = {
      year, month,
      computedAt: new Date().toISOString(),
      volumen: { ok: volumenOk, total: volumenTotal, meta: KpiMeta.volumenMeta },
      calidadTexto: { withText: positivasConTexto, total: positivas.length, ratio: calidadRatio, meta: KpiMeta.calidadTextoMeta },
      ratingMinimo: { belowMin: belowMin.map(r => r.id), meta: KpiMeta.ratingMinimo },
      negativas: totalNegativas,
      tasaRespuesta: { value: tasaRespuesta, totalNegativas, conRespuesta: negativasConRespuesta.length },
      global: { totalReviews: global.totalReviews, avgRating: global.avgRating }
    };

    KpiStore.set(year, month, result);
    return result;
  },

  badge(kpiValue: number, metaValue: number, type = 'higher') {
    if (type === 'higher') {
      return kpiValue >= metaValue ? 'optimal' : 'attention';
    }
    return kpiValue <= metaValue ? 'optimal' : 'attention';
  },

  statusLabel(status: string) {
    const map: Record<string, string> = {
      critical: 'Crítica',
      atencion: 'Atención',
      optima: 'Óptima',
      optimal: 'Óptima',
      attention: 'Atención',
      atention: 'Atención'
    };
    return map[status] || status;
  }
};
