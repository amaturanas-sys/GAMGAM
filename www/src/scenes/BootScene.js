// BootScene.js — Pantalla de carga inicial.
// Precarga las imágenes principales y luego pasa al título.

import { Scene } from '../core/Scene.js';

export class BootScene extends Scene {
  async enter() {
    this.progreso = 0;
    const { game } = this;
    const g = game.config.game;
    const world = game.config.world;

    // Reúne las imágenes más importantes para precargarlas.
    const rutas = [];
    if (g.pantallaInicio?.imagenFondo) rutas.push(g.pantallaInicio.imagenFondo);
    if (world.jugador?.sprite) rutas.push(world.jugador.sprite);
    const escInicial = g.primerEscenario && world.escenarios?.[g.primerEscenario];
    if (escInicial) {
      if (escInicial.fondo) rutas.push(escInicial.fondo);
      (escInicial.puntos || []).forEach((p) => p.sprite && rutas.push(p.sprite));
    }

    await game.assets.precargarLista(rutas);
    this.progreso = 1;
    // Pequeña pausa para que se vea la barra completa.
    setTimeout(() => game.scenes.cambiar('title'), 250);
  }

  render(ctx) {
    const { game } = this;
    const t = game.theme;
    ctx.fillStyle = t.colorFondo;
    ctx.fillRect(0, 0, game.ancho, game.alto);

    ctx.fillStyle = t.colorTexto;
    ctx.textAlign = 'center';
    ctx.font = `bold ${game.escala(26)}px ${t.fuente}`;
    ctx.fillText(game.config.game.titulo || 'GAMGAM', game.ancho / 2, game.alto / 2 - game.escala(30));

    // Barra de progreso
    const w = Math.min(game.ancho * 0.6, 360);
    const h = game.escala(10);
    const x = (game.ancho - w) / 2;
    const y = game.alto / 2 + game.escala(10);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = t.colorPrimario;
    ctx.fillRect(x, y, w * this.progreso, h);
  }
}
