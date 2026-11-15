import { cumulativeKm } from '../lib/geo.js';

let chart; // evita duplicar el gráfico si se vuelve a renderizar

export function renderElevationProfile(route, canvas) {
  const coords = route.features[0].geometry.coordinates; // [lon, lat, elevación_m]
  const km = cumulativeKm(coords);

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: km.map((d) => d.toFixed(2)),
      datasets: [{
        label: 'Elevación (m)',
        data: coords.map((c) => c[2]),
        borderColor: '#ff6b3d',
        backgroundColor: 'rgba(255,107,61,0.15)',
        fill: true,
        tension: 0.25,
        pointRadius: 3,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Distancia (km)', color: '#8b93a7' }, ticks: { color: '#8b93a7' } },
        y: { title: { display: true, text: 'Elevación (m)', color: '#8b93a7' }, ticks: { color: '#8b93a7' } },
      },
    },
  });
}