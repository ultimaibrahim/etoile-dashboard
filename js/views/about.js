/**
 * views/about.js — Sección Acerca de.
 */

const AboutView = {
  render() {
    document.getElementById('app').innerHTML = `
      ${buildTopbar(true, 'Acerca de')}
      <section class="hero" style="padding:48px 22px;">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Nuestro Propósito</span>
            </div>
            <h1 class="display" style="font-size:clamp(36px,8vw,64px);color:var(--crema);line-height:1.05;">
              Crear, operar y crecer modelos innovadores de restaurantes
            </h1>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Misión <span class="accent">y valores</span></div>
        </div>
        <div class="insight-grid">
          <div class="insight-card" style="grid-column:1 / -1;">
            <span class="insight-marker gold" style="font-size:20px;width:32px;height:32px;">✦</span>
            <div>
              <div class="insight-label">Misión</div>
              <div class="insight-val" style="font-size:15px;font-style:italic;font-family:var(--serif);">
                "Crear, operar y crecer modelos innovadores de restaurantes que hagan la vida mejor y más divertida para nosotros y nuestros invitados."
              </div>
            </div>
          </div>
          <div class="insight-card" style="grid-column:1 / -1;">
            <span class="insight-marker" style="font-size:20px;width:32px;height:32px;">✦</span>
            <div>
              <div class="insight-label">Hospitalidad y Excelencia</div>
              <div class="insight-val" style="font-size:15px;font-style:italic;font-family:var(--serif);">
                "Creamos historias de hospitalidad memorable. Documentamos nuestros estándares y los seguimos con orgullo. Entrenamos continuamente para hacer cada día mejor."
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Metodología <span class="accent">del dashboard</span></div>
        </div>
        <div class="chart-card">
          <p style="line-height:1.7;color:var(--text);margin-bottom:14px;">
            Este dashboard monitorea las reseñas de Google Maps de las 8 sucursales de La Crêpe Parisienne en la región de Guadalajara.
            Los datos se actualizan mensualmente a partir de archivos CSV procesados y limpiados.
          </p>
          <ul style="line-height:1.7;color:var(--text-muted);padding-left:18px;font-size:13px;">
            <li>Fuente: Google Reviews vía Apify Google Maps Reviews Scraper.</li>
            <li>Periodo de análisis: Oct 2025 – actualidad.</li>
            <li>Cálculo de rating: promedio simple de estrellas de reseñas con texto.</li>
            <li>Alertas: reseñas ≤ 2 estrellas en el mes en curso.</li>
          </ul>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Descargas <span class="accent">próximamente</span></div>
        </div>
        <div class="chart-card" style="padding:32px;text-align:center;color:var(--text-muted);">
          <span class="glyph" style="font-family:var(--serif);font-style:italic;font-size:40px;color:var(--sage);display:block;margin-bottom:8px;">↓</span>
          <p>Próximamente podrás descargar los archivos Excel mensuales con todas las reseñas.</p>
          <p style="margin-top:8px;font-size:12px;">Flujo planificado: Apify → CSV → Limpieza Python → Excel descargable</p>
        </div>
      </section>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · Grupo MYT / Grupo Corporativo Alancar<br>
        Dashboard de Reseñas · Región Guadalajara
      </footer>`;
  }
};
