// Simulación económica de módulos de base. El tiempo está expresado en minutos simulados.
export function processBaseModules(bases, dtMin) {
  if (!(dtMin > 0)) return;
  for (const base of bases ?? []) {
    base.modules ??= [];
    base.moduleClock ??= {};
    base.storage ??= { ice: 0, regolith: 0, metal: 0 };
    const has = (id) => base.modules.includes(id);
    const advance = (key) => { base.moduleClock[key] = (base.moduleClock[key] ?? 0) + dtMin; return base.moduleClock[key]; };

    if (has('generator')) {
      const capacity = base.energyCapacity ?? (has('battery') ? 50 : 10);
      const elapsed = advance('generator');
      const units = Math.floor(elapsed / 10);
      if (units > 0) {
        base.energy = Math.min(capacity, (base.energy ?? 0) + units);
        base.moduleClock.generator = elapsed % 10;
      }
    }

    if (has('greenhouse')) {
      const elapsed = advance('greenhouse');
      const cycles = Math.min(Math.floor(elapsed / 120), base.storage.ice ?? 0, Math.floor(base.energy ?? 0));
      if (cycles > 0) {
        base.storage.ice -= cycles;
        base.energy -= cycles;
        base.food = (base.food ?? 0) + cycles * 4;
        base.moduleClock.greenhouse = elapsed - cycles * 120;
      }
    }

    if (has('lab') && (base.pendingSamples ?? 0) > 0) {
      const elapsed = advance('lab');
      const processed = Math.min(base.pendingSamples, Math.floor(elapsed / 30), Math.floor(base.energy ?? 0));
      if (processed > 0) {
        base.pendingSamples -= processed;
        base.energy -= processed;
        base.researchPoints = (base.researchPoints ?? 0) + processed * 100;
        base.moduleClock.lab = elapsed - processed * 30;
      }
    }
  }
}
