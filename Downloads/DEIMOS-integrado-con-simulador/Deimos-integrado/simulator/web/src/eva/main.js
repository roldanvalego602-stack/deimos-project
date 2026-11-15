// Arranque del modo EVA: carga la configuración, crea el HUD y lanza Phaser.
import { createHud } from './hud.js';
import { EvaScene } from './scene.js';
import { loadTerrain } from './terrain.js';
import { adjustMissionPoints } from '../sim/waypoints.js';

// Archivos opcionales: si faltan, el modo EVA funciona igual.
async function fetchOptional(url) {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function boot() {
  const res = await fetch('./public/data/simulation.json');
  if (!res.ok) throw new Error(`No se pudo cargar simulation.json (${res.status})`);
  const cfg = await res.json();

  if (typeof Phaser === 'undefined') {
    throw new Error('Phaser no cargó. Revisa que exista web/vendor/phaser.min.js.');
  }

  // Terreno: DEM real si está activado (y válido); si no, la escena usa el procedural.
  const { terrain, notice: terrainNotice } = await loadTerrain(cfg);
  const notes = terrainNotice ? [terrainNotice] : [];
  if (terrain) {
    cfg.terrain.sourceId = terrain.id; // separa la partida guardada del procedural
    if (terrain.meta?.mission) {
      cfg.mission = { ...cfg.mission, ...terrain.meta.mission };
    } else {
      // Un DEM real no se aplana: si inicio o meta caen en una ladera, se mueven a zona plana.
      const adjusted = adjustMissionPoints(terrain, cfg.mission, cfg.astronaut.maxSlopeDeg);
      cfg.mission = adjusted.mission;
      notes.push(...adjusted.notes);
    }
  }
  const notice = notes.join(' · ');

  // Datos compartidos con el mapa: waypoints, ruta y condiciones de seguridad.
  const [waypoints, route, safety] = await Promise.all([
    fetchOptional('./public/data/waypoints.json'),
    fetchOptional('./public/data/route.geojson'),
    fetchOptional('./public/data/safety.json'),
  ]);
  let safetyText = 'Condiciones: valores de simulation.json';
  if (safety && cfg.safetyLink?.enabled !== false) {
    const metric = (id) => safety.metrics?.find((m) => m.id === id);
    const radiation = metric('radiation');
    const temperature = metric('temperature');
    if (cfg.radiation?.enabled && radiation && Number.isFinite(radiation.value)) cfg.radiation.baselineMSvPerDay = radiation.value;
    if (temperature && Number.isFinite(temperature.value)) cfg.ambient.baseC = temperature.value;
    safetyText = `Condiciones desde safety.json${safety.mock ? ' (datos de prueba)' : ''}: ${radiation ? `${radiation.value} ${radiation.unit}` : '—'} · ${temperature ? `${temperature.value} ${temperature.unit}` : '—'} · estado ${safety.status ?? '—'}`;
  }

  const hud = createHud(cfg);
  hud.setSource(terrain?.source ?? { kind: 'procedural', label: 'Procedural (datos de prueba)', detail: 'relieve aleatorio por campaña' }, notice);
  hud.setSafety(safetyText);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: '100%',
    height: '100%',
    backgroundColor: '#120d0b',
    scale: { mode: Phaser.Scale.RESIZE },
  });
  game.registry.set('cfg', cfg);
  game.registry.set('hud', hud);
  game.registry.set('externalTerrain', terrain);
  game.registry.set('waypoints', waypoints);
  game.registry.set('route', route);
  game.scene.add('eva', EvaScene, true);

  hud.onRestart(() => game.scene.getScene('eva').scene.restart());
  // Suspend the game loop while the parent switches to another module.
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'deimos:eva-visible') return;
    if (event.data.visible) game.loop.wake(); else game.loop.sleep();
  });
  if (window.parent !== window && window.parent.DEIMOS?.getCurrentView() !== 'survival-simulator') game.loop.sleep();
}

boot().catch((err) => {
  console.error(err);
  const box = document.getElementById('error');
  box.hidden = false;
  box.textContent = err.message;
});
