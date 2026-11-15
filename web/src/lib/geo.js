import { MARS_RADIUS_KM, degToRad } from './units.js';

// Velocidad de caminata supuesta (km/h). Ver docs/supuestos.md
// 0.8 m/s = 2.88 km/h: el mismo valor que astronaut.walkSpeedMs en simulation.json.
export const WALK_SPEED_KMH = 0.8 * 3.6;

// Distancia entre dos puntos [lon, lat] sobre una esfera del radio de MARTE (no de la Tierra).
export function haversineKm([lon1, lat1], [lon2, lat2]) {
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * MARS_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Distancias acumuladas (km) en cada vértice de la ruta.
export function cumulativeKm(coords) {
  const out = [0];
  for (let i = 1; i < coords.length; i++) {
    out.push(out[i - 1] + haversineKm(coords[i - 1], coords[i]));
  }
  return out;
}

export function routeDistanceKm(coords) {
  const acc = cumulativeKm(coords);
  return acc[acc.length - 1];
}

export function walkingTimeMin(km, speedKmh = WALK_SPEED_KMH) {
  return (km / speedKmh) * 60;
}