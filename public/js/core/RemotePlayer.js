/**
 * RemotePlayer.js — Represents another networked player as a placeholder box.
 * Interpolates between server snapshots for smooth movement.
 */
class RemotePlayer {
  constructor(id, data, scene, color) {
    this.id = id;
    this.scene = scene;
    this.nickname = data.nickname;
    this.target = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
    this.current = this.target.clone();
    this.targetYaw = data.rotation ? data.rotation.y : 0;
    this.currentYaw = this.targetYaw;
    this.health = data.health;
    this.state = data.state;
    this.color = color || `hsl(${Math.random() * 360}, 70%, 60%)`;

    // Mesh (placeholder box)
    const geo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
    this.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.color) });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.position.copy(this.target);
    this.mesh.userData.id = id;
    this.mesh.userData.isRemotePlayer = true;
    this.scene.add(this.mesh);

    // Name label (canvas texture)
    this._createNameLabel();
  }

  _createNameLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.nickname, 128, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
    sprite.position.set(0, 2.2, 0);
    sprite.scale.set(1.6, 0.5, 1);
    this.mesh.add(sprite);
    this.nameSprite = sprite;
  }

  update(data) {
    this.health = data.health;
    this.state = data.state;
    this.target.set(data.position.x, data.position.y, data.position.z);
    this.targetYaw = data.rotation ? data.rotation.y : 0;
  }

  step(dt) {
    // Interpolate position & yaw toward target
    const lerp = Math.min(1, dt * 12);
    this.current.lerpVectors(this.current, this.target, lerp);
    this.currentYaw += (this.targetYaw - this.currentYaw) * lerp;
    this.mesh.position.copy(this.current);
    this.mesh.rotation.y = this.currentYaw;

    // Update material color if changed
    if (this.material.color.getHex() !== new THREE.Color(this.color).getHex()) {
      this.material.color.set(this.color);
    }

    // Name tag always faces camera (handled by Game.js camera lookAt)
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

window.RemotePlayer = RemotePlayer;
