/**
 * data-loader.js — Carga lazy de JSON mensuales y cálculo de estadísticas.
 */

const DataLoader = {
  manifest: null,
  cache: {},
  currentYear: null,
  currentMonth: null,
  previousYear: null,
  previousMonth: null,

  async init() {
    try {
      const res = await fetch('data/manifest.json');
      this.manifest = await res.json();
      
      const years = Object.keys(this.manifest).map(Number).sort((a,b) => b - a);
      if (years.length > 0) {
        this.currentYear = years[0];
        const months = this.manifest[this.currentYear].sort((a,b) => b - a);
        if (months.length > 0) {
          this.currentMonth = months[0];
          // Determine previous month and year
          if (months.length > 1) {
            this.previousMonth = months[1];
            this.previousYear = this.currentYear;
          } else {
            this.previousMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
            this.previousYear = this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;
          }
        }
      }
    } catch (e) {
      console.error('Error loading manifest:', e);
      this.manifest = {};
    }
  },

  async loadMonth(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (this.cache[key]) return this.cache[key];
    try {
      const res = await fetch(`data/${year}/${String(month).padStart(2, '0')}.json`);
      const data = await res.json();
      this.cache[key] = data;
      return data;
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return null;
    }
  },

  getMonth(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return this.cache[key] || null;
  },

  hasMonth(year, month) {
    const y = String(year);
    const m = Number(month);
    return this.manifest && this.manifest[y] && this.manifest[y].includes(m);
  },

  getReviewsForBranch(year, month, branchId) {
    const data = this.getMonth(year, month);
    if (!data) return [];
    const meta = getBranchById(branchId);
    if (!meta) return [];
    const names = [meta.nombre, meta.abr];
    if (branchId === 'gal-gdl') names.push('Galerías GDL');
    if (branchId === 'sta-anita') names.push('Galerías Santa Anita');
    return data.reviews.filter(r => names.includes(r.sucursal));
  },

  computeBranchStats(year, month, branchId) {
    const reviews = this.getReviewsForBranch(year, month, branchId);
    if (!reviews.length) {
      return { count: 0, avg: 0, negativeCount: 0, guideCount: 0 };
    }
    const count = reviews.length;
    const avg = reviews.reduce((a, r) => a + r.stars, 0) / count;
    const negativeCount = reviews.filter(r => r.stars <= 2).length;
    const guideCount = reviews.filter(r => r.isLocalGuide).length;
    return { count, avg, negativeCount, guideCount };
  },

  getAllBranchStats(year, month) {
    const result = {};
    for (const meta of SUCURSALES_META) {
      result[meta.id] = this.computeBranchStats(year, month, meta.id);
    }
    return result;
  },

  getGlobalStats(year, month) {
    const data = this.getMonth(year, month);
    if (!data) return { totalReviews: 0, avgRating: 0, withText: 0 };
    const reviews = data.reviews;
    const totalReviews = reviews.length;
    const avgRating = totalReviews ? reviews.reduce((a, r) => a + r.stars, 0) / totalReviews : 0;
    const withText = reviews.filter(r => r.text && r.text.trim().length > 0).length;
    return { totalReviews, avgRating, withText };
  }
};
