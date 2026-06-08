# 🛠️ Guía: crea tu propio juego (sin programar)

Esta guía te lleva paso a paso. Solo vas a editar **archivos de texto** en la
carpeta `www/config/` y a poner imágenes/sonidos en `www/assets/`.

> 💡 **Consejo antes de empezar:** los archivos `.json` son sensibles a la
> puntuación. Cada elemento se separa con **comas**, los textos van entre
> **comillas dobles** `"así"`, y las llaves `{ }` y corchetes `[ ]` deben abrir
> y cerrar bien. Si el juego muestra un error al cargar, casi siempre es una
> coma o una comilla que falta. Puedes pegar el archivo en un validador online
> (busca "JSON validator") para encontrar el fallo.

Edita con cualquier editor de texto. Recomendado:
[Visual Studio Code](https://code.visualstudio.com/) (gratis), que avisa de los
errores de JSON mientras escribes.

---

## Paso 0 — Ver el juego de ejemplo

```bash
npm start
```

Abre `http://localhost:5173`. Juega un poco para entender las piezas. Mientras
editas los archivos, **recarga la página** del navegador para ver los cambios al
instante (no hay que compilar nada).

---

## Paso 1 — Identidad y aspecto del juego (`config/game.json`)

```json
{
  "titulo": "El nombre de tu juego",
  "subtitulo": "Una frase corta debajo del título",

  "tema": {
    "colorPrimario": "#4cc9f0",
    "colorSecundario": "#f72585",
    "colorFondo": "#0d1b2a",
    "colorTexto": "#ffffff",
    "fuente": "system-ui, sans-serif"
  },

  "controles": { "mundo": "joystick" },

  "pantallaInicio": {
    "imagenFondo": "assets/images/portada.png",
    "musica": "intro"
  },

  "primerEscenario": "pueblo"
}
```

- **Colores**: usa códigos hexadecimales (puedes copiarlos de
  [htmlcolorcodes.com](https://htmlcolorcodes.com/)). Cambiar `colorPrimario`
  cambia los botones; `colorSecundario` resalta acciones; `colorFondo` es el
  fondo general.
- **controles → mundo**: `"joystick"` (arrastrar el dedo) o `"teclado"` (solo
  flechas, útil al probar en ordenador). El teclado siempre funciona además.
- **primerEscenario**: el id del escenario donde empieza el jugador (debe existir
  en `world.json`).

---

## Paso 2 — El mundo y sus escenarios (`config/world.json`)

El mundo se compone de **escenarios** (pantallas por las que se camina). Cada
escenario tiene:

- un **fondo** (imagen o color),
- un punto de aparición (**spawn**),
- **salidas** que llevan a otros escenarios,
- **puntos** de interés (personajes, cofres, retos...).

> 📐 **Las posiciones se indican en "fracciones" de 0 a 1.** `x: 0` es el borde
> izquierdo, `x: 1` el derecho; `y: 0` arriba, `y: 1` abajo. Así todo se ve bien
> en cualquier tamaño de pantalla. Ejemplo: el centro es `x: 0.5, y: 0.5`.

```json
{
  "jugador": {
    "sprite": "assets/images/jugador.png",
    "velocidad": 210,
    "tamano": 56
  },

  "escenarios": {
    "pueblo": {
      "nombre": "El Pueblo",
      "fondo": "assets/images/fondo_pueblo.png",
      "colorFondo": "#2a3d5c",
      "musica": "pueblo",
      "spawn": { "x": 0.5, "y": 0.78 },

      "salidas": [
        {
          "x": 0.92, "y": 0.30, "ancho": 0.08, "alto": 0.4,
          "destino": "bosque",
          "etiqueta": "Bosque →",
          "requiere": ["llave_bosque"],
          "textoBloqueado": "Necesitas una llave para pasar."
        }
      ],

      "puntos": [
        {
          "id": "anciano",
          "x": 0.24, "y": 0.55,
          "sprite": "assets/images/npc_anciano.png",
          "etiqueta": "💬 Hablar",
          "accion": { "tipo": "dialogo", "id": "intro_anciano" }
        },
        {
          "id": "reto_tap",
          "x": 0.68, "y": 0.45,
          "sprite": "assets/images/cofre.png",
          "etiqueta": "🎮 Jugar",
          "accion": { "tipo": "minijuego", "id": "tap_estrellas" },
          "recompensa": "llave_bosque"
        }
      ]
    }
  }
}
```

### Las salidas

| Campo | Significado |
|-------|-------------|
| `x, y, ancho, alto` | rectángulo (en fracciones) que el jugador debe pisar |
| `destino` | id del escenario al que se va |
| `etiqueta` | texto que se muestra junto a la salida |
| `requiere` | (opcional) lista de "banderas" necesarias para pasar |
| `textoBloqueado` | (opcional) mensaje si no se cumplen los requisitos |

### Los puntos de interés

| Campo | Significado |
|-------|-------------|
| `id` | nombre único del punto |
| `x, y` | posición (fracciones) |
| `sprite` | imagen del objeto/personaje |
| `etiqueta` | texto del botón que aparece al acercarse |
| `accion` | qué pasa al activarlo (ver abajo) |
| `requiere` | (opcional) banderas necesarias para poder activarlo |
| `recompensa` | (opcional) bandera que se obtiene al completarlo |

**Tipos de acción:**

```json
{ "tipo": "dialogo",  "id": "intro_anciano" }     // abre un diálogo de story.json
{ "tipo": "minijuego","id": "tap_estrellas" }     // lanza un mini-juego
{ "tipo": "escenario","id": "bosque" }            // viaja a otro escenario
```

### Banderas, llaves y progreso (el "pegamento" de tu juego)

Una **bandera** (flag) es simplemente un nombre que recuerda que algo pasó:
`"llave_bosque"`, `"amuleto"`, `"hablaste_con_rey"`...

- Un punto da una bandera con `"recompensa": "llave_bosque"` al completarlo.
- Una salida o un punto exige banderas con `"requiere": ["llave_bosque"]`.

Así creas **progresión**: el jugador debe lograr X para desbloquear Y. El
progreso se guarda solo en el dispositivo.

---

## Paso 3 — Diálogos y narrativa (`config/story.json`)

Cada diálogo tiene un id y una lista de **líneas**. Una línea puede ofrecer
**opciones** que ramifican la historia.

```json
{
  "intro_anciano": {
    "fondo": "assets/images/fondo_pueblo.png",
    "lineas": [
      {
        "personaje": "Anciano",
        "retrato": "assets/images/npc_anciano.png",
        "texto": "¡Bienvenido, viajero!"
      },
      {
        "personaje": "Anciano",
        "texto": "¿Quieres saber cómo abrir el cofre?",
        "opciones": [
          { "texto": "Sí, cuéntame", "ir": "intro_anciano_ayuda" },
          { "texto": "No, gracias", "ir": null }
        ]
      }
    ]
  },

  "intro_anciano_ayuda": {
    "lineas": [
      { "personaje": "Anciano", "texto": "Atrapa suficientes estrellas y se abrirá." }
    ]
  }
}
```

Opciones disponibles en cada línea:

| Campo | Significado |
|-------|-------------|
| `personaje` | nombre que aparece sobre el texto |
| `retrato` | (opcional) imagen del personaje |
| `texto` | lo que dice |
| `flag` | (opcional) bandera que se activa al llegar a esta línea |
| `musica` | (opcional) cambia la música |
| `opciones` | (opcional) botones de elección |

Cada **opción** puede tener: `ir` (id de otro diálogo, o `null` para terminar),
`flag` (bandera que otorga), o `minijuego` (lanza un mini-juego directamente).

---

## Paso 4 — Los mini-juegos (`config/minigames.json`)

Aquí defines cada desafío. El campo **`tipo`** elige la mecánica
(`tap`, `dodge`, `quiz`). El resto de campos ajustan la dificultad y los textos.

```json
{
  "tap_estrellas": {
    "tipo": "tap",
    "titulo": "Atrapa las estrellas",
    "instrucciones": "Toca 10 estrellas antes de que se acabe el tiempo.",
    "duracion": 30,
    "objetivoPuntos": 10,
    "sprite": "assets/images/estrella.png"
  }
}
```

👉 **Todos los parámetros de cada tipo están en
[MINIJUEGOS.md](MINIJUEGOS.md).**

---

## Paso 5 — Música y sonidos (`config/audio.json`)

Asocia un **id** a cada archivo. Luego usas ese id en los demás archivos
(`"musica": "pueblo"`, etc.).

```json
{
  "musica":  { "intro": "assets/audio/intro.mp3", "pueblo": "assets/audio/pueblo.mp3" },
  "efectos": { "click": "assets/audio/click.wav", "exito": "assets/audio/exito.wav" },
  "volumenMusica": 0.55,
  "volumenEfectos": 0.9
}
```

Efectos que el motor reproduce automáticamente si existen: `click`, `toque`,
`exito`, `fallo`, `golpe`, `puerta`.

---

## Paso 6 — Imágenes (`www/assets/images/`)

Pon tus `.png` ahí y referencia la ruta en los configs. Si no tienes dibujos,
el juego muestra marcadores de color; puedes diseñar todo primero y añadir el
arte después. Detalles y tamaños sugeridos en
[`www/assets/images/README.md`](../www/assets/images/README.md).

---

## Paso 7 — Probar y publicar

- **Probar:** `npm start` y recarga el navegador tras cada cambio.
- **Publicar como APK de Android:** sigue
  [PUBLICAR_ANDROID.md](PUBLICAR_ANDROID.md).

---

## Receta rápida: "quiero añadir un nuevo desafío al mundo"

1. En `minigames.json`, añade un mini-juego nuevo con su `id` y su `tipo`.
2. En `world.json`, dentro de un escenario, añade un **punto** con
   `"accion": { "tipo": "minijuego", "id": "TU_ID" }`.
3. (Opcional) dale una `recompensa` y úsala como `requiere` en otra salida o
   punto para crear progresión.
4. Recarga y pruébalo. ¡Listo!
