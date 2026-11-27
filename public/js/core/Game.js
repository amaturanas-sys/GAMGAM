/**
 * Game.js — Main game loop orchestrator.
 * Wires Three.js renderer, local player, remote players, world, HUD, and network.
 */
class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.network = null;
    this.input = null;
    this.hud = null;
    this.menu = null;
    this.world = null;
    this.player = null;
    this.remotePlayers = new Map();
    this.worldObstacles = [];
    this.lastTime = null;
    this.running = false;

    this._onState = this._onState.bind(this);
    this._onEvent = this._onEvent.bind(this);
    this._onJoined = this._onJoined.bind(this);
    this._animate = this._animate.bind(this);
  }

  async start() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    this.input = new Input();
    this.hud = new HUD();
    this.menu = new Menu();

    this.network = new Network();
    this.network.onStatusChange = (status) => { this.menu.connStatus.textContent = status; };
    this.network.on('joined', this._onJoined);
    this.network.on('state', this._onState);
    this.network.on('event', this._onEvent);

    try { await this.network.connect(); }
    catch (e) { alert('Failed to connect to server. Is it running?'); console.error(e); return; }

    this.menu.init({ onJoin: (nick, room) => this._handleJoin(nick, room) });
    this.menu.show();

    window.addEventListener('resize', () => this._onResize());
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._animate);
  }

  _handleJoin(nickname, roomId) {
    this.menu.setJoining(true);
    this.network.joinWithAck(nickname, roomId, 6000)
      .then((data) => this._onJoined(data))
      .catch((err) => {
        console.error('Join failed:', err);
        this.menu.setError(err.message || 'Join failed. Is the server running?');
        this.menu.setJoining(false);
      });
  }

  _onJoined(data) {
    this.world = new World(this.scene);
    this.world.build(data.world);
    this.player = new Player(this.camera, this.scene, this.network, this.input, this.hud);
    const me = data.players.find(p => p.id === data.playerId);
    this.player.applyState({ ...me, id: data.playerId });
    for (const p of data.players) { if (p.id !== data.playerId) this._addRemotePlayer(p); }
    this.menu.hide();
    this.hud.show();
    if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      document.getElementById('mobileControls').classList.remove('hidden');
    } else { this.input.lockPointer(); }
  }

  _addRemotePlayer(data) {
    const rp = new RemotePlayer(data.id, data, this.scene, data.color);
    this.remotePlayers.set(data.id, rp);
    this.hud.addKillFeed(`${data.nickname} joined`, 'info');
  }

  _removeRemotePlayer(id) {
    const rp = this.remotePlayers.get(id);
    if (rp) { rp.dispose(); this.remotePlayers.delete(id); }
  }

  _onState(data) {
    const me = data.players.find(p => p.id === (this.network.playerId || this.player?.id));
    if (me) {
      if (!this.network.playerId) this.network.playerId = me.id;
      this.player.applyState(me);
    }
    const incomingIds = new Set();
    for (const p of data.players) {
      incomingIds.add(p.id);
      if (p.id === (this.network.playerId || this.player?.id)) continue;
      let rp = this.remotePlayers.get(p.id);
      if (!rp) { rp = new RemotePlayer(p.id, p, this.scene, p.color); this.remotePlayers.set(p.id, rp); }
      else { rp.update(p); }
    }
    for (const id of this.remotePlayers.keys()) { if (!incomingIds.has(id)) this._removeRemotePlayer(id); }
  }

  _onEvent(ev) {
    switch (ev.type) {
      case 'join': this.hud.addKillFeed(`${ev.playerNickname} joined`, 'info'); break;
      case 'leave': this.hud.addKillFeed('player left', 'info'); break;
      case 'shot': this._showRemoteShot(ev.shooterId, ev.point); break;
      case 'hit': if (ev.victimId === this.network.playerId) this.player.takeDamage(ev.damage); break;
      case 'kill':
        this.hud.addKillFeed(`${ev.killerNickname} <span class="victim">eliminated</span> ${ev.victimNickname}`, 'kill');
        if (ev.victimId === this.network.playerId) this.player.setKilledBy(ev.killerNickname);
        break;
      case 'respawn': if (ev.playerId === this.network.playerId) this.player.respawn(); break;
    }
  }

  _showRemoteShot(shooterId, point) {
    const rp = this.remotePlayers.get(shooterId);
    if (!rp) return;
    const start = rp.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const geo = new THREE.BufferGeometry().setFromPoints([start, point]);
    const mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    setTimeout(() => { this.scene.remove(line); geo.dispose(); mat.dispose(); }, 100);
  }

  _animate(now) {
    if (!this.running) return;
    requestAnimationFrame(this._animate);
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    for (const rp of this.remotePlayers.values()) rp.step(dt);
    if (this.player) { this.player.update(dt, now); this.player.weapon.update(now); }
    const camPos = this.camera.position;
    for (const rp of this.remotePlayers.values()) { if (rp.nameSprite) rp.nameSprite.lookAt(camPos); }
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.running = false;
    this.input.destroy();
    this.network.disconnect();
    if (this.world) this.world.dispose();
    if (this.player) this.player.dispose();
    for (const rp of this.remotePlayers.values()) rp.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode)
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    window.removeEventListener('resize', () => this._onResize());
  }
}