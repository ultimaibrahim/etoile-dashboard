import { supabaseClient } from '../lib/supabase';
import { SUCURSALES_META_ALL } from '../lib/data';
import { Review, BranchStats, GlobalStats } from '../types';

export const DataLoader = {
  manifest: null as Record<string, number[]> | null,
  cache: {} as Record<string, { reviews: Review[] }>,

  async init(activeRegion: string): Promise<Record<string, number[]>> {
    // Cargar manifest dinámico desde Supabase `review_months`
    try {
      const { data, error } = await supabaseClient
        .from('review_months')
        .select('*')
        .eq('region', activeRegion);

      if (error) throw error;

      const dbManifest: Record<string, number[]> = {};

      if (data && data.length > 0) {
        data.forEach(row => {
          const y = String(row.year);
          if (!dbManifest[y]) dbManifest[y] = [];
          if (!dbManifest[y].includes(row.month)) {
            dbManifest[y].push(row.month);
          }
        });

        for (const y in dbManifest) {
          dbManifest[y].sort((a, b) => a - b);
        }
      }

      this.manifest = dbManifest;
      return dbManifest;
    } catch (e) {
      console.error('DataLoader: Error al cargar manifest desde Supabase:', e);
      this.manifest = {};
      return {};
    }
  },

  async loadMonth(year: number, month: number, activeRegion: string): Promise<{ reviews: Review[] }> {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (this.cache[key]) return this.cache[key];

    // Cargar reseñas desde Supabase
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 1).toISOString();

      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('region', activeRegion)
        .gte('published_at_date', startDate)
        .lt('published_at_date', endDate);

      if (error) throw error;

      const mappedReviews: Review[] = (data || []).map((r, idx) => ({
        id: r.id,
        globalId: `${key}-${idx}`,
        sucursal: r.sucursal,
        stars: r.stars,
        text: r.text,
        publishedAtDate: r.published_at_date,
        isLocalGuide: r.is_local_guide || false,
        responseText: r.response_text || null,
        responseDate: r.response_date || null
      }));

      const result = { reviews: mappedReviews };
      this.cache[key] = result;
      return result;
    } catch (e) {
      console.error(`DataLoader: Error cargando reseñas de Supabase para ${key}:`, e);
      return { reviews: [] };
    }
  },

  getMonth(year: number, month: number): { reviews: Review[] } | null {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return this.cache[key] || null;
  },

  getReviewByGlobalId(globalId: string): Review | null {
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

  hasMonth(year: number, month: number): boolean {
    const y = String(year);
    const m = Number(month);
    return !!(this.manifest && this.manifest[y] && this.manifest[y].includes(m));
  },

  getReviewsForBranch(year: number, month: number, branchId: string): Review[] {
    const data = this.getMonth(year, month);
    if (!data) return [];

    const meta = SUCURSALES_META_ALL.find(s => s.id === branchId);
    if (!meta) return [];

    // Las reseñas de Supabase usan branchId directamente como `sucursal`
    return data.reviews.filter(r => r.sucursal === branchId);
  },

  computeBranchStats(year: number, month: number, branchId: string): BranchStats {
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

  getAllBranchStats(year: number, month: number, sucursalesList: { id: string }[]): Record<string, BranchStats> {
    const result: Record<string, BranchStats> = {};
    for (const meta of sucursalesList) {
      result[meta.id] = this.computeBranchStats(year, month, meta.id);
    }
    return result;
  },

  getGlobalStats(year: number, month: number): GlobalStats {
    const data = this.getMonth(year, month);
    if (!data) return { totalReviews: 0, avgRating: 0, withText: 0 };
    const reviews = data.reviews;
    const totalReviews = reviews.length;
    const avgRating = totalReviews ? reviews.reduce((a, r) => a + r.stars, 0) / totalReviews : 0;
    const withText = reviews.filter(r => r.text && r.text.trim().length > 0).length;
    return { totalReviews, avgRating, withText };
  }
};
