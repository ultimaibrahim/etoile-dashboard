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
    
    // Si hay un mes guardado y es válido, lo usamos
    if (typeof ViewState !== 'undefined') {
      const saved = ViewState.get('month');
      if (saved && saved.y && saved.m && this.manifest[saved.y] && this.manifest[saved.y].includes(saved.m)) {
        this.setMonth(saved.y, saved.m);
        return;
      }
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

  async loadQuarterStats(year, quarter) {
    const key = `q-${year}-Q${quarter}`;
    if (this.cache[key]) return this.cache[key];

    // Cargar desde Supabase vista
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      try {
        const { data, error } = await supabaseClient
          .from('quarterly_stats')
          .select('*')
          .eq('region', activeRegion)
          .eq('year', year)
          .eq('quarter', quarter);

        if (error) throw error;

        if (data && data.length > 0) {
          const stats = data.map(r => ({
            sucursalId: r.sucursal,
            avgRating: r.avg_rating,
            totalReviews: r.total_reviews,
            negativeReviews: r.negative_reviews
          }));
          this.cache[key] = stats;
          return stats;
        }
      } catch (e) {
        console.error(`Error al consultar estadísticas trimestrales de Supabase para ${key}:`, e);
      }
    }

    // Fallback: calcularlo dinámicamente a partir de los meses correspondientes
    const months = [1, 2, 3].map(m => m + (quarter - 1) * 3);
    const branchStats = [];

    // Cargar los meses en paralelo
    await Promise.all(
      months
        .filter(m => this.hasMonth(year, m))
        .map(m => this.loadMonth(year, m))
    );

    for (const s of SUCURSALES_META) {
      let totalStars = 0;
      let totalCount = 0;
      let totalNeg = 0;

      for (const m of months) {
        const monthData = this.getMonth(year, m);
        if (monthData) {
          const branchRevs = monthData.reviews.filter(r => typeof isSameBranch === 'function' ? isSameBranch(r.sucursal, s.id) : r.sucursal === s.id);
          totalStars += branchRevs.reduce((sum, r) => sum + r.stars, 0);
          totalCount += branchRevs.length;
          totalNeg += branchRevs.filter(r => r.stars <= 2).length;
        }
      }

      branchStats.push({
        sucursalId: s.id,
        avgRating: totalCount > 0 ? Number((totalStars / totalCount).toFixed(2)) : 0,
        totalReviews: totalCount,
        negativeReviews: totalNeg
      });
    }

    this.cache[key] = branchStats;
    return branchStats;
  },

  async loadMonth(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (this.cache[key]) return this.cache[key];

    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      try {
        const startIso = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
        const nextM = month === 12 ? 1 : month + 1;
        const nextY = month === 12 ? year + 1 : year;
        const endIso = `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00.000Z`;

        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabaseClient
            .from('reviews')
            .select('*')
            .gte('published_at_date', startIso)
            .lt('published_at_date', endIso);

          if (activeRegion && activeRegion !== 'BRAND') {
            query = query.eq('region', activeRegion);
          }

          const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
          if (error) throw error;

          if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        }

        const mappedReviews = allData.map((r, idx) => {
          const meta = typeof resolveBranchMeta === 'function' ? resolveBranchMeta(r.sucursal) : null;
          const canonicalId = meta ? meta.id : (r.sucursal || '').toLowerCase();
          const canonicalRegion = meta ? meta.region : (r.region || '');

          return {
            id: r.id,
            globalId: `${key}-${idx}`,
            sucursal: canonicalId,
            stars: r.stars,
            text: r.text,
            publishedAtDate: r.published_at_date,
            isLocalGuide: r.is_local_guide,
            responseText: r.response_text,
            responseFromOwnerText: r.response_text,
            responseDate: r.response_date,
            responseFromOwnerDate: r.response_date,
            region: canonicalRegion,
            classification: r.classification
          };
        });

        const filtered = (activeRegion && activeRegion !== 'BRAND')
          ? mappedReviews.filter(r => r.region === activeRegion)
          : mappedReviews;

        const result = { reviews: filtered };
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
        const startIso = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
        const nextM = month === 12 ? 1 : month + 1;
        const nextY = month === 12 ? year + 1 : year;
        const endIso = `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00.000Z`;

        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .gte('published_at_date', startIso)
            .lt('published_at_date', endIso)
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        }

        const mappedReviews = allData.map((r, idx) => {
          const meta = typeof resolveBranchMeta === 'function' ? resolveBranchMeta(r.sucursal) : null;
          const canonicalId = meta ? meta.id : (r.sucursal || '').toLowerCase();
          const canonicalRegion = meta ? meta.region : (r.region || '');

          return {
            id: r.id,
            globalId: `${key}-${idx}`,
            sucursal: canonicalId,
            stars: r.stars,
            text: r.text,
            publishedAtDate: r.published_at_date,
            isLocalGuide: r.is_local_guide,
            responseText: r.response_text,
            responseFromOwnerText: r.response_text,
            responseDate: r.response_date,
            responseFromOwnerDate: r.response_date,
            region: canonicalRegion,
            classification: r.classification
          };
        });

        this.cache[key] = mappedReviews;
        return mappedReviews;
      } catch (e) {
        console.error(`Error al consultar reseñas globales de Supabase para ${key}:`, e);
      }
    }

    return [];
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
    if (!data || !data.reviews) return [];
    
    const meta = typeof resolveBranchMeta === 'function' ? resolveBranchMeta(branchId) : SUCURSALES_META_ALL.find(s => s.id === branchId);
    if (!meta) return [];

    return data.reviews.filter(r => typeof isSameBranch === 'function' ? isSameBranch(r.sucursal, branchId) : r.sucursal === branchId);
  },

  getAvailableMonthsForBranch(branchId, year = new Date().getFullYear()) {
    const available = [];
    const yearMonths = (this.manifest && this.manifest[year]) ? this.manifest[year] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (const m of yearMonths) {
      const monthData = this.getMonth(year, m);
      if (monthData && monthData.reviews) {
        const revs = monthData.reviews.filter(r => typeof isSameBranch === 'function' ? isSameBranch(r.sucursal, branchId) : r.sucursal === branchId);
        if (revs.length > 0) {
          available.push(m);
        }
      }
    }
    return available;
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
          const branchReviews = data.reviews.filter(r => typeof isSameBranch === 'function' ? isSameBranch(r.sucursal, branchId) : r.sucursal === branchId);
          totalCount += branchReviews.length;
          totalStars += branchReviews.reduce((sum, r) => sum + r.stars, 0);
        }
      }
    }
    const avg = totalCount > 0 ? totalStars / totalCount : 0;
    return { count: totalCount, avg: avg };
  },

  async preloadAllReviews() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      try {
        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabaseClient.from('reviews').select('*');
          if (activeRegion && activeRegion !== 'BRAND') {
            query = query.eq('region', activeRegion);
          }
          const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
          if (error) throw error;

          if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        // Agrupar todas las reseñas en sus respectivos meses resolviendo la sucursal y región canónicas
        const grouped = {};
        allData.forEach((r, idx) => {
          if (!r.published_at_date) return;
          const meta = typeof resolveBranchMeta === 'function' ? resolveBranchMeta(r.sucursal) : null;
          const canonicalId = meta ? meta.id : (r.sucursal || '').toLowerCase();
          const canonicalRegion = meta ? meta.region : (r.region || '');

          if (activeRegion && activeRegion !== 'BRAND' && canonicalRegion && canonicalRegion !== activeRegion) {
            return;
          }

          const date = new Date(r.published_at_date);
          const y = String(date.getUTCFullYear());
          const m = date.getUTCMonth() + 1;
          const mStr = String(m).padStart(2, '0');
          const key = `${y}-${mStr}`;

          if (!grouped[key]) {
            grouped[key] = { reviews: [] };
          }

          grouped[key].reviews.push({
            id: r.id,
            globalId: `${key}-${idx}`,
            sucursal: canonicalId,
            stars: r.stars,
            text: r.text,
            publishedAtDate: r.published_at_date,
            isLocalGuide: r.is_local_guide,
            responseText: r.response_text,
            responseFromOwnerText: r.response_text,
            responseDate: r.response_date,
            responseFromOwnerDate: r.response_date,
            region: canonicalRegion,
            classification: r.classification
          });

          // Actualizar manifest dinámico
          if (!this.manifest) this.manifest = {};
          if (!this.manifest[y]) this.manifest[y] = [];
          if (!this.manifest[y].includes(m)) {
            this.manifest[y].push(m);
            this.manifest[y].sort((a, b) => a - b);
          }
        });

        // Llenar el caché con las reseñas agrupadas
        for (const key in grouped) {
          this.cache[key] = grouped[key];
        }
      } catch (e) {
        console.error("Error precargando reseñas globales de la región:", e);
      }
    }
  },

  async computeHistoricalRatings() {
    // Carga masiva en un solo query en lugar de multiples llamadas HTTP concurrentes
    await this.preloadAllReviews();

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
    if (typeof ViewState !== 'undefined') {
      ViewState.set('month', { y: year, m: month });
    }
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
