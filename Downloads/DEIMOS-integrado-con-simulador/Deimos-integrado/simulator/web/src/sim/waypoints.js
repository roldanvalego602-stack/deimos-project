// Coloca los waypoints científicos (waypoints.json) sobre la cuadrícula del modo EVA.
// - Con DEM georreferenciado (dem.json → origin) usa las coordenadas reales.
// - Si no, reparte el recuadro de la ruta (route.geojson) sobre el mapa, de modo que
//   el primer punto cae en el inicio (suroeste) y el último en la meta (noreste).
// El primer y el último waypoint son salida y retorno; los intermedios son sitios de muestreo.
import { nearestFlat } from './pathfinding.js';

const MARS_RADIUS_M = 3_389_500;
const M_PER_DEG = (2 * Math.PI * MARS_RADIUS_M) / 360;

function routeCoords(route) {
  const out = [];
  for (const f of route?.features ?? []) {
    const g = f.geometry;
    if (g?.type === 'LineString') out.push(...g.coordinates);
  }
  return out; // [lon, lat, elev]
}

function mapGeoreferenced(list, terrain) {
  const o = terrain.meta?.origin;
  if (!o || !Number.isFinite(o.centerLon) || !Number.isFinite(o.centerLat)) return null;
  const mLon = M_PER_DEG * Math.cos((o.centerLat * Math.PI) / 180);
  const cells = list.map((wp) => ({
    col: terrain.size / 2 + ((wp.lon - o.centerLon) * mLon) / terrain.cellSizeM,
    row: terrain.size / 2 - ((wp.lat - o.centerLat) * M_PER_DEG) / terrain.cellSizeM,
  }));
  const ok = cells.every((c) => c.col >= 3 && c.row >= 3 && c.col <= terrain.size - 4 && c.row <= terrain.size - 4);
  return ok ? cells : null;
}

function mapByBounds(list, route, terrain) {
  const pts = [...routeCoords(route).map(([lon, lat]) => ({ lon, lat })), ...list];
  const lons = pts.map((p) => p.lon), lats = pts.map((p) => p.lat);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const spanLon = Math.max(1e-9, maxLon - minLon), spanLat = Math.max(1e-9, maxLat - minLat);
  return list.map((wp) => ({
    col: (0.06 + 0.88 * ((wp.lon - minLon) / spanLon)) * (terrain.size - 1),
    row: (0.94 - 0.88 * ((wp.lat - minLat) / spanLat)) * (terrain.size - 1),
  }));
}

export function mapWaypointsToGrid(waypoints, route, terrain, cfg) {
  const list = [...(waypoints ?? [])].filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lon)).sort((a, b) => a.order - b.order);
  if (list.length < 3) return [];
  const cells = mapGeoreferenced(list, terrain) ?? mapByBounds(list, route, terrain);
  const mode = mapGeoreferenced(list, terrain) ? 'georreferenciado' : 'recuadro de la ruta';
  const maxSlope = cfg.astronaut.maxSlopeDeg;
  const placed = [];
  list.forEach((wp, i) => {
    if (i === 0 || i === list.length - 1) return; // salida y retorno: ya existen como inicio y meta
    const spot = nearestFlat(terrain, cells[i].col, cells[i].row, 0.5 * maxSlope, 14);
    if (!spot) { console.warn(`Waypoint ${wp.id}: no hay terreno transitable cerca; se omite.`); return; }
    placed.push({ ...wp, col: spot.col, row: spot.row, mapping: mode });
  });
  return placed;
}

// Si inicio o meta caen en una ladera (pasa con DEM reales), los mueve a la zona plana más cercana.
export function adjustMissionPoints(terrain, mission, maxSlopeDeg) {
  const s = terrain.size;
  const out = { ...mission };
  const notes = [];
  for (const key of ['start', 'goal']) {
    const [fx, fy] = mission[key];
    const col = Math.round(fx * s), row = Math.round(fy * s);
    const here = terrain.slopes[Math.min(s - 1, row) * s + Math.min(s - 1, col)];
    if (here <= 0.5 * maxSlopeDeg) continue;
    const spot = nearestFlat(terrain, col, row, 0.3 * maxSlopeDeg, 25) ?? nearestFlat(terrain, col, row, 0.5 * maxSlopeDeg, 40);
    if (spot) {
      out[key] = [spot.col / s, spot.row / s];
      notes.push(`${key === 'start' ? 'Inicio' : 'Meta'} movido ${Math.round(spot.dist)} celdas (pendiente ${here.toFixed(0)}°)`);
    }
  }
  return { mission: out, notes };
}

// Elimina por ID cualquier waypoint manual, esté muestreado o pendiente.
export function removeCustomWaypointById(waypoints, id) {
  return (waypoints ?? []).filter((wp) => wp.id !== id);
}
