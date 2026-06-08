// TitleScene.js — Pantalla de título / menú principal.
// Textos y fondo se toman de config/game.json -> "pantallaInicio".

import { Scene } from '../core/Scene.js';

export class TitleScene extends Scene {
  enter() {
    const { game } = this;
    const g = game.config.game;
    const inicio = g.pantallaInicio || {};
    this.fondo = inicio.imagenFondo;

    // El primer toque desbloquea el audio (regla de los navegadores).
    const desbloquear = () => {
      game.audio.desbloquear();
      if (inicio.musica) game.audio.reproducirMusica(inicio.musica);
    };
    window.addEventListener('pointerdown', desbloquear, { once: true });

    // --- Interfaz HTML ---
    const ui = game.ui;
    const panel = ui.panel('ui-panel--titulo');

    const titulo = ui.el('h1', 'ui-titulo', g.titulo || 'Mi Juego');
    panel.appendChild(titulo);
    if (g.subtitulo) panel.appendChild(ui.el('p', 'ui-subtitulo', g.subtitulo));

    const hayPartida = game.save.hayPartida();
    if (hayPartida) {
      panel.appendChild(ui.boton('Continuar', () => this._jugar(true), 'ui-boton--grande'));
      panel.appendChild(ui.boton('Empezar de nuevo', () => {
        game.save.reiniciar();
        this._jugar(false);
      }));
    } else {
      panel.appendChild(ui.boton('Jugar', () => this._jugar(false), 'ui-boton--grande'));
    }

    const botonSonido = ui.boton(
      game.audio.silenciado ? '🔇 Sonido: OFF' : '🔊 Sonido: ON',
      () => {
        const silenciado = game.audio.alternarSilencio();
        botonSonido.textContent = silenciado ? '🔇 Sonido: OFF' : '🔊 Sonido: ON';
      },
      'ui-boton--peque'
    );
    panel.appendChild(botonSonido);

    ui.agregar(panel);
  }

  _jugar(continuar) {
    const { game } = this;
    const g = game.config.game;
    let escenario = g.primerEscenario;
    if (continuar && game.save.datos.escenario) {
      escenario = game.save.datos.escenario;
    }
    game.save.datos.iniciado = true;
    game.save.guardar();
    game.scenes.cambiar('world', { escenario });
  }

  render(ctx) {
    const { game } = this;
    if (this.fondo) {
      const img = game.assets.obtener(this.fondo, { etiqueta: 'Portada', color: game.theme.colorSecundario });
      _dibujarCubriendo(ctx, img, game.ancho, game.alto);
      // Velo oscuro para que el texto resalte.
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, game.ancho, game.alto);
    } else {
      ctx.fillStyle = game.theme.colorFondo;
      ctx.fillRect(0, 0, game.ancho, game.alto);
    }
  }
}

/** Dibuja una imagen cubriendo todo el área (estilo "background-size: cover"). */
function _dibujarCubriendo(ctx, img, W, H) {
  const iw = img.width, ih = img.height;
  if (!iw || !ih) return;
  const escala = Math.max(W / iw, H / ih);
  const w = iw * escala, h = ih * escala;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}
