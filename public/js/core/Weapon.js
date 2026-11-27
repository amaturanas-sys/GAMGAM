/**
 * Weapon.js — Hitscan weapon logic (placeholder visuals).
 * Handles firing cooldown, ammo, reload, muzzle flash + tracer line.
 */
class Weapon {
  constructor(camera, scene, onShotResult) {
    this.camera = camera;
    this.scene = scene;
    this.onShotResult = onShotResult;

    this.damage = 25;
    this.fireCooldownMs = 100;
    this.magSize = 30;
    this.reserveAmmo = 90;
    this.ammo = this.magSize;

    this.reloading = false;
    this.lastShotTime = 0;
    this.reloadStartTime = 0;
    this.reloadDurationMs = 1500;

    // Visuals
    this.muzzleFlash = null;
    this.tracer = null;
    this._initVisuals();
  }

  _initVisuals() {
    // Muzzle flash (small yellow sphere at camera, hidden by default)
    const flashGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffee00 });
    this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlash.visible = false;
    this.scene.add(this.muzzleFlash);

    // Tracer line
    const tracerGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const tracerMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    this.tracer = new THREE.Line(tracerGeo, tracerMat);
    this.tracer.visible = false;
    this.scene.add(this.tracer);
  }

  canFire(now) {
    return !this.reloading && this.ammo > 0 && now - this.lastShotTime >= this.fireCooldownMs;
  }

  fire(now) {
    if (!this.canFire(now)) return null;
    this.lastShotTime = now;
    this.ammo = Math.max(0, this.ammo - 1);

    // Muzzle flash at camera
    const flashPos = this.camera.position.clone();
    this.muzzleFlash.position.copy(flashPos);
    this.muzzleFlash.visible = true;
    setTimeout(() => { this.muzzleFlash.visible = false; }, 60);

    // Build forward ray
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const origin = this.camera.position.clone();
    origin.y += 0.05; // eye level approx

    const hit = this._raycast(origin, direction);

    // Tracer visual to hit point (or max distance)
    const end = hit ? hit.point : origin.clone().add(direction.multiplyScalar(100));
    this._showTracer(origin, end);
    setTimeout(() => { this.tracer.visible = false; }, 60);

    const result = {
      type: hit ? (hit.isPlayer ? 'player' : 'world') : 'none',
      targetId: hit && hit.isPlayer ? hit.targetId : null,
      point: hit ? hit.point : end,
      dist: hit ? hit.t : 100,
    };
    if (this.onShotResult) this.onShotResult(result);
    return result;
  }

  _raycast(origin, direction) {
    const raycaster = new THREE.Raycaster(origin, direction, 0, 100);
    // World obstacles
    const worldHits = raycaster.intersectObjects(this.scene.children.filter(c => c.userData && c.userData.isWorldObstacle));
    // Players
    const playerHits = raycaster.intersectObjects(this.scene.children.filter(c => c.userData && c.userData.isRemotePlayer));

    let best = null;
    let bestDist = Infinity;
    for (const h of worldHits) { if (h.distance < bestDist) { bestDist = h.distance; best = { t: h.distance, point: h.point, isPlayer: false }; } }
    for (const h of playerHits) { if (h.distance < bestDist) { bestDist = h.distance; best = { t: h.distance, point: h.point, isPlayer: true, targetId: h.object.userData.id }; } }
    return best;
  }

  _showTracer(start, end) {
    this.tracer.position.copy(start);
    this.tracer.lookAt(end);
    const len = start.distanceTo(end);
    this.tracer.scale.set(1, 1, len);
    this.tracer.visible = true;
    // line geometry is along -Z by default (lookAt handles rotation); scale Z by length
  }

  startReload(now) {
    if (this.reloading || this.ammo >= this.magSize || this.reserveAmmo <= 0) return false;
    this.reloading = true;
    this.reloadStartTime = now;
    return true;
  }

  update(now) {
    if (this.reloading && now - this.reloadStartTime >= this.reloadDurationMs) {
      const space = this.magSize - this.ammo;
      const take = Math.min(space, this.reserveAmmo);
      this.ammo += take;
      this.reserveAmmo -= take;
      this.reloading = false;
    }
  }

  get ammoDisplay() { return `${this.ammo} / ${this.reserveAmmo}`; }
  get status() {
    if (this.reloading) return 'RELOADING';
    if (this.ammo === 0) return 'EMPTY';
    return '';
  }

  dispose() {
    this.scene.remove(this.muzzleFlash);
    this.scene.remove(this.tracer);
  }
}

window.Weapon = Weapon;
