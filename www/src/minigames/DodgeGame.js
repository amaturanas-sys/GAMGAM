// DodgeGame.js — Mini-juego de ESQUIVA / RUNNER.
// Mueve a tu personaje (abajo) para esquivar los obstáculos que caen.
//
// Parámetros (en config/minigames.json):
//   duracion             segundos que debes sobrevivir para ganar (p.ej. 25)
//   vidas                golpes que aguantas (p.ej. 3)
//   velocidadObstaculos  velocidad de caída (p.ej. 260)
//   intervaloObstaculos  cada cuántos segundos cae uno (p.ej. 0.7)
//   spriteJugador        imagen del personaje (opcional)
//   spriteObstaculo      imagen del obstáculo (opcional)
//   tamanoJugador        diámetro del personaje (p.ej. 64)
//   tamanoObstaculo      diámetro del obstáculo (p.ej. 56)

import { MiniGameBase } from './MiniGameBase.js';
import { rand, clamp, rectsOverlap } from '../core/utils.js';

export class DodgeGame extends MiniGameBase {
  iniciar() {
    this.duracion = this.param('duracion', 25);
    this.tiempoRestante = this.duracion;
    this.vidas = this.param('vidas', 3);
    this.velObs = this.param('velocidadObstaculos', 260);
    this.intervalo = this.param('intervaloObstaculos', 0.7);
    this.spriteJugador = this.param('spriteJugador', this.game.config.world.jugador?.sprite || null);
    this.spriteObs = this.param('spriteObstaculo', null);
    this.tamJug = this.param('tamanoJugador', 64);
    this.tamObs = this.param('tamanoObstaculo', 56);

    this.jugX = this.game.ancho / 2;     // posición horizontal del jugador
    this.objetoX = null;                 // destino al arrastrar
    this.obstaculos = [];
    this._acumulador = 0;
    this.mostrarPuntos = true;
  }

  _radioJug() { return this.game.escala(this.tamJug) / 2; }
  _radioObs() { return this.game.escala(this.tamObs) / 2; }
  _jugY() { return this.game.alto - this.game.escala(90); }

  update(dt) {
    const { game } = this;
    this.tiempoRestante -= dt;
    this.puntos = Math.floor(this.duracion - this.tiempoRestante);

    // Movimiento del jugador: arrastre (puntero) o teclado.
    const r = this._radioJug();
    if (this.objetoX !== null) {
      this.jugX += (this.objetoX - this.jugX) * Math.min(1, dt * 14);
    }
    const v = game.input.vectorMovimiento();
    this.jugX += v.x * game.escala(420) * dt;
    this.jugX = clamp(this.jugX, r, game.ancho - r);

    // Aparición de obstáculos.
    this._acumulador += dt;
    if (this._acumulador >= this.intervalo) {
      this._acumulador = 0;
      const ro = this._radioObs();
      this.obstaculos.push({ x: rand(ro, game.ancho - ro), y: -ro, r: ro });
    }

    // Caída + colisiones.
    const velocidad = game.escala(this.velObs);
    const jugRect = { x: this.jugX - r, y: this._jugY() - r, w: r * 2, h: r * 2 };
    for (const o of this.obstaculos) {
      o.y += velocidad * dt;
      const oRect = { x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 };
      if (!o.golpeado && rectsOverlap(jugRect, oRect)) {
        o.golpeado = true;
        this.vidas--;
        game.audio.efecto('golpe');
        if (this.vidas <= 0) { this.perder(); return; }
      }
    }
    this.obstaculos = this.obstaculos.filter((o) => o.y - o.r < game.alto && !o.golpeado);

    if (this.tiempoRestante <= 0) { this.tiempoRestante = 0; this.ganar(); }
  }

  onPointerDown(x) { this.objetoX = x; }
  onPointerMove(x) { if (this.game.input.puntero.presionado) this.objetoX = x; }
  onPointerUp() { this.objetoX = null; }

  render(ctx) {
    const { game } = this;

    // Obstáculos
    const imgObs = this.spriteObs
      ? game.assets.obtener(this.spriteObs, { etiqueta: 'Obs', color: '#e63946' })
      : null;
    for (const o of this.obstaculos) {
      if (imgObs) {
        ctx.drawImage(imgObs, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = '#e63946';
        ctx.fill();
      }
    }

    // Jugador
    const r = this._radioJug();
    const y = this._jugY();
    const imgJug = this.spriteJugador
      ? game.assets.obtener(this.spriteJugador, { etiqueta: 'Tú', color: game.theme.colorPrimario })
      : null;
    if (imgJug) {
      ctx.drawImage(imgJug, this.jugX - r, y - r, r * 2, r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(this.jugX, y, r, 0, Math.PI * 2);
      ctx.fillStyle = game.theme.colorPrimario;
      ctx.fill();
    }

    // Vidas
    ctx.fillStyle = game.theme.colorTexto;
    ctx.font = `bold ${game.escala(16)}px ${game.theme.fuente}`;
    ctx.textAlign = 'left';
    ctx.fillText('Vidas: ' + '❤️'.repeat(Math.max(0, this.vidas)), game.escala(16), game.escala(34));
  }
}
