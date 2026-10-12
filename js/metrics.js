/**
 * metrics.js — Definiciones únicas de las cifras de Étoile (una sola respuesta para cada pregunta).
 *
 * Queja = reseña de 1 o 2 estrellas CON texto. Las de 1–2★ sin texto se descartan como queja (decisión de Ibrahim,
 * 2026-10-12): es una calificación suelta que no dice nada accionable y solo mancha la reputación de la tienda.
 * Antes cada vista contaba distinto (Inicio exigía texto; KPIs, Marca, Dashboards y Trimestre no) y las cifras no cuadraban.
 */
const Metrics = {
  COMPLAINT_MAX_STARS: 2,
  hasText(r) { return !!(r && typeof r.text === 'string' && r.text.trim().length > 0); },
  isComplaint(r) { return !!r && r.stars <= this.COMPLAINT_MAX_STARS && this.hasText(r); },
  complaints(list) { return (list || []).filter(r => this.isComplaint(r)); },
  /** ¿tiene respuesta del propietario? (texto vacío o solo espacios no cuenta) */
  isReplied(r) {
    const t = r && (r.responseFromOwnerText ?? r.responseText);
    return typeof t === 'string' && t.trim().length > 0;
  },
  /** Quejas sin respuesta */
  unrepliedComplaints(list) { return this.complaints(list).filter(r => !this.isReplied(r)); },
  /** Promedio ponderado por reseñas de [{avg, count}] (nunca promedio de promedios) */
  weightedAvg(rows) {
    let n = 0, s = 0;
    for (const x of rows) if (x && x.count > 0) { n += x.count; s += x.avg * x.count; }
    return n ? s / n : 0;
  }
};
