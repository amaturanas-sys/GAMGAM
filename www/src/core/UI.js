// UI.js — Ayudantes para crear interfaz (botones, paneles, diálogos) en HTML.
//
// Usamos una capa HTML encima del canvas para que los textos largos, botones y
// menús se vean nítidos y sean fáciles de tocar. Todo se estiliza con el tema.
// Cada vez que se cambia de escena, esta capa se vacía automáticamente.

export class UI {
  constructor(raiz) {
    this.raiz = raiz; // elemento contenedor #ui
  }

  limpiar() {
    this.raiz.innerHTML = '';
  }

  /** Crea un elemento genérico con clase y contenido. */
  el(tag, clase, contenido) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (contenido !== undefined) e.textContent = contenido;
    return e;
  }

  /** Añade un elemento a la capa de interfaz. */
  agregar(elemento) {
    this.raiz.appendChild(elemento);
    return elemento;
  }

  /** Crea un botón estilizado. `onClick` es la acción al pulsarlo. */
  boton(texto, onClick, clase = '') {
    const b = this.el('button', 'ui-boton ' + clase, texto);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick?.();
    });
    return b;
  }

  /** Panel centrado (caja con fondo). */
  panel(clase = '') {
    return this.el('div', 'ui-panel ' + clase);
  }

  /** Caja de diálogo en la parte inferior. */
  cajaDialogo() {
    return this.el('div', 'ui-dialogo');
  }

  /** Barra superior con información (HUD): tiempo, puntos, etc. */
  hud() {
    const h = this.el('div', 'ui-hud');
    return h;
  }

  /** Botón flotante de acción (esquina) — p. ej. "Hablar" / "Jugar". */
  botonFlotante(texto, onClick) {
    const b = this.boton(texto, onClick, 'ui-flotante');
    return b;
  }

  /** Mensaje breve centrado en pantalla. */
  aviso(texto) {
    const a = this.el('div', 'ui-aviso', texto);
    this.agregar(a);
    return a;
  }
}
