/**
 * narrative.js — El hallazgo de cada gráfica, escrito por reglas (sin LLM).
 * Principio de Étoile: ninguna gráfica va sola; cada una lleva una frase que dice qué se ve y por qué importa.
 * Honestidad primero: con muestras pequeñas la frase lo avisa en lugar de afirmar.
 * Funciones puras (reciben datos, devuelven texto): fáciles de probar y de ajustar.
 */
const Narrative = {
  MIN_SAMPLE: 5,   // reseñas mínimas para afirmar algo de una sucursal
  fmt(n, d = 2) { return Number(n).toFixed(d); },
  pct(a, b) { return b > 0 ? Math.round((100 * a) / b) : 0; },
  plural(n, uno, varios) { return n === 1 ? uno : varios; },

  /** Ranking de calificación. rows: [{ nombre, score, count }] (solo sucursales con reseñas) */
  ranking(rows, meta) {
    const r = rows.filter(x => x.count > 0).sort((a, b) => b.score - a.score);
    if (r.length === 0) return 'Aún no hay reseñas este mes.';
    const top = r[0];
    const below = r.filter(x => x.score < meta);
    if (below.length === 0) {
      return `Las ${r.length} sucursales con reseñas cumplen la meta de ${this.fmt(meta)}★; lidera ${top.nombre} con ${this.fmt(top.score)}★.`;
    }
    const worst = below[below.length - 1];
    const gap = this.fmt(meta - worst.score);
    const caution = worst.count < this.MIN_SAMPLE ? ` (son solo ${worst.count} ${this.plural(worst.count, 'reseña', 'reseñas')}: poca muestra)` : ` (${worst.count} reseñas)`;
    return `${below.length} de ${r.length} sucursales están bajo la meta de ${this.fmt(meta)}★; la más rezagada es ${worst.nombre} con ${this.fmt(worst.score)}★, a ${gap} de la meta${caution}.`;
  },

  /** Volumen y quejas. rows: [{ nombre, count, neg }] */
  volume(rows) {
    const r = rows.filter(x => x.count > 0);
    const total = r.reduce((s, x) => s + x.count, 0);
    if (total === 0) return 'Aún no hay reseñas este mes.';
    const top = [...r].sort((a, b) => b.count - a.count)[0];
    const totalNeg = r.reduce((s, x) => s + x.neg, 0);
    let s = `${top.nombre} concentra el ${this.pct(top.count, total)}% de las ${total} reseñas del mes`;
    if (totalNeg === 0) return s + '; no hay quejas (1-2★) en ninguna sucursal.';
    const worst = r.filter(x => x.count >= this.MIN_SAMPLE && x.neg > 0).sort((a, b) => (b.neg / b.count) - (a.neg / a.count))[0];
    if (!worst) return s + `; hay ${totalNeg} ${this.plural(totalNeg, 'queja', 'quejas')} repartidas en sucursales con pocas reseñas.`;
    return s + `; ${worst.nombre} tiene la mayor proporción de quejas: ${worst.neg} de ${worst.count} (${this.pct(worst.neg, worst.count)}%).`;
  },

  /** Distribución de estrellas. counts: [n5, n4, n3, n2, n1] */
  distribution(counts) {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 'Aún no hay reseñas este mes.';
    const [n5, , , , n1] = counts;
    const base = `El ${this.pct(n5, total)}% de las ${total} opiniones son de 5★`;
    return n1 === 0 ? `${base}; no hay reseñas de 1★ este mes.` : `${base}; las de 1★ son ${n1} (${this.pct(n1, total)}%).`;
  },

  /**
   * Tendencia de calificación. labels/values paralelos (values puede tener null); meta = calificación mínima.
   * partialLast: el último punto es el mes en curso (incompleto).
   */
  ratingTrend(labels, values, meta, partialLast = false) {
    const pts = values.map((v, i) => ({ v, label: labels[i] })).filter(p => typeof p.v === 'number' && p.v > 0);
    if (pts.length === 0) return 'Aún no hay calificaciones para ver una tendencia.';
    if (pts.length === 1) return `Solo hay un mes con datos: ${pts[0].label} con ${this.fmt(pts[0].v)}★.`;
    const best = pts.reduce((a, b) => (b.v > a.v ? b : a));
    const low = pts.reduce((a, b) => (b.v < a.v ? b : a));
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const d = last.v - prev.v;
    const dir = Math.abs(d) < 0.02 ? 'se mantiene' : d > 0 ? `sube ${this.fmt(d)}` : `baja ${this.fmt(-d)}`;
    const tail = partialLast ? ` (${last.label} aún está en curso)` : '';
    const range = best.v === low.v ? `Calificación estable en ${this.fmt(best.v)}★.` : `Mejor mes: ${best.label} (${this.fmt(best.v)}★); más bajo: ${low.label} (${this.fmt(low.v)}★).`;
    const under = pts.filter(p => p.v < meta).length;
    const metaTxt = under === 0 ? ` Todos los meses cumplen la meta de ${this.fmt(meta)}★.` : ` ${under} de ${pts.length} meses quedaron bajo la meta de ${this.fmt(meta)}★.`;
    return `${range} ${last.label} ${dir} frente a ${prev.label}${tail}.${metaTxt}`;
  },

  /** Tendencia de volumen. partialLast: el último punto es el mes en curso (no se compara contra un mes completo). */
  volumeTrend(labels, values, partialLast = false) {
    const pts = values.map((v, i) => ({ v, label: labels[i] })).filter(p => typeof p.v === 'number');
    if (pts.length === 0) return 'Aún no hay reseñas para ver una tendencia.';
    const max = pts.reduce((a, b) => (b.v > a.v ? b : a));
    const last = pts[pts.length - 1];
    if (partialLast) return `${last.label} va con ${last.v} ${this.plural(last.v, 'reseña', 'reseñas')} (mes en curso). El mes con más reseñas fue ${max.label}: ${max.v}.`;
    if (pts.length < 2) return `${last.label}: ${last.v} reseñas.`;
    const prev = pts[pts.length - 2];
    const ch = prev.v > 0 ? Math.round((100 * (last.v - prev.v)) / prev.v) : 0;
    const dir = ch === 0 ? 'se mantiene' : ch > 0 ? `sube ${ch}%` : `baja ${-ch}%`;
    return `El volumen ${dir} frente a ${prev.label} (${prev.v} → ${last.v}). El mes con más reseñas fue ${max.label}: ${max.v}.`;
  }
};
