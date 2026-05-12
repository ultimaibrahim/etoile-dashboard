/**
 * views/explorer.js — Explorador avanzado de reseñas.
 */

const ExplorerView = {
  state: {
    sucursal: 'todas',
    estrellas: 'todas',
    query: '',
    reviews: []
  },

  async render() {
    Charts.destroyAll();
    const app = document.getElementById('app');
    
    app.innerHTML = `
      ${buildTopbar(true, 'Explorador de Reseñas')}
      <section class="section r" style="margin-top: 24px;">
        <div class="section-head">
          <div class="section-title">Minero de <span class="accent">Datos</span></div>
          <span class="section-sub">Busca patrones, filtra por sucursal y analiza el sentimiento general.</span>
        </div>
        
        <div class="explorer-controls" style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
          <input type="text" id="exp-search" placeholder="Buscar palabras clave (ej. actitud, rápido, guantes)..." value="${this.state.query}" style="flex: 1; min-width: 250px; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--fg); font-family: inherit;" disabled>
          
          <select id="exp-branch" style="padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--fg);" disabled>
            <option value="todas">Todas las Sucursales</option>
            ${SUCURSALES_META.map(s => `<option value="${s.id}" ${this.state.sucursal === s.id ? 'selected' : ''}>${s.nombre}</option>`).join('')}
          </select>
          
          <select id="exp-stars" style="padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--fg);" disabled>
            <option value="todas">Todas las estrellas</option>
            <option value="positivas" ${this.state.estrellas === 'positivas' ? 'selected' : ''}>Positivas (4-5)</option>
            <option value="neutrales" ${this.state.estrellas === 'neutrales' ? 'selected' : ''}>Neutrales (3)</option>
            <option value="negativas" ${this.state.estrellas === 'negativas' ? 'selected' : ''}>Negativas (1-2)</option>
          </select>
        </div>

        <div id="exp-results">
          <div style="padding: 40px; text-align: center; color: var(--fg-muted);">Cargando base de datos de reseñas...</div>
        </div>
      </section>
    `;

    // Lazy load all available data for the explorer
    for (const year of Object.keys(DataLoader.manifest)) {
      for (const m of DataLoader.manifest[year]) {
        await DataLoader.loadMonth(year, m);
      }
    }

    // Collect all reviews
    let allReviews = [];
    for (const key in DataLoader.cache) {
      const data = DataLoader.cache[key];
      if (data && data.reviews) {
        allReviews = allReviews.concat(data.reviews);
      }
    }
    
    // Sort by date descending
    allReviews.sort((a, b) => new Date(b.publishedAtDate) - new Date(a.publishedAtDate));
    this.state.reviews = allReviews;

    // Re-enable controls
    document.getElementById('exp-search').disabled = false;
    document.getElementById('exp-branch').disabled = false;
    document.getElementById('exp-stars').disabled = false;

    // Bind events
    document.getElementById('exp-search').addEventListener('input', (e) => {
      this.state.query = e.target.value.toLowerCase();
      this.updateResults();
    });
    document.getElementById('exp-branch').addEventListener('change', (e) => {
      this.state.sucursal = e.target.value;
      this.updateResults();
    });
    document.getElementById('exp-stars').addEventListener('change', (e) => {
      this.state.estrellas = e.target.value;
      this.updateResults();
    });

    this.updateResults();
  },

  updateResults() {
    const container = document.getElementById('exp-results');
    let filtered = this.state.reviews;

    // Filter by branch
    if (this.state.sucursal !== 'todas') {
      const meta = getBranchById(this.state.sucursal);
      const names = [meta.nombre, meta.abr];
      if (this.state.sucursal === 'gal-gdl') names.push('Galerías GDL');
      if (this.state.sucursal === 'sta-anita') names.push('Galerías Santa Anita');
      filtered = filtered.filter(r => names.includes(r.sucursal));
    }

    // Filter by stars
    if (this.state.estrellas === 'positivas') filtered = filtered.filter(r => r.stars >= 4);
    if (this.state.estrellas === 'neutrales') filtered = filtered.filter(r => r.stars === 3);
    if (this.state.estrellas === 'negativas') filtered = filtered.filter(r => r.stars <= 2);

    // Filter by query
    if (this.state.query.trim() !== '') {
      filtered = filtered.filter(r => (r.text || '').toLowerCase().includes(this.state.query));
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state">No se encontraron reseñas con esos filtros</div>`;
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 14px; color: var(--fg-muted);">Mostrando ${filtered.length} reseña${filtered.length !== 1 ? 's' : ''}</div>
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${filtered.map(r => {
          const type = r.stars >= 4 ? 'ok' : r.stars === 3 ? 'flat' : 'warn';
          return `
            <div style="background: var(--bg-card); padding: 16px; border-radius: 12px; border: 1px solid var(--border);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <span class="bc-stars-line" style="color: var(--${type === 'warn' ? 'alerta' : type === 'flat' ? 'fg-muted' : 'optima'});">${starStr(r.stars)}</span>
                  <span style="font-weight: 600;">${r.sucursal}</span>
                </div>
                <span style="font-size: 12px; color: var(--fg-muted);">${formatDateTime(r.publishedAtDate)}</span>
              </div>
              ${r.text ? `<div style="font-size: 15px; line-height: 1.5; color: var(--fg); margin-top: 8px;">"${r.text}"</div>` : `<div style="font-size: 14px; font-style: italic; color: var(--fg-muted); margin-top: 8px;">Sin texto</div>`}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
