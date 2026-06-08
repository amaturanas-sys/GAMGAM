// generar-imagenes.mjs — Genera imágenes "de inicio" simples para el juego de
// ejemplo, SIN dependencias externas (solo Node y su módulo zlib).
//
// Son marcadores con estilo (formas y colores planos) para que el juego se vea
// terminado mientras dibujas o consigues tu arte definitivo. Sustituye estos
// PNG por los tuyos cuando quieras.
//
//   Uso:  node tools/generar-imagenes.mjs
//
// Crea los archivos en www/assets/images/.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(__dirname, '..', 'www', 'assets', 'images');
mkdirSync(SALIDA, { recursive: true });

// ---------- Lienzo de píxeles (RGBA) ----------
class Lienzo {
  constructor(w, h, fondo = [0, 0, 0, 0]) {
    this.w = w; this.h = h;
    this.buf = new Uint8Array(w * h * 4);
    if (fondo[3] !== 0) this.fillRect(0, 0, w, h, fondo);
  }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const a = c[3] ?? 255;
    const i = (y * this.w + x) * 4;
    if (a >= 255) {
      this.buf[i] = c[0]; this.buf[i + 1] = c[1]; this.buf[i + 2] = c[2]; this.buf[i + 3] = 255;
    } else if (a > 0) {
      // Mezcla alfa sencilla sobre lo existente.
      const ba = this.buf[i + 3] / 255, fa = a / 255;
      const oa = fa + ba * (1 - fa);
      for (let k = 0; k < 3; k++) {
        this.buf[i + k] = (c[k] * fa + this.buf[i + k] * ba * (1 - fa)) / (oa || 1);
      }
      this.buf[i + 3] = oa * 255;
    }
  }
  fillRect(x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  fillCircle(cx, cy, r, c) {
    for (let yy = cy - r; yy <= cy + r; yy++)
      for (let xx = cx - r; xx <= cx + r; xx++) {
        const dx = xx - cx, dy = yy - cy;
        if (dx * dx + dy * dy <= r * r) this.set(xx, yy, c);
      }
  }
  vGradient(top, bottom) {
    for (let y = 0; y < this.h; y++) {
      const t = y / (this.h - 1);
      const c = [
        Math.round(top[0] + (bottom[0] - top[0]) * t),
        Math.round(top[1] + (bottom[1] - top[1]) * t),
        Math.round(top[2] + (bottom[2] - top[2]) * t),
        255,
      ];
      this.fillRect(0, y, this.w, 1, c);
    }
  }
  fillPoly(pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const [, py] of pts) { minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
          xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i < xs.length; i += 2) {
        for (let x = Math.ceil(xs[i]); x <= Math.floor(xs[i + 1]); x++) this.set(x, y, c);
      }
    }
  }
  estrella(cx, cy, rExt, rInt, puntas, c) {
    const pts = [];
    for (let i = 0; i < puntas * 2; i++) {
      const r = i % 2 === 0 ? rExt : rInt;
      const ang = (Math.PI / puntas) * i - Math.PI / 2;
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    this.fillPoly(pts, c);
  }
}

// ---------- Codificador PNG ----------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(tipo, datos) {
  const t = Buffer.from(tipo, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([t, datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([len, cuerpo, crc]);
}
function png(lienzo) {
  const { w, h, buf } = lienzo;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filtro "none"
    buf.copy ? null : null;
    Buffer.from(buf.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function guardar(nombre, lienzo) {
  writeFileSync(join(SALIDA, nombre), png(lienzo));
  console.log('  ✓ ' + nombre);
}

// ---------- Paleta (a juego con el tema de ejemplo) ----------
const PRIMARIO = [76, 201, 240];
const SECUNDARIO = [247, 37, 133];
const ORO = [255, 209, 102];

// ---------- Personaje genérico (círculo con ojos) ----------
function personaje(color, opciones = {}) {
  const s = 256;
  const c = new Lienzo(s, s);
  c.fillCircle(s / 2, s / 2, 110, color);
  c.fillCircle(s / 2, s / 2, 110, [255, 255, 255, 40]); // brillo sutil
  c.fillCircle(s / 2, s / 2, 104, color);
  // Ojos
  const oy = s / 2 - 10;
  c.fillCircle(s / 2 - 34, oy, 16, [255, 255, 255]);
  c.fillCircle(s / 2 + 34, oy, 16, [255, 255, 255]);
  c.fillCircle(s / 2 - 30, oy + 3, 8, [20, 20, 30]);
  c.fillCircle(s / 2 + 30, oy + 3, 8, [20, 20, 30]);
  if (opciones.sombrero) {
    c.fillPoly([[s / 2 - 70, 95], [s / 2 + 70, 95], [s / 2, 5]], opciones.sombrero);
  }
  if (opciones.barba) {
    c.fillCircle(s / 2, s / 2 + 60, 50, opciones.barba);
  }
  return c;
}

console.log('Generando imágenes de inicio en www/assets/images/ ...');

// Jugador
guardar('jugador.png', personaje(PRIMARIO));
// Anciano (con barba y sombrero)
guardar('npc_anciano.png', personaje([124, 145, 200], { barba: [235, 235, 235], sombrero: [90, 70, 140] }));
// Guardián (oscuro con casco)
guardar('npc_guardian.png', personaje([90, 100, 120], { sombrero: [60, 65, 80] }));

// Estrella
{
  const c = new Lienzo(256, 256);
  c.estrella(128, 128, 118, 50, 5, ORO);
  c.estrella(128, 128, 70, 28, 5, [255, 235, 160]);
  guardar('estrella.png', c);
}

// Cofre
{
  const c = new Lienzo(256, 256);
  c.fillRect(40, 110, 176, 110, [120, 80, 45]);   // base
  c.fillRect(40, 80, 176, 50, [150, 100, 55]);    // tapa
  c.fillRect(40, 128, 176, 12, [80, 52, 28]);     // junta
  c.fillRect(116, 120, 24, 36, ORO);              // cerradura
  c.fillCircle(128, 132, 8, [80, 52, 28]);
  guardar('cofre.png', c);
}

// Roca
{
  const c = new Lienzo(256, 256);
  c.fillPoly([[60, 180], [40, 120], [90, 70], [170, 65], [215, 120], [195, 185]], [120, 124, 130]);
  c.fillPoly([[90, 70], [170, 65], [150, 110], [100, 115]], [150, 154, 160]); // brillo
  guardar('roca.png', c);
}

// Fondo del pueblo (cielo -> césped + casas)
{
  const w = 540, h = 960;
  const c = new Lienzo(w, h);
  c.vGradient([88, 150, 210], [180, 205, 170]);
  c.fillRect(0, h - 260, w, 260, [110, 160, 90]); // suelo
  // Casas
  const casa = (x, base, ancho, alto, color) => {
    c.fillRect(x, base - alto, ancho, alto, color);
    c.fillPoly([[x - 12, base - alto], [x + ancho + 12, base - alto], [x + ancho / 2, base - alto - 60]], [140, 70, 60]);
    c.fillRect(x + ancho / 2 - 18, base - 70, 36, 70, [90, 60, 40]); // puerta
  };
  casa(70, h - 250, 150, 170, [220, 200, 170]);
  casa(330, h - 250, 150, 200, [205, 185, 160]);
  guardar('fondo_pueblo.png', c);
}

// Fondo del bosque (verde oscuro + árboles)
{
  const w = 540, h = 960;
  const c = new Lienzo(w, h);
  c.vGradient([40, 80, 60], [20, 45, 35]);
  c.fillRect(0, h - 220, w, 220, [35, 60, 40]); // suelo
  const arbol = (x, base, esc, color) => {
    c.fillRect(x - 10 * esc, base - 50 * esc, 20 * esc, 50 * esc, [80, 55, 35]);
    c.fillPoly([[x - 70 * esc, base - 40 * esc], [x + 70 * esc, base - 40 * esc], [x, base - 150 * esc]], color);
    c.fillPoly([[x - 55 * esc, base - 90 * esc], [x + 55 * esc, base - 90 * esc], [x, base - 185 * esc]], color);
  };
  arbol(110, h - 200, 1.1, [46, 92, 60]);
  arbol(300, h - 180, 1.4, [38, 80, 52]);
  arbol(450, h - 200, 1.0, [50, 100, 66]);
  guardar('fondo_bosque.png', c);
}

// Portada
{
  const w = 540, h = 960;
  const c = new Lienzo(w, h);
  c.vGradient([13, 27, 42], [40, 20, 60]);
  // Estrellas decorativas
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h * 0.7, r = 1 + Math.random() * 2;
    c.fillCircle(x, y, r, [255, 255, 255, 180]);
  }
  c.estrella(w / 2, h * 0.42, 90, 38, 5, ORO);
  c.fillRect(0, h * 0.7, w, 6, SECUNDARIO);
  guardar('portada.png', c);
}

console.log('¡Hecho!');
