// Único lugar de la app que hace fetch. Rutas relativas a index.html.
const BASE = './public/data';

async function getJSON(name) {
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${name} (${res.status})`);
  return res.json();
}

export async function loadAll() {
  const [route, waypoints, safety, layers] = await Promise.all([
    getJSON('route.geojson'),
    getJSON('waypoints.json'),
    getJSON('safety.json'),
    getJSON('layers.json'),
  ]);
  return { route, waypoints, safety, layers };
}