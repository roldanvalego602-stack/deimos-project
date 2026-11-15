# Procesamiento de datos (Python)

Entorno: `python -m venv .venv`, activarlo y `pip install -r requirements.txt`.

## Scripts

| Script | Estado | Qué hace |
|---|---|---|
| `01_descargar.py` | Listo | Descarga un archivo a `data/raw/` (no se sube a git) |
| `06_dem_para_eva.py` | Listo | Recorta un GeoTIFF de elevación y escribe `web/public/data/terreno/dem.json` para el modo EVA |
| `02_recortar.py`, `03_pendientes.py`, `04_costo_ruta.py`, `05_exportar.py` | Vacíos | Reservados para el mapa de misión (recorte, `slope.png`, `route.geojson` y capas). El modo EVA ya calcula pendientes y rutas A* en JavaScript, así que no dependen de ellos |

## Cómo conseguir un DEM real para el modo EVA

1. Elige el sitio. Para un recorte de 15 a 20 km, la mezcla global MOLA + HRSC de USGS (200 m por píxel) alcanza con `--cell 100`; para detalle local, un DTM de HiRISE (1 a 2 m por píxel) con `--cell 20`.
2. No descargues los 11 GB del global: inspecciona primero con `python scripts/06_dem_para_eva.py "/vsicurl/<URL>" --info` y recorta por ventana con `--centro lon,lat`.
3. Ejemplo: `python scripts/06_dem_para_eva.py raw/dem.tif --size 192 --cell 20 --name "Jezero" --mision "MRO HiRISE" --centro 77.45,18.44`.
4. Abre `eva.html?terreno=dem` y comprueba que la base y el relieve tengan sentido.
5. Registra URL, fecha y licencia en `docs/fuentes.md`.
