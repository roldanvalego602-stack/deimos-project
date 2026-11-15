# DEIMOS PROJECT — Interface

Interfaz general (centro de comando y navegación) de **DEIMOS PROJECT**, plataforma de exploración y planificación de misiones en Marte creada por **ORBITRON V2** para NASA Space Apps Challenge 2026.

Esta carpeta contiene **solo la interfaz**. Los módulos Mars Explorer, Survival Simulator y Mission Archives se desarrollan por separado y se conectan después en los contenedores descritos abajo.

## Estructura

```
deimos-interface/
├── index.html          # Vistas y contenedores de integración
├── css/styles.css      # Estilos (todas las clases usan el prefijo dmx-)
├── js/navigation.js    # Navegación, menú móvil y API de integración
├── assets/mars.png     # Representación visual de Marte (ilustración, no imagen oficial)
└── README.md
```

## Cómo abrir

1. Descarga o clona la carpeta `deimos-interface/`.
2. Abre `index.html` con doble clic en cualquier navegador moderno (Chrome, Firefox, Edge, Safari).

No requiere servidor, backend, dependencias ni conexión a internet.

Cada vista tiene su propia URL con hash, por ejemplo `index.html#mars-explorer`.

| Vista              | Hash                  |
| ------------------ | --------------------- |
| Mission Control    | `#mission-control`    |
| Mars Explorer      | `#mars-explorer`      |
| Survival Simulator | `#survival-simulator` |
| Mission Archives   | `#mission-archives`   |
| About Mission      | `#about-mission`      |

## Puntos de integración

Cada módulo tiene un contenedor con un `id` estable. **No cambies estos IDs.**

| Módulo             | Responsable        | Contenedor                     | Vista (`data-dmx-view`) |
| ------------------ | ------------------ | ------------------------------ | ----------------------- |
| Mars Explorer      | Equipo del mapa    | `#mars-map-container`          | `mars-explorer`         |
| Survival Simulator | Equipo simulador   | `#survival-simulator-container`| `survival-simulator`    |
| Mission Archives   | Equipo de archivos | `#mission-archives-container`  | `mission-archives`      |

Dentro de cada contenedor, el contenido temporal está marcado con `data-dmx-placeholder`. Ese contenido es el único que debe reemplazarse.

En la vista Survival Simulator, los indicadores de Oxígeno, Energía, Tiempo y Distancia tienen IDs propios para que el simulador escriba sus valores si lo desea: `dmx-gauge-oxygen`, `dmx-gauge-energy`, `dmx-gauge-time`, `dmx-gauge-distance`. Son opcionales: la interfaz no supone cómo funciona el simulador.

### Opción A — Montaje con JavaScript (recomendada)

Carga el script del módulo después de `js/navigation.js` en `index.html`:

```html
<script src="js/navigation.js"></script>
<!-- Módulos externos -->
<script src="modules/mars-explorer/map.js"></script>
```

En el script del módulo:

```js
// 1. Retira el estado vacío y obtén el contenedor
const container = window.DEIMOS.clearPlaceholder("mars-explorer");

// 2. Renderiza el módulo dentro del contenedor (ej. Leaflet)
//    L.map(container) ...
```

### Opción B — Sustituir el HTML

Reemplaza los nodos con `data-dmx-placeholder` dentro del contenedor por el marcado del módulo. Mantén el elemento contenedor y su `id`.

## API de integración

`js/navigation.js` expone un único objeto global congelado, `window.DEIMOS`:

| Método / propiedad                | Descripción                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `navigateTo(viewId)`              | Cambia de vista (`"mars-explorer"`, `"about-mission"`, …).                  |
| `getCurrentView()`                | Devuelve el id de la vista activa.                                          |
| `getModuleContainer(moduleId)`    | Devuelve el elemento contenedor del módulo.                                 |
| `clearPlaceholder(moduleId)`      | Elimina el contenido temporal, marca el módulo como integrado y devuelve el contenedor. |
| `containers`                      | Mapa de solo lectura `moduleId → containerId`.                              |

### Evento de cambio de vista

Las vistas inactivas usan el atributo `hidden`. Los módulos que necesiten recalcular tamaño al mostrarse (por ejemplo, un mapa) pueden escuchar:

```js
document.addEventListener("deimos:viewchange", (event) => {
  const { view, previousView, containerId } = event.detail;
  if (view === "mars-explorer") {
    // map.invalidateSize();
  }
});
```

## Reglas para evitar conflictos

- Todas las clases de la interfaz usan el prefijo `dmx-`. Los módulos deben usar su propio prefijo.
- La interfaz no modifica el interior de los módulos externos.
- La única variable global es `window.DEIMOS`.
- La hora mostrada en la barra superior es la hora UTC del sistema del usuario. No se muestran datos de telemetría ni datos científicos.
- La imagen `assets/mars.png` es una ilustración generada, no una imagen oficial de NASA.

## Créditos

Diseño e interfaz: **ORBITRON V2** — NASA Space Apps Challenge 2026.
