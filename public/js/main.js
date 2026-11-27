/**
 * main.js — Entry point. Boot the GAMGAM FPS game when DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.game = game;
  game.start().catch((err) => {
    console.error('Game start failed:', err);
    alert('Failed to start game. Check the console.');
  });

  // Expose controls for debugging
  window.__GAME__ = game;
});
