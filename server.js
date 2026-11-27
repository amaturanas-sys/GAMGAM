/**
 * GAMGAM — Authoritative Multiplayer FPS Server (Placeholder Phase)
 * Stack: Express + Socket.io
 *
 * Responsibilities:
 *  - Room & player management
 *  - Authoritative simulation (position, health, ammo, hits, respawn)
 *  - Hit validation (server-side raycast vs AABB)
 *  - State broadcast at fixed tick rate (20 Hz)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 5000,
  pingInterval: 2500,
});

// Serve static client files
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// ============================= GAME CONSTANTS =============================
const TICK_RATE = 20;
const TICK_INTERVAL = 1000 / TICK_RATE;

const PLAYER_RADIUS = 0.35;
const PLAYER_HEIGHT = 1.8;
const MOVE_SPEED = 5.0;
const SPRINT_SPEED = 8.0;
const JUMP_VELOCITY = 7.0;
const GRAVITY = -24.0;
const FRICTION = 0.85;

const MAX_HEALTH = 100;
const DAMAGE_PER_SHOT = 25;
const FIRE_COOLDOWN_MS = 100;
const MAG_SIZE = 30;
const RESERVE_AMMO = 90;
const RELOAD_TIME_MS = 1500;
const RESPAWN_TIME_MS = 3000;
const WORLD_SIZE = 60;

// ============================= WORLD GEOMETRY (placeholder) =============================
const OBSTACLES = [
  { min: { x: -12, y: 0, z: -12 }, max: { x: -8,  y: 2, z: -8 }  },
  { min: { x:  8,  y: 0, z: -12 }, max: { x: 12,  y: 2, z: -8 }  },
  { min: { x: -12, y: 0, z:  8 },  max: { x: -8,  y: 2, z: 12 }  },
  { min: { x:  8,  y: 0, z:  8 },  max: { x: 12,  y: 2, z: 12 }  },
  { min: { x: -6,  y: 0, z: -6 },  max: { x: 6,   y: 3, z: -2 }  },
  { min: { x: -6,  y: 0, z:  2 },  max: { x: 6,   y: 3, z: 6 }   },
  { min: { x:  2,  y: 0, z: -10 }, max: { x: 6,   y: 2, z: -6 }  },
  { min: { x: -6,  y: 0, z:  6 },  max: { x: -2,  y: 2, z: 10 }  },
];

const SPAWN_POINTS = [
  { x: -25, y: 0.9, z: -25 },
  { x:  25, y: 0.9, z: -25 },
  { x: -25, y: 0.9, z:  25 },
  { x:  25, y: 0.9, z:  25 },
  { x:   0, y: 0.9, z: -20 },
  { x:   0, y: 0.9, z:  20 },
];

const FLOOR_Y = 0;

// ============================= STATE =============================
const rooms = new Map();

function createRoom(roomId) {
  return {
    id: roomId,
    players: new Map(),
    lastTick: Date.now(),
  };
}

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, createRoom(roomId));
  return rooms.get(roomId);
}

function createPlayer(socketId, nickname, spawnPoint) {
  return {
    id: socketId,
    nickname,
    position: { ...spawnPoint },
    rotation: { y: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    grounded: false,
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    ammo: MAG_SIZE,
    reserve: RESERVE_AMMO,
    state: 'alive',
    deadAt: null,
    respawnAt: null,
    lastShotAt: 0,
    reloading: false,
    reloadAt: null,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    kills: 0,
    deaths: 0,
    input: { forward: 0, right: 0, jump: false, shoot: false, reload: false, lookY: 0 },
    lastInputAt: 0,
  };
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function resolvePlayerMovement(player, dt) {
  const p = player;
  const speed = p.input.shift ? SPRINT_SPEED : MOVE_SPEED;
  const yaw = p.rotation.y;
  const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  let moveX = 0, moveZ = 0;
  if (p.input.forward !== 0) { moveX += forward.x * p.input.forward * speed; moveZ += forward.z * p.input.forward * speed; }
  if (p.input.right !== 0) { moveX += right.x * p.input.right * speed; moveZ += right.z * p.input.right * speed; }
  p.velocity.x += moveX * dt;
  p.velocity.z += moveZ * dt;
  if (!p.grounded) { p.velocity.y += GRAVITY * dt; } else { p.velocity.y = Math.min(p.velocity.y, 0); if (p.input.jump) { p.velocity.y = JUMP_VELOCITY; p.grounded = false; } }
  p.position.x += p.velocity.x * dt;
  p.position.z += p.velocity.z * dt;
  p.position.y += p.velocity.y * dt;
  if (p.position.y < FLOOR_Y + PLAYER_HEIGHT / 2) { p.position.y = FLOOR_Y + PLAYER_HEIGHT / 2; p.velocity.y = 0; p.grounded = true; } else { p.grounded = false; }
  p.position.x = clamp(p.position.x, -WORLD_SIZE + 1, WORLD_SIZE - 1);
  p.position.z = clamp(p.position.z, -WORLD_SIZE + 1, WORLD_SIZE - 1);
  const playerMin = { x: p.position.x - PLAYER_RADIUS, y: p.position.y, z: p.position.z - PLAYER_RADIUS };
  const playerMax = { x: p.position.x + PLAYER_RADIUS, y: p.position.y + PLAYER_HEIGHT, z: p.position.z + PLAYER_RADIUS };
  for (const obs of OBSTACLES) {
    if (aabbIntersect(playerMin, playerMax, obs.min, obs.max)) {
      const dx = Math.min(playerMax.x, obs.max.x) - Math.max(playerMin.x, obs.min.x);
      const dz = Math.min(playerMax.z, obs.max.z) - Math.max(playerMin.z, obs.min.z);
      if (dx < dz) {
        const overlap = dx;
        const centerX = (playerMin.x + playerMax.x) / 2;
        const obsCenterX = (obs.min.x + obs.max.x) / 2;
        const dir = centerX < obsCenterX ? -1 : 1;
        p.position.x += dir * overlap;
        p.velocity.x = 0;
      } else {
        const overlap = dz;
        const centerZ = (playerMin.z + playerMax.z) / 2;
        const obsCenterZ = (obs.min.z + obs.max.z) / 2;
        const dir = centerZ < obsCenterZ ? -1 : 1;
        p.position.z += dir * overlap;
        p.velocity.z = 0;
      }
    }
  }
  p.velocity.x *= FRICTION;
  p.velocity.z *= FRICTION;
  if (p.grounded) p.velocity.y = 0;
}

function aabbIntersect(minA, maxA, minB, maxB) {
  return minA.x < maxB.x && maxA.x > minB.x && minA.y < maxB.y && maxA.y > minB.y && minA.z < maxB.z && maxA.z > minB.z;
}

function raycastAABB(origin, direction, boxMin, boxMax) {
  let tMin = -Infinity, tMax = Infinity;
  for (const ax of ['x','y','z']) {
    const invD = 1.0 / direction[ax] || 1e6;
    let t1 = (boxMin[ax] - origin[ax]) * invD;
    let t2 = (boxMax[ax] - origin[ax]) * invD;
    if (invD < 0) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  if (tMax < 0) return null;
  const t = tMin < 0 ? 0 : tMin;
  return { t, point: { x: origin.x + direction.x * t, y: origin.y + direction.y * t, z: origin.z + direction.z * t } };
}

function worldRaycast(origin, direction, maxDist = 100) {
  let closest = null;
  for (const obs of OBSTACLES) {
    const hit = raycastAABB(origin, direction, obs.min, obs.max);
    if (hit && hit.t <= maxDist && (!closest || hit.t < closest.t)) closest = { ...hit, type: 'world' };
  }
  return closest;
}
// ============================= COMBAT =============================
function canShoot(player, now) {
  return player.state === 'alive' && !player.reloading && player.ammo > 0 && now - player.lastShotAt >= FIRE_COOLDOWN_MS;
}

function handleShoot(shooter, now) {
  if (!canShoot(shooter, now)) return null;
  shooter.lastShotAt = now;
  shooter.ammo = Math.max(0, shooter.ammo - 1);
  const yaw = shooter.rotation.y;
  const pitch = shooter.rotation.x || 0;
  const direction = { x: Math.sin(yaw) * Math.cos(pitch), y: -Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) };
  const origin = { x: shooter.position.x, y: shooter.position.y + PLAYER_HEIGHT * 0.85, z: shooter.position.z };
  const worldHit = worldRaycast(origin, direction, 100);
  let closestPlayerHit = null;
  let closestDist = Infinity;
  const targetDist = worldHit ? worldHit.t : 100;
  for (const [, target] of shooter.room.players) {
    if (target.id === shooter.id || target.state !== 'alive') continue;
    const boxMin = { x: target.position.x - PLAYER_RADIUS, y: target.position.y, z: target.position.z - PLAYER_RADIUS };
    const boxMax = { x: target.position.x + PLAYER_RADIUS, y: target.position.y + PLAYER_HEIGHT, z: target.position.z + PLAYER_RADIUS };
    const hit = raycastAABB(origin, direction, boxMin, boxMax);
    if (hit && hit.t <= targetDist && hit.t < closestDist) { closestDist = hit.t; closestPlayerHit = { target, hit }; }
  }
  if (closestPlayerHit && (!worldHit || closestPlayerHit.hit.t <= worldHit.t)) {
    applyDamage(closestPlayerHit.target, shooter, DAMAGE_PER_SHOT, now);
    return { type: 'player', targetId: closestPlayerHit.target.id, point: closestPlayerHit.hit.point, dist: closestPlayerHit.hit.t };
  }
  if (worldHit) return { type: 'world', point: worldHit.point, dist: worldHit.t };
  return { type: 'none', point: { x: origin.x + direction.x * 100, y: origin.y + direction.y * 100, z: origin.z + direction.z * 100 }, dist: 100 };
}

function applyDamage(target, attacker, amount, now) {
  if (target.state !== 'alive') return;
  target.health = Math.max(0, target.health - amount);
  if (target.health <= 0) {
    target.health = 0; target.state = 'dying'; target.deadAt = now; target.respawnAt = now + RESPAWN_TIME_MS;
    attacker.kills += 1; target.deaths += 1;
    io.to(target.roomId).emit('event', { type: 'kill', killerId: attacker.id, killerNickname: attacker.nickname, victimId: target.id, victimNickname: target.nickname, timestamp: now });
  } else {
    io.to(target.roomId).emit('event', { type: 'hit', victimId: target.id, attackerId: attacker.id, damage: amount, health: target.health, timestamp: now });
  }
}

function handleReload(player, now) {
  if (player.state !== 'alive' || player.reloading) return;
  if (player.ammo >= MAG_SIZE) return;
  if (player.reserve <= 0) return;
  player.reloading = true; player.reloadAt = now + RELOAD_TIME_MS;
  io.to(player.roomId).emit('event', { type: 'reload_start', playerId: player.id, timestamp: now });
}

function updateRespawn(player, now) {
  if (player.state === 'dying' && player.respawnAt && now >= player.respawnAt) respawnPlayer(player, now);
}

function respawnPlayer(player, now) {
  const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
  player.position = { ...spawn }; player.rotation = { y: 0, x: 0 }; player.velocity = { x: 0, y: 0, z: 0 };
  player.health = MAX_HEALTH; player.ammo = MAG_SIZE; player.reserve = RESERVE_AMMO; player.state = 'alive';
  player.deadAt = null; player.respawnAt = null; player.reloading = false; player.reloadAt = null; player.lastShotAt = 0;
  io.to(player.roomId).emit('event', { type: 'respawn', playerId: player.id, playerNickname: player.nickname, timestamp: now });
}

// ============================= NETWORK =============================
function broadcastState(room) {
  const now = Date.now();
  const playersPayload = [];
  for (const [, p] of room.players) {
    playersPayload.push({
      id: p.id, nickname: p.nickname, position: p.position, rotation: p.rotation,
      health: p.health, maxHealth: p.maxHealth, ammo: p.ammo, reserve: p.reserve,
      state: p.state, color: p.color, kills: p.kills, deaths: p.deaths, reloading: p.reloading,
    });
  }
  io.to(room.id).emit('state', { players: playersPayload, timestamp: now });
}

io.on('connection', (socket) => {
  console.log(`[conn] ${socket.id} connected`);
  socket.on('join', ({ nickname, roomId }) => {
    const cleanNick = (nickname || 'Player').slice(0, 20) || 'Player';
    const cleanRoom = (roomId || 'default').slice(0, 32) || 'default';
    const prevRoomId = socket.roomId;
    if (prevRoomId && rooms.has(prevRoomId)) {
      const prevRoom = rooms.get(prevRoomId);
      prevRoom.players.delete(socket.id);
      socket.leave(prevRoomId);
      io.to(prevRoomId).emit('event', { type: 'leave', playerId: socket.id, timestamp: Date.now() });
    }
    const room = getOrCreateRoom(cleanRoom);
    socket.roomId = cleanRoom;
    socket.join(cleanRoom);
    const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
    const player = createPlayer(socket.id, cleanNick, spawn);
    player.room = room; player.roomId = cleanRoom;
    room.players.set(socket.id, player);
    io.to(cleanRoom).emit('event', { type: 'join', playerId: socket.id, playerNickname: cleanNick, timestamp: Date.now() });
    socket.emit('joined', {
      playerId: socket.id, spawnPoint: spawn,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id, nickname: p.nickname, position: p.position, rotation: p.rotation,
        health: p.health, maxHealth: p.maxHealth, ammo: p.ammo, reserve: p.reserve,
        state: p.state, color: p.color, kills: p.kills, deaths: p.deaths,
      })),
      world: { obstacles: OBSTACLES, spawnPoints: SPAWN_POINTS, floorY: FLOOR_Y, worldSize: WORLD_SIZE },
      timestamp: Date.now(),
    });
    console.log(`[join] ${cleanNick} (${socket.id}) -> room ${cleanRoom}`);
  });

  socket.on('input', (data) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const player = room.players.get(socket.id);
    if (!player || player.state === 'respawning') return;
    const now = Date.now();
    player.input = { forward: data.forward || 0, right: data.right || 0, jump: !!data.jump, shoot: !!data.shoot, reload: !!data.reload, lookY: data.lookY || 0 };
    player.lastInputAt = now;
    if (data.lookY !== undefined) player.rotation.y = data.lookY;
    if (data.lookX !== undefined) player.rotation.x = data.lookX;
    if (player.input.shoot) {
      const shot = handleShoot(player, now);
      if (shot) {
        io.to(roomId).emit('event', { type: 'shot', shooterId: player.id, point: shot.point, typeHit: shot.type, targetId: shot.targetId || null, timestamp: now });
      }
    }
    if (player.input.reload) handleReload(player, now);
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.players.delete(socket.id);
      io.to(roomId).emit('event', { type: 'leave', playerId: socket.id, timestamp: Date.now() });
      console.log(`[disconnect] ${socket.id} left room ${roomId}`);
    }
  });
});

// ============================= GAME LOOP =============================
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (room.players.size === 0) { rooms.delete(roomId); continue; }
    const dt = (now - (room.lastTick || now)) / 1000;
    room.lastTick = now;
    for (const [, player] of room.players) {
      updateRespawn(player, now);
      if (player.reloading && player.reloadAt && now >= player.reloadAt) {
        const space = MAG_SIZE - player.ammo;
        const take = Math.min(space, player.reserve);
        player.ammo += take; player.reserve -= take;
        player.reloading = false; player.reloadAt = null;
        io.to(roomId).emit('event', { type: 'reload_end', playerId: player.id, ammo: player.ammo, timestamp: now });
      }
      if (player.state === 'alive') resolvePlayerMovement(player, dt);
    }
    broadcastState(room);
  }
}, TICK_INTERVAL);

server.listen(PORT, () => {
  console.log(`[server] GAMGAM FPS server listening on http://localhost:${PORT}`);
});
