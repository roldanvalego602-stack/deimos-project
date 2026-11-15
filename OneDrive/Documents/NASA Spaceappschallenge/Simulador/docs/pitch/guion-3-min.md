# Guion de pitch (3 minutos)

> Reemplaza lo que va entre [corchetes] con los datos reales del equipo. Ensáyalo al menos dos veces con cronómetro.

**0:00 – 0:20 · Gancho (persona que presenta)**
"Imagina que eres la primera persona en caminar por [sitio] en Marte. Tienes aire para unas seis horas, el exterior está a −60 °C y no hay nadie a quien pedirle ayuda. ¿Por dónde caminas?"

**0:20 – 0:45 · El problema**
"Planear una caminata (EVA) exige combinar relieve, radiación, temperatura y oxígeno, y esos datos viven en lugares distintos. Construimos Mapa Marciano, una guía de supervivencia que los junta en una sola vista."

**0:45 – 1:50 · Demo (en vivo o video de respaldo)**
1. *Mapa (15 s):* ruta de la EVA, waypoints con su objetivo científico y el panel go/no-go.
2. *Modo EVA (20 s):* "Aquí el astronauta ya no es un punto: gasta oxígeno, se enfría y acumula radiación." Mostrar las barras.
3. *Expedición con ruta (15 s):* colocar un waypoint con `M` y trazar la ruta con `P`. "El algoritmo A* evita pendientes peligrosas y calcula distancia, tiempo, aire y dosis."
4. *Evento (20 s):* "Aparece una tormenta solar con aviso de 10 minutos: ¿vuelvo a la base o termino la muestra?" Mostrar el aviso y la dosis subiendo.
5. *Muestra (15 s):* tomar una muestra con `E` en un sitio científico y mostrar el aviso con su objetivo. El resumen con el puntaje aparece al terminar la misión.

**1:50 – 2:30 · Ciencia y datos**
"Usamos [DEM: MOLA/HRSC o HiRISE] para el relieve y mediciones de Curiosity: RAD para la radiación (unos 0.67 mSv por día) y REMS para temperatura y presión. Todos los supuestos (pendiente máxima, velocidad, presupuesto de dosis) están escritos en la app y en el README, y cada dato cita su fuente."

**2:30 – 3:00 · Impacto y cierre**
"Esta herramienta sirve para ensayar misiones antes de pisar Marte y para que cualquiera entienda por qué cada metro cuenta. Mañana puede cambiar de sitio con solo reemplazar un archivo de datos. Gracias."

## Preguntas probables del jurado
- *¿Qué es real y qué es supuesto?* Datos: [DEM], RAD, REMS. Supuestos de juego: eventos, blindajes, puntaje (en `docs/supuestos.md`).
- *¿Cómo calculan la ruta?* A* sobre una cuadrícula; el costo es el tiempo de caminata (más lento con pendiente y rocas) y no pasa de la pendiente máxima.
- *¿Qué sigue?* Conectar más sitios, usar eventos solares observados por RAD y sumar más instrumentos.
