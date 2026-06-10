// SceneManager.js — Controla qué escena está activa y cambia entre ellas.

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.registro = new Map(); // nombre -> clase de escena
    this.actual = null;
    this.nombreActual = null;
  }

  /** Registra una escena con un nombre para poder cambiar a ella. */
  registrar(nombre, clase) {
    this.registro.set(nombre, clase);
  }

  /** Cambia a la escena indicada, pasándole parámetros opcionales. */
  cambiar(nombre, params = {}) {
    const Clase = this.registro.get(nombre);
    if (!Clase) {
      console.error('[GAMGAM] Escena desconocida: ' + nombre);
      return;
    }
    if (this.actual) {
      this.actual.exit();
      this.game.ui.limpiar();
    }
    this.actual = new Clase(this.game);
    this.nombreActual = nombre;
    this.actual.enter(params);
  }

  update(dt) {
    this.actual?.update(dt);
  }
  render(ctx) {
    this.actual?.render(ctx);
  }
}
