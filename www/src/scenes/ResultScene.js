// ResultScene.js — Pantalla de resultado tras un mini-juego.

import { Scene } from '../core/Scene.js';

export class ResultScene extends Scene {
  enter(params = {}) {
    const { game } = this;
    this.params = params;
    const ui = game.ui;
    const panel = ui.panel('ui-panel--centro');

    const gano = params.gano;
    panel.appendChild(ui.el('h2', 'ui-titulo--medio', gano ? '¡Lo lograste! 🎉' : 'Inténtalo de nuevo'));

    const textos = params.def?.textosResultado || {};
    const mensaje = gano ? (textos.victoria || '¡Bien hecho!') : (textos.derrota || 'No pasa nada, prueba otra vez.');
    panel.appendChild(ui.el('p', 'ui-subtitulo', mensaje));

    panel.appendChild(ui.el('p', 'ui-resultado__puntos', 'Puntuación: ' + (params.puntos ?? 0)));
    const mejor = game.save.mejor(params.idMini);
    if (mejor > 0) panel.appendChild(ui.el('p', 'ui-mejor', 'Mejor marca: ' + mejor));

    if (gano && params.punto?.recompensa) {
      panel.appendChild(ui.el('p', 'ui-recompensa', '🔑 Has obtenido: ' + params.punto.recompensa));
    }

    panel.appendChild(ui.boton('🔁 Reintentar', () => {
      game.scenes.cambiar('minigame', { id: params.idMini, punto: params.punto });
    }, gano ? 'ui-boton--peque' : 'ui-boton--grande'));

    panel.appendChild(ui.boton('🗺️ Volver al mundo', () => {
      game.scenes.cambiar('world', { restaurar: true });
    }, gano ? 'ui-boton--grande' : 'ui-boton--peque'));

    ui.agregar(panel);
  }

  render(ctx) {
    const { game } = this;
    ctx.fillStyle = game.theme.colorFondo;
    ctx.fillRect(0, 0, game.ancho, game.alto);
  }
}
