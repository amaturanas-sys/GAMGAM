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
    this.errorEl = document.getElementById('joinError');
    this.onJoin = null;
  }

  init({ onJoin }) {
    this.onJoin = onJoin;
    this.btn.addEventListener('click', () => this._join());
    this.nick.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._join(); });
    this.room.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._join(); });
    this.screen.addEventListener('click', () => { this.nick.focus(); }, { once: true });
  }

  show() { this.screen.classList.remove('hidden'); this.btn.disabled = false; this.btn.textContent = 'Join Game'; this.setError(''); }
  hide() { this.screen.classList.add('hidden'); }

  setJoining(joining) {
    this.btn.disabled = joining;
    this.btn.textContent = joining ? 'Joining...' : 'Join Game';
    this.setError('');
  }

  setError(msg) {
    if (this.errorEl) {
      this.errorEl.textContent = msg;
      this.errorEl.style.display = msg ? 'block' : 'none';
    }
  }

  _join() {
    const nickname = this.nick.value.trim() || 'Player';
    const roomId = this.room.value.trim() || 'default';
    this.setError('');
    if (this.onJoin) this.onJoin(nickname, roomId);
  }
}

window.Menu = Menu;
