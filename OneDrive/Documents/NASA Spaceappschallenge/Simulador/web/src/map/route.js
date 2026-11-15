function buildPopup(wp) {
  const box = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = wp.name;
  const obj = document.createElement('p');
  obj.textContent = wp.objective;
  box.append(title, obj);

  if (wp.photo) {
    const img = document.createElement('img');
    img.src = wp.photo;
    img.alt = wp.name;
    img.style.maxWidth = '220px';
    img.onerror = () => img.remove(); // si la foto aún no existe, no se muestra rota
    box.append(img);
  }
  return box;
}

export function drawRoute(map, route, waypoints) {
  const line = L.geoJSON(route, {
    style: { color: '#ff6b3d', weight: 4, opacity: 0.95 },
  }).addTo(map);

  waypoints.forEach((wp) => {
    L.circleMarker([wp.lat, wp.lon], {
      radius: 7,
      color: '#fff',
      weight: 2,
      fillColor: '#ff6b3d',
      fillOpacity: 1,
    })
      .bindPopup(buildPopup(wp))
      .bindTooltip(`${wp.order}. ${wp.name}`)
      .addTo(map);
  });

  map.fitBounds(line.getBounds(), { padding: [40, 40] });
  return line;
}