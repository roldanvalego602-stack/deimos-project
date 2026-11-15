// Crea capas desde layers.json y un control con visibilidad + opacidad.
// Tipos soportados: "image" (con bounds) y "tile" (con url {z}/{x}/{y}).
function createLayer(cfg) {
  if (cfg.type === 'image') {
    return L.imageOverlay(cfg.url, cfg.bounds, { opacity: cfg.opacity });
  }
  if (cfg.type === 'tile') {
    return L.tileLayer(cfg.url, { opacity: cfg.opacity, maxZoom: cfg.maxZoom ?? 12 });
  }
  console.warn(`Tipo de capa desconocido: ${cfg.type}`);
  return null;
}

function buildRow(cfg, layer, map) {
  const row = document.createElement('div');
  row.className = 'layer-row';

  const label = document.createElement('label');
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = cfg.visible;
  check.addEventListener('change', () => {
    check.checked ? layer.addTo(map) : map.removeLayer(layer);
  });
  label.append(check, document.createTextNode(cfg.name));

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.05;
  slider.value = cfg.opacity;
  slider.addEventListener('input', () => layer.setOpacity(Number(slider.value)));

  row.append(label, slider);
  return row;
}

export function setupLayers(map, layers, container) {
  const registry = {};
  layers.forEach((cfg) => {
    const layer = createLayer(cfg);
    if (!layer) return;
    registry[cfg.id] = layer;
    if (cfg.visible) layer.addTo(map);
    container.appendChild(buildRow(cfg, layer, map));
  });
  return registry;
}