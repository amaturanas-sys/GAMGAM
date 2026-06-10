// MiniGameScene.js — "Anfitrión" de los mini-juegos.
//
// No contiene la lógica de cada mini-juego (eso está en /minigames). Aquí se
// gestiona lo común: pantalla de instrucciones, marcador (HUD), botón de salir,
// y la pantalla de resultado al terminar.

import { Scene } from '../core/Scene.js';
import { crearMiniJuego } from '../minigames/registry.js';

export class MiniGameScene extends Scene {
  enter(params = {}) {
    const { game } = this;
    this.idMini = params.id;
    this.punto = params.punto || null;
    this.def = game.config.minigames?.[this.idMini];

    if (!this.def) {
      console.error('[GAMGAM] Mini-juego no encontrado: ' + this.idMini);
      this._volver();
      return;
    }

    this.juego = crearMiniJuego(this.def.tipo, this);
    if (!this.juego) {
      console.error('[GAMGAM] Tipo de mini-juego desconocido: ' + this.def.tipo);
      this._volver();
      return;
    }

    this.activo = false;
    if (this.def.musica) game.audio.reproducirMusica(this.def.musica);
    this._mostrarInstrucciones();
  }

  _mostrarInstrucciones() {
    const { game } = this;
    const ui = game.ui;
    ui.limpiar();
    const panel = ui.panel('ui-panel--centro');
    panel.appendChild(ui.el('h2', 'ui-titulo--medio', this.def.titulo || 'Desafío'));
    if (this.def.instrucciones) {
      panel.appendChild(ui.el('p', 'ui-subtitulo', this.def.instrucciones));
    }
    const mejor = game.save.mejor(this.idMini);
    if (mejor > 0) {
      panel.appendChild(ui.el('p', 'ui-mejor', 'Tu mejor marca: ' + mejor));
    }
    panel.appendChild(ui.boton('▶ Empezar', () => this._empezar(), 'ui-boton--grande'));
    panel.appendChild(ui.boton('Salir', () => this._volver(), 'ui-boton--peque'));
    ui.agregar(panel);
  }

  _empezar() {
    const { game } = this;
    game.ui.limpiar();
    // Botón de salir durante la partida.
    const barra = game.ui.el('div', 'ui-topbar');
    barra.appendChild(game.ui.boton('✕ Salir', () => this._volver(), 'ui-boton--peque'));
    game.ui.agregar(barra);

    this.juego.iniciar();
    this.activo = true;
  }

  update(dt) {
    if (this.activo && this.juego) this.juego.update(dt);
  }

  render(ctx) {
    const { game } = this;
    // Fondo
    ctx.fillStyle = this.def.colorFondo || game.theme.colorFondo;
    ctx.fillRect(0, 0, game.ancho, game.alto);

    if (this.juego) this.juego.render(ctx);

    // HUD (marcador) durante la partida.
    if (this.activo && this.juego) this._dibujarHUD(ctx);
  }

  _dibujarHUD(ctx) {
    const { game } = this;
    const j = this.juego;
    ctx.fillStyle = game.theme.colorTexto;
    ctx.font = `bold ${game.escala(20)}px ${game.theme.fuente}`;
    ctx.textAlign = 'right';
    let y = game.escala(34);
    if (j.puntos !== undefined && j.mostrarPuntos !== false) {
      ctx.fillText('Puntos: ' + j.puntos, game.ancho - game.escala(16), y);
      y += game.escala(26);
    }
    if (j.tiempoRestante !== undefined && j.tiempoRestante !== null) {
      ctx.fillText('Tiempo: ' + Math.ceil(j.tiempoRestante), game.ancho - game.escala(16), y);
    }
  }

  onPointerDown(x, y) { this.activo && this.juego?.onPointerDown?.(x, y); }
  onPointerMove(x, y) { this.activo && this.juego?.onPointerMove?.(x, y); }
  onPointerUp(x, y) { this.activo && this.juego?.onPointerUp?.(x, y); }

  /**
   * Lo llama el mini-juego cuando termina.
   * @param {boolean} gano  si el jugador superó el desafío
   * @param {number} puntos puntuación final
   */
  finish(gano, puntos = 0) {
    const { game } = this;
    this.activo = false;
    game.save.registrarPuntuacion(this.idMini, puntos);

    // Recompensas asociadas al punto del mundo.
    if (gano && this.punto) {
      game.save.marcarCompletado(this.punto.id);
      if (this.punto.recompensa) game.save.ponerFlag(this.punto.recompensa);
    }
    game.audio.efecto(gano ? 'exito' : 'fallo');

    game.scenes.cambiar('result', {
      gano,
      puntos,
      idMini: this.idMini,
      def: this.def,
      punto: this.punto,
    });
  }

  _volver() {
    this.game.scenes.cambiar('world', { restaurar: true });
  }
}
