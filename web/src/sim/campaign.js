// Persistencia local de la campaña EVA. Los datos quedan guardados en este navegador.
const STORAGE_PREFIX = 'mapa-marciano-campaign-v2';

function keyFor(cfg) {
  // Si el terreno viene de un DEM, la partida guardada es distinta a la del procedural.
  const sourceId = cfg.terrain?.sourceId ? `-${String(cfg.terrain.sourceId).replace(/[^a-zA-Z0-9_-]+/g, '_')}` : '';
  return `${STORAGE_PREFIX}-${cfg.terrain?.seed ?? 'default'}${sourceId}`;
}

export function loadCampaign(cfg) {
  try {
    const raw = localStorage.getItem(keyFor(cfg));
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.bases)) return null;
    return saved;
  } catch (error) {
    console.warn('No se pudo cargar la campaña guardada:', error);
    return null;
  }
}

export function saveCampaign(cfg, state, bases, collectedResourceIds = [], rovers = [], worldSeed = cfg.terrain?.seed, extras = {}) {
  try {
    localStorage.setItem(keyFor(cfg), JSON.stringify({
      version: 2,
      worldSeed,
      savedAt: new Date().toISOString(),
      inventory: state.inventory,
      inventoryUsed: state.inventoryUsed,
      collectedResourceIds,
      customWaypoints: (extras.customWaypoints ?? []).map((wp) => ({ ...wp })),
      radiationKits: extras.radiationKits ?? 0,
      activeWaypointId: extras.activeWaypointId ?? null,
      radiationKitRemainingMin: extras.radiationKitRemainingMin ?? 0,
      discoveredSectors: [...(extras.discoveredSectors ?? [])],
      rovers: rovers.map((rover) => ({
        id: rover.id, type: rover.type, name: rover.name, x: rover.x, y: rover.y,
        battery: rover.battery, capacity: rover.capacity, deployed: Boolean(rover.deployed), cargo: { ...rover.cargo },
      })),
      bases: bases.map((base) => ({
        id: base.id,
        name: base.name,
        x: base.x,
        y: base.y,
        storage: { ...base.storage },
        modules: [...(base.modules ?? [])],
        energy: base.energy ?? 0, energyCapacity: base.energyCapacity ?? 10,
        food: base.food ?? 0, researchPoints: base.researchPoints ?? 0, pendingSamples: base.pendingSamples ?? 0,
        storageCapacity: base.storageCapacity ?? 30, moduleClock: { ...(base.moduleClock ?? {}) },
        kind: base.kind ?? 'outpost',
      })),
    }));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar la campaña:', error);
    return false;
  }
}

export function clearCampaign(cfg) {
  try {
    localStorage.removeItem(keyFor(cfg));
    return true;
  } catch (error) {
    console.warn('No se pudo reiniciar la campaña:', error);
    return false;
  }
}
