// Escena principal del modo EVA (Phaser 3, vista de arriba).
// Phaser se carga desde web/vendor/ en eva.html, por eso aquí se usa como global.
import { createState, step, speedFactor, ambientC, radiationShield, collectResource, depositInventory, withdrawInventory, buildOutpost, buildRover, collectRoverResource, unloadRover } from '../sim/engine.js';
import { loadCampaign, saveCampaign, clearCampaign } from '../sim/campaign.js';
import { getTerrain, renderTerrainCanvas } from './terrain.js';
import { createEventTimeline, getEventStatus, eventAlert, NO_EFFECTS } from '../sim/events.js';
import { findRoute } from '../sim/pathfinding.js';
import { mapWaypointsToGrid, removeCustomWaypointById as filterCustomWaypoints } from '../sim/waypoints.js';
import { spriteRotationForHeading } from './visuals.js';
import { processBaseModules } from '../sim/baseSystems.js';

const BASE_MODULES = [
  { id: 'lab', name: 'Laboratorio', cost: { metal: 2, regolith: 2 }, color: 0x78b7c8, effect: 'Convierte muestras en puntos de investigación.' },
  { id: 'greenhouse', name: 'Invernadero', cost: { ice: 2, metal: 1 }, color: 0x75a96b, effect: 'Consume hielo y produce alimento.' },
  { id: 'generator', name: 'Generador', cost: { metal: 3 }, color: 0xd6a64e, effect: 'Produce energía para la base.' },
  { id: 'battery', name: 'Baterías', cost: { metal: 2, regolith: 1 }, color: 0x9b9fa5, effect: 'Amplía el almacenamiento de energía.' },
  { id: 'warehouse', name: 'Almacén', cost: { regolith: 3, metal: 1 }, color: 0xb58d65, effect: 'Amplía la capacidad de recursos de la base.' },
  { id: 'hangar', name: 'Hangar', cost: { metal: 3, regolith: 2 }, color: 0x8797a6, effect: 'Acelera la recarga de rovers estacionados.' },
  { id: 'rad_shelter', name: 'Refugio RAD', cost: { regolith: 4, metal: 2 }, color: 0x7f91b5, effect: 'Mejora el blindaje radiológico dentro de la base.' },
];

export class EvaScene extends Phaser.Scene {
  constructor() {
    super('eva');
  }

  create() {
    this.cfg = this.registry.get('cfg');
    this.hud = this.registry.get('hud');
    const t = this.cfg.terrain;

    const saved = loadCampaign(this.cfg);
    this.worldSeed = saved?.worldSeed ?? Math.floor(Math.random() * 0x7fffffff);
    // DEM real si main.js lo cargó; si no, terreno procedural reproducible.
    this.terrain = this.registry.get('externalTerrain') ?? getTerrain({ ...t, seed: this.worldSeed, missionStart: this.cfg.mission.start });
    this.cellPx = this.terrain.cellPx ?? t.cellPx;
    this.worldPx = this.terrain.size * this.cellPx;
    this.radiationMultiplier = 1; // lo fijan los eventos ambientales (applyEvents)
    this.paused = false;
    this.finished = false;
    this.state = createState(this.cfg);
    if (saved?.inventory) {
      this.state.inventory = { ...this.state.inventory, ...saved.inventory };
      this.state.inventoryUsed = Object.values(this.state.inventory).reduce((sum, n) => sum + n, 0);
    }
    this.extra = { ambientC: 0, slopeDeg: 0, homeDistM: 0, blocked: false, paused: false, interaction: '', notice: '' };
    this.hud.hideEnd();

    // El relieve se rasteriza una vez y se presenta en bloques a medida que se explora.
    this.terrainCanvas = renderTerrainCanvas(this.terrain, this.cfg);
    this.terrainChunks = new Map();

    // Despliegue central de la base principal
    const m = this.cfg.mission;
    this.start = { x: m.start[0] * this.worldPx, y: m.start[1] * this.worldPx };

    this.collectedResourceIds = new Set(saved?.collectedResourceIds ?? []);
    this.bases = (saved?.bases?.length ? saved.bases : [{
      id: 'base-1', name: 'Base principal', x: this.start.x, y: this.start.y,
      storage: { ...(this.cfg.bases?.initialStorage ?? { ice: 2, regolith: 4, metal: 3 }) }, modules: [], energy: 0, food: 0, researchPoints: 0, moduleClock: {}, kind: 'main'
    }]).map((base) => ({ ...base, storage: { ...(base.storage ?? {}) } }));
    this.baseVisuals = [];
    this.bases.forEach((base) => this.createBaseVisual(base));
    // Una campaña nueva comienza sin vehículos. Los rovers guardados quedan en el hangar al iniciar;
    // el usuario decide cuándo desplegarlos con V.
    this.rovers = Array.isArray(saved?.rovers) ? saved.rovers.map((rover) => ({ ...rover, deployed: false, cargo: { ...(rover.cargo ?? {}) } })) : [];
    this.roverVisuals = new Map();
    this.drivingRoverId = null;
    this.selectedRoverType = 'explorer';
    this.customWaypoints = (saved?.customWaypoints ?? []).map((wp) => ({ ...wp }));
    this.discoveredSectors = new Set(saved?.discoveredSectors ?? []);
    this.selectedBaseModule = 0;
    this.radiationKits = saved?.radiationKits ?? 0;
    this.radiationKitUntilMin = saved?.radiationKitRemainingMin ?? 0;
    this.activeWaypointId = saved?.activeWaypointId ?? null;
    this.persistCampaign();

    // Eventos ambientales, ruta sugerida (P) y sitios de muestreo científico
    this.events = createEventTimeline(this.cfg, this.worldSeed);
    this.lastWarnId = null;
    this.ambientDelta = 0;
    this.eventEffects = { ...NO_EFFECTS };
    this.routeGraphics = this.add.graphics().setDepth(4);
    this.showRoute = false;
    this.routeCell = null;
    this.routeTimer = 0;
    this.setupScience();
    this.applyEvents();

    // Recursos distribuidos de forma determinista sobre el terreno.
    this.resources = [];
    this.spawnResources();

    // Astronauta EVA: traje presurizado, mochila PLSS, casco y visor en capas.
    this.player = this.add.container(this.start.x, this.start.y).setDepth(10);
    this.updateTerrainChunks(this.player.x, this.player.y);
    this.sectorOverlay = this.add.graphics().setDepth(3);
    this.updateExploration(this.player.x, this.player.y, true);
    const suit = this.add.graphics();
    suit.fillStyle(0xe8e5dc, 1); suit.fillRoundedRect(-4.5, -5, 9, 11, 3);
    suit.fillStyle(0xb7c1c8, 1); suit.fillRoundedRect(-7, -2.5, 4, 7, 1.5);
    suit.fillStyle(0x87949c, 1); suit.fillRoundedRect(3, -2.5, 4, 7, 1.5);
    suit.fillStyle(0x283a49, 1); suit.fillRoundedRect(-3.5, -8, 7, 6, 3);
    suit.lineStyle(1, 0xf5f0df, 0.95); suit.strokeRoundedRect(-3.5, -8, 7, 6, 3);
    suit.fillStyle(0x4b9db6, 1); suit.fillRoundedRect(-2.5, -6.5, 5, 3.2, 1.5);
    suit.fillStyle(0x65727b, 1); suit.fillRoundedRect(-2.5, 3.5, 5, 4, 1);
    suit.lineStyle(1, 0xff6b3d, 0.95); suit.strokeCircle(0, 0, 8);
    this.player.add(suit); this.visor = suit;

    // Cámara: sigue al astronauta, zoom con la rueda del mouse
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldPx, this.worldPx);
    cam.setZoom(1.45);
    cam.setDeadzone(0, 0);
    cam.startFollow(this.player, true, 0.1, 0.1);
    this.input.on('wheel', (_pointer, _objs, _dx, dy) => {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.55, 3.2));
      const followed = this.getDrivingRover() ?? this.player;
      cam.centerOn(followed.x, followed.y);
    });
    this.waypointPlacement = false;
    this.input.on('pointerdown', (pointer) => {
      if (!this.waypointPlacement || this.finished || this.paused || this.drivingRoverId) return;
      const world = cam.getWorldPoint(pointer.x, pointer.y);
      this.addCustomWaypoint(world.x, world.y);
      this.waypointPlacement = false;
      this.setNotice('Waypoint guardado. Presiona P para trazar la ruta.');
    });

    // Teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R,N,SPACE,E,Q,B,V,F,ONE,TWO,P,M,C,H,T,Y,DELETE,BACKSPACE');
  }

  // Materializa visualmente el terreno en bloques de 64×64 celdas alrededor del explorador.
  // La topografía usa una semilla fija de campaña, por lo que los bloques mantienen continuidad al volver.
  updateTerrainChunks(px, py) {
    const chunkCells = 64;
    const chunks = Math.ceil(this.terrain.size / chunkCells);
    const cx = Math.floor(px / (chunkCells * this.cellPx));
    const cy = Math.floor(py / (chunkCells * this.cellPx));
    for (let y = Math.max(0, cy - 1); y <= Math.min(chunks - 1, cy + 1); y++) {
      for (let x = Math.max(0, cx - 1); x <= Math.min(chunks - 1, cx + 1); x++) {
        const key = `${x}:${y}`;
        if (this.terrainChunks.has(key)) continue;
        const sx = x * chunkCells, sy = y * chunkCells;
        const w = Math.min(chunkCells, this.terrain.size - sx);
        const h = Math.min(chunkCells, this.terrain.size - sy);
        const canvas = document.createElement('canvas');
        canvas.width = w * this.cellPx; canvas.height = h * this.cellPx;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.terrainCanvas, sx * this.cellPx, sy * this.cellPx, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        const textureKey = `terrain-${this.worldSeed}-${x}-${y}`;
        if (!this.textures.exists(textureKey)) this.textures.addCanvas(textureKey, canvas);
        const image = this.add.image(sx * this.cellPx, sy * this.cellPx, textureKey).setOrigin(0, 0).setDepth(0);
        this.terrainChunks.set(key, image);
      }
    }
  }

  createBaseVisual(base) {
    const isMain = base.kind === 'main';
    const root = this.add.container(base.x, base.y).setDepth(5);
    const g = this.add.graphics();
    // Hábitat cilíndrico presurizado con esclusa, patas, paneles y antena.
    g.fillStyle(0x252d35, 1); g.fillRoundedRect(-16, -8, 32, 16, 5);
    g.fillStyle(isMain ? 0xc7d0d4 : 0xb9c2c7, 1); g.fillRoundedRect(-12, -7, 24, 14, 4);
    g.fillStyle(0x526b78, 1); g.fillRoundedRect(-8, -5, 16, 10, 3);
    g.fillStyle(0x91c8d8, 0.9); g.fillRoundedRect(-6, -4, 12, 8, 2);
    g.fillStyle(0x59636b, 1); g.fillRoundedRect(-4, 7, 8, 4, 1);
    g.lineStyle(2, 0x737f86, 1); g.lineBetween(-13, 8, -17, 13); g.lineBetween(13, 8, 17, 13);
    g.lineStyle(1.5, 0xd5e1e4, 1); g.lineBetween(0, -8, 0, -16); g.strokeCircle(0, -17, 3);
    // Panel solar articulado y soporte.
    g.fillStyle(0x183d59, 1); g.fillRect(17, -7, 15, 10); g.lineStyle(1, 0x83b9d0, 1);
    g.strokeRect(17, -7, 15, 10); g.lineBetween(22, -7, 22, 3); g.lineBetween(27, -7, 27, 3);
    g.lineStyle(2, isMain ? 0x8bd5ff : 0x3ddc84, 1); g.strokeRoundedRect(-17, -10, 51, 27, 4);
    // Los módulos instalados se representan como unidades presurizadas anexas al hábitat.
    const moduleDefs = new Map(BASE_MODULES.map((m) => [m.id, m]));
    (base.modules ?? []).forEach((moduleId, index) => {
      const def = moduleDefs.get(moduleId);
      if (!def) return;
      const col = index % 3, row = Math.floor(index / 3);
      const x = -14 + col * 14, y = 19 + row * 11;
      g.fillStyle(0x202a32, 1); g.fillRoundedRect(x - 5, y - 4, 10, 8, 1.5);
      g.fillStyle(def.color, 1); g.fillRoundedRect(x - 4, y - 3, 8, 6, 1);
      g.lineStyle(0.8, 0xe2e8eb, 0.9); g.strokeRoundedRect(x - 5, y - 4, 10, 8, 1.5);
      g.fillStyle(0x8bc5d6, 0.9); g.fillRect(x - 2, y - 1, 4, 2);
    });
    root.add(g);
    const label = this.add.text(base.x + 21, base.y - 22, base.name, {
      fontSize: '12px', color: '#ffffff', stroke: '#24140f', strokeThickness: 3
    }).setDepth(6);
    const charger = this.add.text(base.x + 18, base.y + 8, '⚡', { fontSize: '10px', color: '#ffe28a' }).setDepth(7);
    const moduleLabel = this.add.text(base.x + 20, base.y + 25, `${(base.modules ?? []).length} módulos`, { fontSize: '9px', color: '#d5e1e4', stroke: '#202a32', strokeThickness: 2 }).setDepth(7);
    this.baseVisuals.push({ id: base.id, root, label, charger, moduleLabel });
  }

  installBaseModule() {
    const base = this.findNearbyBase();
    if (!base) { this.setNotice('Acércate a una base para instalar un módulo.'); return; }
    base.modules ??= [];
    const def = BASE_MODULES[this.selectedBaseModule % BASE_MODULES.length];
    if (base.modules.includes(def.id)) { this.setNotice(`${def.name} ya está instalado en ${base.name}.`); return; }
    const missing = Object.entries(def.cost).filter(([id, amount]) => (base.storage?.[id] ?? 0) < amount);
    if (missing.length) {
      this.setNotice(`Faltan materiales para ${def.name}: ${missing.map(([id, n]) => `${n - (base.storage?.[id] ?? 0)} ${id}`).join(', ')}.`);
      return;
    }
    for (const [id, amount] of Object.entries(def.cost)) base.storage[id] -= amount;
    base.modules.push(def.id);
    base.moduleClock ??= {};
    if (def.id === 'warehouse') base.storageCapacity = 80;
    if (def.id === 'battery') base.energyCapacity = 50;
    if (def.id === 'lab') base.pendingSamples = base.pendingSamples ?? 0;
    const visual = this.baseVisuals.find((item) => item.id === base.id);
    if (visual) {
      visual.root.destroy(); visual.label.destroy(); visual.charger.destroy(); visual.moduleLabel.destroy();
      this.baseVisuals = this.baseVisuals.filter((item) => item.id !== base.id);
      this.createBaseVisual(base);
    }
    this.persistCampaign();
    this.setNotice(`${def.name} instalado. ${def.effect}`);
  }

  cycleBaseModule() {
    this.selectedBaseModule = (this.selectedBaseModule + 1) % BASE_MODULES.length;
    const def = BASE_MODULES[this.selectedBaseModule];
    const cost = Object.entries(def.cost).map(([id, n]) => `${n} ${id}`).join(' + ');
    this.setNotice(`Módulo seleccionado: ${def.name} · ${cost} · ${def.effect} · Y para instalar.`);
  }

  findNearbyBase() {
    const radiusPx = (this.cfg.bases?.interactionRadiusM ?? 18) / this.terrain.cellSizeM * this.cellPx;
    let nearest = null;
    let nearestDist = radiusPx;
    for (const base of this.bases) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, base.x, base.y);
      if (dist <= nearestDist) { nearest = base; nearestDist = dist; }
    }
    return nearest;
  }

  updateExploration(px, py, force = false) {
    const sectorsPerSide = 24;
    const sectorCells = this.terrain.size / sectorsPerSide;
    const col = Phaser.Math.Clamp(Math.floor((px / this.cellPx) / sectorCells), 0, sectorsPerSide - 1);
    const row = Phaser.Math.Clamp(Math.floor((py / this.cellPx) / sectorCells), 0, sectorsPerSide - 1);
    let changed = false;
    // Se revela el sector actual y sus vecinos inmediatos, como cobertura de reconocimiento.
    for (let sy = Math.max(0, row - 1); sy <= Math.min(sectorsPerSide - 1, row + 1); sy++) {
      for (let sx = Math.max(0, col - 1); sx <= Math.min(sectorsPerSide - 1, col + 1); sx++) {
        const key = `${sx}:${sy}`;
        if (!this.discoveredSectors.has(key)) { this.discoveredSectors.add(key); changed = true; }
      }
    }
    if (changed || force) {
      const g = this.sectorOverlay;
      g.clear();
      const sectorPx = this.worldPx / sectorsPerSide;
      for (let sy = 0; sy < sectorsPerSide; sy++) for (let sx = 0; sx < sectorsPerSide; sx++) {
        if (this.discoveredSectors.has(`${sx}:${sy}`)) continue;
        g.fillStyle(0x080d12, 0.68);
        g.fillRect(sx * sectorPx, sy * sectorPx, sectorPx + 1, sectorPx + 1);
        g.lineStyle(1, 0x9aa8b2, 0.12);
        g.strokeRect(sx * sectorPx, sy * sectorPx, sectorPx, sectorPx);
      }
      if (changed && this.player) this.persistCampaign();
    }
    this.extra.discoveredSectorCount = this.discoveredSectors.size;
  }

  clearCustomWaypoints() {
    for (const mark of this.waypointMarks ?? []) {
      if (!mark.custom) continue;
      mark.marker.destroy(); mark.label.destroy();
    }
    this.waypointMarks = (this.waypointMarks ?? []).filter((mark) => !mark.custom);
    this.customWaypoints = [];
    this.activeWaypointId = null;
    this.routeCell = null;
    this.routeGraphics?.clear();
    this.persistCampaign();
  }

  persistCampaign() {
    saveCampaign(this.cfg, this.state, this.bases, [...(this.collectedResourceIds ?? [])], this.rovers ?? [], this.worldSeed, { customWaypoints: this.customWaypoints ?? [], radiationKits: this.radiationKits ?? 0, activeWaypointId: this.activeWaypointId ?? null, radiationKitRemainingMin: Math.max(0, (this.radiationKitUntilMin ?? 0) - (this.state.timeMin ?? 0)), discoveredSectors: [...(this.discoveredSectors ?? [])] });
  }

  processBaseModules(dtMin) { processBaseModules(this.bases, dtMin); }

  recoverOxygenAtBase(x, y, dtMin) {
    const sheltered = Boolean(this.findNearbyBaseAt(x, y));
    if (sheltered) {
      const maxOxygen = this.cfg.astronaut.oxygenMinutes;
      const rate = this.cfg.bases?.oxygenRechargePerMin ?? 12;
      this.state.oxygen = Math.min(maxOxygen, this.state.oxygen + rate * dtMin);
    }
    return sheltered;
  }

  buildNewBase() {
    const minDistance = (this.cfg.bases?.minimumDistanceM ?? 180) / this.terrain.cellSizeM * this.cellPx;
    const tooClose = this.bases.some((base) => Phaser.Math.Distance.Between(this.player.x, this.player.y, base.x, base.y) < minDistance);
    if (tooClose) {
      this.setNotice('Busca una zona más alejada de las bases existentes para construir.');
      return;
    }
    if (this.slopeAt(this.player.x, this.player.y) > (this.cfg.bases?.maxBuildSlopeDeg ?? 12)) {
      this.setNotice('Terreno demasiado inclinado para construir una base.');
      return;
    }
    const result = buildOutpost(this.state, this.cfg);
    if (!result.ok) { this.setNotice(result.message); return; }
    const base = {
      id: `base-${Date.now()}`,
      name: `Puesto ${this.bases.length}`,
      x: this.player.x,
      y: this.player.y,
      storage: { ice: 0, regolith: 0, metal: 0 },
      modules: [], energy: 0, food: 0, researchPoints: 0, pendingSamples: 0, storageCapacity: 30, energyCapacity: 10, moduleClock: {},
      kind: 'outpost',
    };
    this.bases.push(base);
    this.createBaseVisual(base);
    this.persistCampaign();
    this.setNotice(result.message);
  }

  createRoverVisual(rover) {
    const root = this.add.container(rover.x, rover.y).setDepth(9);
    const g = this.add.graphics();
    const cargo = rover.type === 'cargo';
    // Chasis metálico, seis ruedas, suspensión, cámara mastil y panel solar.
    for (const x of [-9, 0, 9]) for (const side of [-1, 1]) {
      const wx = x, wy = side * 6.5;
      g.fillStyle(0x171b20, 1); g.fillRoundedRect(wx - 2.4, wy - 2.1, 4.8, 4.2, 1.4);
      g.lineStyle(0.8, 0x8a9297, 1); g.strokeRoundedRect(wx - 2.4, wy - 2.1, 4.8, 4.2, 1.4);
      g.lineStyle(1, 0xb7a78d, 1); g.lineBetween(wx, wy * 0.68, wx, wy * 0.22);
    }
    g.fillStyle(0x4b5359, 1); g.fillRoundedRect(-11, -5, 22, 10, 2);
    g.fillStyle(cargo ? 0xc6a46d : 0xc4cbd0, 1); g.fillRoundedRect(-8, -4, 16, 8, 1.5);
    g.fillStyle(0x586c78, 1); g.fillRoundedRect(-5, -3, 10, 6, 1);
    g.fillStyle(0x27343d, 1); g.fillRect(-3, -11, 6, 5);
    g.lineStyle(1.4, 0xd8dfe1, 1); g.lineBetween(0, -5, 0, -13); g.strokeCircle(0, -14, 2);
    g.fillStyle(0x173d58, 1); g.fillRect(7, -10, 9, 5); g.lineStyle(0.8, 0x8dbbd0, 1); g.strokeRect(7, -10, 9, 5);
    if (cargo) { g.fillStyle(0x9b835f, 1); g.fillRoundedRect(-5, -3, 10, 6, 1); }
    g.lineStyle(1.2, 0x252a2e, 1); g.strokeRoundedRect(-12, -7, 24, 14, 3);
    root.add(g);
    const label = this.add.text(rover.x + 15, rover.y - 16, `${rover.name} · ${Math.round(rover.battery)}%`, {
      fontSize: '10px', color: '#ffffff', stroke: '#24140f', strokeThickness: 3,
    }).setDepth(10);
    this.roverVisuals.set(rover.id, { root, label });
  }

  updateRoverVisual(rover) {
    const visual = this.roverVisuals.get(rover.id);
    if (!visual) return;
    visual.root.setPosition(rover.x, rover.y);
    visual.root.setRotation(spriteRotationForHeading(rover.heading ?? 0));
    visual.label.setPosition(rover.x + 15, rover.y - 16);
    visual.label.setText(`${rover.name} · ${Math.round(rover.battery)}%`);
  }

  findNearbyBaseAt(x, y) {
    const radiusPx = (this.cfg.bases?.shelterRadiusM ?? 28) / this.terrain.cellSizeM * this.cellPx;
    let nearest = null;
    let nearestDist = radiusPx;
    for (const base of this.bases) {
      const dist = Phaser.Math.Distance.Between(x, y, base.x, base.y);
      if (dist <= nearestDist) { nearest = base; nearestDist = dist; }
    }
    return nearest;
  }

  getRoverSpawnPosition(base, type, ignoreRoverId = null, anchor = this.player ?? this.start) {
    // La base ocupa 22 px y el rover unos 18 px: dejamos 27 px entre centros.
    // Primero intentamos desplegarlo del lado donde está el astronauta.
    const preferred = Math.atan2(anchor.y - base.y, anchor.x - base.x);
    const offsets = [preferred, preferred + Math.PI / 4, preferred - Math.PI / 4,
      preferred + Math.PI / 2, preferred - Math.PI / 2, preferred + Math.PI,
      preferred + 3 * Math.PI / 4, preferred - 3 * Math.PI / 4];
    const baseClearance = 26;
    const roverClearance = 23;
    const slopeLimit = this.cfg.astronaut.maxSlopeDeg + (this.cfg.rovers?.types?.[type]?.slopeBonusDeg ?? 8);

    for (const radius of [27, 30, 33]) {
      for (const angle of offsets) {
        const x = base.x + Math.cos(angle) * radius;
        const y = base.y + Math.sin(angle) * radius;
        if (x < 12 || y < 12 || x > this.worldPx - 12 || y > this.worldPx - 12) continue;
        if (this.slopeAt(x, y) > slopeLimit) continue;
        if (this.bases.some((other) => Phaser.Math.Distance.Between(x, y, other.x, other.y) < baseClearance)) continue;
        if (this.rovers.some((other) => other.deployed && other.id !== ignoreRoverId && Phaser.Math.Distance.Between(x, y, other.x, other.y) < roverClearance)) continue;
        return { x, y };
      }
    }
    return null;
  }

  findNearbyRover() {
    const radius = (this.cfg.rovers?.boardingRadiusM ?? 60) / this.terrain.cellSizeM * this.cellPx;
    return this.rovers.filter((rover) => rover.deployed).map((rover) => ({ rover, dist: Phaser.Math.Distance.Between(this.player.x, this.player.y, rover.x, rover.y) }))
      .filter((entry) => entry.dist <= radius).sort((a, b) => a.dist - b.dist)[0]?.rover ?? null;
  }

  deployRover() {
    const base = this.findNearbyBase();
    if (!base) { this.setNotice('Acércate a una base para desplegar un rover.'); return; }
    const spawn = this.getRoverSpawnPosition(base, this.selectedRoverType);
    if (!spawn) { this.setNotice('No hay espacio seguro alrededor de la base para desplegar el rover.'); return; }
    const stored = this.rovers.find((rover) => rover.type === this.selectedRoverType && !rover.deployed);
    let rover;
    let message;
    if (stored) {
      rover = stored;
      rover.x = spawn.x; rover.y = spawn.y; rover.deployed = true;
      message = `${rover.name} retirado del hangar y desplegado`;
    } else {
      const result = buildRover(base, this.selectedRoverType, this.cfg);
      if (!result.ok) { this.setNotice(result.message); return; }
      const spec = result.spec;
      rover = {
        id: `rover-${Date.now()}`, type: this.selectedRoverType, name: spec.label,
        x: spawn.x, y: spawn.y, deployed: true,
        battery: spec.battery ?? 100, capacity: spec.capacity ?? 6,
        cargo: Object.fromEntries((this.cfg.resources?.types ?? []).map((item) => [item.id, 0])),
      };
      this.rovers.push(rover);
      message = result.message;
    }
    this.createRoverVisual(rover);
    this.persistCampaign();
    this.setNotice(`${message}. Está estacionado fuera de la base; acércate y presiona F para subir.`);
  }

  toggleRover() {
    if (this.drivingRoverId) {
      const rover = this.getDrivingRover();
      if (rover) {
        // Bajar junto al rover, buscando un punto transitable y libre.
        const heading = rover.heading ?? 0;
        const angles = [heading + Math.PI / 2, heading - Math.PI / 2, heading + Math.PI,
          heading, heading + Math.PI / 4, heading - Math.PI / 4, heading + 3 * Math.PI / 4, heading - 3 * Math.PI / 4];
        let exit = null;
        for (const radius of [16, 20, 24]) {
          for (const angle of angles) {
            const x = Phaser.Math.Clamp(rover.x + Math.cos(angle) * radius, 8, this.worldPx - 8);
            const y = Phaser.Math.Clamp(rover.y + Math.sin(angle) * radius, 8, this.worldPx - 8);
            if (this.slopeAt(x, y) > this.cfg.astronaut.maxSlopeDeg + 8) continue;
            if (this.bases.some((base) => Phaser.Math.Distance.Between(x, y, base.x, base.y) < 12)) continue;
            exit = { x, y }; break;
          }
          if (exit) break;
        }
        exit ??= { x: rover.x + 12, y: rover.y + 12 };
        this.player.setPosition(exit.x, exit.y).setScale(1).setDepth(10).setVisible(true);
        this.visor.setVisible(true);
      }
      this.drivingRoverId = null;
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.persistCampaign();
      this.setNotice('Has salido del rover.');
      return;
    }
    const rover = this.findNearbyRover();
    if (!rover) { this.setNotice('Acércate a un rover; aparecerá el aviso para subir.'); return; }
    if (rover.battery <= 0) { this.setNotice('El rover no tiene batería. Llévalo a una base para recargarlo.'); return; }
    this.drivingRoverId = rover.id;
    this.player.setPosition(rover.x, rover.y).setScale(0.72).setDepth(12).setVisible(false);
    this.visor.setVisible(true);
    this.cameras.main.startFollow(this.roverVisuals.get(rover.id).root, true, 0.12, 0.12);
    this.setNotice(`Conduciendo ${rover.name}. Presiona F para salir.`);
  }

  getDrivingRover() { return this.rovers.find((rover) => rover.id === this.drivingRoverId) ?? null; }

  roverInteract() {
    const rover = this.getDrivingRover();
    if (!rover) return;
    const base = this.findNearbyBaseAt(rover.x, rover.y);
    if (base) {
      const result = unloadRover(rover, base);
      this.setNotice(result.message);
      if (result.ok) this.persistCampaign();
      return;
    }
    const resource = this.findNearbyResourceAt(rover.x, rover.y);
    if (!resource) { this.setNotice('No hay recursos ni bases al alcance del rover.'); return; }
    const result = collectRoverResource(rover, resource.data);
    this.setNotice(result.message);
    if (result.ok) {
      resource.collected = true;
      this.collectedResourceIds.add(resource.id);
      resource.marker.destroy(); resource.label.destroy();
      this.persistCampaign();
    }
  }

  findNearbyResourceAt(x, y) {
    const radiusPx = ((this.cfg.resources?.interactionRadiusM ?? 10) / this.terrain.cellSizeM) * this.cellPx;
    let nearest = null, nearestDist = radiusPx;
    for (const resource of this.resources) {
      if (resource.collected) continue;
      const dist = Phaser.Math.Distance.Between(x, y, resource.x, resource.y);
      if (dist <= nearestDist) { nearest = resource; nearestDist = dist; }
    }
    return nearest;
  }

  driveRover(delta) {
    const rover = this.getDrivingRover();
    if (!rover) { this.drivingRoverId = null; return; }
    const k = this.keys, c = this.cursors;
    const dx = (c.right.isDown || k.D.isDown ? 1 : 0) - (c.left.isDown || k.A.isDown ? 1 : 0);
    const dy = (c.down.isDown || k.S.isDown ? 1 : 0) - (c.up.isDown || k.W.isDown ? 1 : 0);
    const dtSec = delta / 1000;
    let moving = false;
    if ((dx || dy) && rover.battery > 0) {
      const len = Math.hypot(dx, dy);
      const spec = this.cfg.rovers.types[rover.type];
      const terrainFactor = this.terrainSpeedFactor(rover.x, rover.y, 'rover');
      const speed = (spec.speedMs ?? 1.15) * terrainFactor;
      // Velocidad en m/s real, convertida a píxeles con el reloj de simulación.
      const simRate = this.cfg.time?.simMinPerRealSec ?? 1;
      const dist = (speed * dtSec * 60 * simRate / this.terrain.cellSizeM) * this.cellPx;
      const nx = Phaser.Math.Clamp(rover.x + dx / len * dist, 0, this.worldPx - 1);
      const ny = Phaser.Math.Clamp(rover.y + dy / len * dist, 0, this.worldPx - 1);
      const limit = this.cfg.astronaut.maxSlopeDeg + (spec.slopeBonusDeg ?? 4);
      let x = rover.x, y = rover.y;
      if (this.canTraverse(rover.x, rover.y, nx, rover.y, limit, 'rover')) x = nx;
      if (this.canTraverse(x, rover.y, x, ny, limit, 'rover')) y = ny;
      moving = x !== rover.x || y !== rover.y;
      if (moving) rover.heading = Math.atan2(dy, dx);
      rover.x = x; rover.y = y;
      rover.battery = Math.max(0, rover.battery - (spec.batteryDrainPerMin ?? 0.7) * (delta / 60000));
      if (moving) this.updateRoverVisual(rover);
    }
    if (rover.battery <= 0) this.setNotice('Batería agotada. El rover se ha detenido.');
    this.updateRoverVisual(rover);
    // El icono del astronauta queda asociado al vehículo durante toda la conducción.
    this.player.setPosition(rover.x, rover.y);
    const heading = rover.heading ?? 0;
    this.player.setRotation(spriteRotationForHeading(heading));
    this.roverSaveTimer = (this.roverSaveTimer ?? 0) + delta;
    if (this.roverSaveTimer >= 1000) { this.persistCampaign(); this.roverSaveTimer = 0; }
    this.extra.roverStatus = `${rover.name} · Batería ${Math.round(rover.battery)}% · Carga ${Object.values(rover.cargo).reduce((a,b)=>a+b,0)}/${rover.capacity}`;
    this.extra.interaction = `E · Recolectar / descargar · F · Salir del rover`;
    // El astronauta permanece dentro del vehículo: consume oxígeno en reposo.
    const dtMin = (delta / 1000) * this.cfg.time.simMinPerRealSec;
    this.processBaseModules(dtMin);
    const roverSheltered = this.recoverOxygenAtBase(rover.x, rover.y, dtMin);
    step(this.state, this.cfg, dtMin, {
      moving: false, slopeDeg: this.slopeAt(rover.x, rover.y), oxygenProtected: roverSheltered, thermalProtected: roverSheltered,
      radiationShield: this.radiationShieldAt(rover.x, rover.y, { sheltered: roverSheltered, inRover: true }),
      radiationMultiplier: this.radiationMultiplier, ambientDeltaC: this.ambientDelta,
    });
    this.extra.ambientC = ambientC(this.cfg, this.state.timeMin, this.ambientDelta);
    this.extra.slopeDeg = this.slopeAt(rover.x, rover.y);
    const home = this.bases.find((base) => base.kind === 'main') ?? this.bases[0];
    this.extra.homeDistM = home ? (Phaser.Math.Distance.Between(rover.x, rover.y, home.x, home.y) / this.cellPx) * this.terrain.cellSizeM : 0;
    this.checkEnd();
    this.persistCampaign();
  }

  spawnResources() {
    const rcfg = this.cfg.resources;
    if (!rcfg?.types?.length) return;
    let seed = (this.worldSeed ?? this.cfg.terrain.seed ?? 1) ^ 0x5f3759df;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const margin = this.cellPx * 5;
    const targetCount = rcfg.spawnCount ?? 30;
    for (let i = 0; i < targetCount * 12 && this.resources.length < targetCount; i++) {
      let x = margin + random() * (this.worldPx - margin * 2);
      let y = margin + random() * (this.worldPx - margin * 2);
      // Evita colocar recursos encima de la base principal.
      if (Phaser.Math.Distance.Between(x, y, this.start.x, this.start.y) < this.cellPx * 9) continue;
      if (this.slopeAt(x, y) > this.cfg.astronaut.maxSlopeDeg || this.rockinessAt(x, y) > 0.9) continue;
      const elevation = this.terrain.heights[this.terrainCell(x, y)] / this.terrain.elevationRangeM;
      const rock = this.rockinessAt(x, y);
      let preferred = rcfg.types;
      if (rock > 0.52) preferred = rcfg.types.filter((item) => item.id === 'metal');
      else if (elevation < 0.34) preferred = rcfg.types.filter((item) => item.id === 'ice');
      const pool = preferred.length ? preferred : rcfg.types;
      const data = pool[Math.floor(random() * pool.length)];
      if (this.collectedResourceIds?.has(i)) continue;
      const marker = this.add.circle(x, y, 7, Phaser.Display.Color.HexStringToColor(data.color).color)
        .setStrokeStyle(2, 0x2b1b16).setDepth(7);
      const label = this.add.text(x + 9, y - 7, data.symbol, {
        fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
        stroke: '#24140f', strokeThickness: 3
      }).setDepth(8);
      this.resources.push({ id: i, x, y, data, marker, label, collected: false });
    }
  }

  findNearbyResource() {
    const radiusM = this.cfg.resources?.interactionRadiusM ?? 10;
    const radiusPx = (radiusM / this.terrain.cellSizeM) * this.cellPx;
    let nearest = null;
    let nearestDist = radiusPx;
    for (const resource of this.resources) {
      if (resource.collected) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, resource.x, resource.y);
      if (dist <= nearestDist) { nearest = resource; nearestDist = dist; }
    }
    return nearest;
  }

  interact() {
    if (this.drivingRoverId) { this.roverInteract(); return; }
    const waypoint = this.findNearbyWaypoint();
    if (waypoint) { this.sampleWaypoint(waypoint); return; }
    const resource = this.findNearbyResource();
    if (resource) {
      const result = collectResource(this.state, this.cfg, resource.data);
      this.setNotice(result.message);
      if (result.ok) {
        resource.collected = true;
        this.collectedResourceIds.add(resource.id);
        resource.marker.destroy();
        resource.label.destroy();
        this.persistCampaign();
      }
      return;
    }
    const base = this.findNearbyBase();
    if (base) {
      const result = depositInventory(this.state, base);
      this.setNotice(result.message);
      if (result.ok) this.persistCampaign();
      return;
    }
    this.setNotice('No hay recursos ni bases al alcance.');
  }

  craftRadiationKit() {
    const base = this.findNearbyBase();
    if (!base) { this.setNotice('Debes fabricar kits en una base.'); return; }
    if ((base.storage.ice ?? 0) < 2 || (base.storage.regolith ?? 0) < 1) { this.setNotice('Se requieren 2 de hielo y 1 de regolito por kit.'); return; }
    base.storage.ice -= 2; base.storage.regolith -= 1; this.radiationKits += 1;
    this.persistCampaign(); this.setNotice(`Kit de blindaje fabricado. Disponibles: ${this.radiationKits}. Presiona H para usarlo.`);
  }

  useRadiationKit() {
    if (this.radiationKits < 1) { this.setNotice('No tienes kits de blindaje. Fabrica uno en una base con C.'); return; }
    this.radiationKits -= 1;
    this.radiationKitUntilMin = Math.max(this.radiationKitUntilMin ?? 0, this.state.timeMin) + (this.cfg.radiation?.kitDurationMin ?? 60);
    this.persistCampaign(); this.setNotice(`Blindaje temporal activado: la dosis se reduce ${Math.round((this.cfg.radiation?.kitShield ?? 0.5) * 100)} % durante ${this.cfg.radiation?.kitDurationMin ?? 60} min simulados.`);
  }

  withdrawFromBase() {
    const base = this.findNearbyBase();
    if (!base) { this.setNotice('Acércate a una base para retirar materiales.'); return; }
    const result = withdrawInventory(this.state, this.cfg, base);
    this.setNotice(result.message);
    if (result.ok) this.persistCampaign();
  }

  setNotice(message) {
    this.extra.notice = message;
    this.time.delayedCall(2200, () => {
      if (this.extra.notice === message) this.extra.notice = '';
    });
  }

  radiationShieldAt(px, py, { sheltered = false, inRover = false } = {}) {
    const horizonDeg = this.terrain.horizonDeg?.[this.terrainCell(px, py)] ?? 0;
    let baseShield = radiationShield(this.cfg, { sheltered, inRover, horizonDeg });
    const shelterBase = sheltered ? this.findNearbyBaseAt(px, py) : null;
    if (shelterBase?.modules?.includes('rad_shelter')) baseShield = Math.min(0.95, baseShield + 0.25);
    const kitActive = (this.radiationKitUntilMin ?? 0) > this.state.timeMin;
    const kitShield = this.cfg.radiation?.kitShield ?? 0.5;
    const shield = 1 - (1 - baseShield) * (kitActive ? 1 - kitShield : 1);
    this.extra.radiationShield = shield;
    this.extra.radiationKitActive = kitActive;
    return shield;
  }

  terrainCell(px, py) {
    const s = this.terrain.size;
    const col = Math.min(s - 1, Math.max(0, Math.floor(px / this.cellPx)));
    const row = Math.min(s - 1, Math.max(0, Math.floor(py / this.cellPx)));
    return row * s + col;
  }

  rockinessAt(px, py) { return this.terrain.rockiness?.[this.terrainCell(px, py)] ?? 0; }

  terrainSpeedFactor(px, py, mode = 'walk') {
    const slope = this.slopeAt(px, py);
    const rock = this.rockinessAt(px, py);
    const slopeScale = mode === 'rover' ? 48 : 38;
    const slopeFactor = Math.max(mode === 'rover' ? 0.28 : 0.22, 1 - slope / slopeScale);
    const rockFactor = 1 - rock * (mode === 'rover' ? 0.48 : 0.32);
    return Math.max(0.18, slopeFactor * rockFactor);
  }

  canTraverse(x1, y1, x2, y2, slopeLimit, mode = 'walk') {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.max(1, Math.ceil(distance / 4));
    const maxStepM = mode === 'rover' ? 16 : 12;
    let previousHeight = this.terrain.heights[this.terrainCell(x1, y1)];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const idx = this.terrainCell(x, y);
      if (this.terrain.slopes[idx] > slopeLimit) return false;
      const height = this.terrain.heights[idx];
      if (Math.abs(height - previousHeight) > maxStepM) return false;
      previousHeight = height;
    }
    return true;
  }

  // ---------------------------------------------------------------- eventos
  applyEvents() {
    const status = getEventStatus(this.events, this.state.timeMin);
    this.eventStatus = status;
    this.eventEffects = status.effects;
    this.radiationMultiplier = status.effects.radiationMultiplier;
    this.ambientDelta = status.effects.ambientDeltaC;
    const alert = eventAlert(status);
    this.extra.eventAlert = alert;
    this.extra.visibility = status.effects.visibility;
    const key = status.warning?.id ?? null;
    if (key && key !== this.lastWarnId) {
      this.lastWarnId = key;
      this.setNotice(`${alert.text}. ${alert.hint}`);
    }
  }

  // Avanza el reloj sin moverse (tomar una muestra, etc.), minuto a minuto para que
  // los eventos, la radiación y el oxígeno se calculen igual que en tiempo real.
  advanceTime(totalMin) {
    let left = totalMin;
    while (left > 0 && this.state.status === 'playing') {
      const dt = Math.min(1, left);
      left -= dt;
      this.processBaseModules(dt);
      this.applyEvents();
      const { x, y } = this.player;
      const sheltered = this.recoverOxygenAtBase(x, y, dt);
      step(this.state, this.cfg, dt, {
        moving: false, slopeDeg: this.slopeAt(x, y), oxygenProtected: sheltered, thermalProtected: sheltered,
        radiationShield: this.radiationShieldAt(x, y, { sheltered }),
        radiationMultiplier: this.radiationMultiplier, ambientDeltaC: this.ambientDelta,
      });
    }
  }

  checkEnd() {
    if (this.state.status !== 'playing' && !this.finished) {
      this.finished = true;
      this.hud.showEnd(this.state, this.buildSummary());
    }
  }

  // ------------------------------------------------------- ciencia (waypoints)
  setupScience() {
    this.waypointMarks = [];
    const sc = this.cfg.science;
    const list = this.registry.get('waypoints');
    if (!sc?.enabled || !Array.isArray(list)) return;
    const placed = mapWaypointsToGrid(list, this.registry.get('route'), this.terrain, this.cfg);
    const startCell = { col: this.start.x / this.cellPx, row: this.start.y / this.cellPx };
    let n = 0;
    for (const wp of placed) {
      if (!findRoute(this.terrain, this.cfg, startCell, wp).found) {
        console.warn(`Waypoint ${wp.id} (${wp.name}) no es alcanzable desde el inicio; se omite.`);
        continue;
      }
      n += 1;
      const x = (wp.col + 0.5) * this.cellPx;
      const y = (wp.row + 0.5) * this.cellPx;
      const marker = this.add.rectangle(x, y, 12, 12, 0xffd36b).setAngle(45).setStrokeStyle(2, 0x24140f).setDepth(6);
      const label = this.add.text(x + 12, y - 9, `${n}. ${wp.name}`, { fontSize: '12px', color: '#ffd36b', stroke: '#24140f', strokeThickness: 3 }).setDepth(6);
      this.waypointMarks.push({ wp, x, y, marker, label, done: false, custom: false });
    }
    for (const wp of this.customWaypoints ?? []) this.drawCustomWaypoint(wp);
  }

  drawCustomWaypoint(wp) {
    const done = Boolean(wp.done);
    const marker = this.add.circle(wp.x, wp.y, 8, done ? 0x3ddc84 : 0x6ee7d8, 0.95).setStrokeStyle(2, 0x123f43).setDepth(7).setInteractive({ useHandCursor: true });
    marker.on('pointerdown', (_pointer, _localX, _localY, event) => { event?.stopPropagation?.(); this.removeCustomWaypointById(wp.id); });
    const label = this.add.text(wp.x + 11, wp.y - 12, `◆ ${wp.name}`, { fontSize: '11px', color: done ? '#3ddc84' : '#9ff5e8', stroke: '#102327', strokeThickness: 3 }).setDepth(7);
    this.waypointMarks.push({ wp, x: wp.x, y: wp.y, marker, label, done, custom: true });
  }

  addCustomWaypoint(x, y) {
    const col = Math.floor(x / this.cellPx), row = Math.floor(y / this.cellPx);
    if (col < 2 || row < 2 || col >= this.terrain.size - 2 || row >= this.terrain.size - 2) return;
    const spot = this.terrain.slopes[row * this.terrain.size + col] <= this.cfg.astronaut.maxSlopeDeg
      ? { col, row } : null;
    if (!spot) { this.setNotice('Waypoint rechazado: pendiente demasiado alta.'); return; }
    const reachable = findRoute(this.terrain, this.cfg, { col: this.player.x / this.cellPx, row: this.player.y / this.cellPx }, spot);
    if (!reachable.found) { this.setNotice('Waypoint rechazado: no existe una ruta transitable desde tu posición.'); return; }
    const id = `wp-${this.worldSeed}-${Date.now()}`;
    const wp = { id, name: `Exploración ${this.customWaypoints.length + 1}`, x: (col + 0.5) * this.cellPx, y: (row + 0.5) * this.cellPx, col, row, done: false };
    this.customWaypoints.push(wp); this.drawCustomWaypoint(wp); this.activeWaypointId = id; this.persistCampaign();
  }

  removeCustomWaypointById(id) {
    const mark = (this.waypointMarks ?? []).find((item) => item.custom && item.wp.id === id);
    if (!mark) return false;
    mark.marker.destroy(); mark.label.destroy();
    this.waypointMarks = this.waypointMarks.filter((item) => item !== mark);
    this.customWaypoints = filterCustomWaypoints(this.customWaypoints, id);
    if (this.activeWaypointId === id) this.activeWaypointId = null;
    this.routeCell = null;
    this.persistCampaign();
    this.setNotice(`Waypoint ${mark.wp.name} eliminado.`);
    return true;
  }

  removeNearestCustomWaypoint() {
    const custom = (this.waypointMarks ?? []).filter((m) => m.custom).sort((a, b) =>
      Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
      - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y)
    )[0];
    if (!custom) { this.setNotice('No hay waypoints personalizados para eliminar.'); return; }
    this.removeCustomWaypointById(custom.wp.id);
  }

  findNearbyWaypoint() {
    if (!this.waypointMarks?.length) return null;
    const radiusPx = ((this.cfg.science?.interactionRadiusM ?? 30) / this.terrain.cellSizeM) * this.cellPx;
    let best = null;
    let bestDist = radiusPx;
    for (const mark of this.waypointMarks) {
      if (mark.done) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, mark.x, mark.y);
      if (dist <= bestDist) { best = mark; bestDist = dist; }
    }
    return best;
  }

  sampleWaypoint(mark) {
    this.advanceTime(this.cfg.science?.sampleMinutes ?? 8);
    if (this.state.status !== 'playing') { this.checkEnd(); return; }
    mark.done = true;
    const researchBase = [...this.bases].sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y))[0];
    if (researchBase?.modules?.includes('lab')) { researchBase.pendingSamples = (researchBase.pendingSamples ?? 0) + 1; this.setNotice(`Muestra registrada. ${researchBase.name} la procesará en su laboratorio.`); }
    if (mark.custom) { const saved = this.customWaypoints.find((w) => w.id === mark.wp.id); if (saved) saved.done = true; }
    mark.marker.setFillStyle(0x3ddc84);
    mark.label.setColor('#3ddc84');
    this.persistCampaign();
    this.setNotice(`Muestra tomada en ${mark.wp.name}: ${mark.wp.objective ?? 'punto de interés registrado'}`);
  }

  buildSummary() {
    const sc = this.cfg.science ?? {};
    const total = this.waypointMarks?.length ?? 0;
    const samples = (this.waypointMarks ?? []).filter((m) => m.done).map((m) => ({ name: m.wp.name, objective: m.wp.objective }));
    const doseMicroSv = this.state.radiationMSv * 1000;
    const score = Math.max(0, Math.round(
      samples.length * (sc.pointsPerSample ?? 100)
      + (this.state.status === 'won' ? (sc.winBonus ?? 300) : 0)
      + this.state.oxygen * (sc.oxygenPointsPerMin ?? 0.5)
      - doseMicroSv * (sc.dosePenaltyPerMicroSv ?? 0.2)
    ));
    return { total, samples, score };
  }

  // ------------------------------------------------------- ruta sugerida (A*)
  updateRoute(delta) {
    if (!this.showRoute || this.finished) return;
    this.routeTimer += delta;
    const explorer = this.getDrivingRover() ?? this.player;
    const cell = `${Math.floor(explorer.x / this.cellPx)},${Math.floor(explorer.y / this.cellPx)}`;
    if (this.routeCell === cell && this.routeTimer < (this.cfg.route?.refreshMs ?? 4000)) return;
    this.routeCell = cell;
    this.routeTimer = 0;
    const from = { col: explorer.x / this.cellPx, row: explorer.y / this.cellPx };
    const target = this.customWaypoints.find((wp) => wp.id === this.activeWaypointId && !wp.done);
    if (!target) { this.routeGraphics.clear(); this.extra.routeInfo = 'Coloca un waypoint con M para planear una expedición.'; return; }
    const to = { col: target.col, row: target.row };
    const r = findRoute(this.terrain, this.cfg, from, to);
    const g = this.routeGraphics;
    g.clear();
    if (!r.found) { this.extra.routeInfo = `Ruta sugerida: ${r.reason}.`; return; }
    g.lineStyle(3, 0x8bd5ff, 0.9);
    g.beginPath();
    r.cells.forEach((c, i) => {
      const x = (c.col + 0.5) * this.cellPx;
      const y = (c.row + 0.5) * this.cellPx;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    });
    g.strokePath();
    let text = `Ruta a ${target.name}: ${(r.distanceM / 1000).toFixed(2)} km · ~${Math.round(r.minutes)} min · O₂ ~${Math.round(r.oxygenMin)} de ${Math.round(this.state.oxygen)} min · dosis ~${(r.doseMSv * 1000).toFixed(0)} µSv`;
    if (r.oxygenMin > this.state.oxygen * 0.9) text += ' ⚠ O₂ justo: pasa por una base';
    const rad = this.cfg.radiation;
    if (rad?.enabled && this.state.radiationMSv + r.doseMSv > rad.limitMSv * 0.9) text += ' ⚠ dosis justa';
    this.extra.routeInfo = text;
  }

  slopeAt(px, py) {
    const s = this.terrain.size;
    const col = Math.min(s - 1, Math.max(0, Math.floor(px / this.cellPx)));
    const row = Math.min(s - 1, Math.max(0, Math.floor(py / this.cellPx)));
    return this.terrain.slopes[row * s + col];
  }

  update(_time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.N) && !this.finished && !this.paused) {
      if (window.confirm('¿Crear una nueva campaña con mapa, relieve y recursos aleatorios? Se reiniciará el progreso actual.')) {
        clearCampaign(this.cfg);
        this.scene.restart();
      }
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.clearCustomWaypoints();
      this.scene.restart();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !this.finished) {
      this.paused = !this.paused;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && !this.finished && !this.paused) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.M) && !this.finished && !this.paused && !this.drivingRoverId) {
      this.waypointPlacement = !this.waypointPlacement;
      this.setNotice(this.waypointPlacement ? 'Haz clic en una zona transitable para colocar un waypoint.' : 'Colocación de waypoint cancelada.');
    }
    if ((Phaser.Input.Keyboard.JustDown(this.keys.DELETE) || Phaser.Input.Keyboard.JustDown(this.keys.BACKSPACE)) && !this.finished && !this.paused) this.removeNearestCustomWaypoint();
    if (Phaser.Input.Keyboard.JustDown(this.keys.T) && !this.finished && !this.paused) this.cycleBaseModule();
    if (Phaser.Input.Keyboard.JustDown(this.keys.Y) && !this.finished && !this.paused) this.installBaseModule();
    if (Phaser.Input.Keyboard.JustDown(this.keys.C) && !this.finished && !this.paused) this.craftRadiationKit();
    if (Phaser.Input.Keyboard.JustDown(this.keys.H) && !this.finished && !this.paused) this.useRadiationKit();
    if (Phaser.Input.Keyboard.JustDown(this.keys.P) && !this.finished) {
      this.showRoute = !this.showRoute;
      this.routeCell = null;
      if (!this.showRoute) { this.routeGraphics.clear(); this.extra.routeInfo = ''; }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) && !this.finished && !this.paused && !this.drivingRoverId) this.withdrawFromBase();
    if (Phaser.Input.Keyboard.JustDown(this.keys.B) && !this.finished && !this.paused && !this.drivingRoverId) this.buildNewBase();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.selectedRoverType = 'explorer';
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.selectedRoverType = 'cargo';
    if (Phaser.Input.Keyboard.JustDown(this.keys.V) && !this.finished && !this.paused && !this.drivingRoverId) this.deployRover();
    if (Phaser.Input.Keyboard.JustDown(this.keys.F) && !this.finished && !this.paused) this.toggleRover();
    if (this.state.status === 'playing' && !this.paused) {
      this.applyEvents();
      if (this.drivingRoverId) this.driveRover(delta);
      else this.tick(delta);
    }
    this.updateRoute(delta);
    const controlled = this.getDrivingRover() ?? this.player;
    this.updateTerrainChunks(controlled.x, controlled.y);
    this.updateExploration(controlled.x, controlled.y);

    this.campaignSaveTimer = (this.campaignSaveTimer ?? 0) + delta;
    if (this.campaignSaveTimer >= 5000) { this.persistCampaign(); this.campaignSaveTimer = 0; }

    const activeRover = this.getDrivingRover();
    const dtSec = delta / 1000;
    const simMinutes = dtSec * (this.cfg.time?.simMinPerRealSec ?? 1);
    const solarCfg = this.cfg.rovers ?? {};
    const daylight = Math.max(0, Math.sin((2 * Math.PI * ((this.state.timeMin % 1440) - 360)) / 1440)) * (this.eventEffects?.solarFactor ?? 1);
    for (const rover of this.rovers) {
      if (rover.battery >= 100) continue;
      const atBase = !rover.deployed || Boolean(this.findNearbyBaseAt(rover.x, rover.y));
      // El hangar/estación de la base carga rápido; los paneles solares recargan los rovers desplegados durante el día.
      if (atBase && rover.id !== this.drivingRoverId) {
        rover.battery = Math.min(100, rover.battery + dtSec * (solarCfg.baseRechargePercentPerSec ?? 8) * (this.bases.some((base) => base.modules?.includes('hangar') && Phaser.Math.Distance.Between(base.x, base.y, rover.x, rover.y) < 45) ? 1.5 : 1));
      } else if (rover.deployed && rover.id !== this.drivingRoverId && daylight > 0) {
        rover.battery = Math.min(100, rover.battery + simMinutes * daylight * (solarCfg.solarRechargePercentPerSimMin ?? 0.12));
      }
      if (rover.deployed) this.updateRoverVisual(rover);
    }
    this.extra.baseCount = this.bases.length;
    this.extra.roverCount = this.rovers.filter((rover) => rover.deployed).length;
    this.extra.inventory = this.state.inventory;
    this.extra.inventoryUsed = this.state.inventoryUsed;
    this.extra.inventoryCapacity = this.cfg.resources?.inventoryCapacity ?? 12;
    this.extra.paused = this.paused;
    if (activeRover) {
      this.extra.roverStatus = `${activeRover.name} · Kits RAD ${this.radiationKits} · Batería ${Math.round(activeRover.battery)}% · Carga ${Object.values(activeRover.cargo).reduce((a,b)=>a+b,0)}/${activeRover.capacity}`;
      this.hud.update(this.state, this.extra);
      return;
    }
    this.extra.roverStatus = `${this.rovers.filter((rover) => rover.deployed).length} rover(s) desplegado(s) · Kits RAD ${this.radiationKits} · Selección: ${this.selectedRoverType === 'explorer' ? 'Explorador' : 'Carga'}`;
    const nearby = this.findNearbyResource();
    const nearbyBase = this.findNearbyBase();
    const nearbyRover = this.findNearbyRover();
    const prompts = [];
    const nearWp = this.findNearbyWaypoint();
    if (nearWp) prompts.push(`E · Tomar muestra: ${nearWp.wp.name} (${this.cfg.science?.sampleMinutes ?? 8} min)`);
    if (nearby) prompts.push(`E · Recolectar ${nearby.data.name}`);
    if (nearbyRover) prompts.push(`F · Subir a ${nearbyRover.name}`);
    if (nearbyBase) {
      prompts.push(`E · Guardar mochila en ${nearbyBase.name} | Q · Retirar`);
      if (this.state.oxygen < this.cfg.astronaut.oxygenMinutes) prompts.push('O₂ · Recargando en refugio');
    }
    if (this.waypointPlacement) prompts.push('Haz clic en el terreno para colocar waypoint');
    this.extra.interaction = prompts.join(' | ');
    this.extra.nearbyBase = nearbyBase ? nearbyBase.name : '';
    this.extra.baseStorage = nearbyBase?.storage ?? null;
    this.extra.baseSystems = nearbyBase ? { energy: nearbyBase.energy ?? 0, energyCapacity: nearbyBase.energyCapacity ?? 10, food: nearbyBase.food ?? 0, research: nearbyBase.researchPoints ?? 0, pending: nearbyBase.pendingSamples ?? 0, storageCapacity: nearbyBase.storageCapacity ?? 30, modules: nearbyBase.modules ?? [] } : null;
    this.hud.update(this.state, this.extra);
  }

  tick(delta) {
    const cfg = this.cfg;
    const a = cfg.astronaut;
    const k = this.keys;
    const c = this.cursors;

    const dtMin = (delta / 1000) * cfg.time.simMinPerRealSec;
    this.processBaseModules(dtMin);
    const dx = (c.right.isDown || k.D.isDown ? 1 : 0) - (c.left.isDown || k.A.isDown ? 1 : 0);
    const dy = (c.down.isDown || k.S.isDown ? 1 : 0) - (c.up.isDown || k.W.isDown ? 1 : 0);

    const slopeHere = this.slopeAt(this.player.x, this.player.y);
    let moved = false;
    let blocked = false;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const speed = a.walkSpeedMs * speedFactor(this.state, cfg, slopeHere) * this.terrainSpeedFactor(this.player.x, this.player.y, 'walk');
      const distPx = ((speed * 60 * dtMin) / this.terrain.cellSizeM) * this.cellPx;
      const nx = Phaser.Math.Clamp(this.player.x + (dx / len) * distPx, 0, this.worldPx - 1);
      const ny = Phaser.Math.Clamp(this.player.y + (dy / len) * distPx, 0, this.worldPx - 1);
      const limit = a.maxSlopeDeg;
      let x = this.player.x;
      let y = this.player.y;
      if (this.canTraverse(this.player.x, this.player.y, nx, this.player.y, limit, 'walk')) x = nx;
      else if (dx) blocked = true;
      if (this.canTraverse(x, this.player.y, x, ny, limit, 'walk')) y = ny;
      else if (dy) blocked = true;

      moved = x !== this.player.x || y !== this.player.y;
      this.player.setPosition(x, y);
      this.player.setRotation(spriteRotationForHeading(Math.atan2(dy, dx))); 
    }

    const sheltered = this.recoverOxygenAtBase(this.player.x, this.player.y, dtMin);
    step(this.state, cfg, dtMin, {
      moving: moved, slopeDeg: slopeHere, oxygenProtected: sheltered, thermalProtected: sheltered,
      radiationShield: this.radiationShieldAt(this.player.x, this.player.y, { sheltered }),
      radiationMultiplier: this.radiationMultiplier, ambientDeltaC: this.ambientDelta,
    });

    const home = this.bases.find((base) => base.kind === 'main') ?? this.bases[0];
    const distPx = home ? Phaser.Math.Distance.Between(this.player.x, this.player.y, home.x, home.y) : 0;

    this.extra.ambientC = ambientC(cfg, this.state.timeMin, this.ambientDelta);
    this.extra.slopeDeg = slopeHere;
    this.extra.homeDistM = (distPx / this.cellPx) * this.terrain.cellSizeM;
    this.extra.blocked = blocked;

    this.checkEnd();
  }
}
