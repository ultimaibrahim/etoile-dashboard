/**
 * views/about.js — Acerca de / Identidad del portal / Contacto
 */

const AboutView = {
  async render() {
    Charts.destroyAll();

    const pill = (label) =>
      `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:rgba(61,90,71,0.1);color:var(--verde);font-size:12px;font-weight:600;letter-spacing:.04em;border:1px solid rgba(61,90,71,0.18);">${label}</span>`;

    document.getElementById('app').innerHTML = `
      ${buildTopbar()}

      <!-- HERO -->
      <section class="hero r">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Acerca de este portal</span>
            </div>
            <h1 style="font-family:var(--serif);font-size:clamp(28px,6vw,48px);color:var(--crema);line-height:1.1;margin-bottom:14px;">
              Dashboard de <span style="font-style:italic;color:var(--sage);">Reseñas</span>
            </h1>
            <p style="color:rgba(245,239,230,.75);font-size:15px;line-height:1.6;max-width:460px;">
              Herramienta operativa para el seguimiento y análisis de reseñas de Google Maps de las 8 sucursales de La Crêpe Parisienne en la región Guadalajara.
            </p>
          </div>
          <div class="hero-right">
            <div style="display:grid;gap:12px;">
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Versión actual</div>
                <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--crema);">v2.5 · 2026</div>
              </div>
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Cobertura</div>
                <div style="font-size:15px;font-weight:600;color:var(--crema);">8 sucursales · Región GDL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PROPÓSITO -->
      <section class="hero r" style="background:var(--verde-deep);padding:56px 24px;">
        <div style="max-width:1240px;margin:0 auto;display:flex;flex-direction:column;align-items:flex-end;text-align:right;gap:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,239,230,0.4);">Nuestro Propósito</div>
          <h2 style="font-family:var(--serif);font-size:clamp(28px,6vw,52px);color:var(--crema);line-height:1.1;max-width:720px;">
            &ldquo;Crear, operar y crecer modelos innovadores de restaurantes que hagan la vida mejor y m&aacute;s divertida para nosotros y nuestros invitados.&rdquo;
          </h2>
        </div>
      </section>

      <!-- MISIÓN Y VALORES -->
      <section class="section r">
        <div class="section-head">
          <div class="section-title">Misión <span class="accent">y valores</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${[
            { label: 'Hospitalidad y Excelencia', text: 'Creamos historias de hospitalidad memorable. Documentamos nuestros estándares y los seguimos con orgullo. Entrenamos continuamente para hacer cada día mejor.' },
            { label: 'Innovación Continua', text: 'Buscamos constantemente nuevas formas de sorprender a nuestros invitados, optimizar operaciones y adoptar tecnología que potencie a nuestro equipo.' },
            { label: 'Datos como Cultura', text: 'Cada reseña es una conversación. Escuchamos, medimos y actuamos — porque la mejora continua empieza en entender qué piensan quienes nos visitan.' },
          ].map(v => `
            <div class="chart-card" style="display:flex;align-items:flex-start;gap:16px;padding:18px 22px;">
              <div style="margin-top:2px;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--oro)" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">${v.label}</div>
                <p style="font-size:15px;line-height:1.6;color:var(--text);">${v.text}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>

      <!-- PRODUCT OWNER -->
      <section class="section r">
        <div class="section-head">
          <div class="section-title">Product <span class="accent">Owner</span></div>
        </div>
        <div class="chart-card" style="display:flex;flex-direction:column;gap:20px;">
          <div style="display:flex;align-items:center;gap:18px;">
            <div style="width:68px;height:68px;background:var(--verde);color:var(--crema);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:26px;flex-shrink:0;box-shadow:0 4px 14px rgba(61,90,71,0.3);">IG</div>
            <div>
              <div style="font-size:22px;font-family:var(--serif);color:var(--negro);">Ibrahim García</div>
              <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
                ${pill('Producto Digital')}${pill('Operaciones GDL')}${pill('Data-Driven')}
              </div>
            </div>
          </div>
          <p style="font-size:14px;line-height:1.7;color:var(--text);border-left:3px solid var(--sage);padding-left:16px;margin:0;">
            Estratega de operaciones y producto con enfoque en innovación data-driven para la industria restaurantera. Diseño, desarrollo y escalo herramientas internas que convierten los datos de clientes en decisiones operativas concretas — desde el KPI hasta el cambio en piso. Creo en que la tecnología bien aplicada no simplifica el trabajo, lo eleva.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="mailto:ultima.ibrahim@proton.me"
               style="text-decoration:none;background:var(--surface-2);padding:9px 18px;border-radius:20px;font-size:13px;font-weight:600;color:var(--text);border:1px solid var(--border);transition:all 0.2s ease;display:flex;align-items:center;gap:7px;"
               onmouseover="this.style.borderColor='var(--sage)';this.style.background='var(--surface)';"
               onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface-2)';">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,6 12,13 22,6"/></svg>
              ultima.ibrahim@proton.me
            </a>
            <a href="https://wa.me/5213333223998" target="_blank"
               style="text-decoration:none;background:var(--surface-2);padding:9px 18px;border-radius:20px;font-size:13px;font-weight:600;color:var(--text);border:1px solid var(--border);transition:all 0.2s ease;display:flex;align-items:center;gap:7px;"
               onmouseover="this.style.borderColor='var(--sage)';this.style.background='var(--surface)';"
               onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface-2)';">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              WhatsApp · +52 1 333 322 3998
            </a>
          </div>
        </div>
      </section>

      <!-- DESCARGAS -->
      <section class="section r">
        <div class="section-head">
          <div class="section-title">Descargas <span class="accent">próximamente</span></div>
        </div>
        <div class="chart-card" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 20px;">
          <div style="width:52px;height:52px;border-radius:14px;background:rgba(61,90,71,0.08);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div style="font-family:var(--serif);font-size:20px;color:var(--negro);margin-bottom:8px;">Formatos y Reportes PDF</div>
          <div style="font-size:14px;color:var(--text-muted);max-width:300px;">El módulo para exportar los reportes de KPIs mensuales en PDF está en desarrollo.</div>
        </div>
      </section>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · Grupo MYT / Corporativo Alancar<br>
        Dashboard de Reseñas · Región Guadalajara · v2.5 2026
      </footer>`;

    requestAnimationFrame(() => initReveal());
  }
};
