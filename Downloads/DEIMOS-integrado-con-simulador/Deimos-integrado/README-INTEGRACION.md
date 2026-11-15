# DEIMOS PROJECT — Integración web

## Ejecutar en Windows
1. Extraer el ZIP por completo. No abrir index.html directamente desde el ZIP.
2. Abrir la carpeta `Deimos-integrado` en VS Code y ejecutar Live Server desde el `index.html` de la raíz. Alternativamente, abrir PowerShell en esa carpeta y ejecutar `python -m http.server 8000`, después ir a `http://localhost:8000/` en Chrome.
3. Abrir Mars Explorer: el mapa se carga automáticamente con el token de navegador del proyecto original. No se solicita al usuario. Para publicación pública, restringir el token a lectura, asset y dominios autorizados.
4. Para PROJECT, habilitar el micrófono una vez en el mapa y decir «Project, explora Gale». El navegador debe permitir micrófono y disponer de conexión para el reconocimiento de voz si no es local. Al salir del mapa el micrófono se detiene.

## Módulos
- Mission Control: interfaz original, tema y navegación.
- Mars Explorer: un iframe del mismo origen conserva el estado de Cesium, su interfaz, los módulos científicos, el asistente, la planificación, la radiación, el aterrizaje y la exportación. La biblioteca CesiumJS incluida en el original se carga localmente; las teselas siguen dependiendo de Cesium ion.
- Survival Simulator: calculadora de recursos como alternativa provisional al simulador 2D, que no estaba en el ZIP. Usa duración/distancia de la expedición si el mapa está conectado, o duración manual. Los botones sincronizan parámetros con el módulo Life Support. No es un sistema certificado ni representa capacidades reales de trajes.
- Mission Archives: proyecto original integrado en su propio iframe.

Los archivos MOLA IMG/XML y RAD CSV originales se conservan sin cambios. El MOLA local es una región, no cobertura global. El archivo IMG supera 100 MB: usar Git LFS si se publica en GitHub y comprobar que el hosting entrega los datos binarios, no un puntero LFS.

## Verificación
Se validó la sintaxis JavaScript con Node.js. El navegador de pruebas del entorno bloqueó la navegación local, por lo que no fue posible comprobar la conexión a Cesium ion, la captura de voz, la navegación visual ni la interacción real de todos los módulos. Antes del pitch, verificar: mapa, dos puntos de ruta, duración, RAD, MOLA dentro de cobertura, exportación, archivo histórico y PROJECT.

No se incluyeron .git ni node_modules. No se modificó el ZIP original.

## Simulador EVA integrado
El módulo Survival Simulator contiene el proyecto Simulador/web/eva.html (copiado a simulator/web/eva.html), con Phaser y datos propios. Se reemplazó la calculadora provisional; la calculadora de soporte vital sigue en Mars Explorer > Operations. El simulador usa su propia campaña y no importa automáticamente la ruta de Cesium. Abrir desde la raíz mediante Live Server.
