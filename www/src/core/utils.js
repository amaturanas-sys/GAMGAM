// utils.js — Funciones de ayuda usadas en todo el motor.
// (No necesitas editar este archivo para crear tus juegos.)

/** Limita un valor entre un mínimo y un máximo. */
export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

/** Número aleatorio entre min y max. */
export function rand(min, max) {
  return min + Math.random() * (max - min);
}

/** Entero aleatorio entre min y max (ambos incluidos). */
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/** Elige un elemento al azar de una lista. */
export function pick(list) {
  return list[randInt(0, list.length - 1)];
}

/** Distancia entre dos puntos. */
export function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/** ¿Se solapan dos rectángulos? Cada rect = {x, y, w, h}. */
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** ¿El punto (px,py) está dentro del rectángulo? */
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** Interpolación lineal. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Devuelve un valor del objeto, o un valor por defecto si no existe. */
export function def(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}
