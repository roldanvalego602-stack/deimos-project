// Marte no tiene mapa base por defecto en Leaflet: se usa fondo oscuro y capas propias.
export function initMap(containerId) {
  const map = L.map(containerId, {
    center: [18.4, 77.59],
    zoom: 12,
    minZoom: 8,
    maxZoom: 16,
    zoomControl: true,
  });
  L.control.scale({ metric: true, imperial: false }).addTo(map);
  return map;
}