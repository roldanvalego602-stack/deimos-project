"""Convierte un GeoTIFF de elevación (MOLA, HRSC, HiRISE DTM...) al dem.json del modo EVA.

Funciona también con archivos remotos grandes sin descargarlos completos
(GDAL lee solo la ventana necesaria si el servidor admite rangos HTTP):
  python scripts/06_dem_para_eva.py "/vsicurl/https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif" --info
Primero usa --info para ver el CRS y los límites, y luego pasa --centro con coordenadas de ese CRS.

Uso (desde la carpeta data/):
  python scripts/06_dem_para_eva.py raw/dem.tif --size 192 --cell 20 \
      --name "Jezero (recorte)" --mision "MRO HiRISE" --producto "DTM_XXXX" \
      --url "https://..." --descargado 2026-11-14 --licencia "NASA / PDS (dominio público)"

Qué hace:
  1. Toma un cuadrado de (size × cell) metros centrado en el raster (o en --centro lon,lat,
     en las coordenadas del propio raster).
  2. Lo remuestrea (bilineal) a size × size celdas.
  3. Escribe web/public/data/terreno/dem.json con el formato de contract/schemas/formatos.md.

Si el CRS del raster está en grados, convierte a metros con el radio de Marte (3389.5 km).
Los huecos (nodata) se escriben como null; la app los rellena con el promedio.
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.windows import Window

MARS_RADIUS_M = 3_389_500.0
M_PER_DEG = 2 * math.pi * MARS_RADIUS_M / 360.0


def pixel_size_m(src, lat_deg):
    """Tamaño de pixel (x, y) en metros."""
    px, py = abs(src.res[0]), abs(src.res[1])
    if src.crs is not None and src.crs.is_geographic:
        return px * M_PER_DEG * math.cos(math.radians(lat_deg)), py * M_PER_DEG
    return px, py


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("entrada", help="GeoTIFF de elevación en metros")
    ap.add_argument("--size", type=int, default=192, help="celdas por lado (cuadrado)")
    ap.add_argument("--cell", type=float, help="metros por celda en el resultado (obligatorio salvo con --info)")
    ap.add_argument("--info", action="store_true", help="solo muestra CRS, tamaño y resolución del raster y termina")
    ap.add_argument("--centro", help="lon,lat del centro del recorte (en el CRS del raster)")
    ap.add_argument("--name", default="DEM sin nombre")
    ap.add_argument("--mision", default="")
    ap.add_argument("--producto", default="")
    ap.add_argument("--url", default="")
    ap.add_argument("--descargado", default="")
    ap.add_argument("--licencia", default="")
    ap.add_argument("--salida", default=str(Path(__file__).resolve().parents[2] / "web/public/data/terreno/dem.json"))
    args = ap.parse_args()

    with rasterio.open(args.entrada) as src:
        if args.info:
            print(f"CRS: {src.crs}")
            print(f"Tamaño: {src.width} x {src.height} px · resolución: {src.res[0]} x {src.res[1]} (unidades del CRS)")
            print(f"Límites: {src.bounds}")
            return
        if args.cell is None:
            raise SystemExit("Falta --cell (metros por celda).")
        if args.centro:
            lon, lat = (float(v) for v in args.centro.split(","))
            row, col = src.index(lon, lat)
        else:
            row, col = src.height // 2, src.width // 2
            lon, lat = src.xy(row, col)
        lat_ref = lat if (src.crs is not None and src.crs.is_geographic) else 0.0
        px_m, py_m = pixel_size_m(src, lat_ref)

        side_m = args.size * args.cell
        win_w, win_h = side_m / px_m, side_m / py_m
        if win_w > src.width or win_h > src.height:
            raise SystemExit(
                f"El recorte de {side_m / 1000:.2f} km no cabe en el raster "
                f"({src.width * px_m / 1000:.2f} x {src.height * py_m / 1000:.2f} km). "
                "Baja --size o --cell."
            )
        col0 = int(round(col - win_w / 2))
        row0 = int(round(row - win_h / 2))
        col0 = min(max(0, col0), src.width - int(win_w))
        row0 = min(max(0, row0), src.height - int(win_h))
        window = Window(col0, row0, win_w, win_h)

        data = src.read(
            1, window=window, out_shape=(args.size, args.size),
            resampling=Resampling.bilinear, masked=True,
        )
        arr = data.astype("float64").filled(np.nan)

    holes = int(np.isnan(arr).sum())
    elev = np.where(np.isnan(arr), None, np.round(arr, 1)).ravel().tolist()
    valid = arr[~np.isnan(arr)]
    if valid.size == 0:
        raise SystemExit("El recorte no tiene valores válidos (¿nodata?).")

    dem = {
        "format": "mapa-marciano-dem/1",
        "name": args.name,
        "source": {
            "mission": args.mision, "product": args.producto, "url": args.url,
            "downloaded": args.descargado, "license": args.licencia,
        },
        "origin": {"centerLon": round(float(lon), 6), "centerLat": round(float(lat), 6)},
        "size": args.size,
        "cellSizeM": args.cell,
        "elevationM": elev,
    }
    out = Path(args.salida)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(dem, ensure_ascii=False), encoding="utf-8")
    print(f"OK -> {out}")
    print(f"  {args.size}x{args.size} celdas de {args.cell} m = {side_m / 1000:.2f} km de lado")
    print(f"  elevación {valid.min():.1f} a {valid.max():.1f} m (relieve {valid.max() - valid.min():.1f} m), huecos: {holes}")
    print("  Activa el DEM con: simulation.json -> terrain.source.mode = \"dem\"  (o eva.html?terreno=dem)")


if __name__ == "__main__":
    main()
