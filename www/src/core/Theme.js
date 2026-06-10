// Theme.js — Aplica los colores y la fuente definidos en game.json -> "tema".
//
// Los valores se convierten en "variables CSS" que usan tanto la interfaz (HTML)
// como el motor para dibujar. Cambiar un color aquí cambia todo el aspecto.

export class Theme {
  constructor(tema = {}) {
    this.colorPrimario = tema.colorPrimario || '#4cc9f0';
    this.colorSecundario = tema.colorSecundario || '#f72585';
    this.colorFondo = tema.colorFondo || '#0d1b2a';
    this.colorTexto = tema.colorTexto || '#ffffff';
    this.colorPanel = tema.colorPanel || 'rgba(13, 27, 42, 0.92)';
    this.fuente = tema.fuente || 'system-ui, sans-serif';
    this.radio = tema.radioBordes ?? 14;
  }

  /** Escribe las variables CSS en la página. */
  aplicar() {
    const r = document.documentElement.style;
    r.setProperty('--color-primario', this.colorPrimario);
    r.setProperty('--color-secundario', this.colorSecundario);
    r.setProperty('--color-fondo', this.colorFondo);
    r.setProperty('--color-texto', this.colorTexto);
    r.setProperty('--color-panel', this.colorPanel);
    r.setProperty('--fuente', this.fuente);
    r.setProperty('--radio', this.radio + 'px');
    document.body.style.background = this.colorFondo;
    document.body.style.color = this.colorTexto;
    document.body.style.fontFamily = this.fuente;
  }
}
