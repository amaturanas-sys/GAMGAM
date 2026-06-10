# 🎮 GAMGAM — Esqueleto de videojuego para Android

Un **proyecto base reutilizable** para crear juegos para Android **sin apenas
programar**. Tú no tocas el código del motor: solo editas archivos de texto
(`config/*.json`) y añades tus imágenes y sonidos. Funciona al instante en el
navegador y se empaqueta como **APK de Android** con Capacitor.

Incluye una **experiencia principal de mundo 2D explorable** dentro de la cual
el jugador se encuentra con **mini-juegos / desafíos**.

---

## ✨ Qué puedes personalizar (sin programar)

| Aspecto | Dónde se edita |
|--------|----------------|
| 🎨 **Diseño y colores** (tema) | `www/config/game.json` → `tema` |
| 🕹️ **Controles** | `www/config/game.json` → `controles` |
| 🗺️ **Mundo y escenarios** (mapa, salidas, objetos) | `www/config/world.json` |
| 📖 **Historia y diálogos** | `www/config/story.json` |
| 🎯 **Mini-juegos** (cuáles hay y su dificultad) | `www/config/minigames.json` |
| 🔊 **Música y efectos** | `www/config/audio.json` + `www/assets/audio/` |
| 🖼️ **Imágenes** (personajes, fondos, objetos) | `www/assets/images/` |

> El motor está hecho para que **todo el juego se defina con datos**. Si una
> imagen o un sonido no existe todavía, el juego **no falla**: muestra un
> marcador de color o se queda en silencio hasta que añadas el archivo.

---

## 🚀 Empezar en 2 minutos

Necesitas [Node.js](https://nodejs.org) instalado (solo para el servidor local).

```bash
npm start
```

Abre la dirección que aparece (por defecto `http://localhost:5173`) en tu
navegador. ¡Ya estás jugando al ejemplo **"La Llave del Bosque"**!

> ¿No quieres usar Node? Cualquier servidor estático sirve. Por ejemplo, con
> Python: `cd www && python3 -m http.server 5173`. (No se puede abrir
> `index.html` con doble clic: el navegador bloquea la carga de archivos por
> seguridad; hay que servirlo.)

---

## 🎲 El juego de ejemplo

"La Llave del Bosque" demuestra todas las piezas funcionando juntas:

1. Hablas con el **anciano** del pueblo (diálogo con ramas).
2. Juegas a **atrapar estrellas** (mini-juego de *reacción/tap*) y ganas una llave.
3. La llave **desbloquea** la salida al bosque.
4. En el bosque, **esquivas rocas** (mini-juego de *esquiva/runner*) y ganas un amuleto.
5. El **guardián** te hace un **quiz** (mini-juego de *trivia*) para terminar la aventura.

Esto muestra el patrón clave: **una experiencia principal (el mundo) que
contiene varios desafíos (los mini-juegos)**, conectados por recompensas
(llaves, amuletos) que abren nuevas zonas.

---

## 📁 Estructura del proyecto

```
GAMGAM/
├── www/                      ← La app (esto es lo que se convierte en APK)
│   ├── index.html
│   ├── config/               ← ⭐ LO QUE TÚ EDITAS para crear tu juego
│   │   ├── game.json         · título, tema, controles, pantalla de inicio
│   │   ├── world.json        · escenarios del mundo 2D, salidas y puntos
│   │   ├── story.json        · diálogos y narrativa
│   │   ├── minigames.json    · definición de cada mini-juego
│   │   └── audio.json        · música y efectos de sonido
│   ├── assets/
│   │   ├── images/           ← tus imágenes (.png)
│   │   └── audio/            ← tu música y efectos (.mp3 / .wav)
│   ├── styles/main.css       · estilos de la interfaz (tema)
│   └── src/                  · el MOTOR (normalmente no se toca)
│       ├── core/             · carga, escenas, audio, input, guardado...
│       ├── scenes/           · título, mundo, diálogo, mini-juego, resultado
│       └── minigames/        · tipos de mini-juego (tap, dodge, quiz)
├── docs/                     ← Guías paso a paso
│   ├── GUIA_CREAR_JUEGO.md   · cómo hacer TU juego (para no programadores)
│   ├── MINIJUEGOS.md         · todos los parámetros de cada mini-juego
│   └── PUBLICAR_ANDROID.md   · cómo generar el APK de Android
├── capacitor.config.json     · nombre y id de la app Android
└── package.json
```

---

## 📚 Guías

- **[docs/GUIA_CREAR_JUEGO.md](docs/GUIA_CREAR_JUEGO.md)** — Crea tu propio juego
  desde cero editando los archivos `config`. Empieza por aquí.
- **[docs/MINIJUEGOS.md](docs/MINIJUEGOS.md)** — Referencia completa de cada tipo
  de mini-juego y todos sus parámetros.
- **[docs/PUBLICAR_ANDROID.md](docs/PUBLICAR_ANDROID.md)** — Convierte tu juego en
  un APK instalable para Android.

---

## 🧩 ¿Cómo está pensado para escalar?

- **Añadir un escenario** = añadir un bloque en `world.json`.
- **Añadir un desafío** = añadir un mini-juego en `minigames.json` y un "punto"
  en el mundo que lo lance.
- **Añadir un tipo nuevo de mini-juego** (esto sí requiere algo de código) = crear
  un archivo en `src/minigames/` y registrarlo. Ver `src/minigames/registry.js`.
- **Cambiar el aspecto** = cambiar los colores del `tema` y sustituir las imágenes.

Un mismo esqueleto, infinitos juegos. 🚀
