export interface Review {
  id: string;
  globalId: string;
  sucursal: string; // ID o nombre en JSON local
  stars: number;
  text: string | null;
  publishedAtDate: string;
  isLocalGuide: boolean;
  responseText: string | null;
  responseDate: string | null;
}

export interface SucursalMeta {
  id: string;
  nombre: string;
  abr: string;
  historico: number;
  q1Status: 'critical' | 'optimal' | 'attention';
  alertTheme: any;
  problemas: string[];
  region: string;
}

export interface UserProfile {
  id: string;
  nombre: string;
  rol: 'admin' | 'analista' | 'regional' | 'zonal' | 'gerente';
  region: string;
  sucursal: string | null;
  regiones_permitidas?: string[];
}

export interface BranchStats {
  count: number;
  avg: number;
  negativeCount: number;
  guideCount: number;
}

export interface GlobalStats {
  totalReviews: number;
  avgRating: number;
  withText: number;
}
