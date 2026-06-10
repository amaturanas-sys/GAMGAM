// validar.mjs — Comprueba que el juego está bien formado:
//   1) Todos los archivos de config/ son JSON válido.
//   2) Todos los módulos de src/ tienen sintaxis JS correcta.
//   3) Referencias básicas coherentes (escenario inicial, tipos de mini-juego).
//
//   Uso:  npm run validate     (o:  node tools/validar.mjs)
//
// Sale con código 1 si encuentra algún problema (útil para hooks/CI).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(raiz, 'www');
let errores = 0;
const fallo = (msg) => { console.error('  ✗ ' + msg); errores++; };
const ok = (msg) => console.log('  ✓ ' + msg);

// --- 1) JSON de configuración ---
console.log('Validando JSON de config/ ...');
const configs = {};
for (const archivo of ['game', 'world', 'story', 'minigames', 'audio']) {
  const ruta = join(www, 'config', archivo + '.json');
  try {
    configs[archivo] = JSON.parse(readFileSync(ruta, 'utf8'));
    ok('config/' + archivo + '.json');
  } catch (e) {
    fallo('config/' + archivo + '.json — ' + e.message);
  }
}

// --- 2) Sintaxis de los módulos JS ---
console.log('Comprobando sintaxis de src/ ...');
function listarJS(dir) {
  let out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out = out.concat(listarJS(p));
    else if (n.endsWith('.js')) out.push(p);
  }
  return out;
}
for (const f of listarJS(join(www, 'src'))) {
  try {
    execFileSync(process.execPath, ['--check', '--input-type=module'], { input: readFileSync(f) });
  } catch (e) {
    fallo(f.replace(raiz + '/', '') + ' — error de sintaxis');
  }
}
if (!errores) ok('sintaxis de módulos correcta');

// --- 3) Coherencia básica de referencias ---
console.log('Comprobando referencias ...');
if (configs.game && configs.world) {
  const ini = configs.game.primerEscenario;
  if (ini && !configs.world.escenarios?.[ini]) {
    fallo(`game.json -> primerEscenario "${ini}" no existe en world.json`);
  }
  // Mini-juegos referenciados desde el mundo deben existir.
  const tiposValidos = ['tap', 'dodge', 'quiz'];
  const minis = configs.minigames || {};
  for (const [idEsc, esc] of Object.entries(configs.world.escenarios || {})) {
    for (const p of esc.puntos || []) {
      const a = p.accion || {};
      if (a.tipo === 'minijuego' && !minis[a.id]) {
        fallo(`world.json: el punto "${p.id}" (escenario "${idEsc}") usa el mini-juego "${a.id}" que no está en minigames.json`);
      }
      if (a.tipo === 'dialogo' && configs.story && !configs.story[a.id]) {
        fallo(`world.json: el punto "${p.id}" usa el diálogo "${a.id}" que no está en story.json`);
      }
    }
  }
  for (const [id, def] of Object.entries(minis)) {
    if (!tiposValidos.includes(def.tipo)) {
      fallo(`minigames.json: "${id}" tiene un tipo desconocido "${def.tipo}" (válidos: ${tiposValidos.join(', ')})`);
    }
  }
}
if (!errores) ok('referencias coherentes');

console.log('');
if (errores) {
  console.error(`❌ Validación: ${errores} problema(s) encontrado(s).`);
  process.exit(1);
} else {
  console.log('✅ Todo correcto.');
}
