// Eventos ambientales (tormenta solar, tormenta de polvo, descenso de temperatura).
// Solo cálculos: no toca el DOM ni Phaser. Todo sale de simulation.json → events.
//
// La línea de tiempo se genera de antemano con una semilla (la de la campaña), así que
// es reproducible y el HUD puede avisar con minutos de anticipación (warnMin).

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const NO_EFFECTS = Object.freeze({ radiationMultiplier: 1, solarFactor: 1, visibility: 1, ambientDeltaC: 0 });

export function createEventTimeline(cfg, seed) {
  const e = cfg.events;
  if (!e?.enabled || !e.types?.length) return [];
  const rate = (e.ratePerSimHour ?? 0.5) * (cfg.operationalFactors?.eventRate ?? 1);
  if (!(rate > 0)) return [];

  const rand = mulberry32(((seed ?? 1) ^ 0x9e3779b9) >>> 0);
  const meanGap = 60 / rate;
  const expo = () => -Math.log(1 - rand()) * meanGap;
  const totalWeight = e.types.reduce((sum, t) => sum + (t.weight ?? 1), 0);
  const pick = () => {
    let roll = rand() * totalWeight;
    for (const t of e.types) { roll -= t.weight ?? 1; if (roll <= 0) return t; }
    return e.types[e.types.length - 1];
  };

  const horizon = e.horizonMin ?? 1440;
  const timeline = [];
  let cursor = (e.firstEventAfterMin ?? 40) + expo() * 0.5;
  while (cursor < horizon) {
    const type = pick();
    const [dMin, dMax] = type.durationMin ?? [15, 30];
    const duration = dMin + rand() * (dMax - dMin);
    timeline.push({
      id: `${type.id}-${timeline.length + 1}`,
      typeId: type.id,
      name: type.name,
      hint: type.hint ?? '',
      color: type.color ?? '#ffffff',
      startMin: cursor,
      endMin: cursor + duration,
      warnMin: type.warnMin ?? 8,
      effects: { ...NO_EFFECTS, ...(type.effects ?? {}) },
    });
    cursor += duration + (e.minGapMin ?? 25) + expo();
  }
  return timeline;
}

// Estado en un instante: eventos activos, el siguiente aviso y los efectos combinados.
export function getEventStatus(timeline, timeMin) {
  const active = [];
  let warning = null;
  for (const ev of timeline ?? []) {
    if (timeMin >= ev.startMin && timeMin < ev.endMin) active.push({ ...ev, remainingMin: ev.endMin - timeMin });
    else if (timeMin < ev.startMin && ev.startMin - timeMin <= ev.warnMin && !warning) warning = { ...ev, inMin: ev.startMin - timeMin };
  }
  const effects = { ...NO_EFFECTS };
  for (const ev of active) {
    effects.radiationMultiplier *= ev.effects.radiationMultiplier ?? 1;
    effects.solarFactor = Math.min(effects.solarFactor, ev.effects.solarFactor ?? 1);
    effects.visibility = Math.min(effects.visibility, ev.effects.visibility ?? 1);
    effects.ambientDeltaC += ev.effects.ambientDeltaC ?? 0;
  }
  return { active, warning, effects };
}

// Texto corto para el HUD.
export function describeEffects(effects) {
  const parts = [];
  if (effects.radiationMultiplier !== 1) parts.push(`dosis ×${effects.radiationMultiplier}`);
  if (effects.visibility < 1) parts.push(`visibilidad −${Math.round((1 - effects.visibility) * 100)} %`);
  if (effects.solarFactor < 1) parts.push(`carga solar −${Math.round((1 - effects.solarFactor) * 100)} %`);
  if (effects.ambientDeltaC !== 0) parts.push(`exterior ${effects.ambientDeltaC > 0 ? '+' : '−'}${Math.abs(effects.ambientDeltaC)} °C`);
  return parts.join(' · ');
}

export function eventAlert(status) {
  const ev = status.active[0];
  if (ev) {
    return { level: 'active', color: ev.color, text: `● ${ev.name} · quedan ${Math.ceil(ev.remainingMin)} min · ${describeEffects(status.effects)}`, hint: ev.hint };
  }
  if (status.warning) {
    const w = status.warning;
    return { level: 'warn', color: w.color, text: `⚠ ${w.name} en ${Math.ceil(w.inMin)} min`, hint: w.hint };
  }
  return null;
}
