// Toda conversión de unidades vive aquí. Documentar en docs/supuestos.md.
export const MARS_RADIUS_KM = 3389.5;

export const degToRad = (deg) => (deg * Math.PI) / 180;

export function formatKm(km) {
  return `${km.toFixed(2)} km`;
}

export function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}