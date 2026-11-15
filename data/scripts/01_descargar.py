"""Descarga un archivo (DEM, imagen...) a data/raw/ con barra de progreso.

Uso:
  python scripts/01_descargar.py URL [--salida raw/]

Fuentes sugeridas (verifica la licencia y cítalas en docs/fuentes.md):
  - Elevación global 200 m (USGS, mezcla MOLA + HRSC), archivo de ~11 GB:
    https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif
    Es muy grande: mejor NO descargarlo completo. Léelo por ventana con
    06_dem_para_eva.py usando una ruta "/vsicurl/https://..." (ver ese script).
  - Modelos digitales de terreno HiRISE (1-2 m, regionales y mucho más chicos):
    https://www.uahirise.org/dtm/
"""
import argparse
import sys
import urllib.request
from pathlib import Path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url")
    ap.add_argument("--salida", default=str(Path(__file__).resolve().parents[1] / "raw"))
    args = ap.parse_args()

    out_dir = Path(args.salida)
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / Path(args.url.split("?")[0]).name
    if dest.exists():
        print(f"Ya existe {dest}; no se vuelve a descargar.")
        return

    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(args.url) as resp, open(tmp, "wb") as f:
        total = int(resp.headers.get("Content-Length") or 0)
        if total > 2 * 1024**3:
            print(f"Aviso: el archivo pesa {total / 1024**3:.1f} GB. Considera leerlo por ventana con /vsicurl/.")
        done = 0
        while chunk := resp.read(1024 * 1024):
            f.write(chunk)
            done += len(chunk)
            if total:
                sys.stdout.write(f"\r{done / 1024**2:.0f} / {total / 1024**2:.0f} MB")
                sys.stdout.flush()
    tmp.rename(dest)
    print(f"\nListo: {dest}")


if __name__ == "__main__":
    main()
