// DialogueScene.js — Muestra diálogos y narrativa (config/story.json).
//
// Cada diálogo tiene una lista de "lineas". Cada línea puede tener:
//   personaje, retrato (imagen), texto, y opcionalmente:
//     • opciones: botones que llevan a otro diálogo (ir) o terminan.
//     • flag: bandera que se activa al llegar a esa línea (p.ej. una decisión).
// Toca la pantalla para avanzar cuando no hay opciones.

import { Scene } from '../core/Scene.js';

export class DialogueScene extends Scene {
  enter(params = {}) {
    const { game } = this;
    this.story = game.config.story;
    this.idActual = params.id;
    this.punto = params.punto || null;
    this.nodo = this.story[this.idActual];
    this.indice = 0;

    if (!this.nodo) {
      console.error('[GAMGAM] Diálogo no encontrado: ' + this.idActual);
      this._terminar();
      return;
    }
    this.fondo = this.nodo.fondo;
    this._mostrarLinea();
  }

  _lineaActual() {
    return this.nodo.lineas?.[this.indice];
  }

  _mostrarLinea() {
    const { game } = this;
    const ui = game.ui;
    ui.limpiar();

    const linea = this._lineaActual();
    if (!linea) { this._terminar(); return; }

    // Bandera asociada a esta línea (decisión/recompensa narrativa).
    if (linea.flag) game.save.ponerFlag(linea.flag);
    if (linea.musica) game.audio.reproducirMusica(linea.musica);

    const caja = ui.cajaDialogo();

    if (linea.retrato) {
      const cont = ui.el('div', 'ui-dialogo__retrato');
      const img = document.createElement('img');
      img.src = linea.retrato;
      img.onerror = () => { img.style.display = 'none'; };
      cont.appendChild(img);
      caja.appendChild(cont);
    }

    const cuerpo = ui.el('div', 'ui-dialogo__cuerpo');
    if (linea.personaje) cuerpo.appendChild(ui.el('div', 'ui-dialogo__nombre', linea.personaje));
    cuerpo.appendChild(ui.el('p', 'ui-dialogo__texto', linea.texto || ''));

    if (linea.opciones && linea.opciones.length) {
      const opc = ui.el('div', 'ui-dialogo__opciones');
      linea.opciones.forEach((o) => {
        opc.appendChild(ui.boton(o.texto, () => this._elegir(o)));
      });
      cuerpo.appendChild(opc);
    } else {
      cuerpo.appendChild(ui.el('div', 'ui-dialogo__continuar', 'Toca para continuar  ▶'));
    }

    caja.appendChild(cuerpo);
    ui.agregar(caja);
  }

  _elegir(opcion) {
    this.game.audio.efecto('click');
    if (opcion.flag) this.game.save.ponerFlag(opcion.flag);
    if (opcion.minijuego) {
      this.game.scenes.cambiar('minigame', { id: opcion.minijuego, punto: this.punto });
      return;
    }
    if (opcion.ir) {
      this.idActual = opcion.ir;
      this.nodo = this.story[this.idActual];
      this.indice = 0;
      this.fondo = this.nodo?.fondo || this.fondo;
      this._mostrarLinea();
    } else {
      this._terminar();
    }
  }

  onPointerDown() {
    const linea = this._lineaActual();
    if (linea && (!linea.opciones || !linea.opciones.length)) {
      this.game.audio.efecto('click');
      this.indice++;
      this._mostrarLinea();
    }
  }

  _terminar() {
    // Vuelve al mundo en la posición donde estábamos.
    this.game.scenes.cambiar('world', { restaurar: true });
  }

  render(ctx) {
    const { game } = this;
    if (this.fondo) {
      const img = game.assets.obtener(this.fondo, { etiqueta: 'Escena' });
      const iw = img.width, ih = img.height;
      if (iw && ih) {
        const e = Math.max(game.ancho / iw, game.alto / ih);
        ctx.drawImage(img, (game.ancho - iw * e) / 2, (game.alto - ih * e) / 2, iw * e, ih * e);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, game.ancho, game.alto);
    } else {
      ctx.fillStyle = game.theme.colorFondo;
      ctx.fillRect(0, 0, game.ancho, game.alto);
    }
  }
}
