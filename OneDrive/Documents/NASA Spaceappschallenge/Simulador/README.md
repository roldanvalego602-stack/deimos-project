# Mapa Marciano: Guía de Supervivencia Interplanetaria

NASA Space Apps Challenge · Durango · 14-15 de noviembre de 2026

Dos vistas sobre la misma misión:

- **Mapa de misión** (`web/index.html`): ruta de caminata (EVA) sobre capas, panel de seguridad con estado go/no-go, perfil de elevación y resumen de la ruta.
- **Simulador EVA** (`web/eva.html`): exploración libre, en vista cenital, de un terreno marciano procedural (o de un DEM real). El astronauta administra oxígeno, estamina, temperatura y radiación; recolecta recursos, construye bases y rovers, y planea expediciones con waypoints y rutas A*.

## Cómo correrlo

1. Abrir la carpeta en VS Code con la extensión **Live Server** y, con clic derecho en `web/index.html`, elegir *Open with Live Server*.
2. No requiere internet ni instalar dependencias: Phaser, Leaflet y Chart.js están en `web/vendor/`.
3. Pruebas: `npm test` (o `node tests/smoke.mjs`; basta con Node 18 o superior).

## Simulador EVA

### Controles

| Tecla | Acción |
|---|---|
| `WASD` / flechas | Mover al astronauta o conducir el rover |
| `E` | Tomar muestra en un waypoint, recolectar un recurso, guardar la mochila en una base; con rover: recolectar o descargar |
| `Q` | Retirar materiales del almacén de la base cercana |
| `B` | Construir un puesto avanzado (4 regolito, 3 metal, 1 hielo; terreno poco inclinado y lejos de otras bases) |
| `T` / `Y` | Elegir / instalar un módulo en la base cercana |
| `1` / `2` | Elegir rover explorador / de carga |
| `V` | Fabricar y desplegar el rover elegido desde una base (si ya hay uno guardado en el hangar, lo saca) |
| `F` | Subir o bajar del rover cercano |
| `C` / `H` | Fabricar (2 hielo + 1 regolito) / usar un kit de protección radiológica |
| `M` | Activar la colocación de un waypoint y hacer clic en el terreno |
| `P` | Mostrar u ocultar la ruta A* hacia el waypoint activo |
| Clic en un waypoint, `Supr` o `Retroceso` | Eliminar un waypoint manual (el clic elimina ese; las teclas, el más cercano) |
| `Espacio` | Pausar |
| `R` | Reiniciar la misión conservando mapa, bases, recursos recolectados y sectores explorados; elimina los waypoints manuales |
| `N` | Nueva campaña con otro relieve y recursos (pide confirmación y borra el guardado) |
| Rueda del mouse | Zoom |

El panel **Ajustes de interfaz** cambia la opacidad (35–100 %), la escala (80–125 %) y la visibilidad de los paneles. Se guarda aparte de la campaña.

### Qué se simula

- **Supervivencia.** Oxígeno, estamina y temperatura del traje se gastan al moverse; la pendiente y el cansancio frenan al astronauta. La misión se interrumpe si se agota el aire, el traje baja del mínimo o se supera el presupuesto de dosis.
- **Radiación.** Tasa base de 0.67 mSv/día (Curiosity/RAD) y presupuesto de 0.12 mSv por EVA. Se reduce con el relieve (hasta 30 %), la cabina del rover (25 %) y las bases (90 %). Los kits de protección reducen la dosis a la mitad durante 60 minutos simulados.
- **Eventos ambientales.** Tormenta de partículas solares (dosis ×8), tormenta de polvo (menos visibilidad y carga solar) y descenso brusco de temperatura. Se programan con la semilla de la campaña, avisan unos minutos antes y se muestran en un banner con sus efectos.
- **Bases y módulos.** La base principal está en el centro del mapa. Cada base tiene almacén (30 unidades) y repone oxígeno y temperatura dentro de su radio. Módulos instalables:

  | Módulo | Efecto |
  |---|---|
  | Generador | 1 unidad de energía cada 10 min simulados (10 de capacidad; 50 con baterías) |
  | Baterías | Capacidad de energía de 50 |
  | Invernadero | Cada 120 min consume 1 hielo y 1 energía y produce 4 de alimento |
  | Laboratorio | Cada 30 min consume 1 energía y convierte una muestra pendiente en 100 puntos de investigación |
  | Almacén | Capacidad de la base de 30 a 80 unidades |
  | Hangar | Recarga de rovers estacionados un 50 % más rápida |
  | Refugio RAD | +25 puntos de blindaje dentro de la base (máximo 95 %) |

- **Rovers.** Explorador (6 de carga, 1.15 m/s) y de carga (20, 0.95 m/s), con batería propia. Se recargan junto a una base y, más despacio, con sus paneles solares durante el día. Un rover guardado vuelve al hangar al recargar la página.
- **Exploración.** El mapa se descubre por sectores (cuadrícula de 24 × 24; se revela el actual y sus vecinos). El relieve se dibuja en bloques de 64 × 64 celdas alrededor del explorador.
- **Expediciones y ciencia.** Con `M` se colocan waypoints transitables y alcanzables; `P` traza la ruta A* y estima distancia, tiempo, oxígeno y dosis. Tomar una muestra cuesta 8 minutos simulados (con el reloj, el aire y la radiación corriendo); si la base más cercana tiene laboratorio, la muestra se procesa allí. Los sitios de muestreo de `waypoints.json` aparecen también en el terreno. Al terminar la misión, la pantalla final lista las muestras con su objetivo científico y un puntaje de juego.

### Terreno

- **Procedural (por defecto).** 384 × 384 celdas de 20 m (7.68 × 7.68 km), con cráteres, macizos y campos rocosos reproducibles por semilla. La zona de la base se suaviza. El relieve completo se calcula al iniciar una campaña, así que el arranque tarda un par de segundos.
- **DEM real (opcional).** Abre `eva.html?terreno=dem` (o pon `terrain.source.mode` en `"dem"` en `simulation.json`; también acepta `?dem=otra/ruta.json`). Lee `web/public/data/terreno/dem.json` (formato en `contract/schemas/formatos.md`). Hoy trae un **DEM de prueba**. Si el archivo falta o es inválido, la app avisa y vuelve al procedural. Pendiente, rugosidad y blindaje se calculan desde la cuadrícula; si la base cae en una ladera, se mueve a la zona plana más cercana. El panel indica qué terreno se usa y la partida guardada es independiente para cada uno.
- Cómo generar un DEM real desde un GeoTIFF: ver `data/README.md`.

### Guardado

La campaña se guarda en el `localStorage` del navegador (no se sincroniza entre dispositivos): bases, almacenes, módulos, recursos recolectados, rovers, waypoints, kits y sectores descubiertos. No se guarda el estado de la EVA en curso (aire, temperatura, dosis, reloj y eventos), que se reinicia al recargar o con `R`.

## Configuración

Todo el balance está en `web/public/data/simulation.json`; el código no tiene números escritos.

| Sección | Qué controla |
|---|---|
| `time` | Minutos simulados por segundo real |
| `terrain` | Tamaño, escala, semilla base, número de formaciones y origen del terreno (procedural o DEM) |
| `mission` | Posición de la base principal (`start`, fracciones del mapa) |
| `ambient`, `astronaut` | Temperatura exterior y consumo, velocidad y límites del astronauta |
| `resources`, `bases`, `rovers` | Recursos, costos, radios de interacción, módulos y vehículos |
| `radiation` | Tasa base, presupuesto de dosis, blindajes y kits |
| `events` | Frecuencia, duración, aviso y efectos de cada evento |
| `science`, `route` | Muestreo, puntaje y parámetros de la ruta A* |
| `safetyLink` | Si el EVA toma radiación y temperatura de `safety.json` |
| `operationalFactors` | Multiplicadores globales (oxígeno, estamina, enfriamiento, radiación, eventos) |

## Datos del mapa

Archivos en `web/public/data/`: `route.geojson`, `waypoints.json`, `safety.json`, `layers.json` y `terreno/dem.json`. Hoy son datos de prueba; para reemplazarlos se mantiene el nombre y el formato (ver `contract/schemas/formatos.md`). El EVA también lee `waypoints.json` (sitios de muestreo) y `safety.json` (radiación y temperatura base).

## Estructura

- `web/`: aplicación en HTML + JS plano (módulos ES). `src/sim/` es la lógica sin DOM (motor, eventos, ruta A*, módulos de base, guardado); `src/eva/` es el simulador (escena Phaser, terreno, HUD); `src/map/`, `src/hud/` y `src/lib/` son el mapa de misión.
- `data/`: scripts de Python para procesar datos reales.
- `contract/`: formato de los archivos que se intercambian.
- `docs/`: fuentes, supuestos y material del pitch.
- `tests/`: pruebas de la lógica de simulación.

## Pruebas y límites conocidos

- `npm test` verifica generación de terreno, DEM, ruta A*, radiación, eventos, módulos de base, orientación de sprites y guardado. No cubre el dibujo (Phaser): hay que revisar a mano en el navegador.
- El mundo es amplio pero finito (7.68 km por lado); no hay generación infinita.
- No existe un estado de "expedición completada": la pantalla final con el resumen y el puntaje aparece cuando la misión se interrumpe.
- Los valores de balance, eventos, blindajes y puntaje son supuestos de juego (ver `docs/supuestos.md`).

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
