// HUD del modo EVA. Solo dibuja lo que le da la simulación; no calcula nada.
const $ = (id) => document.getElementById(id);

function setBar(id, fraction, text) {
  const root = $(id);
  const f = Math.min(1, Math.max(0, fraction));
  root.querySelector('.fill').style.width = `${(f * 100).toFixed(1)}%`;
  root.querySelector('.val').textContent = text;
  root.classList.toggle('warn', f < 0.5 && f >= 0.25);
  root.classList.toggle('low', f < 0.25);
}

export function createHud(cfg) {
  // Preferencias visuales locales: no modifican el estado de la campaña.
  const settings = $('ui-settings');
  const prefKey = 'mapa-marciano-ui-v1';
  let prefs = { opacity: 88, scale: 100, stats: true, controls: true };
  try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(prefKey) ?? '{}') }; } catch { /* usa valores iniciales */ }
  const applyPrefs = () => {
    document.documentElement.style.setProperty('--ui-opacity', String(prefs.opacity / 100));
    document.documentElement.style.setProperty('--ui-scale', String(prefs.scale / 100));
    $('stats').hidden = !prefs.stats; $('controls').hidden = !prefs.controls;
    $('ui-restore').hidden = prefs.controls;
    $('ui-opacity').value = String(prefs.opacity); $('ui-opacity-value').textContent = `${prefs.opacity}%`;
    $('ui-scale').value = String(prefs.scale); $('ui-scale-value').textContent = `${prefs.scale}%`;
    $('ui-stats-visible').checked = prefs.stats; $('ui-controls-visible').checked = prefs.controls;
    try { localStorage.setItem(prefKey, JSON.stringify(prefs)); } catch { /* preferencias opcionales */ }
  };
  applyPrefs();
  $('ui-restore').addEventListener('click', () => { prefs.controls = true; applyPrefs(); });
  $('btn-ui-settings').addEventListener('click', () => {
    settings.hidden = !settings.hidden;
    $('btn-ui-settings').setAttribute('aria-expanded', String(!settings.hidden));
  });
  $('ui-opacity').addEventListener('input', (event) => { prefs.opacity = Number(event.target.value); applyPrefs(); });
  $('ui-scale').addEventListener('input', (event) => { prefs.scale = Number(event.target.value); applyPrefs(); });
  $('ui-stats-visible').addEventListener('change', (event) => { prefs.stats = event.target.checked; applyPrefs(); });
  $('ui-controls-visible').addEventListener('change', (event) => { prefs.controls = event.target.checked; applyPrefs(); });

  const a = cfg.astronaut;
  const rad = cfg.radiation;
  if (!rad?.enabled) {
    $('bar-rad').hidden = true;
    $('r-rad').hidden = true;
  }

  return {
    // Muestra de dónde vienen los datos del terreno (procedural o DEM) y avisos de carga.
    setSource(source, notice = '') {
      const el = $('data-source');
      el.textContent = `Terreno: ${source.label} · ${source.detail}${notice ? ` · ${notice}` : ''}`;
      el.classList.toggle('mock', Boolean(source.mock) || source.kind === 'procedural');
    },

    onRestart(callback) {
      const go = () => callback();
      $('btn-restart').addEventListener('click', go);
      $('btn-again').addEventListener('click', go);
    },

    update(state, extra) {
      setBar('bar-o2', state.oxygen / a.oxygenMinutes, `${Math.ceil(state.oxygen)} min de aire`);
      setBar('bar-stamina', state.stamina / a.staminaMax, state.exhausted ? 'Agotado' : `${Math.round(state.stamina)}%`);
      const tempFrac = (state.suitTempC - a.suitTempMinC) / (a.suitTempStartC - a.suitTempMinC);
      setBar('bar-temp', tempFrac, `${state.suitTempC.toFixed(1)} °C en el traje`);

      if (rad?.enabled) {
        const spent = state.radiationMSv / rad.limitMSv;
        setBar('bar-rad', 1 - spent, `${(state.radiationMSv * 1000).toFixed(1)} / ${(rad.limitMSv * 1000).toFixed(0)} µSv`);
        const shieldPct = Math.round((extra.radiationShield ?? 0) * 100);
        $('r-rad').textContent = `Radiación ahora: ${state.radiationRateMSvPerDay.toFixed(2)} mSv/día · blindaje ${shieldPct} %`;
      }

      const ea = extra.eventAlert;
      const banner = $('event-banner');
      banner.hidden = !ea;
      if (ea) {
        banner.textContent = ea.hint ? `${ea.text} — ${ea.hint}` : ea.text;
        banner.className = ea.level;
        banner.style.borderColor = ea.color;
      }
      $('dust').style.opacity = String(Math.min(0.7, (1 - (extra.visibility ?? 1)) * 0.9));
      $('r-route').textContent = extra.routeInfo || `Exploración: ${extra.discoveredSectorCount ?? 0} sectores · P · Ruta · M · Waypoint`;
      if (extra.radiationKitActive) $('r-rad').textContent += ' · kit activo';

      const h = Math.floor(state.timeMin / 60);
      const m = Math.floor(state.timeMin % 60);
      $('r-time').textContent = `Tiempo en EVA: ${h} h ${String(m).padStart(2, '0')} min`;
      $('r-ambient').textContent = `Exterior: ${extra.ambientC.toFixed(0)} °C`;
      $('r-slope').textContent = `Pendiente aquí: ${extra.slopeDeg.toFixed(0)}°`;
      $('r-goal').textContent = `Distancia a la base principal: ${(extra.goalDistM / 1000).toFixed(2)} km`;

      const inventory = extra.inventory ?? state.inventory;
      $('inventory-count').textContent = `${extra.inventoryUsed ?? state.inventoryUsed}/${extra.inventoryCapacity ?? 12}`;
      $('inventory-items').textContent = Object.entries(inventory).map(([id, count]) => `${({ ice: 'Hielo', regolith: 'Regolito', metal: 'Metal' })[id] ?? id}: ${count}`).join(' · ');
      $('interaction').textContent = extra.interaction || '';
      $('rover-count').textContent = `${extra.roverCount ?? extra.roverStatus ?? '0'}`;
      $('rover-info').textContent = extra.roverStatus || 'Sin rovers desplegados.';
      $('base-count').textContent = `${extra.baseCount ?? 1} activa(s)`;
      $('base-info').textContent = extra.nearbyBase
        ? `${extra.nearbyBase} · Almacén: ${Object.entries(extra.baseStorage ?? {}).map(([id, n]) => `${({ ice: 'Hielo', regolith: 'Regolito', metal: 'Metal' })[id] ?? id}: ${n}`).join(' · ')} · Capacidad ${extra.baseSystems?.storageCapacity ?? 30} · Energía ${Math.floor(extra.baseSystems?.energy ?? 0)}/${extra.baseSystems?.energyCapacity ?? 10} · Alimento ${Math.floor(extra.baseSystems?.food ?? 0)} · Investigación ${Math.floor(extra.baseSystems?.research ?? 0)}${extra.baseSystems?.pending ? ` · Muestras en laboratorio ${extra.baseSystems.pending}` : ''} · Módulos: ${(extra.baseSystems?.modules ?? []).map((id) => ({ lab: 'Laboratorio', greenhouse: 'Invernadero', generator: 'Generador', battery: 'Baterías', warehouse: 'Almacén', hangar: 'Hangar', rad_shelter: 'Refugio RAD' })[id] ?? id).join(', ') || 'ninguno'}`
        : `Bases desplegadas: ${extra.baseCount ?? 1}`;

      const toast = $('toast');
      let msg = extra.notice || '';
      if (!msg && extra.paused) msg = 'En pausa. Presiona Espacio para continuar.';
      else if (!msg && extra.blocked) msg = 'Pendiente demasiado fuerte para pasar por ahí.';
      else if (!msg && state.exhausted && state.status === 'playing') msg = 'Estás agotado: camina lento y gasta más aire. Descansa para recuperarte.';
      toast.textContent = msg;
      toast.hidden = !msg;
    },

    // Condiciones tomadas de safety.json (el mismo archivo que usa el panel del mapa).
    setSafety(text) {
      $('safety-link').textContent = text;
    },

    showEnd(state, summary = {}) {
      const won = state.status === 'won';
      $('end-title').textContent = won ? 'Expedición completada' : 'Misión interrumpida';
      const left = Math.round(state.oxygen);
      const dose = rad?.enabled ? ` Dosis acumulada: ${(state.radiationMSv * 1000).toFixed(1)} µSv de ${(rad.limitMSv * 1000).toFixed(0)}.` : '';
      $('end-text').textContent = (won
        ? `Terminaste en ${Math.round(state.timeMin)} min con ${left} min de aire de sobra.`
        : `${state.reason} Duraste ${Math.round(state.timeMin)} min en la superficie.`) + dose;
      const list = $('end-science');
      list.replaceChildren();
      const hasScience = Boolean(summary.total);
      $('end-score').hidden = !hasScience;
      if (hasScience) {
        $('end-score').textContent = `Muestras: ${summary.samples.length}/${summary.total} · Puntaje: ${summary.score}`;
        for (const sample of summary.samples) {
          const li = document.createElement('li');
          li.textContent = `${sample.name}: ${sample.objective}`;
          list.append(li);
        }
      }
      $('end').hidden = false;
    },

    hideEnd() {
      $('end').hidden = true;
    },
  };
}
