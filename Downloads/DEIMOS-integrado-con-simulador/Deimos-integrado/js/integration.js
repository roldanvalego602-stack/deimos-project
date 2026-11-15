(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const api = window.DEIMOS;
  const mapMount = api.clearPlaceholder('mars-explorer');
  const archiveMount = api.clearPlaceholder('mission-archives');
  const simMount = api.clearPlaceholder('survival-simulator');
  function status(id, text) { document.querySelectorAll('[data-dmx-module-status="'+id+'"]').forEach(e=>e.textContent=text); }
  status('mars-explorer','Ready'); status('survival-simulator','Integrated'); status('mission-archives','Integrated');
  let mapFrame, archiveFrame;
  const bar=document.createElement('div'); bar.className='integration-toolbar';
  bar.innerHTML='<button class="dmx-btn dmx-btn--ghost" id="connect-map">Reload map</button><button class="dmx-btn dmx-btn--ghost" id="map-fullscreen">Full screen</button><span id="map-connection" role="status">Map ready to launch</span>';
  mapMount.before(bar);
  function launchMap() {
    if(mapFrame) mapFrame.remove();
    mapFrame=document.createElement('iframe'); mapFrame.className='integration-frame map-frame'; mapFrame.title='Mars Explorer and Project voice assistant'; mapFrame.allow='microphone; fullscreen'; mapFrame.allowFullscreen=true; mapFrame.src='./mars-explorer/index.html'; mapMount.append(mapFrame); $('map-connection').textContent='Connecting to Mars…'; status('mars-explorer','Connecting');
  }
  $('connect-map').onclick=launchMap;
  $('map-fullscreen').onclick=()=>{ if(document.fullscreenElement) document.exitFullscreen(); else mapMount.requestFullscreen?.().catch(()=>{}); };
  function mapWindow(){return mapFrame?.contentWindow;}
  function loaded(){return !!mapWindow()?.DEIMOS_MAP_STATUS?.ready;}
  function openOperations(page){api.navigateTo('mars-explorer'); if(!loaded()){ $('map-connection').textContent='Connect the map first.'; return; } const w=mapWindow(); const doc=w.document; if(doc.getElementById('mission-panel')?.hidden)doc.getElementById('open-mission')?.click(); w.DEIMOS_DASHBOARD?.openTab('operations'); w.DEIMOS_OPERATIONS?.openPage(page);}
  // Archive: one persistent frame, isolated original styles.
  function loadArchive(){if(archiveFrame)return; archiveFrame=document.createElement('iframe'); archiveFrame.className='integration-frame archive-frame'; archiveFrame.title='Interactive Mars mission archives'; archiveFrame.src='./mission-archives/index.html'; archiveMount.append(archiveFrame);}
  let simFrame;
  const simBar=document.createElement('div'); simBar.className='integration-toolbar';
  simBar.innerHTML='<button class="dmx-btn dmx-btn--ghost" id="sim-reload">Reload simulator</button><button class="dmx-btn dmx-btn--ghost" id="sim-fullscreen">Full screen</button><a class="dmx-btn dmx-btn--ghost" href="./simulator/web/eva.html" target="_blank" rel="noopener">Open separately</a><span> EVA training · independent simulation</span>';
  simMount.before(simBar);
  function loadSim(){if(simFrame)return; simFrame=document.createElement('iframe'); simFrame.className='integration-frame sim-frame'; simFrame.title='EVA Mars survival simulator'; simFrame.allowFullscreen=true; simFrame.src='./simulator/web/eva.html'; simMount.append(simFrame);}
  $('sim-reload').onclick=()=>{simFrame?.remove();simFrame=null;loadSim();};
  $('sim-fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else simMount.requestFullscreen?.().catch(()=>{});};
  window.addEventListener('message',e=>{if(e.origin===location.origin && e.source===simFrame?.contentWindow && e.data?.type==='deimos:eva-back') api.navigateTo('mars-explorer');});
  function viewChanged(view){if(view==='mars-explorer'){if(!mapFrame)launchMap(); setTimeout(()=>mapWindow()?.viewer?.resize(),150);}else{mapWindow()?.DEIMOS_VOICE_STOP?.();} if(view==='mission-archives')loadArchive(); if(view==='survival-simulator'){loadSim();simFrame.contentWindow?.postMessage({type:'deimos:eva-visible',visible:true},location.origin);}else if(simFrame){simFrame.contentWindow?.postMessage({type:'deimos:eva-visible',visible:false},location.origin);}}
  document.addEventListener('deimos:viewchange',e=>viewChanged(e.detail.view));
  setInterval(()=>{if(mapFrame){const w=mapWindow(), state=w?.DEIMOS_MAP_STATUS; if(state?.ready){$('map-connection').textContent=state.failedModules?`${state.failedModules} module(s) need attention`:'Mars Explorer online';status('mars-explorer',state.failedModules?'Partial':'Integrated');}else if(state?.error){$('map-connection').textContent='Cesium connection failed. Verify token and internet.';status('mars-explorer','Connection failed');}}},1000);
  viewChanged(api.getCurrentView());
})();
