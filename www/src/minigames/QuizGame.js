// QuizGame.js — Mini-juego de QUIZ / TRIVIA.
// Responde preguntas eligiendo la opción correcta.
//
// Parámetros (en config/minigames.json):
//   preguntas         lista de { pregunta, opciones: [...], correcta: índice (empieza en 0) }
//   objetivoCorrectas cuántas aciertos hacen falta para ganar (por defecto: todas)
//   aleatorio         true para barajar el orden de las preguntas
//
// Este mini-juego usa botones HTML (más cómodos para leer y tocar).

import { MiniGameBase } from './MiniGameBase.js';

export class QuizGame extends MiniGameBase {
  iniciar() {
    this.preguntas = (this.def.preguntas || []).slice();
    if (this.param('aleatorio', false)) this._barajar(this.preguntas);
    this.objetivo = this.param('objetivoCorrectas', this.preguntas.length);
    this.indice = 0;
    this.puntos = 0;
    this.mostrarPuntos = false; // el progreso se ve en el panel
    this.tiempoRestante = null;
    this._panel = null;
    this._mostrarPregunta();
  }

  _barajar(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  _mostrarPregunta() {
    const { game } = this;
    const ui = game.ui;
    if (this._panel) { this._panel.remove(); this._panel = null; }

    const p = this.preguntas[this.indice];
    if (!p) { this._finalizar(); return; }

    const panel = ui.panel('ui-panel--quiz');
    panel.appendChild(ui.el('div', 'ui-quiz__progreso',
      `Pregunta ${this.indice + 1} de ${this.preguntas.length}  ·  Aciertos: ${this.puntos}`));
    panel.appendChild(ui.el('h3', 'ui-quiz__pregunta', p.pregunta || ''));

    const cont = ui.el('div', 'ui-quiz__opciones');
    (p.opciones || []).forEach((texto, i) => {
      const boton = ui.boton(texto, () => this._responder(i, boton, panel), 'ui-quiz__opcion');
      cont.appendChild(boton);
    });
    panel.appendChild(cont);
    this._panel = ui.agregar(panel);
  }

  _responder(elegida, boton, panel) {
    const { game } = this;
    const p = this.preguntas[this.indice];
    const correcto = elegida === p.correcta;

    // Bloquea todos los botones y marca el resultado visualmente.
    panel.querySelectorAll('button').forEach((b, i) => {
      b.disabled = true;
      if (i === p.correcta) b.classList.add('ui-quiz__opcion--correcta');
      else if (i === elegida) b.classList.add('ui-quiz__opcion--incorrecta');
    });

    if (correcto) { this.puntos++; game.audio.efecto('exito'); }
    else game.audio.efecto('fallo');

    // Avanza tras una breve pausa para que se vea el color.
    setTimeout(() => {
      this.indice++;
      this._mostrarPregunta();
    }, 900);
  }

  _finalizar() {
    if (this._panel) { this._panel.remove(); this._panel = null; }
    this.puntos >= this.objetivo ? this.ganar() : this.perder();
  }

  render(ctx) {
    // El fondo lo dibuja el host; aquí no hace falta nada en el canvas.
  }
}
