/**
 * Player.js — Local first-person player controller.
 * Owns the camera, weapon, movement input prediction, and local hit feedback.
 */
class Player {
  constructor(camera, scene, network, input, hud) {
    this.camera = camera;
    this.scene = scene;
    this.network = network;
    this.input = input;
    this.hud = hud;

    // Authoritative state (from server)
    this.id = null;
    this.nickname = 'You';
    this.position = new THREE.Vector3(0, 0.9, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.health = 100;
    this.ammo = 30;
    this.reserve = 90;
    this.state = 'alive'; // alive | dying | respawning
    this.color = 0xffffff;
    this.deadAt = 0;

    // Camera offset (eye level)
    this.camera.position.copy(this.position);
    this.camera.position.y += 1.6;

    this.weapon = new Weapon(camera, scene, (result) => this._onShotResult(result));
    this.deathScreen = document.getElementById('deathScreen');
    this.deathBy = document.getElementById('deathBy');
    this.btnRespawn = document.getElementById('btnRespawn');

    this._bindUI();
  }

  _bindUI() {
    this.btnRespawn.addEventListener('click', () => {
      this.network.sendInput({ forward: 0, right: 0, jump: false, shoot: false, reload: false, lookY: this.rotation.y, lookX: this.rotation.x });
      // Respawn is server-timed; button just confirms intent
      this.deathScreen.classList.add('hidden');
    });
  }

  // Apply authoritative snapshot from server
  applyState(state) {
    this.id = state.id;
    this.nickname = state.nickname;
    this.position.set(state.position.x, state.position.y, state.position.z);
    this.rotation.set(state.rotation.x || 0, state.rotation.y || 0, 0);
    this.health = state.health;
    this.ammo = state.ammo;
    this.reserve = state.reserve;
    this.state = state.state;
    this.color = state.color;
    this.deadAt = state.deadAt || 0;

    // Sync camera to authoritative position/rotation
    this.camera.position.set(this.position.x, this.position.y + 1.6, this.position.z);
    this.camera.rotation.set(this.rotation.x, this.rotation.y, 0);
    this.weapon.camera = this.camera;

    // HUD
    if (this.hud) {
      this.hud.setHealth(this.health, 100);
      this.hud.setAmmo(this.weapon.ammoDisplay, this.weapon.status);
      if (this.state === 'dying') this._showDeath();
    }
  }

  // Called each frame: read input, run local prediction, send to server
  update(dt, now) {
    if (this.state === 'dying' || this.state === 'respawning') return;

    const input = this.input;
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    let forward = 0, right = 0, shoot = false, reload = false;
    let lookX = 0, lookY = 0;

    if (isMobile) {
      const mi = input.mobileInput;
      forward = mi.forward; right = mi.right; shoot = mi.shoot; reload = mi.reload;
      lookX = mi.lookX; lookY = mi.lookY;
    } else {
      const m = input.movement;
      forward = m.forward; right = m.right;
      shoot = input.consumeShoot();
      reload = input.reload;
      lookX = input.look.x * 0.0015;   // pitch
      lookY = input.look.y * 0.0015;   // yaw
    }

    // Apply look rotation (yaw around Y, pitch around X clamped)
    this.rotation.y += lookY;
    this.rotation.x += lookX;
    this.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.rotation.x));

    // Local-predicted movement (will be corrected by server)
    const speed = input.sprint ? 8.0 : 5.0;
    const yaw = this.rotation.y;
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const rgt = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const move = new THREE.Vector3(0, 0, 0);
    if (forward !== 0) move.add(fwd.multiplyScalar(forward * speed * dt));
    if (right !== 0) move.add(rgt.multiplyScalar(right * speed * dt));
    this.position.add(move);

    // Jump (local prediction only)
    if (input.jump && this.position.y <= 0.91) {
      this.position.y += 7.0 * dt; // simple jump impulse approx
    }
    // Simple gravity pull back to floor (predictive)
    if (this.position.y > 0.9) {
      this.position.y -= 12.0 * dt;
      if (this.position.y < 0.9) this.position.y = 0.9;
    }

    // World bounds
    this.position.x = Math.max(-59, Math.min(59, this.position.x));
    this.position.z = Math.max(-59, Math.min(59, this.position.z));

    // Weapon
    this.weapon.update(now);
    if (shoot) {
      const result = this.weapon.fire(now);
      // local visual handled by weapon; hit confirmed by server
    }
    if (reload) {
      this.weapon.startReload(now);
    }

    // Send input to server
    this.network.sendInput({
      forward, right, jump: !!input.jump, shoot, reload,
      lookY: this.rotation.y, lookX: this.rotation.x,
    });
  }

  _onShotResult(result) {
    // Local visual feedback (hitmarker) handled here; server confirms actual damage
    if (result.type === 'player') {
      this.hud && this.hud.showHitmarker();
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.hud.setHealth(this.health, 100);
    this.hud.showDamageFlash();
    if (this.health <= 0) this._showDeath();
  }

  _showDeath() {
    this.state = 'dying';
    this.deathScreen.classList.remove('hidden');
    this.deathBy.innerHTML = 'by <span>enemy</span>';
    this.input.unlockPointer();
  }

  setKilledBy(killerNickname) {
    this.deathBy.innerHTML = `by <span>${killerNickname || 'enemy'}</span>`;
  }

  respawn() {
    this.state = 'alive';
    this.health = 100;
    this.ammo = 30;
    this.reserve = 90;
    this.deathScreen.classList.add('hidden');
    this.hud.setHealth(100, 100);
    this.hud.setAmmo(this.weapon.ammoDisplay, this.weapon.status);
    this.input.lockPointer();
  }

  dispose() {
    this.weapon.dispose();
  }
}

window.Player = Player;
