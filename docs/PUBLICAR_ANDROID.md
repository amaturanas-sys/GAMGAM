# 📱 Publicar tu juego como APK de Android

Tu juego es una app web. Para convertirlo en una app de Android instalable
usamos **[Capacitor](https://capacitorjs.com/)**, que envuelve la carpeta `www/`
en una app nativa. Solo hay que hacer esto **una vez**; después, cada cambio se
sincroniza con un comando.

---

## Requisitos (instalar una vez)

1. **[Node.js](https://nodejs.org)** (versión 18 o superior).
2. **[Android Studio](https://developer.android.com/studio)** — incluye el SDK
   de Android y un emulador. Al instalarlo, ábrelo una vez para que descargue
   los componentes (acepta las licencias del SDK).
3. **Java JDK 17** (Android Studio suele traer uno compatible).

> Esta es la parte más "técnica" de todo el proceso, pero solo se hace una vez
> y Android Studio guía la instalación.

---

## Paso 1 — Instalar dependencias del proyecto

En la carpeta del proyecto:

```bash
npm install
```

## Paso 2 — Inicializar Capacitor (solo la primera vez)

El proyecto ya incluye `capacitor.config.json`. Crea la carpeta nativa de
Android con:

```bash
npm run android:add
```

Esto genera una carpeta `android/` (no se sube a git; se regenera cuando haga
falta).

## Paso 3 — Sincronizar tu juego

Cada vez que cambies algo en `www/` (configs, imágenes, sonidos), copia los
cambios a la app nativa con:

```bash
npm run android:sync
```

## Paso 4 — Abrir en Android Studio y probar

```bash
npm run android:open
```

Se abrirá Android Studio. Desde ahí puedes:

- **Probar en un emulador**: pulsa el botón ▶ "Run" (elige un dispositivo
  virtual; si no tienes, créalo en *Device Manager*).
- **Probar en tu móvil**: conéctalo por USB con la *depuración USB* activada y
  pulsa ▶ "Run".

## Paso 5 — Generar el APK

En Android Studio: menú **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
Al terminar, aparece un aviso con un enlace **"locate"** para encontrar el
archivo `app-debug.apk`. Ese archivo se puede instalar en cualquier Android
(activando "instalar apps de orígenes desconocidos").

---

## Personalizar nombre, icono y color de la app

- **Nombre e id de la app:** edita `capacitor.config.json`:

  ```json
  {
    "appId": "com.tunombre.tujuego",
    "appName": "El nombre que verá el usuario",
    "webDir": "www"
  }
  ```

  > El `appId` debe ser único (estilo dominio al revés) y **no se debe cambiar**
  > una vez publicado en Google Play. Vuelve a ejecutar `npm run android:sync`
  > tras cambiarlo.

- **Icono y pantalla de carga:** la forma más sencilla es usar la herramienta
  oficial. Instala y ejecuta:

  ```bash
  npm install -D @capacitor/assets
  npx capacitor-assets generate --android
  ```

  Pon una imagen `assets/icon.png` (1024×1024) y un `assets/splash.png`
  (2732×2732) en la **raíz del proyecto** antes de ejecutarlo, y generará todos
  los tamaños. Luego `npm run android:sync`.

- **Color de la barra superior:** edita `theme-color` en `www/index.html`.

---

## Publicar en Google Play (resumen)

1. Crea una cuenta de **[Google Play Console](https://play.google.com/console)**
   (tiene un pago único de registro).
2. En Android Studio: **Build → Generate Signed Bundle / APK → Android App
   Bundle (.aab)**. Crea una *keystore* (¡guárdala muy bien y no la pierdas!).
3. Sube el archivo `.aab` a Play Console, completa la ficha (descripción,
   capturas, clasificación de contenido y política de privacidad) y envíalo a
   revisión.

> Para una guía siempre actualizada, consulta la
> [documentación oficial de Capacitor para Android](https://capacitorjs.com/docs/android).

---

## Problemas frecuentes

- **"command not found: npm"** → falta instalar Node.js.
- **Gradle falla la primera vez** → abre Android Studio, espera a que termine de
  descargar/indexar (barra inferior) y vuelve a pulsar ▶.
- **Pantalla en blanco en el móvil** → ejecuta `npm run android:sync` después de
  cada cambio; comprueba que no haya errores de JSON en `config/`.
- **No suena el audio** → en Android el sonido empieza tras el primer toque (es
  normal); revisa que los archivos existan en `assets/audio/`.
