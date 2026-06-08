// AssetManager.js — Carga imágenes y crea "marcadores de posición" automáticos.
//
// IMPORTANTE: Si una imagen no existe todavía, el motor NO falla. En su lugar
// dibuja un rectángulo de color con un texto. Así tu juego funciona desde el
// primer momento aunque no tengas dibujos. Cuando añadas tus imágenes reales en
// /assets/images, aparecerán automáticamente.

import { def } from './utils.js';

export class AssetManager {
  constructor() {
    this.imagenes = new Map();   // ruta -> HTMLImageElement | HTMLCanvasElement
    this.cargando = new Map();   // ruta -> Promise
  }

  /**
   * Devuelve una imagen ya cargada (o un marcador si no existe / aún no carga).
   * Es seguro llamarla en cada fotograma.
   */
  obtener(ruta, opciones = {}) {
    if (!ruta) return this._marcador(opciones);
    if (this.imagenes.has(ruta)) return this.imagenes.get(ruta);
    // Aún no está: inicia la carga y devuelve un marcador mientras tanto.
    this.precargar(ruta, opciones);
    return this._marcador(opciones);
  }

  /** Inicia la carga de una imagen (sin bloquear). */
  precargar(ruta, opciones = {}) {
    if (!ruta || this.imagenes.has(ruta) || this.cargando.has(ruta)) return;
    const img = new Image();
    const promesa = new Promise((resolve) => {
      img.onload = () => {
        this.imagenes.set(ruta, img);
        this.cargando.delete(ruta);
        resolve(img);
      };
      img.onerror = () => {
        // No existe: guardamos un marcador permanente para no reintentar.
        const marcador = this._marcador({ ...opciones, etiqueta: opciones.etiqueta || _nombreDesdeRuta(ruta) });
        this.imagenes.set(ruta, marcador);
        this.cargando.delete(ruta);
        resolve(marcador);
      };
    });
    img.src = ruta;
    this.cargando.set(ruta, promesa);
  }

  /** Precarga una lista de rutas y espera a que todas terminen. */
  async precargarLista(rutas) {
    rutas.filter(Boolean).forEach((r) => this.precargar(r));
    await Promise.all(Array.from(this.cargando.values()));
  }

  /** Crea un marcador visual (rectángulo de color con texto). */
  _marcador(opciones = {}) {
    const tam = def(opciones.tam, 96);
    const color = def(opciones.color, '#7b8cde');
    const etiqueta = def(opciones.etiqueta, '?');
    const clave = `${tam}|${color}|${etiqueta}`;
    if (!this._cacheMarcadores) this._cacheMarcadores = new Map();
    if (this._cacheMarcadores.has(clave)) return this._cacheMarcadores.get(clave);

    const c = document.createElement('canvas');
    c.width = c.height = tam;
    const ctx = c.getContext('2d');
    // Fondo redondeado
    ctx.fillStyle = color;
    _redondeado(ctx, 0, 0, tam, tam, tam * 0.18);
    ctx.fill();
    // Borde
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(2, tam * 0.04);
    _redondeado(ctx, 2, 2, tam - 4, tam - 4, tam * 0.16);
    ctx.stroke();
    // Texto (iniciales)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(tam * 0.32)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const txt = String(etiqueta).slice(0, 3).toUpperCase();
    ctx.fillText(txt, tam / 2, tam / 2);

    this._cacheMarcadores.set(clave, c);
    return c;
  }
}

function _nombreDesdeRuta(ruta) {
  const base = ruta.split('/').pop() || ruta;
  return base.replace(/\.[a-z0-9]+$/i, '');
}

function _redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
