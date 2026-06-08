// SaveManager.js — Guarda el progreso del jugador en el dispositivo.
//
// Usa el almacenamiento local del navegador (persiste también dentro del APK).
// Guarda: el escenario actual, las "banderas" obtenidas (recompensas/llaves),
// los desafíos completados y la mejor puntuación de cada mini-juego.

const CLAVE = 'gamgam_save_v1';

export class SaveManager {
  constructor() {
    this.datos = this._cargar();
  }

  _cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) return JSON.parse(crudo);
    } catch (_) {/* almacenamiento no disponible */}
    return this._nuevo();
  }

  _nuevo() {
    return {
      escenario: null,
      flags: {},        // p.ej. { "llave_bosque": true }
      completados: {},  // p.ej. { "tap_estrellas": true }
      mejores: {},      // p.ej. { "tap_estrellas": 12 }
      iniciado: false,
    };
  }

  guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.datos));
    } catch (_) {/* sin permiso de almacenamiento */}
  }

  reiniciar() {
    this.datos = this._nuevo();
    this.guardar();
  }

  hayPartida() {
    return !!this.datos.iniciado;
  }

  // --- Banderas (llaves, logros, decisiones) ---
  tieneFlag(nombre) {
    return !!this.datos.flags[nombre];
  }
  ponerFlag(nombre, valor = true) {
    if (!nombre) return;
    this.datos.flags[nombre] = valor;
    this.guardar();
  }
  tieneTodas(lista) {
    if (!lista || lista.length === 0) return true;
    return lista.every((f) => this.tieneFlag(f));
  }

  // --- Desafíos completados ---
  marcarCompletado(id) {
    this.datos.completados[id] = true;
    this.guardar();
  }
  estaCompletado(id) {
    return !!this.datos.completados[id];
  }

  // --- Mejores puntuaciones ---
  registrarPuntuacion(id, puntos) {
    const previo = this.datos.mejores[id] || 0;
    if (puntos > previo) {
      this.datos.mejores[id] = puntos;
      this.guardar();
    }
  }
  mejor(id) {
    return this.datos.mejores[id] || 0;
  }
}
