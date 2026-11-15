import { loadAll } from './lib/data.js';
import { initMap } from './map/map.js';
import { setupLayers } from './map/layers.js';
import { drawRoute } from './map/route.js';
import { renderSafetyPanel } from './hud/safetyPanel.js';
import { renderGoNoGo } from './hud/goNoGo.js';
import { renderElevationProfile } from './hud/elevationProfile.js';
import { routeDistanceKm, walkingTimeMin } from './lib/geo.js';
import { formatKm, formatMinutes } from './lib/units.js';

async function init() {
  try {
    const { route, waypoints, safety, layers } = await loadAll();

    // Mapa
    const map = initMap('map');
    setupLayers(map, layers, document.getElementById('layer-panel'));
    drawRoute(map, route, waypoints);

    // HUD
    renderGoNoGo(safety, document.getElementById('go-nogo'), document.getElementById('reasons'));
    renderSafetyPanel(safety, document.getElementById('safety-panel'));
    renderElevationProfile(route, document.getElementById('elevation-chart'));

    // Resumen de ruta (se calcula desde la geometría, no se hardcodea)
    const coords = route.features[0].geometry.coordinates;
    const km = routeDistanceKm(coords);
    document.getElementById('route-summary').textContent =
      `Distancia: ${formatKm(km)} · Tiempo estimado: ${formatMinutes(walkingTimeMin(km))}`;
  } catch (err) {
    console.error(err);
    const box = document.getElementById('error');
    box.hidden = false;
    box.textContent = `Error al cargar la app: ${err.message}`;
  }
}

init();