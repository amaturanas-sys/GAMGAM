# 🎯 Referencia de mini-juegos

Cada mini-juego se define en `www/config/minigames.json` como un objeto con un
**id** (el nombre que usas desde el mundo) y un campo **`tipo`** que elige la
mecánica. Aquí están todos los parámetros de cada tipo.

Campos comunes a todos los tipos:

| Campo | Significado |
|-------|-------------|
| `tipo` | `"tap"`, `"dodge"` o `"quiz"` |
| `titulo` | título en la pantalla de instrucciones |
| `instrucciones` | texto explicativo antes de empezar |
| `musica` | (opcional) id de música a reproducir |
| `colorFondo` | (opcional) color de fondo durante el juego |
| `textosResultado` | (opcional) `{ "victoria": "...", "derrota": "..." }` |

---

## 1) `tap` — Reacción / Tap

Aparecen objetivos que debes tocar antes de que desaparezcan.

| Parámetro | Por defecto | Qué hace |
|-----------|-------------|----------|
| `duracion` | 30 | segundos de partida |
| `objetivoPuntos` | 12 | aciertos necesarios para ganar |
| `spawnIntervalo` | 0.8 | cada cuántos segundos aparece un objetivo |
| `vidaObjetivo` | 1.5 | segundos que dura cada objetivo en pantalla |
| `sprite` | (ninguno) | imagen del objetivo (si falta, un círculo) |
| `tamano` | 90 | diámetro del objetivo en píxeles |

**Más fácil:** sube `vidaObjetivo` y `duracion`, baja `objetivoPuntos`.
**Más difícil:** baja `vidaObjetivo` y sube `objetivoPuntos`.

```json
{
  "tap_estrellas": {
    "tipo": "tap",
    "titulo": "Atrapa las estrellas",
    "instrucciones": "Toca 10 estrellas antes de que se acabe el tiempo.",
    "duracion": 30,
    "objetivoPuntos": 10,
    "spawnIntervalo": 0.8,
    "vidaObjetivo": 1.5,
    "sprite": "assets/images/estrella.png",
    "tamano": 90
  }
}
```

---

## 2) `dodge` — Esquiva / Runner

Mueve tu personaje (abajo) para esquivar obstáculos que caen. Sobrevive el
tiempo indicado para ganar. Controles: arrastrar el dedo, o flechas/A-D.

| Parámetro | Por defecto | Qué hace |
|-----------|-------------|----------|
| `duracion` | 25 | segundos que hay que sobrevivir |
| `vidas` | 3 | golpes que aguantas antes de perder |
| `velocidadObstaculos` | 260 | velocidad de caída |
| `intervaloObstaculos` | 0.7 | cada cuántos segundos cae un obstáculo |
| `spriteJugador` | (el del mundo) | imagen del personaje |
| `spriteObstaculo` | (ninguno) | imagen del obstáculo (si falta, un círculo) |
| `tamanoJugador` | 64 | diámetro del personaje |
| `tamanoObstaculo` | 56 | diámetro del obstáculo |

**Más fácil:** sube `vidas` e `intervaloObstaculos`, baja `velocidadObstaculos`.
**Más difícil:** baja `vidas` e `intervaloObstaculos`, sube la velocidad.

```json
{
  "esquiva_rocas": {
    "tipo": "dodge",
    "titulo": "Esquiva las rocas",
    "instrucciones": "Arrastra para moverte y aguanta 25 segundos.",
    "duracion": 25,
    "vidas": 3,
    "velocidadObstaculos": 260,
    "intervaloObstaculos": 0.7,
    "spriteObstaculo": "assets/images/roca.png"
  }
}
```

---

## 3) `quiz` — Quiz / Trivia

Preguntas con opciones. Acierta las suficientes para ganar.

| Parámetro | Por defecto | Qué hace |
|-----------|-------------|----------|
| `preguntas` | `[]` | lista de preguntas (ver formato abajo) |
| `objetivoCorrectas` | todas | aciertos necesarios para ganar |
| `aleatorio` | false | `true` para barajar el orden de las preguntas |

Formato de cada pregunta:

```json
{
  "pregunta": "¿Cuál es la capital de Francia?",
  "opciones": ["Madrid", "París", "Roma"],
  "correcta": 1
}
```

> ⚠️ **`correcta` empieza a contar en 0.** En el ejemplo, `1` es "París"
> (la primera opción es `0`, la segunda es `1`, la tercera es `2`).

```json
{
  "quiz_guardian": {
    "tipo": "quiz",
    "titulo": "La prueba del guardián",
    "instrucciones": "Acierta al menos 2 de 3.",
    "objetivoCorrectas": 2,
    "aleatorio": false,
    "preguntas": [
      { "pregunta": "¿Qué abre el bosque?", "opciones": ["Una espada", "Una llave"], "correcta": 1 }
    ]
  }
}
```

---

## ¿Quieres un tipo de mini-juego nuevo? (requiere algo de código)

El motor es ampliable. Para crear, por ejemplo, un juego de **memoria** o de
**puzzle**:

1. Crea `www/src/minigames/MemoriaGame.js` que herede de `MiniGameBase`
   (copia uno existente como plantilla).
2. Impleméntalo: `iniciar()`, `update(dt)`, `render(ctx)` y los `onPointer*`.
   Llama a `this.ganar()` o `this.perder()` al terminar.
3. Regístralo en `www/src/minigames/registry.js` con un nombre nuevo.
4. Úsalo en `minigames.json` con `"tipo": "memoria"`.

Cada instancia tiene acceso a:
- `this.game` — el motor (`ancho`, `alto`, `assets`, `audio`, `theme`, `input`).
- `this.def` — la configuración de ese mini-juego (usa `this.param("campo", valorPorDefecto)`).
- `this.puntos` y `this.tiempoRestante` — los muestra el marcador automáticamente.
