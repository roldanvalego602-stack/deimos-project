// El astronauta y el rover se dibujan mirando hacia arriba (-Y).
// Compensa el eje local para que el frente apunte en la dirección del movimiento XY.
export function spriteRotationForHeading(heading) {
  return heading + Math.PI / 2;
}
