/**
 * data-loader.js — Carga lazy de reseñas desde Supabase o JSON mensuales locales,
 * y cálculo de estadísticas agregadas.
 */

const DataLoader = {
  manifest: null,
  cache: {},
  currentYear: null,
  currentMonth: null,
  previousYear: null,
  previousMonth: null,

  async init() {
    this.manifest = {};

    // Si Supabase está inicializado, intentar cargar el manifest dinámico de la base de datos
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      try {
        const { data, error } = await supabaseClient
          .from('review_months')
          .select('*')
          .eq('region', activeRegion);

        if (error) throw error;

        if (data && data.length > 0) {
          const dbManifest = {};
          data.forEach(row => {
            const y = String(row.year);
            if (!dbManifest[y]) dbManifest[y] = [];
            if (!dbManifest[y].includes(row.month)) {
              dbManifest[y].push(row.month);
            }
          });
          // Ordenar ascendentemente los meses en cada año
          for (const y in dbManifest) {
            dbManifest[y].sort((a, b) => a - b);
          }
          this.manifest = dbManifest;
        }
      } catch (e) {
        console.error('No se pudo cargar el manifest dinámico desde Supabase:', e);
      }
    }

    this.setupCurrentPeriods();
  },

  setupCurrentPeriods() {
    if (!this.manifest || Object.keys(this.manifest).length === 0) {
      this.currentYear = new Date().getFullYear();
      this.currentMonth = new Date().getMonth() + 1;
      this.previousYear = this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;
      this.previousMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
      return;
    }
    const years = Object.keys(this.manifest).map(Number).sort((a, b) => b - a);
    if (years.length > 0) {
      this.currentYear = years[0];
      const months = [...this.manifest[this.currentYear]].sort((a, b) => b - a);
      if (months.length > 0) {
        this.currentMonth = months[0];
        // Determinar periodo anterior para comparaciones
        if (months.length > 1) {
          this.previousMonth = months[1];
          this.previousYear = this.currentYear;
        } else {
          this.previousMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
          this.previousYear = this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;
        }
      }
    }
  },

  async switchRegion(region) {
    if (setRegionActiva(region)) {
      this.cache = {}; // Vaciar la caché al cambiar de región
      await this.init();
      await this.computeHistoricalRatings();
      return true;
    }
    return false;
  },

  async loadMonth(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (this.cache[key]) return this.cache[key];

    // Cargar desde Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      try {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString(); // primer día del mes siguiente (exclusivo)

        const { data, error } = await supabaseClient
          .from('reviews')
          .select('*')
          .eq('region', activeRegion)
          .gte('published_at_date', startDate)
          .lt('published_at_date', endDate);

        if (error) throw error;

        // Mapear de base de datos relacional (snake_case) al formato camelCase de la UI
        const mappedReviews = (data || []).map((r, idx) => ({
          id: r.id,
          globalId: `${key}-${idx}`,
          sucursal: r.sucursal, // Mapeado directamente a su ID (ej. 'andares')
          stars: r.stars,
          text: r.text,
          publishedAtDate: r.published_at_date,
          isLocalGuide: r.is_local_guide,
          responseText: r.response_text,
          responseFromOwnerText: r.response_text,
          responseDate: r.response_date,
          responseFromOwnerDate: r.response_date
        }));

        const result = { reviews: mappedReviews };
        this.cache[key] = result;
        return result;
      } catch (e) {
        console.error(`Error al consultar reseñas de Supabase para ${key}:`, e);
      }
    }

    return { reviews: [] };
  },

  async loadBrandData(year, month) {
    const key = `brand-${year}-${String(month).padStart(2, '0')}`;
    if (this.cache[key]) return this.cache[key];

    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      try {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString(); // primer día del mes siguiente (exclusivo)

        const { data, error } = await supabaseClient
          .from('reviews')
          .select('*')
          .gte('published_at_date', startDate)
          .lt('published_at_date', endDate);

        if (error) throw error;

        // Mapear de base de datos relacional (snake_case) al formato camelCase de la UI
        const mappedReviews = (data || []).map((r, idx) => ({
          id: r.id,
          globalId: `${key}-${idx}`,
          sucursal: r.sucursal, // Mapeado directamente a su ID (ej. 'andares')
          stars: r.stars,
          text: r.text,
          publishedAtDate: r.published_at_date,
          isLocalGuide: r.is_local_guide,
          responseText: r.response_text,
          responseFromOwnerText: r.response_text,
          responseDate: r.response_date,
          responseFromOwnerDate: r.response_date,
          region: r.region
        }));

        this.cache[key] = mappedReviews;
        return mappedReviews;
      } catch (e) {
        console.error(`Error al consultar reseñas globales de Supabase para ${key}:`, e);
      }
    }

    // Fallback: Mock data if database query fails or is not configured
    const mockReviews = [];
    const seed = month + year;
    for (const s of SUCURSALES_META_ALL) {
      const hist = s.historico || 4.5;
      const count = Math.floor(((seed * 7 + s.id.charCodeAt(0)) % 12) + 6);
      for (let i = 0; i < count; i++) {
        let stars = 5;
        const rand = (seed * 11 + s.id.charCodeAt(0) + i) % 100;
        if (rand < 6) stars = 1;
        else if (rand < 14) stars = 2;
        else if (rand < 28) stars = 3;
        else if (rand < 48) stars = 4;
        
        mockReviews.push({
          id: `${s.id}-${i}`,
          globalId: `${key}-${s.id}-${i}`,
          sucursal: s.id,
          stars: stars,
          text: stars <= 2 ? "El servicio fue deficiente y la comida fría." : "Excelente ambiente y deliciosas crepas.",
          publishedAtDate: new Date(year, month - 1, Math.max(1, (i * 4) % 28)).toISOString(),
          isLocalGuide: rand % 5 === 0,
          region: s.region
        });
      }
    }
    this.cache[key] = mockReviews;
    return mockReviews;
  },

  getMonth(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return this.cache[key] || null;
  },

  getReviewByGlobalId(globalId) {
    if (!globalId) return null;
    const parts = globalId.split('-');
    if (parts.length < 3) return null;
    const key = `${parts[0]}-${parts[1]}`;
    const idx = parseInt(parts[2]);
    const data = this.cache[key];
    if (data && data.reviews && data.reviews[idx]) {
      return data.reviews[idx];
    }
    return null;
  },

  hasMonth(year, month) {
    const y = String(year);
    const m = Number(month);
    return this.manifest && this.manifest[y] && this.manifest[y].includes(m);
  },

  getReviewsForBranch(year, month, branchId) {
    const data = this.getMonth(year, month);
    if (!data) return [];
    
    const meta = SUCURSALES_META_ALL.find(s => s.id === branchId);
    if (!meta) return [];

    return data.reviews.filter(r => r.sucursal === branchId);
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
  },

  computeBranchHistoricalStats(branchId) {
    let totalStars = 0;
    let totalCount = 0;
    for (const key in this.cache) {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const data = this.cache[key];
        if (data && data.reviews) {
          const branchReviews = data.reviews.filter(r => r.sucursal === branchId);
          totalCount += branchReviews.length;
          totalStars += branchReviews.reduce((sum, r) => sum + r.stars, 0);
        }
      }
    }
    const avg = totalCount > 0 ? totalStars / totalCount : 0;
    return { count: totalCount, avg: avg };
  },

  async computeHistoricalRatings() {
    if (this.manifest) {
      const loadPromises = [];
      for (const year in this.manifest) {
        for (const month of this.manifest[year]) {
          loadPromises.push(this.loadMonth(Number(year), month));
        }
      }
      await Promise.all(loadPromises);
    }

    for (const meta of SUCURSALES_META_ALL) {
      const stats = this.computeBranchHistoricalStats(meta.id);
      if (stats.count > 0) {
        meta.historico = stats.avg;
        meta.historicoCount = stats.count;
      } else {
        meta.historicoCount = 0;
      }
    }
  },

  setMonth(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    const availableMonths = this.manifest[year] || [];
    const sortedMonths = [...availableMonths].sort((a, b) => a - b);
    const idx = sortedMonths.indexOf(month);
    if (idx > 0) {
      this.previousMonth = sortedMonths[idx - 1];
      this.previousYear = year;
    } else {
      this.previousMonth = month === 1 ? 12 : month - 1;
      this.previousYear = month === 1 ? year - 1 : year;
    }
  }
};
