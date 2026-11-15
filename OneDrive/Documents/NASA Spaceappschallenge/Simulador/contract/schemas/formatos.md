# Contrato de datos

Archivos en `web/public/data/`. Los ejemplos mock viven ahí mismo; cuando haya
datos reales, se reemplaza el archivo con el mismo nombre y formato.

- `route.geojson`: FeatureCollection con un LineString. Coordenadas `[lon, lat, elevación_m]`.
- `waypoints.json`: lista de `{ id, order, name, lat, lon, objective, photo }`.
- `safety.json`: `{ status, reasons[], metrics[{ id, label, value, unit, status, note }] }`. Estados: `ok | caution | nogo`.
- `layers.json`: lista de `{ id, name, type: image|tile, url, bounds?, opacity, visible }`.

Cualquier cambio de formato se avisa al equipo antes de subirlo.
- `terreno/dem.json` (modo EVA, opcional): cuadrícula de elevación real. Se activa con `terrain.source.mode = "dem"` en `simulation.json` o con `eva.html?terreno=dem`. Si falta o es inválido, la app avisa y usa el terreno procedural.

```json
{
  "format": "mapa-marciano-dem/1",
  "mock": false,
  "name": "Jezero (recorte)",
  "source": { "mission": "MRO HiRISE", "product": "DTM_XXXX", "url": "https://...", "downloaded": "2026-11-14", "license": "NASA / PDS" },
  "origin": { "centerLon": 77.45, "centerLat": 18.44 },
  "size": 192,
  "cellSizeM": 20,
  "elevationM": [ "size × size números en metros, por filas, norte arriba; null = sin dato" ],
  "mission": { "start": [0.5, 0.5] }
}
```

Reglas: la cuadrícula es cuadrada (`size` de 8 a 1024); `elevationM` puede ser una lista plana de `size*size` valores o una lista de `size` filas; los `null` se rellenan con el promedio; `mission` es opcional (`start` en fracciones 0..1 del mapa, `[x, y]` con y hacia abajo) y sustituye a la posición de la base principal de `simulation.json`; sin él, la app mueve la base a terreno plano si cae en una ladera. Para generarlo desde un GeoTIFF: `data/scripts/06_dem_para_eva.py`.
- `waypoints.json` también lo usa el modo EVA: el primer y el último punto (por `order`) son salida y retorno y el EVA los ignora (la base principal está en el centro del mapa); los **intermedios son sitios de muestreo** (se colocan con las coordenadas reales si el DEM trae `origin`, o repartidos sobre el recuadro de la ruta si no). Su `objective` se muestra al tomar la muestra y en el resumen final.
- `safety.json` también alimenta al modo EVA: `radiation` (mSv/día) fija la tasa base de radiación y `temperature` (°C) la temperatura exterior media. Se puede apagar con `safetyLink.enabled = false` en `simulation.json`.
