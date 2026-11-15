# Mapa Marciano: Guía de Supervivencia Interplanetaria

NASA Space Apps Challenge · Durango · 14-15 de noviembre de 2026

Mapa interactivo por capas de una ruta de caminata (EVA) en Marte, con datos de
varias misiones de la NASA y un panel de seguridad para el astronauta.

## Modo EVA: controles y supervivencia
- `WASD` o flechas: mover al astronauta.
- `E`: recolectar un recurso cuando aparece el aviso de proximidad.
- `Espacio`: pausar o continuar.
- `R`: reiniciar la misión conservando mapa, bases y recursos; elimina los waypoints manuales de esa misión.
- `N`: crear una campaña completamente nueva con una nueva semilla; elimina el progreso, los sectores descubiertos y los waypoints guardados.
- Rueda del mouse: acercar o alejar la cámara.

El inventario inicial permite almacenar 12 unidades de recursos de prueba: hielo, regolito y metal. Los recursos se generan de forma determinista para que el mapa sea reproducible. Estos elementos son prototipos de juego y no representan depósitos científicos confirmados.

## Cómo correrlo
1. Clonar el repo y abrir la carpeta en VS Code.
2. Instalar la extensión **Live Server**.
3. Clic derecho en `web/index.html` → *Open with Live Server*.

No requiere instalar nada ni tener internet: Phaser, Leaflet y Chart.js están en `web/vendor/`.

## Estructura
- `web/`: aplicación (HTML + JS plano). Datos en `web/public/data/`.
- `data/`: scripts de Python para procesar los datos (pendientes, costo, ruta A*).
- `contract/`: formatos de los archivos que se intercambian y ejemplos mock.
- `docs/`: fuentes, supuestos y material del pitch.

## Equipo
| Rol | Entregable | Responsable |
|---|---|---|
| Líder técnico e integración | App desplegada y siempre funcionando | |
| Datos y geoprocesamiento | `dem.json`, `route.geojson`, `slope.png`, capas recortadas | |
| Frontend del mapa | Mapa interactivo con todas las capas | |
| UI/UX y panel de seguridad | Interfaz pulida y gráficas | |
| Ciencia, contenido y pitch | `waypoints.json`, `safety.json`, pitch y video | |

## Supuestos y fuentes
Ver `docs/supuestos.md` y `docs/fuentes.md`.
## Modo EVA: almacenes y puestos avanzados

- `E`: recolecta un recurso cercano. Si no hay recursos y el astronauta está junto a una base, guarda toda la mochila en su almacén.
- `Q`: retira materiales del almacén de la base cercana hasta llenar la mochila.
- `B`: construye un puesto avanzado en la ubicación actual si el terreno es adecuado y hay materiales suficientes.
- Los inventarios de las bases, la mochila y los recursos ya recolectados se guardan en `localStorage` del navegador. Se conservan al reiniciar o recargar en el mismo navegador.
- Coste inicial de un puesto avanzado: 4 de regolito, 3 de metal y 1 de hielo. Los valores se configuran en `web/public/data/simulation.json`.

Los datos de campaña son locales a cada navegador y no se sincronizan entre dispositivos.


## Modo EVA: rovers
- `1` selecciona rover explorador; `2` selecciona rover de carga.
- `V` fabrica y despliega el modelo seleccionado desde una base cercana, usando materiales de su almacén.
- `F` permite entrar o salir de un rover cercano. La cámara sigue al vehículo mientras se conduce.
- `WASD` o flechas conducen el rover; `E` recoge recursos con el rover o descarga su compartimento al llegar a una base.
- El explorador almacena 6 unidades; el rover de carga almacena 20. Ambos tienen batería independiente y se recargan automáticamente cuando están estacionados junto a una base.
- Los rovers, su batería, carga y posición se guardan en la campaña local.


## Corrección v3.1: despliegue y abordaje de rovers

- Los rovers ahora aparecen fuera del perímetro visual de la base, buscando una posición libre y con pendiente transitable.
- Se prioriza el lado de la base donde está el astronauta para que pueda abordar inmediatamente.
- Se amplió el radio de abordaje para compensar la escala del mapa.
- Al cargar una partida, los rovers antiguos que estaban superpuestos con una base se reubican automáticamente.
- El HUD muestra `F · Subir a [nombre del rover]` cuando el astronauta está a distancia de abordaje.

Controles: `F` para subir o bajar del rover; `WASD` o flechas para conducir.


## Corrección v3.2: conducción y refugios
- La velocidad de los rovers ahora aplica el mismo multiplicador de tiempo de simulación que el movimiento a pie; además, la penalización por pendiente es menos agresiva.
- Al subir, el icono del astronauta se oculta y su posición lógica se mantiene sincronizada con el rover; al bajar, aparece junto al vehículo en una posición transitable.
- Dentro del radio de una base, el oxígeno queda protegido del consumo exterior y se recarga hasta el máximo (6 minutos de aire por minuto simulado, configurable en `simulation.json`).
- El HUD indica cuándo el astronauta está recargando oxígeno en una base.


## v3.3 — movilidad, energía y habitabilidad

- Corregida la conversión de velocidad del rover: ahora convierte m/s a minutos simulados igual que el movimiento a pie (60 segundos por minuto simulado).
- Aumentadas las velocidades base: explorador 3.2 m/s y carga 2.4 m/s.
- Los rovers desplegados por el usuario se conservan en la campaña; una campaña nueva no crea rovers automáticamente.
- Los paneles solares recargan lentamente los rovers estacionados durante las horas de luz.
- Las estaciones de las bases recargan rápidamente los rovers estacionados en su radio.
- Dentro del radio de refugio de las bases se recupera oxígeno y el sistema térmico regula el traje a 20 °C.


### Ideas para próximas mejoras de las bases (propuesta, aún no implementada)

1. **Almacén modular:** niveles I–III que amplían la capacidad total y permiten separar depósitos de hielo, regolito y metal.
2. **Hangar de rovers:** lista de vehículos guardados, reparación, selección y despliegue sin volver a pagar su fabricación.
3. **Red energética:** paneles solares, baterías estacionarias y estación de carga con capacidad compartida entre módulos.
4. **Módulo térmico:** aislamiento y calefacción con consumo energético, para mantener temperatura habitable incluso durante tormentas.
5. **Reciclador de soporte vital:** convierte hielo y energía en reservas de agua/oxígeno y reduce la dependencia de expediciones.
6. **Taller:** reparación de rovers y fabricación de piezas usando metal y regolito.
7. **Ampliación habitable:** dormitorios y laboratorio que aporten bonificaciones de descanso, investigación o recuperación.

La mejora de almacenamiento sería un buen siguiente paso: cada nivel tendría un coste en recursos y mostraría la capacidad usada/disponible en el HUD.


## v3.4 — relieve procedural y movilidad adaptativa

- Velocidades equilibradas: astronauta 0.8 m/s, rover explorador 1.15 m/s y rover de carga 0.95 m/s antes de modificadores del terreno.
- El mapa genera una semilla aleatoria por campaña y la conserva en el guardado; reiniciar o recargar no cambia el mundo de esa campaña.
- Se generan cráteres, macizos montañosos y campos rocosos con alturas, pendientes y rugosidad propias.
- Astronauta y rovers comprueban el trayecto en pequeños pasos: no pueden atravesar laderas por encima de su límite ni saltos bruscos de elevación.
- La velocidad se adapta a la pendiente y a la rocosidad. La roca suelta reduce más la velocidad de los vehículos.
- Los recursos se distribuyen aleatoriamente y de forma reproducible por campaña: el hielo tiende a zonas bajas y el metal a terrenos rocosos; se evitan pendientes extremas.
- `N` inicia una campaña nueva con otra semilla; `R` reinicia la misión actual sin cambiar su mapa.
- Los valores de velocidad, límites de pendiente y cantidad de formaciones se pueden ajustar en `web/public/data/simulation.json`.


## v3.5 — terreno real (DEM) y radiación

### Terreno: procedural o DEM real
- Por defecto el modo EVA sigue usando el relieve procedural (sin cambios).
- Para usar una cuadrícula de elevación real: pon `terrain.source.mode` en `"dem"` en `web/public/data/simulation.json`, o abre `eva.html?terreno=dem` (también `?dem=ruta/otro.json`).
- El archivo es `web/public/data/terreno/dem.json` (formato en `contract/schemas/formatos.md`). Hoy trae un **DEM de prueba**; para generar el real desde un GeoTIFF: `python data/scripts/06_dem_para_eva.py raw/dem.tif --size 192 --cell 20 --name "..." --mision "..."`.
- Si el DEM falta o es inválido, la app avisa en el panel y usa el procedural. El panel muestra siempre qué terreno se está usando (en ámbar si son datos de prueba).
- Con DEM, la pendiente, la rugosidad y el blindaje se calculan a partir de la cuadrícula. La rugosidad es un proxy (Laplaciano del relieve), no un mapa de rocas.
- La partida guardada es independiente para cada terreno. `N` crea una campaña nueva: con DEM el terreno es el mismo y cambian los recursos.
- `mission.start` y `mission.goal` del `dem.json` (opcionales) sustituyen a los de `simulation.json`.

### Radiación como variable de supervivencia
- Nueva barra **Radiación (dosis)**: se llena al revés que las demás (verde = presupuesto disponible). Si la dosis llega al presupuesto de la EVA, la misión falla.
- Tasa base: 0.67 mSv/día (RAD/Curiosity). Presupuesto por EVA: 0.12 mSv (supuesto de juego). Todo está en `simulation.json` → `radiation` y se puede desactivar con `"enabled": false`.
- Blindaje: relieve (hasta 30 %), cabina del rover (25 %) y base o refugio (90 %); se combinan multiplicando. El HUD muestra la tasa actual y el blindaje.
- La tasa se calcula con factores operativos fijos (`operationalFactors`) y puede variar por eventos ambientales.
- `radiationMultiplier` en la escena (hoy 1) es el enchufe para eventos como una tormenta solar.
- Los valores son de prueba y están documentados en `docs/supuestos.md` y `docs/fuentes.md`.


## v3.6 — eventos, ruta sugerida, ciencia y mapa conectado

### Cambios y arreglos
- **Sin internet:** Phaser, Leaflet y Chart.js ahora se cargan desde `web/vendor/` (con sus licencias).
- **Supuestos alineados:** pendiente máxima 20° y caminata a 0.8 m/s en el simulador, el mapa (`geo.js`) y `docs/supuestos.md`.
- **Inicio y meta con DEM real:** si caen en una ladera, se mueven solos a la zona plana más cercana (aparece un aviso en el panel). Un bloque `mission` en `dem.json` tiene prioridad.
- **README:** tabla de equipo con entregables; `docs/fuentes.md` con la fuente candidata del DEM y las librerías incluidas.

### Eventos ambientales
- Tres tipos (`simulation.json` → `events`): **tormenta de partículas solares** (dosis ×8), **tormenta de polvo** (menos visibilidad y carga solar de rovers) y **descenso brusco de temperatura**.
- Se generan al azar con la semilla de la campaña y una frecuencia operativa fija (reproducibles). El HUD avisa unos minutos antes y muestra los efectos mientras duran. Un refugio (base) reduce mucho la dosis.

### Ruta sugerida (tecla `P`)
- A* sobre la cuadrícula del terreno: evita pendientes por encima del límite, prefiere suelo liso y se recalcula al moverte.
- El panel muestra distancia, tiempo, oxígeno y dosis estimados, con avisos si el aire o la dosis quedan justos. Con rovers o bases, la ruta real puede ser distinta.

### Ciencia en el modo EVA
- Los waypoints intermedios de `waypoints.json` son sitios de muestreo: `E` cerca de uno toma una muestra (8 min de simulación, con el reloj, el aire y la radiación corriendo).
- Al terminar, el resumen muestra las muestras, su objetivo científico y un puntaje de juego.

### Mapa y EVA conectados
- El mapa tiene botones **Iniciar EVA** e **Iniciar con DEM**; el EVA tiene **← Volver al mapa**.
- El EVA lee `safety.json` (radiación y temperatura) y `waypoints.json`; el panel muestra qué condiciones y terreno está usando.

### Limitaciones conocidas
- Entre el 1 % y el 4 % de los mapas procedurales aleatorios no tiene camino a pie de inicio a meta dentro del límite de pendiente (`N` crea otra campaña). El DEM real no tiene este problema si se elige bien el sitio.
- La rugosidad del DEM es un proxy; los eventos y el puntaje son supuestos de juego (ver `docs/supuestos.md`).
- La integración con Phaser se probó con una simulación sin navegador; falta una revisión manual con Live Server.

## v3.7 — exploración, blindaje y presentación visual

### Waypoints de exploración y rutas
- `M` activa/desactiva la colocación de waypoints; después haz clic en una celda del terreno. Solo se aceptan ubicaciones dentro del mapa con pendiente transitable.
- Los waypoints personalizados se guardan en la campaña, aparecen en el mapa y se pueden muestrear con `E` al acercarte.
- `P` muestra/oculta la ruta A* hacia el último waypoint personalizado activo; si no hay uno pendiente, conserva el destino original de la misión.
- Clic directamente sobre un waypoint manual para eliminarlo; `Supr` o `Retroceso` elimina el más cercano. También se pueden borrar los que ya fueron muestreados.
- `R` limpia los waypoints manuales al reiniciar la misión; `N` limpia toda la campaña.
- La geografía y los recursos siguen vinculados a la semilla de la campaña. Los waypoints manuales son progreso de campaña, no alteran el generador procedural.

### Kits de protección radiológica
- Junto a una base, `C` fabrica un kit consumiendo 2 unidades de hielo y 1 de regolito del almacén.
- `H` consume un kit y reduce a la mitad la dosis de radiación recibida durante 60 minutos simulados.
- El número de kits y el tiempo restante del efecto se guardan en la campaña. La protección se combina con el blindaje del terreno, rover y refugio.
- Es un mecanismo simplificado de juego; no representa un diseño real de blindaje ni una recomendación médica.

### Modelos visuales EVA
- El jugador ahora se representa con traje presurizado, casco/visor, mochila de soporte vital y detalles de articulaciones.
- Los rovers muestran chasis, seis ruedas, suspensión, mástil de instrumentos y panel solar; el rover de carga se distingue visualmente del explorador.
- Las bases muestran un hábitat presurizado, esclusa, patas, antena y panel solar. Las diferencias visuales no cambian las estadísticas o funciones físicas ya existentes.

### Interfaz configurable
- En `Ajustes de interfaz` se puede cambiar la opacidad de paneles (35–100 %), escala (80–125 %) y visibilidad de los paneles de estado y controles.
- Las preferencias se guardan localmente en el navegador y son independientes del guardado de campaña.

### Verificación local
- Ejecutar `node --experimental-default-type=module tests/smoke.mjs` desde la raíz del proyecto para verificar generación determinista, variación por semilla, ruta A*, consumo lógico de oxígeno y persistencia de waypoints/kits.
- Los archivos JavaScript usan módulos ES y pueden comprobarse con `node --experimental-default-type=module --check`.


## v3.8 — orientación 2D, waypoints corregidos y expansión modular

### Correcciones
- El astronauta y el icono del astronauta al conducir un rover ahora compensan el eje local de dibujo (cabeza/frente hacia -Y) al calcular la rotación. La dirección de movimiento queda alineada con el frente del modelo en el plano XY, sin la sensación de caminar invertido.
- Los rovers también aplican la misma corrección de orientación a su eje frontal.
- Los waypoints manuales ahora se pueden eliminar haciendo clic directamente en su marcador, con `Supr` o `Retroceso` para eliminar el más cercano. Se pueden borrar tanto pendientes como ya muestreados.
- `R` reinicia la misión y elimina los waypoints manuales, conservando el mapa, bases, recursos recolectados y sectores explorados. `N` inicia una campaña nueva y limpia todo el guardado de campaña.

### Bases modulares (primera fase visual)
- `T` recorre los módulos: laboratorio, invernadero, generador, baterías, almacén, hangar y refugio radiológico.
- `Y` instala el módulo seleccionado cuando el jugador está junto a una base y el almacén contiene los materiales requeridos.
- Cada módulo aparece como una estructura anexa al hábitat y el contador visual de módulos se actualiza.
- Los módulos y sus costes se guardan en la campaña. En esta primera fase son ampliaciones visuales y de consumo de materiales; todavía no otorgan bonificaciones funcionales de energía, agricultura o laboratorio.

### Exploración progresiva por sectores
- El terreno se divide en una cuadrícula de 12 × 12 sectores. Al acercarse, se revela el sector actual y sus vecinos inmediatos; el resto permanece cubierto por una capa oscura.
- Los sectores descubiertos se guardan en la campaña y se conservan al reiniciar con `R`. Una campaña nueva (`N`) comienza con el mapa sin descubrir.

### Pruebas
- `node --experimental-default-type=module tests/smoke.mjs`: incluye pruebas de orientación del sprite en ocho direcciones, borrado de waypoints por ID, guardado de módulos y sectores descubiertos, además de generación procedural, A* y supervivencia.
- Validación visual en navegador pendiente: comprobar el sentido del modelo al girar, interacción por clic con los marcadores, visibilidad de sectores en distintos niveles de zoom y encaje de módulos alrededor de bases.


## v3.9 — módulos de base operativos

Los módulos construibles ahora tienen efectos en la simulación:

- **Generador:** produce 1 unidad de energía por cada 10 minutos simulados. Sin baterías, almacena hasta 10 unidades.
- **Baterías:** elevan la capacidad energética de la base a 50 unidades.
- **Invernadero:** consume 1 unidad de hielo y 1 de energía cada 120 minutos simulados; produce 4 unidades de alimento.
- **Laboratorio:** consume 1 unidad de energía para procesar una muestra pendiente cada 30 minutos simulados y genera 100 puntos de investigación.
- **Almacén:** amplía la capacidad total de recursos de la base de 30 a 80 unidades; los excedentes permanecen en la mochila.
- **Hangar:** aumenta un 50 % la velocidad de recarga de rovers estacionados en esa base.
- **Refugio RAD:** añade 25 puntos porcentuales de blindaje radiológico mientras el astronauta permanece dentro del área protegida (con un máximo de 95 %).

La energía, alimento, investigación, muestras pendientes, relojes de producción y capacidades se guardan con la campaña. La producción usa minutos simulados, tanto durante el movimiento como al realizar acciones que consumen tiempo. Los valores son parámetros iniciales de balance y podrán ajustarse en próximas pruebas.


## v4.0 — exploración libre y cámara centrada

- Se eliminó el selector de dificultad. La simulación utiliza factores operativos fijos configurados en `simulation.json`; las condiciones se expresan mediante oxígeno, temperatura, radiación, energía, recursos y eventos ambientales.
- La base principal aparece en el centro de una zona procedural de 384 × 384 celdas (20 m por celda: 7.68 × 7.68 km). La zona de despliegue alrededor de la base se suaviza para evitar iniciar sobre una pendiente extrema.
- La cámara sigue al astronauta o al rover controlado, mantiene al vehículo como centro de atención y permite ajustar el zoom con la rueda del mouse.
- El terreno se presenta mediante bloques visuales de 64 × 64 celdas que se materializan alrededor del explorador conforme avanza. La topografía se mantiene reproducible mediante la semilla de campaña y los sectores descubiertos se guardan.
- La exploración deja de tener una meta obligatoria al otro extremo del mapa. Las expediciones se planifican con waypoints manuales (`M`) y rutas A* (`P`). El HUD muestra la distancia de regreso a la base principal.
- Se aumentó la cantidad de recursos distribuidos por el terreno y se separó el guardado de campañas de versiones anteriores para que la nueva base central no herede coordenadas antiguas.

**Alcance del terreno en esta versión:** el mundo jugable tiene un tamaño amplio pero finito de 7.68 × 7.68 km. Los bloques gráficos se cargan progresivamente; el relieve procedural de esa zona se calcula al iniciar la campaña. La generación de chunks topográficos fuera de esos límites (mundo verdaderamente infinito) queda como una evolución posterior, no se presenta como implementada.

## v4.0.1 — limpieza y mantenimiento

- Se retiraron cuatro scripts Python vacíos que figuraban en el flujo inicial, pero no realizaban procesamiento (`02_recortar.py` a `05_exportar.py`). La guía de datos ahora documenta solo las dos herramientas ejecutables que sí se entregan.
- Se redujeron las dependencias Python a `numpy` y `rasterio`, que son las utilizadas por las herramientas conservadas.
- Se eliminaron dos conversiones de unidades y un helper de pendiente sin consumidores en el código del proyecto.
- Se corrigió la instrucción duplicada de la tecla `N` en esta guía.
- Se conservaron los módulos del mapa principal, paneles, datos de demostración y bibliotecas de terceros porque siguen siendo utilizados por `index.html` o `eva.html`.
