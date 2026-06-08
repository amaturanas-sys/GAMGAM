// AudioManager.js — Reproduce música de fondo y efectos de sonido.
//
// Las pistas se declaran en config/audio.json. Si un archivo de sonido no
// existe, simplemente no suena (el juego no falla). Por las reglas de los
// navegadores, el audio empieza tras la primera interacción del usuario.

export class AudioManager {
  constructor(config) {
    this.config = config || {};
    this.musica = this.config.musica || {};
    this.efectos = this.config.efectos || {};
    this.volumenMusica = this.config.volumenMusica ?? 0.6;
    this.volumenEfectos = this.config.volumenEfectos ?? 0.9;
    this.silenciado = false;
    this.desbloqueado = false;

    this._pistaActual = null;       // id de la música sonando
    this._audioMusica = null;       // HTMLAudioElement de la música
    this._cacheEfectos = new Map(); // id -> HTMLAudioElement
  }

  /** Se llama tras la primera pulsación para permitir el audio. */
  desbloquear() {
    this.desbloqueado = true;
    if (this._audioMusica && this._audioMusica.paused) {
      this._audioMusica.play().catch(() => {});
    }
  }

  /** Reproduce (en bucle) la música con el id indicado en audio.json. */
  reproducirMusica(id) {
    if (id === this._pistaActual) return;
    this.detenerMusica();
    this._pistaActual = id;
    const ruta = this.musica[id];
    if (!ruta) return;
    const audio = new Audio(ruta);
    audio.loop = true;
    audio.volume = this.silenciado ? 0 : this.volumenMusica;
    audio.addEventListener('error', () => {/* archivo ausente: silencio */});
    this._audioMusica = audio;
    if (this.desbloqueado) audio.play().catch(() => {});
  }

  detenerMusica() {
    if (this._audioMusica) {
      this._audioMusica.pause();
      this._audioMusica = null;
    }
    this._pistaActual = null;
  }

  /** Reproduce un efecto de sonido corto por su id en audio.json. */
  efecto(id) {
    if (!id || !this.desbloqueado) return;
    const ruta = this.efectos[id];
    if (!ruta) return;
    try {
      const base = this._cacheEfectos.get(id) || new Audio(ruta);
      this._cacheEfectos.set(id, base);
      // Clonamos para permitir sonidos solapados.
      const inst = base.cloneNode();
      inst.volume = this.silenciado ? 0 : this.volumenEfectos;
      inst.play().catch(() => {});
    } catch (_) {/* ignorar */}
  }

  alternarSilencio() {
    this.silenciado = !this.silenciado;
    if (this._audioMusica) {
      this._audioMusica.volume = this.silenciado ? 0 : this.volumenMusica;
    }
    return this.silenciado;
  }
}
