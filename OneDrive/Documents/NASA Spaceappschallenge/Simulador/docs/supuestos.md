# Supuestos del proyecto

> Valores propuestos. El equipo debe confirmarlos o ajustarlos y mantener esta
> tabla igual que la interfaz.

| Parámetro | Valor | Unidad | Justificación |
|---|---|---|---|
| Pendiente máxima transitable a pie | 20 | grados | Supuesto de juego (`astronaut.maxSlopeDeg`): no se avanza sobre pendientes mayores. La ruta sugerida (A*) usa el 90 % de este límite si es posible. Referencia por confirmar |
| Velocidad de caminata en traje | 0.8 | m/s (2.9 km/h) | Supuesto de juego (`astronaut.walkSpeedMs`); el mapa usa el mismo valor en `web/src/lib/geo.js`. Baja con la pendiente y el cansancio. Referencia por confirmar |
| Duración de la EVA | 3 | horas | Duración nominal que se muestra en `safety.json`. El simulador da 380 min de aire (~6.3 h) para dejar margen de maniobra |
| Radio de Marte | 3389.5 | km | Usado en el cálculo de distancias |
| Elevación | metros | m | Respecto al datum de referencia del dato usado |
| Pendiente | grados (no porcentaje) | ° | Definir y no mezclar |
| Dosis de radiación en superficie (aire libre) | 0.67 | mSv/día | Dosis equivalente de GCR medida por RAD/Curiosity en Gale (Hassler et al., 2014). Configurable en `simulation.json` → `radiation` |
| Presupuesto de dosis por EVA (juego) | 0.12 | mSv | Supuesto de juego ≈ 1.4× la dosis nominal de una EVA de 3 h (0.084 mSv). No es un límite regulatorio |
| Blindaje del rover (cabina) | 25 | % | Supuesto de juego |
| Blindaje de la base / refugio | 90 | % | Supuesto de juego |
| Blindaje máximo por relieve | 30 | % | Aproximación de juego: se calcula con el ángulo de horizonte (cráteres y laderas tapan parte del cielo); no es un modelo de transporte de radiación |
| Tormenta de partículas solares | ×8 la dosis, 14 a 30 min, aviso 10 min antes | multiplicador | Supuesto de juego, no calibrado con eventos reales observados por RAD |
| Tormenta de polvo | visibilidad −55 %, carga solar −75 %, exterior −4 °C, 35 a 80 min | | Supuesto de juego |
| Descenso brusco de temperatura | −25 °C, 25 a 55 min | | Supuesto de juego |
| Frecuencia de eventos | 0.6 por hora simulada (frecuencia operativa fija) | | Se generan al azar con la semilla de la campaña; configurable en `simulation.json` → `events` |
| Muestra en un waypoint | 8 min, 30 m de radio | | Supuesto de juego (`science`) |
| Puntaje | 100 por muestra, +0.5 por min de aire, −0.2 por µSv | | Solo de juego, no es una métrica científica |
| Tamaño del mundo procedural | 384 × 384 celdas de 20 m (7.68 km) | | Supuesto de juego (`terrain`) |
| Kit de protección radiológica | −50 % de dosis durante 60 min; cuesta 2 hielo + 1 regolito | | Mecanismo simplificado de juego, no un blindaje real ni una recomendación médica |
| Módulos de base | Producción, consumo y capacidades en el README | | Parámetros iniciales de balance, ajustables en las pruebas |
