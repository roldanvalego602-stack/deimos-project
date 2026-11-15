// Terreno del modo EVA.
// Dos orígenes con el mismo formato de salida:
//   1) Procedural (ruido + cráteres): generateTerrain(). Es el valor por defecto.
//   2) Cuadrícula real (DEM): loadTerrain() lee public/data/terreno/dem.json
//      (ver contract/schemas/formatos.md). Si falla, vuelve al procedural.
// El resto de la app solo consume el objeto { size, cellSizeM, heights, slopes,
// rockiness, horizonDeg, ... } y no sabe de dónde salió.

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t) => t * t * (3 - 2 * t);

function makeLayer(rand, size, cellsPerLattice) {
  const n = Math.ceil(size / cellsPerLattice) + 2;
  const lattice = new Float32Array(n * n);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  return { n, lattice, cellsPerLattice };
}

function sampleLayer(layer, x, y) {
  const gx = x / layer.cellsPerLattice;
  const gy = y / layer.cellsPerLattice;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smooth(gx - x0);
  const fy = smooth(gy - y0);
  const { n, lattice } = layer;
  const a = lattice[y0 * n + x0];
  const b = lattice[y0 * n + x0 + 1];
  const c = lattice[(y0 + 1) * n + x0];
  const d = lattice[(y0 + 1) * n + x0 + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

// Pendiente en grados por celda (diferencias centradas).
function computeSlopes(heights, size, cellSizeM) {
  const slopes = new Float32Array(size * size);
  const at = (x, y) => heights[Math.min(size - 1, Math.max(0, y)) * size + Math.min(size - 1, Math.max(0, x))];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dzdx = (at(x + 1, y) - at(x - 1, y)) / (2 * cellSizeM);
    const dzdy = (at(x, y + 1) - at(x, y - 1)) / (2 * cellSizeM);
    slopes[y * size + x] = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
  }
  return slopes;
}

// Ángulo de horizonte medio (grados) por celda: cuánto cielo tapa el relieve.
// Se escanean 8 direcciones a varias distancias. Alimenta el blindaje contra
// radiación del terreno (cráteres y laderas protegen un poco). Es una aproximación de juego.
const HORIZON_STEPS = [1, 2, 3, 4, 6, 8, 12];
const HORIZON_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
export function computeHorizon(heights, size, cellSizeM) {
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const h0 = heights[y * size + x];
    let total = 0;
    for (const [dx, dy] of HORIZON_DIRS) {
      let best = 0;
      for (const step of HORIZON_STEPS) {
        const sx = Math.round(x + dx * step);
        const sy = Math.round(y + dy * step);
        if (sx < 0 || sy < 0 || sx >= size || sy >= size) break;
        const distM = Math.hypot(sx - x, sy - y) * cellSizeM;
        const angle = Math.atan2(heights[sy * size + sx] - h0, distM);
        if (angle > best) best = angle;
      }
      total += best;
    }
    out[y * size + x] = ((total / HORIZON_DIRS.length) * 180) / Math.PI;
  }
  return out;
}

export function generateTerrain(tcfg) {
  const { size, cellSizeM, seed, elevationRangeM, octaves, baseCells } = tcfg;
  const rand = mulberry32(seed);
  const layers = [];
  let ampSum = 0;
  for (let o = 0; o < octaves; o++) {
    layers.push({ ...makeLayer(rand, size, baseCells / 2 ** o), amp: 0.5 ** o });
    ampSum += 0.5 ** o;
  }

  const raw = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const l of layers) v += l.amp * sampleLayer(l, x, y);
    raw[y * size + x] = v / ampSum;
  }

  // Formaciones procedurales reproducibles: cráteres, macizos y campos rocosos.
  // Se mantienen alejadas de los puntos inicial/final (esquinas del mapa).
  const features = [];
  const featureCount = tcfg.featureCount ?? 22;
  for (let i = 0; i < featureCount; i++) {
    const kindRoll = rand();
    const kind = kindRoll < 0.48 ? 'crater' : kindRoll < 0.78 ? 'mountain' : 'rockfield';
    const radius = kind === 'crater' ? 5 + rand() * 10 : kind === 'mountain' ? 5 + rand() * 12 : 4 + rand() * 10;
    let x = 20 + rand() * (size - 40);
    let y = 20 + rand() * (size - 40);
    // Deja despejadas las zonas de inicio y meta para evitar spawns sobre laderas.
    for (let tries = 0; tries < 20; tries++) {
      const startPoint = tcfg.missionStart ?? [0.5, 0.5];
      const nearStart = Math.hypot(x - size * startPoint[0], y - size * startPoint[1]) < radius + 18;
      const nearGoal = Math.hypot(x - size * 0.94, y - size * 0.06) < radius + 16;
      if (!nearStart && !nearGoal) break;
      x = 20 + rand() * (size - 40); y = 20 + rand() * (size - 40);
    }
    features.push({ kind, x, y, radius, strength: 0.08 + rand() * 0.12 });
  }

  const rockiness = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    let h = raw[i];
    let rock = 0.12 + 0.18 * sampleLayer(layers[layers.length - 1], x, y);
    for (const f of features) {
      const d = Math.hypot(x - f.x, y - f.y);
      const q = d / f.radius;
      if (f.kind === 'crater') {
        const bowl = -f.strength * Math.exp(-((q / 0.72) ** 2));
        const rim = f.strength * 0.62 * Math.exp(-(((q - 0.92) / 0.16) ** 2));
        h += bowl + rim;
        if (q > 0.72 && q < 1.18) rock += 0.18;
      } else if (f.kind === 'mountain') {
        h += f.strength * Math.exp(-((q / 0.72) ** 2));
        if (q < 1.15) rock += 0.12;
      } else if (q < 1.2) {
        rock += 0.48 * (1 - q / 1.2);
      }
    }
    raw[i] = h;
    rockiness[i] = Math.min(1, rock);
  }

  let min = Infinity, max = -Infinity;
  for (const v of raw) { min = Math.min(min, v); max = Math.max(max, v); }
  const heights = new Float32Array(size * size);
  for (let i = 0; i < raw.length; i++) heights[i] = ((raw[i] - min) / Math.max(1e-6, max - min)) * elevationRangeM;

  // Zona de despliegue de la base principal: superficie suavizada alrededor del centro de misión.
  const landing = tcfg.missionStart ?? [0.5, 0.5];
  for (const point of [[size * landing[0], size * landing[1]]]) {
    const cx = Math.round(point[0]), cy = Math.round(point[1]);
    const anchor = heights[cy * size + cx];
    for (let y = Math.max(0, cy - 7); y <= Math.min(size - 1, cy + 7); y++) {
      for (let x = Math.max(0, cx - 7); x <= Math.min(size - 1, cx + 7); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= 7) continue;
        const blend = (1 - d / 7) * 0.88;
        const i = y * size + x;
        heights[i] = heights[i] * (1 - blend) + anchor * blend;
      }
    }
  }

  const slopes = computeSlopes(heights, size, cellSizeM);
  const horizonDeg = computeHorizon(heights, size, cellSizeM);
  return {
    size, cellSizeM, heights, slopes, rockiness, horizonDeg, features, elevationRangeM,
    cellPx: tcfg.cellPx,
    source: { kind: 'procedural', label: 'Procedural (datos de prueba)', detail: `semilla ${seed}` },
  };
}

// Para no regenerar el terreno cada vez que se reinicia la partida
let cache = { key: null, terrain: null };
export function getTerrain(tcfg) {
  const key = JSON.stringify(tcfg);
  if (cache.key !== key) cache = { key, terrain: generateTerrain(tcfg) };
  return cache.terrain;
}

// Dibuja el terreno como imagen: color por elevación + sombreado de relieve.
// Las zonas más inclinadas que la pendiente máxima se oscurecen en rojo (no transitables).
export function renderTerrainCanvas(t, cfg) {
  const { size, cellSizeM, heights, slopes } = t;
  const maxSlope = cfg.astronaut.maxSlopeDeg;
  const small = document.createElement('canvas');
  small.width = size;
  small.height = size;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(size, size);

  const low = [96, 52, 34];
  const high = [208, 170, 128];
  // Luz desde el noroeste, 45° sobre el horizonte
  const L = [-0.5, -0.5, 0.707];
  const at = (x, y) => heights[Math.min(size - 1, Math.max(0, y)) * size + Math.min(size - 1, Math.max(0, x))];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const dzdx = (at(x + 1, y) - at(x - 1, y)) / (2 * cellSizeM);
      const dzdy = (at(x, y + 1) - at(x, y - 1)) / (2 * cellSizeM);
      const nl = Math.hypot(dzdx, dzdy, 1);
      const shade = Math.min(1.3, Math.max(0.45, (-dzdx * L[0] - dzdy * L[1] + L[2]) / nl / 0.707));
      const e = heights[i] / t.elevationRangeM;
      let rgb = [0, 1, 2].map((k) => (low[k] + (high[k] - low[k]) * e) * shade);
      const rock = t.rockiness?.[i] ?? 0;
      rgb = rgb.map((v, k) => v * (1 - rock * 0.22) + [105, 91, 82][k] * rock * 0.22);
      if (slopes[i] > maxSlope) rgb = [rgb[0] * 0.55 + 70, rgb[1] * 0.35, rgb[2] * 0.35];
      img.data[i * 4] = rgb[0];
      img.data[i * 4 + 1] = rgb[1];
      img.data[i * 4 + 2] = rgb[2];
      img.data[i * 4 + 3] = 255;
    }
  }
  sctx.putImageData(img, 0, 0);

  const big = document.createElement('canvas');
  const cellPx = t.cellPx ?? cfg.terrain.cellPx;
  big.width = size * cellPx;
  big.height = size * cellPx;
  const bctx = big.getContext('2d');
  bctx.imageSmoothingEnabled = true;
  bctx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}

// ---------------------------------------------------------------------------
// Terreno real (DEM). Formato: contract/schemas/formatos.md → dem.json
// ---------------------------------------------------------------------------

function flattenElevation(raw, size) {
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    if (raw.length !== size || raw.some((row) => !Array.isArray(row) || row.length !== size)) {
      throw new Error(`elevationM (filas) no coincide con size=${size}.`);
    }
    return Float32Array.from(raw.flat().map((v) => (v === null ? NaN : Number(v))));
  }
  if (!Array.isArray(raw) || raw.length !== size * size) {
    throw new Error(`elevationM debe tener size×size = ${size * size} valores (tiene ${raw?.length ?? 0}).`);
  }
  return Float32Array.from(raw.map((v) => (v === null ? NaN : Number(v))));
}

export function terrainFromDEM(dem, tcfg = {}) {
  const size = dem.size;
  const cellSizeM = dem.cellSizeM;
  if (!Number.isInteger(size) || size < 8 || size > 1024) throw new Error('size debe ser un entero entre 8 y 1024 (cuadrícula cuadrada).');
  if (!(cellSizeM > 0)) throw new Error('cellSizeM debe ser un número mayor que 0 (metros por celda).');

  const elev = flattenElevation(dem.elevationM, size);

  // Huecos (null/NaN): se rellenan con el promedio para no romper pendientes.
  let sum = 0, count = 0, min = Infinity, max = -Infinity;
  for (const v of elev) if (Number.isFinite(v)) { sum += v; count++; min = Math.min(min, v); max = Math.max(max, v); }
  if (!count) throw new Error('elevationM no tiene valores válidos.');
  const mean = sum / count;
  const holes = elev.length - count;
  if (holes) for (let i = 0; i < elev.length; i++) if (!Number.isFinite(elev[i])) elev[i] = mean;

  // Alturas relativas al punto más bajo; la elevación real se conserva en baseElevationM.
  const heights = new Float32Array(elev.length);
  for (let i = 0; i < elev.length; i++) heights[i] = elev[i] - min;
  const elevationRangeM = Math.max(1, max - min);

  const slopes = computeSlopes(heights, size, cellSizeM);

  // Rugosidad estimada: Laplaciano (qué tan "quebrado" está el relieve localmente).
  // Es un proxy; si hay un mapa de rocas real (p. ej. HiRISE), conviene sustituirlo.
  const rockiness = new Float32Array(size * size);
  const at = (x, y) => heights[Math.min(size - 1, Math.max(0, y)) * size + Math.min(size - 1, Math.max(0, x))];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lap = Math.abs(4 * at(x, y) - at(x + 1, y) - at(x - 1, y) - at(x, y + 1) - at(x, y - 1));
    const lapDeg = (Math.atan(lap / cellSizeM) * 180) / Math.PI;
    rockiness[y * size + x] = Math.min(1, 0.12 + 0.6 * Math.min(1, lapDeg / 12));
  }

  const horizonDeg = computeHorizon(heights, size, cellSizeM);
  const targetWorldPx = tcfg.targetWorldPx ?? 2304;
  const cellPx = Math.max(2, Math.min(24, Math.round(targetWorldPx / size)));
  const src = dem.source ?? {};
  const name = dem.name ?? 'DEM sin nombre';
  const id = `dem-${name}-${size}-${cellSizeM}-${Math.round(min)}-${Math.round(max)}`.replace(/[^a-zA-Z0-9_-]+/g, '_');

  return {
    id, size, cellSizeM, heights, slopes, rockiness, horizonDeg, features: [], elevationRangeM,
    baseElevationM: min, cellPx,
    meta: { mission: dem.mission ?? null, origin: dem.origin ?? null, source: src, holes },
    source: {
      kind: 'dem',
      label: dem.mock ? `${name} (DEM de prueba)` : name,
      detail: [src.mission, src.product].filter(Boolean).join(' · ') || 'sin fuente indicada',
      mock: Boolean(dem.mock),
    },
  };
}

// Decide el origen del terreno. Devuelve { terrain, notice }.
//   terrain = null → la escena usa el procedural de siempre (getTerrain).
// Se puede forzar con la URL: eva.html?terreno=dem  |  ?terreno=procedural  |  ?dem=otra/ruta.json
export async function loadTerrain(cfg, search = typeof location !== 'undefined' ? location.search : '') {
  const params = new URLSearchParams(search);
  const conf = cfg.terrain?.source ?? {};
  const mode = params.get('terreno') ?? conf.mode ?? 'procedural';
  const url = params.get('dem') ?? conf.demUrl ?? './public/data/terreno/dem.json';
  if (mode !== 'dem') return { terrain: null, notice: '' };
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
    const terrain = terrainFromDEM(await res.json(), cfg.terrain);
    return { terrain, notice: '' };
  } catch (err) {
    console.warn('No se pudo usar el DEM; se usa el terreno procedural.', err);
    return { terrain: null, notice: `DEM no disponible (${err.message}). Usando terreno procedural.` };
  }
}
