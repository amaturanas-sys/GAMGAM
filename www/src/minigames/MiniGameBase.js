// MiniGameBase.js — Base común de todos los mini-juegos.
//
// Cada tipo de mini-juego (tap, dodge, quiz...) hereda de aquí. El "host"
// (MiniGameScene) le da acceso al juego, a su configuración (def) y le permite
// terminar con ganar() o perder().

export class MiniGameBase {
  constructor(host) {
    this.host = host;       // MiniGameScene
    this.game = host.game;  // motor
    this.def = host.def;    // configuración de este mini-juego (de minigames.json)

    this.puntos = 0;
    this.tiempoRestante = null; // null = sin cronómetro visible
    this.mostrarPuntos = true;
  }

  iniciar() {}
  update(_dt) {}
  render(_ctx) {}
  onPointerDown(_x, _y) {}
  onPointerMove(_x, _y) {}
  onPointerUp(_x, _y) {}

  ganar() { this.host.finish(true, this.puntos); }
  perder() { this.host.finish(false, this.puntos); }

  // Acceso rápido a un parámetro de la configuración con valor por defecto.
  param(nombre, porDefecto) {
    const v = this.def[nombre];
    return v === undefined || v === null ? porDefecto : v;
  }
}
