# Procesamiento de datos (Python)

Esta carpeta conserva únicamente las herramientas de preparación que están
implementadas y mantenidas en el proyecto.

## Herramientas disponibles

- `scripts/01_descargar.py`: descarga un archivo (DEM, imagen u otro recurso)
  a `data/raw/`.
- `scripts/06_dem_para_eva.py`: recorta y remuestrea un GeoTIFF para generar
  `web/public/data/terreno/dem.json`, compatible con el modo EVA.

Ejemplo para inspeccionar un DEM remoto sin descargarlo completo:

```bash
python scripts/06_dem_para_eva.py \
  "/vsicurl/https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif" \
  --info
```

Ejemplo de exportación de un recorte local:

```bash
python scripts/06_dem_para_eva.py raw/dem.tif --size 192 --cell 20 \
  --name "Jezero" --mision "MRO HiRISE"
```

Para trabajar con los scripts, crea un entorno virtual e instala las
dependencias indicadas en `requirements.txt`. Los scripts de recorte de área,
cálculo de pendientes, costo de ruta y exportación cartográfica que aparecían
en el flujo inicial no estaban implementados en esta versión y se retiraron;
no forman parte del flujo ejecutable actual.

## Cómo conseguir un DEM real

1. Elige el sitio de interés. Para una zona amplia puede servir el mosaico
   global MOLA+HRSC de USGS; para detalle local, usa un DTM HiRISE.
2. Inspecciona primero el raster con `--info` y verifica su CRS y límites.
3. Recorta con `--centro` si necesitas una ubicación concreta. Las coordenadas
   deben estar expresadas en el CRS del raster.
4. Abre `web/eva.html?terreno=dem` y comprueba que el relieve y el punto de
   inicio tengan sentido.
5. Registra URL, fecha y licencia en `docs/fuentes.md`.
