#!/bin/bash
# Hook de inicio de sesión para Claude Code en la web.
# Instala dependencias y valida que el juego esté bien formado, de modo que
# las sesiones puedan servir el juego y ejecutar la validación sin sorpresas.
set -uo pipefail

# Solo en el entorno remoto (Claude Code en la web).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

echo "[session-start] Instalando dependencias (npm install)..."
if npm install --no-audit --no-fund; then
  echo "[session-start] Dependencias instaladas."
else
  echo "[session-start] Aviso: 'npm install' falló (posible restricción de red)."
  echo "[session-start] El juego se puede editar y servir igualmente como archivos estáticos."
fi

echo "[session-start] Validando configuración del juego..."
if npm run --silent validate; then
  echo "[session-start] Validación correcta."
else
  echo "[session-start] Aviso: la validación encontró problemas (revisa los config/*.json)."
fi

echo "[session-start] Listo."
