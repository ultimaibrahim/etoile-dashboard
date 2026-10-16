/* Constelación de sucursales sobre el mapa de México (solo en la página pública de Étoile).
 * Cada punto es una sucursal; se encienden de la Ciudad de México hacia afuera y las regiones se unen como una constelación.
 * Coordenadas redondeadas a 2 decimales. 11 vienen del pin de su ficha de Google (locations.latitude/longitude, 2026-10-16);
 * las demás fichas no traen pin y quedan aproximadas a nivel plaza. Corre una vez; sin movimiento si el sistema lo pide. */
(function () {
  const host = document.getElementById('mapa');
  if (!host) return;

  // [región, latitud, longitud]
  const SUC = [
    ['CDMX', 19.39, -99.25], ['CDMX', 19.31, -99.21], ['CDMX', 19.41, -99.20], ['CDMX', 19.36, -99.28], ['CDMX', 19.36, -99.17],
    ['CDMX', 19.35, -99.18], ['CDMX', 19.45, -99.09], ['CDMX', 19.40, -99.24], ['CDMX', 19.36, -99.27], ['CDMX', 19.30, -99.14],
    ['CDMX', 19.44, -99.20], ['CDMX', 19.51, -99.23], ['CDMX', 19.43, -99.19], ['CDMX', 19.49, -99.12],
    ['GDL', 20.71, -103.41], ['GDL', 20.64, -103.31], ['GDL', 20.68, -103.43], ['GDL', 20.56, -103.45], ['GDL', 20.66, -103.35],
    ['GDL', 20.67, -103.39], ['GDL', 20.71, -103.38], ['GDL', 20.65, -103.40],
    ['MTY', 25.65, -100.33], ['MTY', 25.68, -100.35], ['MTY', 25.64, -100.31],
    ['TOL', 19.26, -99.62], ['TOL', 19.27, -99.61],
    ['QRO', 20.67, -100.44], ['SLP', 22.13, -101.03], ['AGS', 21.92, -102.29], ['LEON', 21.15, -101.70],
    ['CUN', 21.16, -86.81], ['TJ', 32.52, -117.02]
  ];
  const NOMBRE = { CDMX: 'Ciudad de México', GDL: 'Guadalajara', MTY: 'Monterrey', TOL: 'Toluca', QRO: 'Querétaro', SLP: 'San Luis Potosí', AGS: 'Aguascalientes', LEON: 'León', CUN: 'Cancún', TJ: 'Tijuana' };
  // Posición de la etiqueta respecto a la región (en unidades del mapa) para que no choquen en el Bajío
  const ETQ = { CDMX: [6, 7, 'start'], GDL: [-5, 9, 'end'], MTY: [5, -3, 'start'], TOL: [-5, 5, 'end'], QRO: [5, -1, 'start'], SLP: [5, -2, 'start'],
                AGS: [-3, -5, 'end'], LEON: [-3, 4, 'end'], CUN: [-4, -4, 'end'], TJ: [4, 6, 'start'] };

  // Contorno simplificado de México [longitud, latitud]: frontera norte, golfo, Yucatán, Pacífico y la península de Baja California
  const MX = [[-117.1,32.5],[-114.7,32.7],[-111,31.3],[-108.2,31.3],[-108.2,31.8],[-106.5,31.8],[-105,30.7],[-104.5,29.6],[-103.2,29],[-102.4,29.8],
    [-101.4,29.8],[-100.3,28.3],[-99.5,27.5],[-99.1,26.4],[-97.5,25.9],[-97.2,25],[-97.6,23.5],[-97.85,22.2],[-97.2,20.6],[-96.1,19.2],[-94.4,18.15],
    [-92.5,18.6],[-91.8,18.65],[-90.5,19.85],[-90.4,21],[-89.6,21.3],[-87,21.6],[-86.8,21.1],[-87.5,19.5],[-88.3,18.5],[-89.15,17.8],[-90.98,17.8],
    [-91,17.25],[-91.4,17.25],[-90.4,16.1],[-91.7,16.07],[-92.2,15.25],[-92.2,14.55],[-93.9,15.9],[-95.2,16.17],[-96.5,15.65],[-98.5,16.3],[-99.9,16.85],
    [-101.5,17.6],[-102.2,17.95],[-103.5,18.3],[-104.3,19.1],[-105.3,20],[-105.5,20.7],[-105.2,21.5],[-105.7,22.5],[-106.4,23.2],[-107.5,24.5],
    [-108.5,25.5],[-109.4,26.3],[-110,27],[-110.9,27.9],[-111.9,29],[-112.8,30.3],[-113.1,31.2],[-114.1,31.5],[-114.8,31.8],[-114.84,31],
    [-114.2,30],[-113.55,28.95],[-112.27,27.34],[-111.34,26],[-110.7,24.8],[-110.3,24.15],[-109.9,22.88],[-110.2,23.45],[-111.6,24.4],[-112.1,24.6],
    [-112.2,25.9],[-113.2,26.7],[-114.05,27.97],[-115.1,27.85],[-114.3,28.6],[-114.9,29.6],[-115.7,30.07],[-115.95,30.5],[-116.6,31.85]];

  // Proyección equirrectangular corregida a la latitud media de México
  const K = 10, COS = Math.cos(23 * Math.PI / 180);
  const P = (lat, lng) => [+((lng + 118) * COS * K).toFixed(1), +((33.5 - lat) * K).toFixed(1)];
  const W = Math.ceil((-86 + 118) * COS * K), H = Math.ceil((33.5 - 14) * K);

  const pts = SUC.map(([r, la, lo]) => ({ r, p: P(la, lo) }));
  const regs = {};
  pts.forEach(s => { (regs[s.r] = regs[s.r] || []).push(s); });
  const cen = Object.fromEntries(Object.entries(regs).map(([r, l]) => [r, [l.reduce((a, s) => a + s.p[0], 0) / l.length, l.reduce((a, s) => a + s.p[1], 0) / l.length]]));
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // Árbol de expansión mínima entre regiones, creciendo desde la Ciudad de México: así se dibuja la constelación
  const orden = ['CDMX'], aristas = [];
  while (orden.length < Object.keys(cen).length) {
    let best = null;
    orden.forEach(a => Object.keys(cen).forEach(b => { if (!orden.includes(b) && (!best || d(cen[a], cen[b]) < best[2])) best = [a, b, d(cen[a], cen[b])]; }));
    orden.push(best[1]); aristas.push(best);
  }
  const t0 = 900, paso = 260; // el contorno se traza primero; luego cada región se enciende a su turno
  const turno = Object.fromEntries(orden.map((r, i) => [r, t0 + i * paso]));

  const outline = 'M' + MX.map(([lo, la]) => P(la, lo).join(' ')).join('L') + 'Z';
  const lines = aristas.map(([a, b]) => {
    const [x1, y1] = cen[a], [x2, y2] = cen[b];
    return `<line class="cl" pathLength="1" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="--t:${turno[b] - 120}ms"/>`;
  }).join('');
  const dots = pts.map((s, i) => `<circle class="cd" cx="${s.p[0]}" cy="${s.p[1]}" r="${regs[s.r].length > 1 ? 1.3 : 1.9}" style="--t:${turno[s.r] + (i % 5) * 40}ms"/>`).join('');
  const halos = Object.entries(cen).map(([r, c]) => `<circle class="ch" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(3 + Math.sqrt(regs[r].length) * 2.2).toFixed(1)}" style="--t:${turno[r]}ms"/>`).join('');
  const labels = Object.entries(cen).map(([r, c]) => {
    const [dx, dy, an] = ETQ[r] || [4, -3, 'start'];
    return `<text class="ct${regs[r].length > 1 || r === 'TJ' || r === 'CUN' ? '' : ' ct-min'}" x="${(c[0] + dx).toFixed(1)}" y="${(c[1] + dy).toFixed(1)}" text-anchor="${an}" style="--t:${turno[r] + 180}ms">${NOMBRE[r] || r}</text>`;
  }).join('');

  host.innerHTML = `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" role="img" aria-labelledby="mapaT">
    <title id="mapaT">Mapa de México con las ${pts.length} sucursales de La Crêpe Parisienne en ${orden.length} regiones, unidas como una constelación</title>
    <path class="cm" pathLength="1" d="${outline}"/>${lines}${halos}${dots}${labels}</svg>
    <p class="mapa-pie"><b>${pts.length}</b> sucursales · <b>${orden.length}</b> regiones</p>`;
  requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('on')));
})();
