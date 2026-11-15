// Ruta sugerida con A* sobre la cuadrícula del terreno (procedural o DEM).
// Costo = tiempo de caminata (más lento con pendiente y rocas). No pasa por celdas
// con pendiente mayor que el límite del astronauta (con un margen de seguridad).
import { speedFactor } from './engine.js';

class MinHeap {
  constructor() { this.keys = []; this.vals = []; }
  get size() { return this.keys.length; }
  push(key, val) {
    const k = this.keys, v = this.vals;
    let i = k.length;
    k.push(key); v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= key) break;
      k[i] = k[p]; v[i] = v[p]; i = p;
    }
    k[i] = key; v[i] = val;
  }
  pop() {
    const k = this.keys, v = this.vals;
    const top = v[0];
    const lastK = k.pop(), lastV = v.pop();
    const n = k.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && k[c + 1] < k[c]) c++;
        if (k[c] >= lastK) break;
        k[i] = k[c]; v[i] = v[c]; i = c;
      }
      k[i] = lastK; v[i] = lastV;
    }
    return top;
  }
}

const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const STILL = { exhausted: false };

// Intenta primero con un margen de seguridad bajo el límite de pendiente; si no hay camino,
// reintenta con el límite completo (el mismo que usa el movimiento del astronauta).
export function findRoute(terrain, cfg, from, to, opts = {}) {
  const margins = opts.slopeMargin != null ? [opts.slopeMargin] : [cfg.route?.slopeMargin ?? 0.9, 1];
  let result = null;
  for (const margin of margins) {
    result = searchRoute(terrain, cfg, from, to, { ...opts, slopeMargin: margin });
    if (result.found) return { ...result, slopeMargin: margin };
  }
  return result;
}

function searchRoute(terrain, cfg, from, to, opts) {
  const { size, cellSizeM, slopes, rockiness } = terrain;
  const rcfg = cfg.route ?? {};
  const limit = cfg.astronaut.maxSlopeDeg * opts.slopeMargin;
  const rockPenalty = opts.rockPenalty ?? rcfg.rockPenalty ?? 0.8;
  const inside = (c, r) => c >= 0 && r >= 0 && c < size && r < size;
  const passable = (c, r) => inside(c, r) && slopes[r * size + c] <= limit;

  const sc = Math.round(from.col), sr = Math.round(from.row);
  const gc = Math.round(to.col), gr = Math.round(to.row);
  if (!inside(sc, sr) || !inside(gc, gr)) return { found: false, reason: 'fuera del mapa' };
  // El punto de partida y el destino siempre se permiten (el astronauta ya está ahí).
  const start = sr * size + sc, goal = gr * size + gc;

  const g = new Float32Array(size * size).fill(Infinity);
  const parent = new Int32Array(size * size).fill(-1);
  const closed = new Uint8Array(size * size);
  const heuristic = (c, r) => {
    const dx = Math.abs(c - gc), dy = Math.abs(r - gr);
    return (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)) * cellSizeM;
  };

  const heap = new MinHeap();
  g[start] = 0;
  heap.push(heuristic(sc, sr), start);

  while (heap.size) {
    const cur = heap.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goal) break;
    const cc = cur % size, cr = (cur / size) | 0;
    for (const [dx, dy] of NEIGHBORS) {
      const nc = cc + dx, nr = cr + dy;
      if (!inside(nc, nr)) continue;
      const ni = nr * size + nc;
      if (closed[ni]) continue;
      if (ni !== goal && !passable(nc, nr)) continue;
      // Sin cortar esquinas entre dos celdas bloqueadas
      if (dx && dy && (!passable(cc + dx, cr) || !passable(cc, cr + dy))) continue;
      const slope = (slopes[cur] + slopes[ni]) / 2;
      const spd = speedFactor(STILL, cfg, slope);
      const dist = cellSizeM * (dx && dy ? Math.SQRT2 : 1);
      const cost = (dist / Math.max(0.05, spd)) * (1 + rockPenalty * (rockiness?.[ni] ?? 0));
      const tentative = g[cur] + cost;
      if (tentative < g[ni]) {
        g[ni] = tentative;
        parent[ni] = cur;
        heap.push(tentative + heuristic(nc, nr), ni);
      }
    }
  }
  if (!closed[goal]) return { found: false, reason: 'sin ruta transitable' };

  const cells = [];
  for (let i = goal; i !== -1; i = parent[i]) cells.push({ col: i % size, row: (i / size) | 0 });
  cells.reverse();
  return { found: true, cells, ...routeMetrics(terrain, cfg, cells) };
}

// Distancia, tiempo, oxígeno y dosis estimados para una lista de celdas.
export function routeMetrics(terrain, cfg, cells) {
  const { size, cellSizeM, slopes, heights } = terrain;
  const a = cfg.astronaut;
  const d = cfg.operationalFactors ?? { oxygenDrain: 1, radiationRate: 1 };
  let distanceM = 0, minutes = 0, o2 = 0, maxSlopeDeg = 0, ascentM = 0;
  for (let i = 1; i < cells.length; i++) {
    const p = cells[i - 1], q = cells[i];
    const ip = p.row * size + p.col, iq = q.row * size + q.col;
    const dist = cellSizeM * (p.col !== q.col && p.row !== q.row ? Math.SQRT2 : 1);
    const slope = (slopes[ip] + slopes[iq]) / 2;
    const speed = a.walkSpeedMs * speedFactor(STILL, cfg, slope); // m/s
    const mins = dist / (speed * 60);
    distanceM += dist;
    minutes += mins;
    o2 += mins * (a.oxygenMoveRate + a.oxygenPerSlopeDeg * slope) * (d.oxygenDrain ?? 1);
    maxSlopeDeg = Math.max(maxSlopeDeg, slopes[iq]);
    ascentM += Math.max(0, heights[iq] - heights[ip]);
  }
  const rad = cfg.radiation;
  const doseMSv = rad?.enabled ? (rad.baselineMSvPerDay / 1440) * minutes * (d.radiationRate ?? 1) : 0;
  return { distanceM, minutes, oxygenMin: o2, maxSlopeDeg, ascentM, doseMSv };
}

// Celda transitable más cercana (por pendiente) dentro de un radio, o null.
export function nearestFlat(terrain, col, row, maxSlopeDeg, radius = 12) {
  const { size, slopes } = terrain;
  let best = null, bestD = Infinity;
  for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
    const c = Math.round(col) + dc, r = Math.round(row) + dr;
    if (c < 2 || r < 2 || c >= size - 2 || r >= size - 2) continue;
    const dist = Math.hypot(dc, dr);
    if (dist > radius || dist >= bestD) continue;
    if (slopes[r * size + c] <= maxSlopeDeg) { best = { col: c, row: r, dist }; bestD = dist; }
  }
  return best;
}
