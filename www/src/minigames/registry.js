// registry.js — Lista de tipos de mini-juego disponibles.
//
// Para AÑADIR un nuevo tipo de mini-juego:
//   1) Crea un archivo nuevo en /minigames que herede de MiniGameBase.
//   2) Impórtalo aquí abajo.
//   3) Añádelo al objeto TIPOS con un nombre (el que usarás como "tipo" en
//      config/minigames.json).

import { TapGame } from './TapGame.js';
import { DodgeGame } from './DodgeGame.js';
import { QuizGame } from './QuizGame.js';

const TIPOS = {
  tap: TapGame,
  dodge: DodgeGame,
  quiz: QuizGame,
};

/** Crea una instancia del mini-juego del tipo indicado. */
export function crearMiniJuego(tipo, host) {
  const Clase = TIPOS[tipo];
  if (!Clase) return null;
  return new Clase(host);
}

/** Lista de tipos disponibles (útil para validar o documentar). */
export function tiposDisponibles() {
  return Object.keys(TIPOS);
}
