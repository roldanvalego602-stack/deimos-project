// DEIMOS PROJECT — Voice Command System V4
function enableVoiceControls(viewer, tileset) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const el = id => document.getElementById(id);
    const button = el('voice-button'), status = el('voice-status');
    const transcript = el('voice-transcript'), language = el('voice-language');
    if (!button || !status || !transcript || button.dataset.voiceV3) return;
    if (!Recognition) { status.textContent = 'Voice recognition unavailable'; button.disabled = true; return; }
    button.dataset.voiceV3 = 'true';
    const normalize = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[¿?¡!;:]/g,' ').replace(/\s+/g,' ').trim();
    const wake = /^(?:(?:oye|hola|hey|ok)\s+)?(?:project|proyect[o]?|proyecte|proyekt|proyec|projec|pro\s+ject|pro\s+yec)\b[,.\s]*/;
    let enabled = false, active = false, recognition = null, speaking = false;
    let restart = null, deadline = null, silence = null, watchdog = null, speechTimer = null;
    let pending = null, captured = '', confirmation = null;
    const locale = () => language?.value || 'es-MX';
    const es = () => locale().startsWith('es');
    const say = (a,b) => es() ? a : b;
    function ui(message, state) {
        status.textContent = message; button.dataset.state = state;
        button.classList.toggle('listening', enabled && !speaking);
        button.setAttribute('aria-pressed', String(enabled));
    }
    function clearSessionTimers() { clearTimeout(deadline); clearTimeout(silence); clearTimeout(watchdog); }
    function stopSession() {
        if (!recognition || recognition._deimosStopping) return;
        recognition._deimosStopping = true;
        try { recognition.stop(); } catch (_) {}
        clearTimeout(watchdog);
        const old = recognition;
        watchdog = setTimeout(() => {
            if (recognition !== old) return;
            recognition = null;
            try { old.abort(); } catch (_) {}
            afterSession();
        }, 1800);
    }
    function disable() {
        stopMotion();
        enabled = false; active = false; confirmation = null; pending = null;
        clearSessionTimers(); clearTimeout(restart); clearTimeout(speechTimer);
        const old = recognition; recognition = null;
        try { old?.abort(); } catch (_) {}
        speaking = false; window.speechSynthesis?.cancel();
        ui(say('Micrófono desactivado','Microphone off'),'off');
    }
    function schedule(delay = 250) {
        clearTimeout(restart);
        if (enabled && !speaking && !recognition) restart = setTimeout(start, delay);
    }
    function answer(text, follow = false) {
        active = follow; ui(text, follow ? 'active' : 'standby');
        console.log('DEIMOS RESPONSE:', text);
        if (!window.speechSynthesis || !enabled) { schedule(); return; }
        speaking = true; button.classList.remove('listening');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = locale(); utterance.rate = 1.05;
        let done = false;
        const finish = () => { if (done) return; done = true; clearTimeout(speechTimer); speaking = false; schedule(); };
        utterance.onend = utterance.onerror = finish;
        speechTimer = setTimeout(() => { window.speechSynthesis.cancel(); finish(); }, 16000);
        window.speechSynthesis.speak(utterance);
    }
    function start() {
        if (!enabled || recognition || speaking) return;
        const r = new Recognition(); recognition = r; captured = ''; pending = null;
        r.lang = locale(); r.continuous = false; r.interimResults = true; r.maxAlternatives = 1;
        const valid = () => recognition === r && enabled;
        r.onstart = () => { if (!valid()) return; ui(active ? say('Escuchando instrucción…','Listening for command…') : say('Di «Project»','Say “Project”'), active ? 'active' : 'standby'); };
        r.onresult = event => {
            if (!valid()) return;
            const results = Array.from(event.results);
            captured = results.map(x => x[0].transcript).join(' ').trim();
            transcript.textContent = captured;
            console.log('DEIMOS HEARD:', captured);
            clearTimeout(silence);
            if (results.every(x => x.isFinal)) { pending = captured; stopSession(); }
            else silence = setTimeout(stopSession, 900);
        };
        r.onspeechend = () => { if (valid()) stopSession(); };
        r.onnomatch = () => { if (valid()) { pending = ''; stopSession(); } };
        r.onerror = e => {
            if (!valid()) return;
            console.log('DEIMOS VOICE:', e.error);
            if (!['aborted','no-speech'].includes(e.error)) { disable(); ui('Voice error: ' + e.error,'off'); }
        };
        r.onend = () => { if (!valid()) return; recognition = null; afterSession(); };
        deadline = setTimeout(() => { if (valid()) stopSession(); }, active ? 9000 : 12000);
        try { r.start(); } catch (e) { disable(); ui('Voice error: ' + e.message,'off'); }
    }
    function afterSession() {
        clearSessionTimers();
        // Never execute an unconfirmed partial transcript.
        const text = pending; pending = null;
        if (!enabled) return;
        if (!text) {
            if (active) { confirmation = null; answer(say('No te escuché. Di Project para intentarlo otra vez.','I did not hear you. Say Project to retry.')); }
            else schedule();
            return;
        }
        let command = normalize(text);
        const activated = wake.test(command);
        if (activated) command = command.replace(wake,'').trim();
        if (!activated && !active) { schedule(); return; }
        if (!command) { answer(say('Te escucho.','Listening.'),true); return; }
        active = false;
        run(command);
    }
    button.addEventListener('click', () => { if (enabled) disable(); else { enabled = true; active = true; start(); } });
    language?.addEventListener('change', () => { if (enabled) { disable(); enabled = true; start(); } });
    window.addEventListener('pagehide',disable);

    // Existing application controls; no synthetic science data.
    function press(id) { const e = el(id); if (!e || e.disabled) return false; e.click(); return true; }
    function tab(name) { if (el('mission-panel')?.hidden) press('open-mission'); window.DEIMOS_DASHBOARD?.openTab(name); }
    function operation(name) { tab('operations'); window.DEIMOS_OPERATIONS?.openPage(name); }
    function set(id,value) { const e = el(id); if (!e || e.disabled) return false; const old = e.value; if (e.type === 'checkbox') e.checked = Boolean(value); else { e.value = String(value); if (!e.value || (e.validity && !e.validity.valid)) { e.value = old; return false; } } e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true; }
    function metric(id) { const s = el(id)?.textContent.trim(); return s && !['—','N/A','Unknown'].includes(s) ? s : null; }
    const unavailable = () => say('No está disponible esa función o faltan datos.','That function or data is unavailable.');
    function action(id, page, message) { if(page) tab(page); return press(id) ? message : unavailable(); }
    function report(id, label, unit='') { const v=metric(id); return v === null ? unavailable() : `${label}: ${v} ${unit}.`; }
    function mapping(on) { tab('overview'); const b=el('start-route'); if(!b) return unavailable(); if(b.classList.contains('active')!==on) press('start-route'); return on ? say('Trazado activado. Apunta al lugar y di marca punto.','Mapping active. Aim and say add waypoint.') : say('Trazado finalizado.','Mapping finished.'); }
    function waypoint() {
        stopMotion();
        tab('overview'); const b=el('start-route'); if(!b) return unavailable();
        if(!b.classList.contains('active')) press('start-route');
        const canvas=viewer.scene.canvas, handler=viewer.screenSpaceEventHandler;
        const position=new Cesium.Cartesian2(canvas.clientWidth/2,canvas.clientHeight/2);
        const click=handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        const before=metric('mission-points'); if(!click) return unavailable();
        click({position}); const after=metric('mission-points');
        return before!==after ? say(`Punto ${after} registrado.`,`Waypoint ${after} registered.`) : say('No se pudo marcar el centro del mapa. Apunta a la superficie de Marte.','Could not mark the map center. Aim at Mars.');
    }
    const regionWords = {jezero:/\b(jezero|yesero|yecero|jazero|jizero|jesero)\b/,gale:/\b(gale|geil|gail)\b/,olympus:/\b(olympus|olimpo|olimpus)\b/,valles:/\b(valles|marineris|mariner)\b/,tharsis:/\b(tharsis|tarsis)\b/,arcadia:/\b(arcadia|arkadia)\b/};
    const nums={cero:0,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,quince:15,veinte:20,veinticinco:25,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,noventa:90,cien:100,ciento:100,doscientos:200,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
    function numeric(s) { const n=s.match(/-?\d+(?:[.,]\d+)?/); if(n) return Number(n[0].replace(',','.')); const w=s.split(/\s+/).find(x=>Object.hasOwn(nums,x)); return w===undefined ? NaN : nums[w]; }
    const commandDictionary = {

    "vista global": [
        "muestra marte",
        "ver marte",
        "planeta completo",
        "regresa al inicio",
        "vista planetaria",
        "vista general",
        "alejate del planeta",
        "show mars",
        "global view"
    ],

    "acercate": [
        "acerca",
        "acercar",
        "acerca la camara",
        "acerca el mapa",
        "quiero ver mas cerca",
        "aumenta el zoom",
        "mas cerca",
        "zoom in"
    ],

    "alejate": [
        "aleja",
        "alejar",
        "aleja la camara",
        "reduce el zoom",
        "mas lejos",
        "retrocede",
        "zoom out"
    ],

    "muestra topografia": [
        "relieve",
        "elevaciones",
        "datos topograficos",
        "capa topografica",
        "mapa topografico",
        "muestra el relieve",
        "activa mola",
        "ver topografia",
        "topographic map"
    ],

    "muestra radiacion": [
        "datos de radiacion",
        "informacion radiologica",
        "monitor de radiacion",
        "analisis de radiacion",
        "radiacion solar",
        "abre radiacion",
        "ver radiacion",
        "radiation data"
    ],

    "cuanta radiacion": [
        "cuanta radiacion hay",
        "cuanta radiacion recibire",
        "cual es la dosis",
        "dosis de radiacion",
        "exposicion estimada",
        "nivel de radiacion",
        "radiation exposure"
    ],

    "muestra datos opticos": [
        "capa optica",
        "imagenes de marte",
        "imagenes satelitales",
        "fotografias orbitales",
        "activa viking",
        "mapa optico",
        "optical imagery"
    ],

    "superficie natural": [
        "quita las capas",
        "desactiva las capas",
        "mapa original",
        "superficie original",
        "vista normal",
        "colores naturales",
        "natural surface"
    ],

    "planificar mision": [
        "nueva mision",
        "nueva expedicion",
        "crear expedicion",
        "preparar mision",
        "planear expedicion",
        "abrir planificador",
        "quiero explorar",
        "mission planner"
    ],

    "iniciar ruta": [
        "crear ruta",
        "trazar ruta",
        "comenzar recorrido",
        "iniciar recorrido",
        "dibujar ruta",
        "marcar puntos",
        "start route"
    ],

    "finalizar ruta": [
        "terminar recorrido",
        "detener trazado",
        "terminar ruta",
        "finalizar recorrido",
        "ruta completada",
        "finish route"
    ],

    "analizar terreno": [
        "analiza el relieve",
        "calcula las pendientes",
        "calcula la elevacion",
        "analisis del terreno",
        "estudia el terreno",
        "analiza la superficie",
        "terrain analysis"
    ],

    "evaluar riesgos": [
        "analiza los peligros",
        "muestra los riesgos",
        "condiciones ambientales",
        "evaluacion de la mision",
        "que riesgos existen",
        "risk assessment"
    ],

    "comparar rutas": [
        "compara recorridos",
        "rutas alternativas",
        "comparacion de rutas",
        "cual es la mejor ruta",
        "compare routes"
    ],

    "guardar ruta": [
        "guarda el recorrido",
        "guardar recorrido",
        "almacena la ruta",
        "conserva la ruta",
        "save route"
    ],

    "estado de la mision": [
        "informe de la mision",
        "reporte de expedicion",
        "resumen de resultados",
        "como va la mision",
        "cuanto durara la mision",
        "cuanto falta",
        "mission report",
        "mission status"
    ],

    "temperatura": [
        "cuanto frio hace",
        "condiciones termicas",
        "temperatura ambiental",
        "que temperatura hay",
        "consulta la temperatura",
        "temperature"
    ],

    "cierra el panel": [
        "cerrar ventana",
        "oculta el panel",
        "quita el menu",
        "cierra el menu",
        "cerrar informacion",
        "close panel"
    ]
};

    // V4: camera motion, guided routes and local scientific knowledge.
    let motion = null;
    function stopMotion() { if (motion !== null) { clearInterval(motion); motion = null; } }
    function cameraCommand(c) {
        const cam = viewer.camera;
        if (/^(deten|detente|para|alto|stop)(?: la camara| el mapa| el giro| de girar| camera)?[.! ]*$/.test(c)) {
            stopMotion(); cam.cancelFlight(); return say('Movimiento detenido.','Camera stopped.');
        }
        const rotate = /gir[aeo]|rot[ae]|vuelta|orbita|rotate|spin|inclina/.test(c);
        const zooming = /acerca|aleja|mas cerca|mas lejos|zoom|distancia de la camara/.test(c);
        if (!rotate && !zooming && !/^(izquierda|derecha|arriba|abajo)$/.test(c)) return null;
        stopMotion(); cam.cancelFlight();
        if (zooming) {
            const out = /aleja|lejos|zoom out|reduce.*zoom/.test(c);
            const big = /mucho|bastante|considerable|maximo|completo|total|much|far/.test(c);
            if (out && /maximo|completo|total/.test(c)) { viewer.flyTo(tileset,{duration:2}); return say('Vista planetaria.','Global view.'); }
            const h = Math.max(100,cam.positionCartographic.height);
            const factor = c.match(/(\d+(?:[.,]\d+)?)\s*(?:veces|times|x)\b/);
            const percentage = c.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por ciento|percent)/);
            const mult = factor ? Math.min(30,Math.max(1,Number(factor[1].replace(',','.')))) : big ? 5 : 1.5;
            const frac = percentage ? Math.min(0.95,Math.max(0,Number(percentage[1].replace(',','.'))/100)) : null;
            const amount = frac!==null ? h*frac : out ? h*(mult-1) : h*(1-1/mult);
            if(out) cam.zoomOut(Math.min(amount,50000000)); else cam.zoomIn(Math.min(amount,Math.max(0,h-100)));
            return say(out?'Alejando la cámara.':'Acercando la cámara.',out?'Zooming out.':'Zooming in.');
        }
        const direction = /izquierda|left|oeste/.test(c)?'rotateLeft':/arriba|up|norte/.test(c)?'rotateUp':/abajo|down|sur/.test(c)?'rotateDown':'rotateRight';
        const infinite = /continu|sin parar|hasta que|indefin|keep|continuously/.test(c);
        const n = /ciento ochenta/.test(c)?180:/trescientos sesenta/.test(c)?360:numeric(c), degrees = Number.isFinite(n)?Math.max(1,Math.min(360,Math.abs(n))):/media vuelta/.test(c)?180:/vuelta completa/.test(c)?360:/mucho|bastante/.test(c)?90:30;
        const total=Cesium.Math.toRadians(degrees);
        let moved=0;
        motion=setInterval(()=>{ try { const step=infinite?0.018:Math.min(0.025,total-moved); if(step<=0){stopMotion();return;} cam[direction](step); moved+=step; viewer.scene.requestRender?.(); if((!infinite&&moved>=total-1e-7)||(infinite&&moved>=18))stopMotion(); }catch(e){stopMotion();console.warn(e);} },30);
        return infinite?say('Girando. Di Project, detén el giro, para parar. Se detendrá automáticamente tras treinta segundos.','Rotating. Say Project, stop, to stop. Automatic stop after thirty seconds.'):say(`Girando ${degrees} grados.`,`Rotating ${degrees} degrees.`);
    }
    function routeGuide() {
        const n=Number(metric('mission-points')||0);
        const route=el('start-route');
        if(!route) return unavailable();
        tab('overview');
        if(n===0) { mapping(true); return {text:say('Apunta al hábitat con la cámara y di marca punto. Será el punto inicial.','Aim at your habitat and say mark waypoint.'),follow:true}; }
        if(n===1) { mapping(true); return {text:say('Ya tienes el origen. Gira o acerca el mapa hacia el primer destino y di marca punto.','Origin registered. Aim at the destination and say mark waypoint.'),follow:true}; }
        return {text:say(`Hay ${n} puntos. Puedes añadir otro, finalizar la ruta o analizar el terreno. Comprueba el retorno y la autonomía.`,`There are ${n} points. Add another, finish the route or analyze terrain. Check return and autonomy.`),follow:true};
    }
    const facts=[
      [/\b(fobos|phobos)\b.*\b(deimos|lunas|moons)\b|cuantas lunas|satelites.*marte|moons of mars/, 'Marte tiene dos lunas: Fobos y Deimos.','Mars has two moons, Phobos and Deimos.'],
      [/\b(deimos|fobos|phobos)\b/, 'Fobos y Deimos son las dos lunas naturales de Marte. Deimos es la más pequeña y distante.','Phobos and Deimos are Mars’s two moons. Deimos is smaller and farther away.'],
      [/gravedad|gravity/, 'La gravedad superficial de Marte es aproximadamente 3.71 metros por segundo cuadrado, cerca del 38 por ciento de la terrestre.','Mars surface gravity is about 3.71 meters per second squared, around 38 percent of Earth’s.'],
      [/duracion.*(sol|dia)|cuanto.*dura.*(sol|dia)|horas.*dia.*marte|martian day|what is a sol|que es un sol/, 'Un sol marciano dura aproximadamente 24 horas y 39 minutos.','A Martian sol lasts approximately 24 hours and 39 minutes.'],
      [/cuanto.*(ano|year)|duracion.*ano|martian year/, 'Un año marciano dura unos 687 días terrestres.','A Martian year lasts about 687 Earth days.'],
      [/atmosfera|atmosphere/, 'La atmósfera de Marte está compuesta principalmente por dióxido de carbono. Es mucho más tenue que la terrestre.','Mars has a thin atmosphere composed mostly of carbon dioxide.'],
      [/\b(agua|water)\b.*\b(marte|mars|hielo|liquida)\b|hay agua/, 'Existe hielo de agua en Marte y evidencia geológica de agua líquida en el pasado.','Mars has water ice and geological evidence of past liquid water.'],
      [/que es.*mola|what is.*mola/, 'MOLA es el altímetro láser de Mars Global Surveyor. Sus mediciones permiten reconstruir la topografía marciana.','MOLA is the Mars Global Surveyor laser altimeter, used to map Martian topography.'],
      [/que es.*rad\b|what is.*rad\b/, 'RAD es el detector de evaluación de radiación de Curiosity. Mide el ambiente de radiación ionizante.','RAD is Curiosity’s Radiation Assessment Detector.'],
      [/que es.*rems|what is.*rems/, 'REMS es la estación de monitorización ambiental de Curiosity. Registra variables meteorológicas.','REMS is Curiosity’s environmental monitoring station.'],
      [/\bcuriosity\b|\bperseverance\b/, 'Curiosity explora Gale desde 2012. Perseverance explora Jezero desde 2021.','Curiosity explores Gale since 2012; Perseverance explores Jezero since 2021.'],
      [/\b(jezero|yesero)\b/, 'Jezero conserva evidencias de un antiguo lago y delta; es el lugar de exploración de Perseverance.','Jezero contains evidence of an ancient lake and delta, explored by Perseverance.'],
      [/\bgale\b/, 'Gale es el cráter investigado por Curiosity. Sus estratos documentan cambios ambientales antiguos.','Gale crater is explored by Curiosity and preserves ancient environmental records.'],
      [/\b(olympus|olimpo)\b/, 'Olympus Mons es un enorme volcán en escudo de Marte.','Olympus Mons is an enormous shield volcano on Mars.'],
      [/\b(valles|marineris)\b/, 'Valles Marineris es un sistema gigantesco de cañones marcianos.','Valles Marineris is a giant Martian canyon system.'],
      [/quien eres|como te llamas|who are you/, 'Soy Project, el asistente de navegación y operaciones de Deimos.','I am Project, the Deimos navigation and operations assistant.'],
      [/capital de francia|capital of france/, 'París.','Paris.'],
      [/\b(hora|time)\b.*\b(ahora|actual|is it)\b|que hora es/,()=>new Date().toLocaleTimeString(locale()),()=>new Date().toLocaleTimeString(locale())]
    ];
    function knowledge(c) { const f=facts.find(([re])=>re.test(c)); if(!f)return null; const val=es()?f[1]:f[2]; return typeof val==='function'?val():val; }
    function quickMath(c) {
        const r=c.match(/^(?:cuanto es |calcula |what is )?(\d+(?:[.,]\d+)?)\s*(mas|menos|por|entre|dividido entre|\+|-|\*|\/)\s*(\d+(?:[.,]\d+)?)[?. ]*$/);
        if(!r)return null; const a=Number(r[1].replace(',','.')), b=Number(r[3].replace(',','.')); const op=r[2]; const result=/mas|\+/.test(op)?a+b:/menos|-/.test(op)?a-b:/por|\*/.test(op)?a*b:b!==0?a/b:NaN; return Number.isFinite(result)?String(result):say('No se puede dividir entre cero.','Cannot divide by zero.');
    }

    function dispatch(raw, fallback = false) {
        const c=normalize(raw).replace(wake,''); const m=re=>re.test(c);
        if (confirmation) { const fn=confirmation; confirmation=null; if(m(/^(si|confirmar|confirmo|yes|confirm)\b/)) return fn(); if(m(/^(no|cancelar|cancel)\b/)) return say('Cancelado.','Cancelled.'); }
        if(m(/deja de escuchar|apaga.*microfono|desactiva.*microfono|stop listening|disable microphone/)) { disable(); return null; }
        const math=quickMath(c); if(math!==null)return math;
        if(m(/ayudame.*ruta|guiame.*ruta|asistente.*ruta|ayuda.*traz|guide.*route/)) return routeGuide();
        if(m(/cuantos puntos|puntos.*ruta|waypoint count/)) return report('mission-points',say('Puntos registrados','Registered waypoints'));
        if(m(/cuanto.*(falta|margen).*autonomia|margen.*recursos/)) return report('ops-resource-status',say('Estado de recursos','Resource status'));
        if(!m(/radiacion|temperatura|presion|autonomia|ruta|aterrizaje|viaje|duracion.*mision|distancia|oxigeno/) && m(/^(?:que es|quien|cual|cuantas|cuantos|cuanto|por que|como|hay|what|who|why|how|is there)\b/)) { const fact=knowledge(c);if(fact!==null)return fact; }
        if(!m(/ruta|trayecto|radiacion|terreno|mision|panel|capas|aterrizaje|waypoint/)) { const movement=cameraCommand(c); if(movement!==null)return movement; }
        if(m(/ayuda|comandos disponibles|help|commands/)) { console.table(window.DEIMOS_VOICE_COMMANDS); return say('Puedes navegar, marcar puntos, analizar terreno, consultar radiación, clima, recursos, aterrizaje y exportar informes. Consulta la consola para ejemplos.','You can navigate, mark waypoints, analyze terrain, query radiation, weather, resources, landing and export reports.'); }
        if(m(/borra.*rutas guardadas|clear saved routes|elimina.*todas.*rutas/)) { confirmation=()=>action('clear-comparison-routes','routes',say('Rutas guardadas eliminadas.','Saved routes cleared.')); return {text:say('¿Confirmas eliminar las rutas guardadas?','Confirm clearing saved routes?'),follow:true}; }
        if(m(/borra.*ruta|limpia.*ruta|elimina.*ruta actual|clear route/)) { confirmation=()=>action('clear-route','overview',say('Ruta actual eliminada.','Current route cleared.')); return {text:say('¿Confirmas eliminar la ruta actual?','Confirm clearing current route?'),follow:true}; }
        if(m(/exporta|descarga.*informe|genera.*informe|export report|export json/)) { operation('report'); return action(m(/json/)?'ops-export-json':'ops-export-report',null,say('Solicitud de exportación enviada.','Export requested.')); }
        if(m(/marca.*punto|agrega.*punto|anade.*punto|pon.*punto|marca.*habitat|marca.*destino|add waypoint|mark waypoint/)) return waypoint();
        if(m(/deshacer punto|quita.*ultimo punto|elimina.*ultimo punto|undo waypoint/)) return action('undo-point','overview',say('Solicitud de deshacer enviada.','Undo requested.'));
        if(m(/finaliza.*ruta|termina.*ruta|deten.*trazado|finalizar recorrido|finish mapping|finish route/)) return mapping(false);
        if(m(/inicia.*ruta|crea.*ruta|traza.*ruta|dibuja.*ruta|comienza.*recorrido|start mapping|start route/)) return mapping(true);
        if(m(/guarda.*ruta|guardar recorrido|save route/)) { tab('routes'); return press('save-comparison-route') ? metric('comparison-status') || say('Guardado solicitado.','Save requested.') : unavailable(); }
        if(m(/compara|rutas alternativas|compare routes/)) { tab('routes'); const criterion=m(/pendiente|relieve|slope/)?'slope':m(/radiacion|radiation/)?'radiation':m(/tiempo|duracion|time/)?'duration':m(/distancia|distance|corta/)?'distance':null; if(criterion)set('comparison-criterion',criterion); return say('Comparación de rutas abierta.','Route comparison opened.'); }
        if(m(/sin retorno|sin regreso|no regresar|one way/)) { set('mission-return',false); return say('Retorno desactivado.','Return disabled.'); }
        if(m(/con retorno|con regreso|regresar al habitat|ida y vuelta|round trip/)) { set('mission-return',true); return say('Retorno incluido.','Return included.'); }
        if(m(/condiciones historicas de gale|usar.*gale|use gale/)) { set('mission-gale',true); return say('Referencia histórica de Gale seleccionada.','Historical Gale reference selected.'); }
        if(m(/desactiva.*gale|disable gale/)) { set('mission-gale',false); return say('Referencia de Gale desactivada.','Gale reference disabled.'); }
        const parameters=[[/velocidad|walking speed/,'mission-speed','Velocidad'],[/tiempo.*cientific|minutos.*investigacion|science time/,'mission-science-time','Tiempo científico'],[/reserva|reserve/,'ops-reserve','Reserva'],[/consumo.*oxigeno|oxygen consumption/,'ops-oxygen-rate','Consumo de oxígeno'],[/capacidad.*oxigeno|oxygen capacity/,'ops-oxygen','Capacidad de oxígeno'],[/consumo.*agua|water consumption/,'ops-water-rate','Consumo de agua'],[/capacidad.*agua|water capacity/,'ops-water','Capacidad de agua'],[/potencia|power consumption/,'ops-power','Potencia'],[/bateria|battery capacity/,'ops-energy','Batería'],[/limite.*pendiente|slope limit/,'risk-slope-limit','Límite de pendiente'],[/limite.*tiempo|time limit/,'risk-time-limit','Límite de tiempo']];
        for(const [re,id,label] of parameters) if(m(re)&&Number.isFinite(numeric(c))) { const value=numeric(c); return set(id,value)?`${label}: ${value}.`:unavailable(); }
        if(m(/analiz.*terreno|calcula.*pendiente|analiz.*relieve|analyze terrain/)) return action('analyze-terrain','terrain',say('Análisis topográfico solicitado.','Terrain analysis requested.'));
        if(m(/evalu.*aterrizaje|analiz.*zona.*aterrizaje|evaluate landing/)) return action('landing-analyze','landing',say('Análisis de zona candidata solicitado.','Candidate site analysis requested.'));
        if(m(/inicia.*aterrizaje|simula.*aterrizaje|play landing/)) return action('landing-start','landing',say('Reproducción histórica iniciada.','Historical playback started.'));
        if(m(/pausa.*aterrizaje|pause landing/)) return action('landing-pause','landing',say('Reproducción pausada.','Playback paused.'));
        if(m(/reinicia.*aterrizaje|reset landing/)) return action('landing-reset','landing',say('Reproducción reiniciada.','Playback reset.'));
        if(m(/cuanto.*aterriz|tiempo.*aterriz|landing time/)) return say('Perseverance tardó aproximadamente siete minutos en entrada, descenso y aterrizaje. No es una predicción tripulada.','Perseverance took about seven minutes. This is not a crewed landing prediction.');
        if(m(/aterrizaje|descenso|landing/)) { tab('landing'); return say('Control de aterrizaje abierto.','Landing control opened.'); }
        if(m(/cuanto.*viaje|cuanto.*llegar.*marte|travel time/)) return say('Mars 2020 tardó 203 días en su viaje. Es una referencia histórica.','Mars 2020 cruised for 203 days. This is a historical reference.');
        if(m(/viaje interplanetario|viaje a marte|interplanetary/)) { operation('travel'); return say('Planificación interplanetaria abierta.','Travel planning opened.'); }
        if(m(/yellowknife|hottah|mount sharp|monte sharp/)) { operation('science'); const v=m(/yellowknife/)?'yellowknife':m(/hottah/)?'hottah':'sharp'; if(!set('ops-objective',v)||!press('ops-apply-objective'))return unavailable(); return say('Objetivo científico aplicado. Selecciona los puntos de la ruta por separado.','Science objective applied. Select route points separately.'); }
        if(m(/objetivos cientificos|investigacion cientifica|science objectives/)) { operation('science'); return say('Objetivos científicos abiertos.','Science objectives opened.'); }
        if(m(/cuanta radiacion|cuanta.*dosis|dosis estimada|exposicion.*radiacion|radiation dose|radiation exposure/)) { const d=metric('rad-estimated-dose'), h=metric('mission-radiation'); return d? say(`Dosis absorbida estimada: ${d} micrograys. Escenario histórico.`,`Estimated absorbed dose: ${d} micrograys. Historical scenario.`):h?say(`Dosis equivalente histórica estimada: ${h} milisieverts.`,`Historical equivalent dose estimate: ${h} millisieverts.`):unavailable(); }
        if(m(/radiacion.*(maxima|minima|media|promedio)|peak radiation|mean radiation/)) { const id=m(/maxima|peak/)?'rad-max':m(/minima/)?'rad-min':'rad-mean'; return report(id,say('Tasa histórica','Historical dose rate'),say('micrograys por día','micrograys per day')); }
        if(m(/radiacion|radiation|tormenta solar/)) { tab('radiation'); if(typeof RAD!=='undefined'&&!RAD.loaded)press('rad-load-data'); const day=c.match(/\b(9|1[0-9]|2[01])\s*(?:de\s+)?mayo\b/); if(day) { const value=`2024-05-${day[1].padStart(2,'0')}`; if(!set('rad-date',value))return say('Carga el dataset y vuelve a solicitar la fecha.','Load the dataset and request the date again.'); } return say('Observaciones históricas de radiación abiertas.','Historical radiation observations opened.'); }
        if(m(/temperatura|temperature|cuanto frio/)) { operation('weather'); return say('Referencia histórica de Gale: entre menos setenta y cero grados Celsius. No es un pronóstico.','Historical Gale reference: minus 70 to zero Celsius. Not a forecast.'); }
        if(m(/presion atmosferica|atmospheric pressure/)) { operation('weather'); return say('En Gale, del 15 al 18 de agosto de 2012, referencia histórica de 690 a 780 pascales.','Historical Gale reference: 690 to 780 pascals, August 15 to 18, 2012.'); }
        if(m(/clima|meteorologia|weather|viento|polvo/)) { operation('weather'); return say('Meteorología histórica abierta. Viento y polvo actuales no disponibles.','Historical weather opened. Current wind and dust unavailable.'); }
        if(m(/cuanta.*autonomia|cuanto.*oxigeno|autonomia disponible|remaining resources/)) { operation('resources'); return report('ops-autonomy',say('Autonomía bajo supuestos configurables','Autonomy under configured assumptions')); }
        if(m(/oxigeno|autonomia|soporte vital|recursos|life support/)) { operation('resources'); return say('Soporte vital abierto. Parámetros hipotéticos.','Life support opened. Hypothetical parameters.'); }
        if(m(/riesgos|peligros|risk assessment/)) { tab('environment'); return say('Evaluación ambiental abierta. No certifica la seguridad.','Environmental assessment opened. Safety is not certified.'); }
        if(m(/informe|reporte|mission report/)) { operation('report'); return say('Informe de misión abierto.','Mission report opened.'); }
        if(m(/cuant[oa].*distancia|distancia.*ruta|cuantos kilometros|route distance/)) return report('mission-distance',say('Distancia total','Total distance'),'km');
        if(m(/cuanto.*durara|duracion.*mision|mission duration/)) return report('mission-duration',say('Duración estimada','Estimated duration'),say('horas','hours'));
        if(m(/pendiente maxima|maximum slope/)) return report('mission-slope',say('Pendiente máxima muestreada','Maximum sampled slope'));
        if(m(/estado.*mision|resumen.*mision|mission status|mission summary/)) return [report('mission-distance',say('Distancia','Distance'),'km'),report('mission-duration',say('Duración','Duration'),'h'),report('mission-slope',say('Pendiente','Slope'))].join(' ');
        if(m(/planifica|planear|nueva.*mision|nueva.*expedicion|mission planner|plan mission/)) { tab('overview'); return say('Planificador abierto.','Planner opened.'); }
        if(m(/oculta.*capas|minimiza.*capas|hide layers/)) { if(!el('science-layers')?.classList.contains('collapsed'))press('toggle-layers');return say('Menú de capas minimizado.','Layers minimized.'); }
        if(m(/abre.*capas|expande.*capas|show layers/)) { if(el('science-layers')?.classList.contains('collapsed'))press('toggle-layers');return say('Menú de capas abierto.','Layers opened.'); }
        const layer=m(/superficie natural|mapa original|quita.*capas|natural surface/)?'base':m(/ctx|alta resolucion|high resolution/)?'ctx':m(/optica|opticos|viking|optical/)?'optical':m(/topografia|topografico|mola|relieve|topography/)?'topography':null;
        if(layer) { const b=document.querySelector(`[data-layer="${layer}"]`); if(!b||b.disabled)return unavailable(); b.click(); return say('Capa solicitada.','Layer requested.'); }
        if(m(/cierra.*panel|cerrar.*panel|oculta.*panel|close panel/)) { if(!el('mission-panel')?.hidden)press('close-mission');el('region-panel')?.classList.add('hidden');viewer.selectedEntity=undefined;return say('Panel cerrado.','Panel closed.'); }
        if(m(/vista global|vista general|planeta completo|muestra marte|global view|show mars/)) {stopMotion();viewer.selectedEntity=undefined;el('region-panel')?.classList.add('hidden');viewer.flyTo(tileset,{duration:2});return say('Vista global.','Global view.');}
        for(const [id,re] of Object.entries(regionWords)) if(m(re)){const entity=viewer.entities.getById(id);if(!entity)return unavailable();stopMotion();viewer.selectedEntity=undefined;viewer.selectedEntity=entity;return say(`Navegando hacia ${entity.name}.`,`Navigating to ${entity.name}.`);}
        const camera=viewer.camera, zoom=Math.max(10,(camera?.positionCartographic?.height || 0)*.25);
        const move=m(/acerca|mas cerca|aumenta.*zoom|zoom in/)?()=>camera.zoomIn(zoom):m(/aleja|mas lejos|reduce.*zoom|zoom out/)?()=>camera.zoomOut(zoom):m(/izquierda|left/)?()=>camera.rotateLeft(.15):m(/derecha|right/)?()=>camera.rotateRight(.15):m(/arriba|rotate up/)?()=>camera.rotateUp(.15):m(/abajo|rotate down/)?()=>camera.rotateDown(.15):null;
        if(move){camera.cancelFlight();move();return say('Cámara ajustada.','Camera adjusted.');}
        if (!fallback) {
            const aliases = Object.entries(commandDictionary).flatMap(([key,values])=>values.map(value=>[normalize(value),key])).sort((a,b)=>b[0].length-a[0].length);
            const match = aliases.find(([value,key])=>key!==c && (` ${c} `).includes(` ${value} `));
            if(match) return dispatch(match[1],true);
        }
        const fact=knowledge(c); if(fact!==null)return fact;
        if(/^(que|quien|cual|cuanto|cuanta|por que|como|donde|what|who|why|how|where)\b/.test(c)) return {text:say('No tengo información verificada para responder esa pregunta. Puedes preguntarme sobre Marte o tu misión.','I do not have verified information for that question. Ask me about Mars or your mission.'),follow:true};
        return {text:say('No entendí la instrucción. ¿Puedes repetirla?','I did not understand. Please repeat.'),follow:true};
    }
    function run(command) { try { const result=dispatch(command); if(result===null)return true; if(typeof result==='object'){answer(result.text,result.follow);return false;} answer(result);return true; } catch(e){console.error('DEIMOS COMMAND ERROR:',e);answer(say('No pude ejecutar la instrucción.','Could not execute the command.'));return false;} }
    window.deimosVoiceCommand=run;
    window.DEIMOS_VOICE_COMMANDS=['Explora Gale','Vista global','Acércate','Gira a la derecha','Muestra topografía','Muestra datos ópticos','Planifica misión','Inicia ruta','Marca punto','Finaliza ruta','Deshacer punto','Borra ruta','Confirma','Velocidad 2','Tiempo científico 60','Con retorno','Usar condiciones históricas de Gale','Analiza terreno','Guarda ruta','Compara rutas por pendiente','Muestra radiación','Radiación del 20 de mayo','Cuánta radiación recibiré','Temperatura','Presión atmosférica','Evalúa riesgos','Soporte vital','Reserva 25','Objetivos científicos','Yellowknife Bay','Tiempo de aterrizaje','Simula aterrizaje','Evalúa zona de aterrizaje','Viaje interplanetario','Exporta informe','Estado de la misión','Cierra el panel','Project deja de escuchar','Gira 90 grados a la derecha','Gira continuamente','Detén el giro','Aléjate mucho','Aléjate 5 veces','Acércate 3 veces','Ayúdame a trazar una ruta','Cuántos puntos tiene la ruta','Qué es MOLA','Cuál es la gravedad de Marte','Cuánto dura un sol'];
    ui(say('Activa el micrófono','Enable microphone'),'off');
    console.log('DEIMOS: Voice Command System V4 initialized.');
}
