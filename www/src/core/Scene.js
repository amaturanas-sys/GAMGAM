// Scene.js — Clase base de la que heredan todas las pantallas del juego.
//
// Una "escena" es una pantalla: el título, el mundo, un diálogo, un mini-juego,
// la pantalla de resultados... El SceneManager se encarga de cambiar entre ellas.

export class Scene {
  constructor(game) {
    this.game = game;
  }

  // Se llama al entrar en la escena. `params` trae datos de la escena anterior.
  enter(_params) {}

  // Se llama al salir. Útil para limpiar la interfaz HTML.
  exit() {}

  // Lógica cada fotograma. `dt` = segundos transcurridos.
  update(_dt) {}

  // Dibujo cada fotograma sobre el canvas.
  render(_ctx) {}

  // Eventos de puntero (toque o clic) sobre el canvas.
  onPointerDown(_x, _y) {}
  onPointerMove(_x, _y) {}
  onPointerUp(_x, _y) {}
}
