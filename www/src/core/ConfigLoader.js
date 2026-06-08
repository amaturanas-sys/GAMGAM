// ConfigLoader.js — Carga todos los archivos de la carpeta /config.
// Estos archivos JSON son LO QUE TÚ EDITAS para crear tu juego.

const ARCHIVOS = {
  game: 'config/game.json',
  world: 'config/world.json',
  story: 'config/story.json',
  minigames: 'config/minigames.json',
  audio: 'config/audio.json',
};

export class ConfigLoader {
  /**
   * Lee todos los JSON de configuración y los devuelve en un solo objeto:
   *   { game, world, story, minigames, audio }
   * Si un archivo tiene un error de sintaxis, avisa con un mensaje claro.
   */
  static async cargarTodo() {
    const resultado = {};
    for (const [clave, ruta] of Object.entries(ARCHIVOS)) {
      try {
        const respuesta = await fetch(ruta + '?v=' + Date.now());
        if (!respuesta.ok) {
          throw new Error('No se encontró el archivo (HTTP ' + respuesta.status + ')');
        }
        const texto = await respuesta.text();
        try {
          resultado[clave] = JSON.parse(texto);
        } catch (errorJson) {
          throw new Error(
            'El archivo "' + ruta + '" tiene un error de formato JSON: ' +
            errorJson.message +
            '. Revisa que no falten comas, comillas o llaves.'
          );
        }
      } catch (error) {
        console.error('[GAMGAM] Error cargando ' + ruta, error);
        throw error;
      }
    }
    return resultado;
  }
}
