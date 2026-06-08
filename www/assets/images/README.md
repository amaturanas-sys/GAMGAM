# Carpeta de imágenes

Pon aquí tus imágenes (PNG con transparencia recomendado). Luego escribe su
ruta en los archivos de `config/`. Por ejemplo, si guardas `heroe.png` aquí,
en `world.json` pondrías:

```json
"jugador": { "sprite": "assets/images/heroe.png" }
```

## ¿No tienes imágenes todavía?

¡No pasa nada! El juego funciona igual: donde falte una imagen, el motor dibuja
un cuadrado de color con un texto (un "marcador de posición"). Cuando añadas la
imagen real con ese nombre, aparecerá automáticamente.

## Imágenes que usa el juego de ejemplo

Puedes crear estas imágenes para reemplazar los marcadores (todas opcionales):

| Archivo              | Para qué sirve                  | Tamaño sugerido |
|----------------------|---------------------------------|-----------------|
| `portada.png`        | Fondo de la pantalla de título  | 1080 × 1920     |
| `jugador.png`        | El personaje que controlas      | 128 × 128       |
| `fondo_pueblo.png`   | Fondo del escenario "pueblo"    | 1080 × 1920     |
| `fondo_bosque.png`   | Fondo del escenario "bosque"    | 1080 × 1920     |
| `npc_anciano.png`    | El anciano del pueblo           | 128 × 128       |
| `npc_guardian.png`   | El guardián del bosque          | 128 × 128       |
| `cofre.png`          | El cofre (reto de estrellas)    | 128 × 128       |
| `estrella.png`       | Las estrellas del mini-juego    | 128 × 128       |
| `roca.png`           | Las rocas que caen              | 128 × 128       |

Consejo: las imágenes cuadradas (mismo ancho y alto) se ven mejor para
personajes y objetos. Los fondos, en vertical (más altos que anchos).
