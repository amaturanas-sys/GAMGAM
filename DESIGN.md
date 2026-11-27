# GAMGAM — Game Design Document (Placeholder Phase)

## 1. Overview
- **Genre:** 3D Multiplayer 1st-Person Shooter (FPS)
- **Platforms:** Windows & Android (runs in a web browser — no install)
- **Stack:** Three.js (rendering) + Socket.io (networking) + Node.js/Express (authoritative server)
- **Phase:** Placeholder assets only — simple geometric primitives (boxes, spheres, cylinders) for player, bullets, world, and UI. Real assets/UI/FSX come in Phase 2.

---

## 2. Core Gameplay Loop
1. **Join** → Enter a nickname, pick a room, spawn into the level.
2. **Move & Look** → WASD + mouse/touch look (Pointer Lock on desktop, virtual joystick on mobile).
3. **Shoot** → Hitscan raycast weapon with ammo, cooldown, and reload.
4. **Take/Deal Damage** → Reduce enemy health; eliminate at 0 HP.
5. **Respawn** → After death, wait respawn timer, respawn at a spawn point with full health/ammo.
6. **Repeat** → Compete for kills/survival in the room.

---

## 3. Controls (Placeholder)
| Action | Desktop (Keyboard/Mouse) | Android (Touch) |
|--------|-------------------------|-----------------|
| Move Forward | W | Left joystick up |
| Move Backward | S | Left joystick down |
| Strafe Left | A | Left joystick left |
| Strafe Right | D | Left joystick right |
| Look Around | Mouse move | Right side drag |
| Jump | Space | Jump button |
| Shoot | Left click / Tap | Fire button (right) |
| Reload | R | Reload button |
| Pause / Unlock Cursor | Esc | Menu button |

---

## 4. Game Mechanics

### 4.1 Movement
- First-person character controller.
- Grounded movement with acceleration/friction (no ice-skating).
- Jump with gravity (only when grounded).
- Collision vs. world geometry (simple AABB vs. boxes/planes).
- Speed walk ~5 units/s, sprint ~8 units/s (Shift hold).

### 4.2 Combat / Weapon
- **Hitscan weapon** (instant raycast from camera center).
- Damage per shot: 25.
- Magazine: 30 rounds.
- Fire rate: 10 rounds/s (100ms cooldown).
- Reload time: 1.5s (cannot fire while reloading).
- Muzzle flash + tracer tracer (placeholder colored line).
- Crosshair always on screen center.

### 4.3 Health & Damage
- Max health: 100.
- Damage reduces health; hits play a hitmarker (placeholder red flash).
- At 0 HP → player is "dead", ragdoll-ish (placeholder: fade to red, freeze input).
- Respawn after 3 seconds at a random spawn point with full health/ammo.

### 4.4 Multiplayer (Authoritative Server)
- **Server is authoritative** for: positions, health, ammo, hits, deaths, respawns.
- Client sends **inputs** (movement direction, jump, shoot, reload) at ~30Hz.
- Server simulates physics/game logic and broadcasts **state snapshots** at 20Hz.
- Clients interpolate remote player positions for smooth movement.
- Latency tolerance: basic input prediction for local player (movement applied locally, corrected by server).

### 4.5 Rooms & Lobby
- Players enter a nickname + room name to join.
- Room holds up to 16 players.
- Room state: lobby (waiting) / in-game.
- Join-in-progress supported (spawn on join).

---

## 5. World (Placeholder Geometry)
- **Level:** Simple enclosed arena (~60×60 units) with:
  - Floor (large box)
  - 4 outer walls
  - 6–8 cover obstacles (boxes of varying sizes)
  - 4 spawn points (corners)
- All geometry uses `MeshBasicMaterial` with distinct colors (no textures/lights needed).
- No skybox (plain color background) — placeholder only.

---

## 6. UI / HUD (Placeholder)
- **Crosshair:** center dot + small gap.
- **Health bar:** top-left, red bar + number.
- **Ammo:** bottom-right, "mag / reserve".
- **Kill feed:** top-right, list of recent kills ("PlayerA killed PlayerB").
- **Main menu:** nickname input, room input, Join button.
- **Death screen:** "You were killed by X" + Respawn button / auto-respawn.

---

## 7. Technical Architecture

```
Client (browser)                         Server (Node.js)
-------------                            ----------------
Three.js renderer                          Express + Socket.io
FirstPersonController                      Game room manager
InputManager (keyboard/mouse/touch)        Player state store
Weapon (hitscan raycast)                   Physics/collision (simple AABB)
NetworkClient (socket.io)                  Hit validation & damage
HUD                                        Respawn timer
                                           State broadcast (20Hz)
```

**Network messages (client → server):**
- `join`: { nickname, room }
- `input`: { keys: {w,a,s,d,space,shift}, shoot: bool, reload: bool, look: {x,y}, timestamp }

**Network messages (server → client):**
- `joined`: { playerId, spawnPoint, players[], world }
- `state`: { players: [{id, position, rotation, health, ammo, state}], timestamp }
- `event`: { type: 'hit'|'kill'|'respawn'|'join'|'leave', ... }
- `disconnect`: { playerId }

---

## 8. Milestones (Placeholder Phase)
1. [ ] Project scaffold + dev server running.
2. [ ] Three.js scene + first-person camera + pointer lock.
3. [ ] WASD movement + jump + gravity + collision.
4. [ ] Multiplayer: join room, see other players as colored boxes.
5. [ ] Smooth interpolation of remote players.
6. [ ] Hitscan shooting + ammo + reload.
7. [ ] Health + damage + death + respawn.
8. [ ] HUD (crosshair, health, ammo, kill feed).
9. [ ] Main menu (nickname + room).
10. [ ] Playtest & balance (damage, fire rate, move speed).
11. [ ] **Phase 2 gate:** All mechanics locked → move to real assets/UI/FSX.

---

## 9. Notes for Phase 2 (Future)
- Replace placeholder boxes with real player models & weapons.
- Add real textures, lighting, shadows, skybox.
- Replace debug HUD with polished UI.
- Add FSX (visual effects): muzzle flash, bullet tracers, hit particles, explosions.
- Add mobile touch controls UI overlay.
- Add anti-cheat (server-side validation of fire rate, position sanity).
- Add matchmaking, rankings, persistent stats.