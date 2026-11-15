// Motor de simulación: solo cálculos. No toca el DOM ni Phaser.
// Todos los números salen de simulation.json (cfg), nada está escrito aquí.

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function createState(cfg) {
  const a = cfg.astronaut;
  return {
    timeMin: 0, // minutos simulados desde el inicio
    oxygen: a.oxygenMinutes, // minutos de aire restantes (al ritmo de reposo)
    stamina: a.staminaMax,
    suitTempC: a.suitTempStartC,
    exhausted: false,
    radiationMSv: 0, // dosis acumulada en esta EVA
    radiationRateMSvPerDay: 0, // tasa actual (para el HUD)
    status: 'playing', // playing | won | lost
    reason: null,
    inventory: Object.fromEntries((cfg.resources?.types ?? []).map((item) => [item.id, 0])),
    inventoryUsed: 0,
  };
}

// Temperatura exterior: una oscilación diaria sencilla (mock).
// deltaC es el ajuste de un evento activo (p. ej. descenso brusco de temperatura).
export function ambientC(cfg, timeMin, deltaC = 0) {
  const { baseC, swingC, periodMin } = cfg.ambient;
  return baseC + swingC * Math.sin((2 * Math.PI * timeMin) / periodMin) + deltaC;
}

// Fracción de radiación bloqueada (0 a 1) según dónde está el astronauta.
// El blindaje se combina multiplicando lo que pasa: terreno → rover → base.
export function radiationShield(cfg, { sheltered = false, inRover = false, horizonDeg = 0 } = {}) {
  const r = cfg.radiation;
  if (!r?.enabled) return 0;
  const terrain = (r.terrainShieldMax ?? 0.3) * clamp(horizonDeg / (r.horizonFullShieldDeg ?? 30), 0, 1);
  let passes = 1 - terrain;
  if (inRover) passes *= 1 - (r.roverShield ?? 0.25);
  if (sheltered) passes *= 1 - (r.shelterShield ?? 0.9);
  return 1 - passes;
}

// Qué tan rápido puede caminar ahora (0 a 1). Más pendiente y cansancio = más lento.
export function speedFactor(state, cfg, slopeDeg) {
  const slopePenalty = 1 - 0.6 * clamp(slopeDeg / cfg.astronaut.maxSlopeDeg, 0, 1);
  return slopePenalty * (state.exhausted ? 0.35 : 1);
}

// Avanza la simulación dtMin minutos simulados.
// ctx = { moving, slopeDeg, oxygenProtected?, thermalProtected?, radiationShield?, radiationMultiplier?, ambientDeltaC? }
// radiationMultiplier es el enchufe para eventos (p. ej. una tormenta solar ×10).
export function step(state, cfg, dtMin, ctx) {
  if (state.status !== 'playing') return state;

  const a = cfg.astronaut;
  const d = cfg.operationalFactors ?? { oxygenDrain: 1, staminaDrain: 1, coolDrain: 1, radiationRate: 1 };
  const { moving, slopeDeg, oxygenProtected = false, thermalProtected = false } = ctx;

  // Oxígeno
  let o2Rate = oxygenProtected ? 0 : (moving ? a.oxygenMoveRate + a.oxygenPerSlopeDeg * slopeDeg : a.oxygenRestRate);
  if (state.exhausted && !oxygenProtected) o2Rate *= 1.5;
  state.oxygen -= o2Rate * d.oxygenDrain * dtMin;

  // Estamina: se gasta al moverse (más en pendiente) y se recupera en reposo
  if (moving) {
    state.stamina -= a.staminaDrainPerMin * (1 + slopeDeg * 0.1) * d.staminaDrain * dtMin;
  } else {
    state.stamina += a.staminaRegenPerMin * dtMin;
  }
  state.stamina = clamp(state.stamina, 0, a.staminaMax);
  if (state.stamina <= a.exhaustedBelow) state.exhausted = true;
  else if (state.exhausted && state.stamina >= a.recoverAbove) state.exhausted = false;

  // Temperatura del traje: pierde calor hacia el exterior, moverse genera un poco
  const loss = (state.suitTempC - ambientC(cfg, state.timeMin, ctx.ambientDeltaC ?? 0)) * a.coolRatePerMin * d.coolDrain;
  const heat = moving ? a.moveHeatPerMin : 0;
  if (thermalProtected) {
    const targetC = cfg.bases?.interiorTempC ?? 20;
    const regulation = cfg.bases?.temperatureRegulationPerMin ?? 1.5;
    state.suitTempC += clamp(targetC - state.suitTempC, -regulation * dtMin, regulation * dtMin);
  } else {
    state.suitTempC += (heat - loss) * dtMin;
  }

  // Radiación: dosis = tasa base × evento × (1 − blindaje) × factor operativo fijo
  const rad = cfg.radiation;
  if (rad?.enabled) {
    const shield = clamp(ctx.radiationShield ?? 0, 0, 0.99);
    const rate = rad.baselineMSvPerDay * (ctx.radiationMultiplier ?? 1) * (1 - shield) * (d.radiationRate ?? 1);
    state.radiationRateMSvPerDay = rate;
    state.radiationMSv += (rate / 1440) * dtMin;
  }

  state.timeMin += dtMin;

  // Condiciones de derrota
  if (state.oxygen <= 0) {
    state.oxygen = 0;
    state.status = 'lost';
    state.reason = 'Se agotó el oxígeno.';
  } else if (state.suitTempC <= a.suitTempMinC) {
    state.status = 'lost';
    state.reason = 'El traje bajó de la temperatura mínima segura.';
  } else if (rad?.enabled && state.radiationMSv >= rad.limitMSv) {
    state.radiationMSv = rad.limitMSv;
    state.status = 'lost';
    state.reason = 'Se superó el presupuesto de dosis de radiación de la EVA.';
  }
  return state;
}

// Recoge una unidad de recurso si queda espacio en el inventario.
export function collectResource(state, cfg, resource) {
  const capacity = cfg.resources?.inventoryCapacity ?? 12;
  if (!resource || !(resource.id in state.inventory)) {
    return { ok: false, message: 'No se reconoce este recurso.' };
  }
  if (state.inventoryUsed >= capacity) {
    return { ok: false, message: 'Inventario lleno. Regresa a la base para descargar recursos.' };
  }
  state.inventory[resource.id] += 1;
  state.inventoryUsed += 1;
  return { ok: true, message: `Recolectaste: ${resource.name}.` };
}


// Transfiere todos los recursos de la mochila al almacén de una base.
export function depositInventory(state, base) {
  if (!base?.storage) return { ok: false, message: 'No se encontró el almacén de la base.' };
  const moved = [];
  const capacity = base.storageCapacity ?? 30;
  let stored = 0;
  for (const [id, amount] of Object.entries(state.inventory)) {
    if (amount > 0) {
      const used = Object.values(base.storage).reduce((sum, value) => sum + value, 0);
      const accepted = Math.min(amount, Math.max(0, capacity - used));
      if (accepted > 0) {
        base.storage[id] = (base.storage[id] ?? 0) + accepted;
        state.inventory[id] -= accepted;
        stored += accepted;
        moved.push(`${accepted} ${id}`);
      }
    }
  }
  state.inventoryUsed = Object.values(state.inventory).reduce((sum, amount) => sum + amount, 0);
  if (!stored) return { ok: false, message: 'El almacén está lleno o tu mochila está vacía.' };
  return { ok: true, message: `Materiales guardados en ${base.name}: ${moved.join(', ')}.${state.inventoryUsed ? ` Quedan ${state.inventoryUsed} en la mochila; capacidad del almacén ${capacity}.` : ''}` };
}

// Retira recursos de una base hasta llenar la mochila.
export function withdrawInventory(state, cfg, base) {
  if (!base?.storage) return { ok: false, message: 'No se encontró el almacén de la base.' };
  const capacity = cfg.resources?.inventoryCapacity ?? 12;
  let moved = 0;
  for (const id of Object.keys(state.inventory)) {
    while ((base.storage[id] ?? 0) > 0 && state.inventoryUsed < capacity) {
      base.storage[id] -= 1;
      state.inventory[id] += 1;
      state.inventoryUsed += 1;
      moved += 1;
    }
  }
  return moved
    ? { ok: true, message: `Retiraste ${moved} unidad(es) del almacén.` }
    : { ok: false, message: state.inventoryUsed >= capacity ? 'La mochila está llena.' : 'No hay materiales almacenados.' };
}

export function buildOutpost(state, cfg) {
  const cost = cfg.bases?.outpostCost ?? { regolith: 4, metal: 3, ice: 1 };
  const missing = Object.entries(cost).filter(([id, amount]) => (state.inventory[id] ?? 0) < amount);
  if (missing.length) {
    return { ok: false, message: `Faltan materiales: ${missing.map(([id, amount]) => `${amount - (state.inventory[id] ?? 0)} ${id}`).join(', ')}.` };
  }
  for (const [id, amount] of Object.entries(cost)) {
    state.inventory[id] -= amount;
    state.inventoryUsed -= amount;
  }
  return { ok: true, message: 'Puesto avanzado construido. Ya puedes almacenar materiales aquí.' };
}


// Fabrica un rover descontando materiales del almacén de una base.
export function buildRover(base, roverType, cfg) {
  if (!base?.storage) return { ok: false, message: 'Necesitas estar junto a una base.' };
  const spec = cfg.rovers?.types?.[roverType];
  if (!spec) return { ok: false, message: 'Tipo de rover desconocido.' };
  const cost = spec.cost ?? {};
  const missing = Object.entries(cost).filter(([id, amount]) => (base.storage[id] ?? 0) < amount);
  if (missing.length) {
    return { ok: false, message: `Faltan en ${base.name}: ${missing.map(([id, amount]) => `${amount - (base.storage[id] ?? 0)} ${id}`).join(', ')}.` };
  }
  for (const [id, amount] of Object.entries(cost)) base.storage[id] -= amount;
  return { ok: true, message: `${spec.label} desplegado desde ${base.name}.`, spec };
}

export function collectRoverResource(rover, resource) {
  const capacity = rover.capacity ?? 6;
  const used = Object.values(rover.cargo ?? {}).reduce((sum, n) => sum + n, 0);
  if (used >= capacity) return { ok: false, message: 'Compartimento del rover lleno. Regresa a una base.' };
  if (!resource || !(resource.id in (rover.cargo ?? {}))) return { ok: false, message: 'Recurso no compatible con el rover.' };
  rover.cargo[resource.id] = (rover.cargo[resource.id] ?? 0) + 1;
  return { ok: true, message: `Rover recolectó: ${resource.name}.` };
}

export function unloadRover(rover, base) {
  if (!rover?.cargo || !base?.storage) return { ok: false, message: 'No se pudo transferir la carga.' };
  let moved = 0;
  for (const [id, amount] of Object.entries(rover.cargo)) {
    base.storage[id] = (base.storage[id] ?? 0) + amount;
    moved += amount;
    rover.cargo[id] = 0;
  }
  return moved
    ? { ok: true, message: `Rover descargó ${moved} unidad(es) en ${base.name}.` }
    : { ok: false, message: 'El rover no lleva materiales.' };
}
