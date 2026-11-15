import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateTerrain } from '../web/src/eva/terrain.js';
import { findRoute, nearestFlat } from '../web/src/sim/pathfinding.js';
import { createState, step } from '../web/src/sim/engine.js';
import { saveCampaign, loadCampaign, clearCampaign } from '../web/src/sim/campaign.js';
import { removeCustomWaypointById } from '../web/src/sim/waypoints.js';
import { spriteRotationForHeading } from '../web/src/eva/visuals.js';
import { processBaseModules } from '../web/src/sim/baseSystems.js';
import { depositInventory } from '../web/src/sim/engine.js';

const cfg = JSON.parse(fs.readFileSync(new URL('../web/public/data/simulation.json', import.meta.url), 'utf8'));
const terrainCfg = { ...cfg.terrain, size: 96, cellPx: 8, featureCount: 10, seed: 4567 };
const a = generateTerrain(terrainCfg);
const b = generateTerrain(terrainCfg);
assert.deepEqual([...a.heights], [...b.heights], 'same seed must reproduce elevation');
assert.deepEqual(a.features, b.features, 'same seed must reproduce landforms');
const c = generateTerrain({ ...terrainCfg, seed: 4568 });
assert.notDeepEqual([...a.heights], [...c.heights], 'different seed must change terrain');

const start = nearestFlat(a, 20, 20, cfg.astronaut.maxSlopeDeg * 0.9, 20);
const goal = nearestFlat(a, 23, 23, cfg.astronaut.maxSlopeDeg * 0.9, 20);
assert.ok(start && goal, 'safe start and goal cells exist');
const route = findRoute(a, cfg, start, goal);
assert.equal(route.found, true, 'A* should find a traversable route between safe points');
assert.ok(route.cells.length > 1);
assert.ok(route.cells.every((cell) => a.slopes[cell.row * a.size + cell.col] <= cfg.astronaut.maxSlopeDeg), 'A* route stays within the slope limit');

// El frente de los gráficos locales apunta hacia -Y; verifica que el giro XY alinee la proa con el movimiento.
for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 2.2]) {
  const rotation = spriteRotationForHeading(heading);
  const forward = { x: Math.sin(rotation), y: -Math.cos(rotation) };
  assert.ok(Math.abs(forward.x - Math.cos(heading)) < 1e-9);
  assert.ok(Math.abs(forward.y - Math.sin(heading)) < 1e-9);
}

// Los módulos de base producen y procesan recursos usando minutos simulados.
const operationalBase = {
  modules: ['generator', 'battery', 'greenhouse', 'lab', 'warehouse'],
  storage: { ice: 2, regolith: 0, metal: 0 }, energy: 0, energyCapacity: 50,
  food: 0, researchPoints: 0, pendingSamples: 1, storageCapacity: 80, moduleClock: {},
};
processBaseModules([operationalBase], 30);
assert.equal(operationalBase.energy, 2, 'generator produces energy and the lab consumes one unit to process a sample');
assert.equal(operationalBase.researchPoints, 100, 'lab processes a sample after thirty simulated minutes');
assert.equal(operationalBase.pendingSamples, 0);
processBaseModules([operationalBase], 240);
assert.equal(operationalBase.food, 8, 'greenhouse consumes ice and one energy unit per 120-minute production cycle');
assert.equal(operationalBase.storage.ice, 0);
const storageState = { inventory: { ice: 4, regolith: 0, metal: 0 }, inventoryUsed: 4 };
const depositResult = depositInventory(storageState, { name: 'Almacén de prueba', storage: { ice: 78, regolith: 0, metal: 0 }, storageCapacity: 80 });
assert.equal(depositResult.ok, true);
assert.equal(storageState.inventory.ice, 2, 'warehouse capacity limits deposit and keeps overflow in the backpack');

const state = createState(cfg);
assert.equal('difficulty' in state, false, 'mission state has no difficulty selector/state');
assert.equal(cfg.mission.start[0], 0.5, 'main base starts at the center of the procedural world');
assert.equal(cfg.mission.start[1], 0.5, 'main base starts at the center of the procedural world');
assert.equal(cfg.difficulty, undefined, 'difficulty presets are removed from mission configuration');
const oxygenBefore = state.oxygen;
step(state, cfg, 1, { moving: true, slopeDeg: 5, radiationShield: 0.5 });
assert.ok(state.oxygen < oxygenBefore, 'movement consumes oxygen');
assert.ok(state.timeMin === 1, 'simulation clock advances');

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, v),
  removeItem: (k) => memory.delete(k),
};
const campaignCfg = { ...cfg, terrain: { ...cfg.terrain, seed: 123456, sourceId: 'smoke-test' } };
const bases = [{ id: 'b1', name: 'Base', x: 10, y: 10, kind: 'main', storage: { ice: 2, regolith: 3, metal: 1 }, modules: ['lab', 'greenhouse'], energy: 7, energyCapacity: 50, food: 4, researchPoints: 100, pendingSamples: 1, storageCapacity: 80, moduleClock: { generator: 3 } }];
const customWaypoints = [{ id: 'wp1', name: 'Prueba', x: 20, y: 30, col: 2, row: 3, done: true }];
assert.equal(saveCampaign(campaignCfg, state, bases, [1, 2], [], 987, { customWaypoints, radiationKits: 2, activeWaypointId: 'wp1', radiationKitRemainingMin: 45, discoveredSectors: ['4:5', '5:5'] }), true);
const saved = loadCampaign(campaignCfg);
assert.equal(saved.worldSeed, 987);
assert.deepEqual(saved.customWaypoints, customWaypoints);
assert.equal(saved.radiationKits, 2);
assert.equal(saved.activeWaypointId, 'wp1');
assert.equal(saved.radiationKitRemainingMin, 45);
assert.deepEqual(saved.discoveredSectors, ['4:5', '5:5']);
assert.deepEqual(saved.bases[0].modules, ['lab', 'greenhouse']);
assert.equal(saved.bases[0].energy, 7);
assert.equal(saved.bases[0].food, 4);
assert.equal(saved.bases[0].researchPoints, 100);
assert.equal(saved.bases[0].pendingSamples, 1);
assert.equal(saved.bases[0].storageCapacity, 80);
assert.deepEqual(saved.bases[0].moduleClock, { generator: 3 });
assert.deepEqual(removeCustomWaypointById(customWaypoints, 'wp1'), [], 'manual waypoint deletion works even after sampling');
assert.deepEqual(removeCustomWaypointById(customWaypoints, 'missing'), customWaypoints, 'unknown waypoint ID leaves the list unchanged');
assert.equal(clearCampaign(campaignCfg), true);
assert.equal(loadCampaign(campaignCfg), null);

console.log('OK: terreno determinista, ruta A*, orientación 2D, waypoints, módulos operativos (energía, alimento, laboratorio y almacén) y persistencia de campaña.');
