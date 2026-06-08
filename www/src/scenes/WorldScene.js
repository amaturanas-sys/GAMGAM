// WorldScene.js — El mundo 2D explorable.
//
// El jugador camina por un "escenario" (definido en config/world.json). Puede:
//   • Cruzar "salidas" para ir a otro escenario.
//   • Acercarse a "puntos" de interés y pulsar un botón para activar su acción:
//     un diálogo, un mini-juego o ir a otro escenario.
//
// Controles: arrastra el dedo para mover (joystick) o usa flechas/WASD.

import { Scene } from '../core/Scene.js';
import { clamp, dist } from '../core/utils.js';

export class WorldScene extends Scene {
  enter(params = {}) {
    const { game } = this;
    const world = game.config.world;

    // ¿Volvemos de un diálogo o mini-juego? Restauramos posición.
    if (params.restaurar && game.mundoRetorno) {
      this.idEscenario = game.mundoRetorno.escenario;
    } else {
      this.idEscenario = params.escenario || game.config.game.primerEscenario;
    }

    this.escenario = world.escenarios?.[this.idEscenario];
    if (!this.escenario) {
      console.error('[GAMGAM] Escenario no encontrado: ' + this.idEscenario);
      this.escenario = { nombre: '?', puntos: [], salidas: [], spawn: { x: 0.5, y: 0.5 } };
    }

    // Guarda el escenario actual en la partida.
    game.save.datos.escenario = this.idEscenario;
    game.save.guardar();

    // Jugador (fracciones 0..1 de la pantalla).
    this.jugadorDef = world.jugador || {};
    if (params.restaurar && game.mundoRetorno && game.mundoRetorno.escenario === this.idEscenario) {
      this.px = game.mundoRetorno.x;
      this.py = game.mundoRetorno.y;
    } else {
      this.px = this.escenario.spawn?.x ?? 0.5;
      this.py = this.escenario.spawn?.y ?? 0.7;
    }

    // Música del escenario.
    if (this.escenario.musica) game.audio.reproducirMusica(this.escenario.musica);

    // Precarga imágenes del escenario.
    const rutas = [this.escenario.fondo, this.jugadorDef.sprite];
    (this.escenario.puntos || []).forEach((p) => rutas.push(p.sprite));
    game.assets.precargarLista(rutas);

    // Controles táctiles (joystick por arrastre).
    const modo = game.config.game.controles?.mundo || 'joystick';
    game.input.activarJoystick(modo === 'joystick');

    this._cooldownSalida = 0.6;     // evita reactivar la salida al aparecer
    this._puntoActivoId = null;
    this._botonEl = null;

    this._construirHUD();
  }

  exit() {
    this.game.input.activarJoystick(false);
  }

  _construirHUD() {
    const { game } = this;
    const ui = game.ui;
    const barra = ui.el('div', 'ui-topbar');
    barra.appendChild(ui.boton('☰ Menú', () => game.scenes.cambiar('title'), 'ui-boton--peque'));
    barra.appendChild(ui.el('span', 'ui-topbar__nombre', this.escenario.nombre || ''));
    ui.agregar(barra);
  }

  // --- Dimensiones del jugador en píxeles ---
  _radioJugador() {
    return this.game.escala((this.jugadorDef.tamano || 48) / 2);
  }

  update(dt) {
    const { game } = this;
    if (this._cooldownSalida > 0) this._cooldownSalida -= dt;

    // Movimiento
    const v = game.input.vectorMovimiento();
    const velPx = game.escala(this.jugadorDef.velocidad || 180);
    let x = this.px * game.ancho;
    let y = this.py * game.alto;
    x += v.x * velPx * dt;
    y += v.y * velPx * dt;
    const r = this._radioJugador();
    x = clamp(x, r, game.ancho - r);
    y = clamp(y, r, game.alto - r);
    this.px = x / game.ancho;
    this.py = y / game.alto;

    // ¿Sobre una salida?
    if (this._cooldownSalida <= 0) {
      for (const s of this.escenario.salidas || []) {
        const sx = s.x * game.ancho, sy = s.y * game.alto;
        const sw = (s.ancho || 0.06) * game.ancho, sh = (s.alto || 0.25) * game.alto;
        if (x > sx && x < sx + sw && y > sy && y < sy + sh) {
          if (!game.save.tieneTodas(s.requiere)) {
            this._mostrarBloqueoSalida(s);
            this._cooldownSalida = 1.2; // evita repetir el aviso sin parar
            return;
          }
          game.audio.efecto('puerta');
          game.scenes.cambiar('world', { escenario: s.destino });
          return;
        }
      }
    }

    // Punto de interés más cercano que se pueda activar.
    this._actualizarPuntoCercano(x, y);
  }

  _mostrarBloqueoSalida(salida) {
    const { game } = this;
    // Empuja al jugador de vuelta para que no quede atascado en la salida.
    this.px = Math.min(0.9, Math.max(0.1, this.px - (this.px > 0.5 ? 0.06 : -0.06)));
    if (this._avisoEl) this._avisoEl.remove();
    this._avisoEl = game.ui.aviso('🔒 ' + (salida.textoBloqueado || 'Camino bloqueado'));
    game.audio.efecto('fallo');
    setTimeout(() => { if (this._avisoEl) { this._avisoEl.remove(); this._avisoEl = null; } }, 1800);
  }

  _actualizarPuntoCercano(x, y) {
    const { game } = this;
    const radioActivacion = game.escala(75);
    let mejor = null, mejorDist = Infinity;
    for (const p of this.escenario.puntos || []) {
      const d = dist(x, y, p.x * game.ancho, p.y * game.alto);
      if (d < radioActivacion && d < mejorDist) { mejor = p; mejorDist = d; }
    }

    const idNuevo = mejor ? mejor.id : null;
    if (idNuevo === this._puntoActivoId) return; // sin cambios
    this._puntoActivoId = idNuevo;

    // Reconstruye el botón flotante.
    if (this._botonEl) { this._botonEl.remove(); this._botonEl = null; }
    if (!mejor) return;

    const requisitosOk = game.save.tieneTodas(mejor.requiere);
    if (!requisitosOk) {
      this._botonEl = game.ui.el('div', 'ui-flotante ui-flotante--bloqueado',
        '🔒 ' + (mejor.textoBloqueado || 'Bloqueado'));
      game.ui.agregar(this._botonEl);
      return;
    }

    const etiqueta = mejor.etiqueta || _etiquetaPorTipo(mejor.accion);
    this._botonEl = game.ui.botonFlotante(etiqueta, () => this._ejecutarAccion(mejor));
    game.ui.agregar(this._botonEl);
  }

  _ejecutarAccion(punto) {
    const { game } = this;
    const accion = punto.accion || {};
    // Recuerda dónde estamos para volver aquí.
    game.mundoRetorno = { escenario: this.idEscenario, x: this.px, y: this.py };
    game.audio.efecto('click');

    if (accion.tipo === 'dialogo') {
      game.scenes.cambiar('dialogue', { id: accion.id, punto });
    } else if (accion.tipo === 'minijuego') {
      game.scenes.cambiar('minigame', { id: accion.id, punto });
    } else if (accion.tipo === 'escenario') {
      game.scenes.cambiar('world', { escenario: accion.id });
    }
  }

  render(ctx) {
    const { game } = this;
    const W = game.ancho, H = game.alto;

    // Fondo
    if (this.escenario.fondo) {
      const img = game.assets.obtener(this.escenario.fondo, { etiqueta: 'Fondo' });
      _cover(ctx, img, W, H);
    } else {
      ctx.fillStyle = this.escenario.colorFondo || game.theme.colorFondo;
      ctx.fillRect(0, 0, W, H);
    }

    // Salidas
    for (const s of this.escenario.salidas || []) {
      const sx = s.x * W, sy = s.y * H;
      const sw = (s.ancho || 0.06) * W, sh = (s.alto || 0.25) * H;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = game.theme.colorPrimario;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, sw, sh);
      if (s.etiqueta) {
        ctx.fillStyle = game.theme.colorTexto;
        ctx.font = `bold ${game.escala(14)}px ${game.theme.fuente}`;
        ctx.textAlign = 'center';
        ctx.fillText(s.etiqueta, sx + sw / 2, sy - game.escala(8));
      }
    }

    // Puntos de interés
    const radioActivacion = game.escala(75);
    for (const p of this.escenario.puntos || []) {
      const x = p.x * W, y = p.y * H;
      const tam = game.escala(p.tamano || 56);
      const completado = game.save.estaCompletado(p.id);

      // Aro de activación si el jugador está cerca.
      if (p.id === this._puntoActivoId) {
        ctx.beginPath();
        ctx.arc(x, y, radioActivacion * 0.9, 0, Math.PI * 2);
        ctx.strokeStyle = game.theme.colorSecundario;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const img = game.assets.obtener(p.sprite, { etiqueta: p.id, tam: 96, color: game.theme.colorSecundario });
      ctx.globalAlpha = completado ? 0.6 : 1;
      ctx.drawImage(img, x - tam / 2, y - tam / 2, tam, tam);
      ctx.globalAlpha = 1;

      if (completado) {
        ctx.fillStyle = '#3ddc84';
        ctx.font = `bold ${game.escala(20)}px ${game.theme.fuente}`;
        ctx.textAlign = 'center';
        ctx.fillText('✓', x + tam * 0.35, y - tam * 0.3);
      }
    }

    // Jugador
    const jr = this._radioJugador();
    const jimg = game.assets.obtener(this.jugadorDef.sprite, { etiqueta: 'Tú', tam: 96, color: game.theme.colorPrimario });
    ctx.drawImage(jimg, this.px * W - jr, this.py * H - jr, jr * 2, jr * 2);

    // Joystick visual
    this._dibujarJoystick(ctx);
  }

  _dibujarJoystick(ctx) {
    const j = this.game.input.joystick;
    if (!j.activo) return;
    const radio = Math.min(this.game.ancho, this.game.alto) * 0.12;
    ctx.beginPath();
    ctx.arc(j.baseX, j.baseY, radio, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(j.baseX + j.dx * radio, j.baseY + j.dy * radio, radio * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = this.game.theme.colorPrimario;
    ctx.fill();
  }
}

function _etiquetaPorTipo(accion = {}) {
  if (accion.tipo === 'dialogo') return '💬 Hablar';
  if (accion.tipo === 'minijuego') return '🎮 Jugar';
  if (accion.tipo === 'escenario') return '🚪 Entrar';
  return 'Acción';
}

function _cover(ctx, img, W, H) {
  const iw = img.width, ih = img.height;
  if (!iw || !ih) return;
  const escala = Math.max(W / iw, H / ih);
  const w = iw * escala, h = ih * escala;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}
