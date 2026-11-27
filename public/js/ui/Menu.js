/**
 * Menu.js — Main menu: nickname + room input, join button.
 */
class Menu {
  constructor() {
    this.screen = document.getElementById('menu');
    this.btn = document.getElementById('btnJoin');
    this.nick = document.getElementById('inputNickname');
    this.room = document.getElementById('inputRoom');
    this.connStatus = document.getElementById('connStatus');
    this.onJoin = null;
  }

  init({ onJoin }) {
    this.onJoin = onJoin;
    this.btn.addEventListener('click', () => this._join());
    this.nick.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._join(); });
    this.room.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._join(); });
    // Auto-focus & pointer lock on first click
    this.screen.addEventListener('click', () => { this.nick.focus(); }, { once: true });
  }

  show() { this.screen.classList.remove('hidden'); this.btn.disabled = false; }
  hide() { this.screen.classList.add('hidden'); }

  _join() {
    const nickname = this.nick.value.trim() || 'Player';
    const roomId = this.room.value.trim() || 'default';
    this.btn.disabled = true;
    this.btn.textContent = 'Joining...';
    if (this.onJoin) this.onJoin(nickname, roomId);
  }
}

window.Menu = Menu;
