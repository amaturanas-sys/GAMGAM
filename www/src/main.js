// main.js — Punto de arranque. Crea el juego y lo inicia.
//
// Si algo falla al cargar (por ejemplo, un error en un archivo JSON), se muestra
// un mensaje claro en pantalla en lugar de quedarse en negro.

import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('lienzo');
  const ui = document.getElementById('ui');
  const game = new Game(canvas, ui);
  window.GAMGAM = game; // accesible desde la consola para depurar

  try {
    await game.iniciar();
  } catch (error) {
    mostrarError(error);
  }
});

function mostrarError(error) {
  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
    'padding:24px;background:#1a1a2e;color:#fff;font-family:system-ui,sans-serif;z-index:9999;';
  div.innerHTML =
    '<div style="max-width:520px;text-align:center">' +
    '<h2 style="color:#f72585">No se pudo iniciar el juego</h2>' +
    '<p style="opacity:.85;line-height:1.5">' + escapar(String(error && error.message || error)) + '</p>' +
    '<p style="opacity:.6;font-size:14px">Suele deberse a un error en algún archivo de la carpeta <b>config</b>. ' +
    'Revisa que el JSON esté bien escrito (comas, comillas y llaves).</p>' +
    '</div>';
  document.body.appendChild(div);
  console.error('[GAMGAM]', error);
}

function escapar(t) {
  return t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
