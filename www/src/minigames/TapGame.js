// TapGame.js — Mini-juego de REACCIÓN / TAP.
// Aparecen objetivos que debes tocar antes de que desaparezcan.
//
// Parámetros (en config/minigames.json):
//   duracion        segundos de partida (p.ej. 30)
//   objetivoPuntos  cuántos aciertos hacen falta para ganar (p.ej. 12)
//   spawnIntervalo  cada cuántos segundos aparece un objetivo (p.ej. 0.8)
//   vidaObjetivo    segundos que dura cada objetivo en pantalla (p.ej. 1.5)
//   sprite          imagen del objetivo (opcional)
//   tamano          diámetro del objetivo en px (p.ej. 90)

import { MiniGameBase } from './MiniGameBase.js';
import { rand } from '../core/utils.js';

export class TapGame extends MiniGameBase {
  iniciar() {
    this.duracion = this.param('duracion', 30);
    this.tiempoRestante = this.duracion;
    this.objetivo = this.param('objetivoPuntos', 12);
    this.intervalo = this.param('spawnIntervalo', 0.8);
    this.vidaObjetivo = this.param('vidaObjetivo', 1.5);
    this.tam = this.param('tamano', 90);
    this.sprite = this.param('sprite', null);

    this.objetivos = [];
    this._acumulador = 0;
  }

  update(dt) {
    this.tiempoRestante -= dt;
    this._acumulador += dt;
    if (this._acumulador >= this.intervalo) {
      this._acumulador = 0;
      this._aparecer();
    }
    // Envejecer objetivos.
    for (const o of this.objetivos) o.vida -= dt;
    this.objetivos = this.objetivos.filter((o) => o.vida > 0);

    if (this.puntos >= this.objetivo) { this.ganar(); return; }
    if (this.tiempoRestante <= 0) {
      this.tiempoRestante = 0;
      this.puntos >= this.objetivo ? this.ganar() : this.perder();
    }
  }

  _aparecer() {
    const { game } = this;
    const r = game.escala(this.tam) / 2;
    const margenSup = game.escala(70); // deja sitio al marcador
    this.objetivos.push({
      x: rand(r, game.ancho - r),
      y: rand(margenSup + r, game.alto - r),
      r,
      vida: this.vidaObjetivo,
    });
  }

  onPointerDown(x, y) {
    // ¿Tocó algún objetivo? (del más nuevo al más viejo)
    for (let i = this.objetivos.length - 1; i >= 0; i--) {
      const o = this.objetivos[i];
      const dx = x - o.x, dy = y - o.y;
      if (dx * dx + dy * dy <= o.r * o.r) {
        this.objetivos.splice(i, 1);
        this.puntos++;
        this.game.audio.efecto('toque');
        return;
      }
    }
  }

  render(ctx) {
    const { game } = this;
    const img = this.sprite
      ? game.assets.obtener(this.sprite, { etiqueta: 'Obj', tam: 96, color: game.theme.colorSecundario })
      : null;

    for (const o of this.objetivos) {
      const frac = o.vida / this.vidaObjetivo;
      // Anillo de tiempo restante.
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.strokeStyle = game.theme.colorPrimario;
      ctx.lineWidth = 4;
      ctx.stroke();

      if (img) {
        ctx.drawImage(img, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = game.theme.colorSecundario;
        ctx.fill();
      }
    }

    // Meta
    ctx.fillStyle = game.theme.colorTexto;
    ctx.font = `bold ${game.escala(16)}px ${game.theme.fuente}`;
    ctx.textAlign = 'left';
    ctx.fillText('Meta: ' + this.objetivo, game.escala(16), game.escala(34));
  }
}
