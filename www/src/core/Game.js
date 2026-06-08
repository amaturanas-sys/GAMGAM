// Game.js — El corazón del motor. Une todas las piezas y ejecuta el bucle.
//
// No necesitas editar este archivo para crear tus juegos: tú trabajas en la
// carpeta /config y en /assets. Esto solo coordina la carga, las escenas, el
// dibujo y la actualización fotograma a fotograma.

import { ConfigLoader } from './ConfigLoader.js';
import { AssetManager } from './AssetManager.js';
import { AudioManager } from './AudioManager.js';
import { Input } from './Input.js';
import { SaveManager } from './SaveManager.js';
import { Theme } from './Theme.js';
import { SceneManager } from './SceneManager.js';
import { UI } from './UI.js';

import { BootScene } from '../scenes/BootScene.js';
import { TitleScene } from '../scenes/TitleScene.js';
import { WorldScene } from '../scenes/WorldScene.js';
import { DialogueScene } from '../scenes/DialogueScene.js';
import { MiniGameScene } from '../scenes/MiniGameScene.js';
import { ResultScene } from '../scenes/ResultScene.js';

export class Game {
  constructor(canvas, uiRaiz) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = new UI(uiRaiz);

    this.ancho = 0;   // ancho lógico en píxeles CSS
    this.alto = 0;    // alto lógico en píxeles CSS
    this.dpr = 1;

    this.config = null;
    this.assets = new AssetManager();
    this.audio = null;
    this.save = new SaveManager();
    this.input = null;
    this.theme = null;
    this.scenes = new SceneManager(this);

    this._ultimo = 0;
    this._corriendo = false;
  }

  async iniciar() {
    // 1) Cargar configuración del usuario.
    this.config = await ConfigLoader.cargarTodo();

    // 2) Aplicar tema visual.
    this.theme = new Theme(this.config.game.tema);
    this.theme.aplicar();
    document.title = this.config.game.titulo || 'GAMGAM';

    // 3) Audio e input.
    this.audio = new AudioManager(this.config.audio);
    this.input = new Input(this.canvas, this);

    // 4) Ajuste de tamaño responsivo.
    this._redimensionar();
    window.addEventListener('resize', () => this._redimensionar());

    // 5) Registrar todas las escenas disponibles.
    this.scenes.registrar('boot', BootScene);
    this.scenes.registrar('title', TitleScene);
    this.scenes.registrar('world', WorldScene);
    this.scenes.registrar('dialogue', DialogueScene);
    this.scenes.registrar('minigame', MiniGameScene);
    this.scenes.registrar('result', ResultScene);

    // 6) Empezar.
    this.scenes.cambiar('boot');
    this._corriendo = true;
    requestAnimationFrame((t) => this._bucle(t));
  }

  _redimensionar() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ancho = w;
    this.alto = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _bucle(tiempo) {
    if (!this._corriendo) return;
    let dt = (tiempo - this._ultimo) / 1000;
    this._ultimo = tiempo;
    // Limita dt para evitar saltos tras pausas (cambiar de pestaña).
    if (!isFinite(dt) || dt > 0.05) dt = 0.05;

    this.scenes.update(dt);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.ancho, this.alto);
    this.scenes.render(ctx);

    requestAnimationFrame((t) => this._bucle(t));
  }

  // --- Atajos útiles para las escenas ---

  /** Convierte una fracción horizontal (0..1) a píxeles. */
  fx(fraccion) { return fraccion * this.ancho; }
  /** Convierte una fracción vertical (0..1) a píxeles. */
  fy(fraccion) { return fraccion * this.alto; }
  /** Escala una medida de diseño (referencia 720px de alto) al tamaño real. */
  escala(valor) { return valor * (this.alto / 720); }
}
