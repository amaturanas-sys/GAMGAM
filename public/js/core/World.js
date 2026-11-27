/**
 * World.js — Placeholder level geometry built with Three.js primitives.
 * Colors only (no textures). Used for collision visual reference.
 */
class World {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.obstacles = []; // {min, max} in world units (mirrors server)
    this.spawnPoints = [];
    this.floor = null;
    this.size = 60;
  }

  build({ obstacles, spawnPoints, floorY, worldSize }) {
    this.size = worldSize || 60;
    this.obstacles = obstacles || [];
    this.spawnPoints = spawnPoints || [];

    // Floor (large box at y=floorY)
    const floorGeo = new THREE.BoxGeometry(this.size * 2, 0.4, this.size * 2);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.position.set(0, floorY - 0.2, 0);
    this.scene.add(this.floor);
    this.meshes.push(this.floor);

    // Sky/background
    this.scene.background = new THREE.Color(0x1a2a3a);

    // Obstacles (colored boxes)
    const obsMat = new THREE.MeshBasicMaterial({ color: 0x6b5b95 });
    for (const obs of this.obstacles) {
      const w = obs.max.x - obs.min.x;
      const h = obs.max.y - obs.min.y;
      const d = obs.max.z - obs.min.z;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, obsMat);
      mesh.position.set(
        (obs.min.x + obs.max.x) / 2,
        (obs.min.y + obs.max.y) / 2,
        (obs.min.z + obs.max.z) / 2
      );
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    // Spawn point markers (small yellow cylinders)
    const spMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    for (const sp of this.spawnPoints) {
      const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
      const mesh = new THREE.Mesh(geo, spMat);
      mesh.position.set(sp.x, sp.y + 0.3, sp.z);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  dispose() {
    for (const m of this.meshes) {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
    }
    this.meshes = [];
  }
}

window.World = World;
