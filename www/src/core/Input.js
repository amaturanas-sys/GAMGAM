// Input.js — Unifica teclado, ratón y pantalla táctil.
//
// Ofrece dos cosas:
//  1) Un "vector de movimiento" (x,y entre -1 y 1) para mover al personaje,
//     que funciona con flechas/WASD o con un joystick táctil en pantalla.
//  2) Eventos de puntero (toques/clics) que se envían a la escena activa.

import { clamp } from './utils.js';

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.teclas = new Set();
    this.puntero = { x: 0, y: 0, presionado: false };

    // Joystick virtual (solo se activa en modo "joystick").
    this.joystick = { activo: false, baseX: 0, baseY: 0, dx: 0, dy: 0, idToque: null };
    this.modoJoystick = false;

    this._instalar();
  }

  _instalar() {
    window.addEventListener('keydown', (e) => {
      this.teclas.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.teclas.delete(e.key.toLowerCase());
    });

    const pos = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const fuente = e.touches && e.touches[0] ? e.touches[0] : e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e;
      return { x: fuente.clientX - r.left, y: fuente.clientY - r.top };
    };

    const abajo = (e) => {
      const p = pos(e);
      this.puntero.x = p.x;
      this.puntero.y = p.y;
      this.puntero.presionado = true;
      if (this.modoJoystick) this._joystickInicio(p.x, p.y);
      this.game.scenes.actual?.onPointerDown?.(p.x, p.y);
    };
    const mover = (e) => {
      const p = pos(e);
      this.puntero.x = p.x;
      this.puntero.y = p.y;
      if (this.modoJoystick && this.joystick.activo) this._joystickMover(p.x, p.y);
      this.game.scenes.actual?.onPointerMove?.(p.x, p.y);
      if (this.modoJoystick && this.joystick.activo) e.preventDefault();
    };
    const arriba = (e) => {
      const p = pos(e);
      this.puntero.presionado = false;
      if (this.modoJoystick) this._joystickFin();
      this.game.scenes.actual?.onPointerUp?.(p.x, p.y);
    };

    this.canvas.addEventListener('mousedown', abajo);
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', arriba);
    this.canvas.addEventListener('touchstart', (e) => { abajo(e); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', mover, { passive: false });
    this.canvas.addEventListener('touchend', arriba);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  activarJoystick(activo) {
    this.modoJoystick = activo;
    if (!activo) this.joystick.activo = false;
  }

  _joystickInicio(x, y) {
    this.joystick.activo = true;
    this.joystick.baseX = x;
    this.joystick.baseY = y;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
  }
  _joystickMover(x, y) {
    const radio = Math.min(this.canvas.clientWidth, this.canvas.clientHeight) * 0.12;
    let dx = x - this.joystick.baseX;
    let dy = y - this.joystick.baseY;
    const mag = Math.hypot(dx, dy) || 1;
    const factor = Math.min(1, mag / radio);
    this.joystick.dx = (dx / mag) * factor;
    this.joystick.dy = (dy / mag) * factor;
  }
  _joystickFin() {
    this.joystick.activo = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
  }

  /** Vector de dirección (-1..1 en cada eje) combinando teclado y joystick. */
  vectorMovimiento() {
    let x = 0, y = 0;
    if (this.teclas.has('arrowleft') || this.teclas.has('a')) x -= 1;
    if (this.teclas.has('arrowright') || this.teclas.has('d')) x += 1;
    if (this.teclas.has('arrowup') || this.teclas.has('w')) y -= 1;
    if (this.teclas.has('arrowdown') || this.teclas.has('s')) y += 1;
    if (this.modoJoystick && this.joystick.activo) {
      x += this.joystick.dx;
      y += this.joystick.dy;
    }
    // Normaliza para que en diagonal no vaya más rápido.
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
  }
}
