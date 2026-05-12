/**
 * views/about.js — Acerca de / Perfil de contacto
 */

const AboutView = {
  async render() {
    Charts.destroyAll();

    document.getElementById('app').innerHTML = `
      ${buildTopbar()}
      <section class="hero r">
        <div class="hero-inner">
          <div class="hero-left">
            <h1 style="font-family:var(--serif);font-size:32px;line-height:1.1;margin-bottom:12px;">
              Acerca de este <span class="accent">portal</span>
            </h1>
            <p style="color:rgba(245,239,230,.8);font-size:15px;line-height:1.5;max-width:400px;">
              Dashboard operativo para el seguimiento y análisis de reseñas de Google Maps de la región Guadalajara.
            </p>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Product <span class="accent">Owner</span></div>
        </div>
        <div class="chart-card" style="display:flex; flex-direction: column; gap:16px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:64px;height:64px;background:var(--verde);color:var(--crema);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:24px;">IG</div>
            <div>
              <div style="font-size:20px;font-family:var(--serif);color:var(--negro);">Ibrahim García</div>
              <div style="font-size:14px;color:var(--text-muted);">Manager Regional GDL · Creador del Portal</div>
            </div>
          </div>
          <p style="font-size:14px;line-height:1.6;color:var(--text);">
            Cualquier duda operativa sobre el uso del dashboard, inconsistencias en los KPIs reportados o propuestas de mejora a la herramienta, puedes contactarme directamente.
          </p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:8px;">
            <a href="mailto:gerencia.andares@myt.com.mx" style="text-decoration:none; background:var(--surface-2); padding:8px 16px; border-radius:20px; font-size:13px; font-weight:600; color:var(--text); border:1px solid var(--border); transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--sage)';this.style.background='var(--surface)';" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface-2)';">
              📧 gerencia.andares@myt.com.mx
            </a>
            <a href="https://wa.me/523312345678" target="_blank" style="text-decoration:none; background:var(--surface-2); padding:8px 16px; border-radius:20px; font-size:13px; font-weight:600; color:var(--text); border:1px solid var(--border); transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--sage)';this.style.background='var(--surface)';" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface-2)';">
              📱 WhatsApp (Urgencias)
            </a>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Descargas <span class="accent">próximamente</span></div>
        </div>
        <div class="chart-card" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 20px;">
          <div style="font-size:32px;margin-bottom:16px;">📥</div>
          <div style="font-family:var(--serif);font-size:20px;color:var(--negro);margin-bottom:8px;">Formatos y Reportes PDF</div>
          <div style="font-size:14px;color:var(--text-muted);max-width:300px;">
            El módulo para descargar los reportes de KPIs mensuales en formato PDF está en desarrollo.
          </div>
        </div>
      </section>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · Grupo MYT<br>
        Dashboard de Reseñas · Región Guadalajara
      </footer>`;
      
    requestAnimationFrame(() => initReveal());
  }
};
