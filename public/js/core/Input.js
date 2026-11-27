/**
 * Input.js — Keyboard, mouse (pointer lock), and touch input for the FPS.
 * Produces a normalized input object consumed by Game.js.
 */
class Input {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0 };
    this.pointerLocked = false;
    this._shoot = false;
    this.mobile = { joy: { active: false, delta: { x: 0, y: 0 } }, look: { delta: { x: 0, y: 0 } } };

    this._onKeyDown = (e) => { this.keys[e.code] = true; };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    this._onMouseMove = (e) => { this.mouse.x = e.movementX; this.mouse.y = e.movementY; };
    this._onPointerChange = () => { this.pointerLocked = !!document.pointerLockElement; };
    this._onMouseDown = (e) => { if (e.button === 0) this._shoot = true; };
    this._onMouseUp = (e) => { if (e.button === 0) this._shoot = false; };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerChange);
    document.addEventListener('mozpointerlockchange', this._onPointerChange);

    this._setupMobile();
  }

  lockPointer() { const c = document.querySelector('canvas'); if (c) c.requestPointerLock(); }
  unlockPointer() { if (document.exitPointerLock) document.exitPointerLock(); }

  get movement() {
    let f = 0, r = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) f += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) f -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) r -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) r += 1;
    return { forward: f, right: r };
  }
  get jump() { return this.keys['Space']; }
  get sprint() { return this.keys['ShiftLeft'] || this.keys['ShiftRight']; }
  get shoot() { return this._shoot; }
  get reload() { return this.keys['KeyR']; }
  get look() { return { x: this.mouse.x, y: this.mouse.y }; }

  consumeShoot() { const s = this._shoot; this._shoot = false; return s; }

  _setupMobile() {
    const wrap = document.getElementById('joystickWrap');
    const base = document.getElementById('joystickBase');
    const stick = document.getElementById('joystickStick');
    const lookZone = document.getElementById('lookZone');
    const btnFire = document.getElementById('btnFire');
    const btnReload = document.getElementById('btnReload');
    const btnJump = document.getElementById('btnJump');

    const baseCenter = () => { const r = base.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

    const startJoy = (e) => { this.mobile.joy.active = true; this._moveJoy(e); };
    const moveJoy = (e) => { if (!this.mobile.joy.active) return; this._moveJoy(e); };
    const endJoy = () => { this.mobile.joy.active = false; this.mobile.joy.delta = { x: 0, y: 0 }; stick.style.transform = 'translate(-50%, -50%)'; };

    this._moveJoy = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const c = baseCenter();
      let dx = t.clientX - c.x, dy = t.clientY - c.y;
      const dist = Math.hypot(dx, dy), max = 56;
      if (dist > max) { dx *= max / dist; dy *= max / dist; }
      stick.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
      this.mobile.joy.delta = { x: dx / max, y: dy / max };
    };

    wrap.addEventListener('touchstart', (e) => { e.preventDefault(); startJoy(e); }, { passive: false });
    wrap.addEventListener('touchmove', (e) => { e.preventDefault(); moveJoy(e); }, { passive: false });
    wrap.addEventListener('touchend', endJoy);
    wrap.addEventListener('touchcancel', endJoy);
    wrap.addEventListener('mousedown', (e) => { e.preventDefault(); startJoy(e); });
    window.addEventListener('mousemove', moveJoy);
    window.addEventListener('mouseup', endJoy);

    let lookActive = false;
    const startLook = (e) => { lookActive = true; const c = this._tc(e); this.mobile.look.start = c; };
    const moveLook = (e) => { if (!lookActive) return; const c = this._tc(e); this.mobile.look.delta = { x: c.x - this.mobile.look.start.x, y: c.y - this.mobile.look.start.y }; this.mobile.look.start = c; };
    const endLook = () => { lookActive = false; this.mobile.look.delta = { x: 0, y: 0 }; };

    lookZone.addEventListener('touchstart', (e) => { e.preventDefault(); startLook(e); }, { passive: false });
    lookZone.addEventListener('touchmove', (e) => { e.preventDefault(); moveLook(e); }, { passive: false });
    lookZone.addEventListener('touchend', endLook);
    lookZone.addEventListener('touchcancel', endLook);

    const bindBtn = (el, onPress) => {
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onPress(); }, { passive: false });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onPress(); });
    };
    bindBtn(btnFire, () => { this._shoot = true; });
    btnFire.addEventListener('mouseup', () => { this._shoot = false; });
    btnFire.addEventListener('touchend', () => { this._shoot = false; });
    bindBtn(btnReload, () => { this.keys['KeyR'] = true; setTimeout(() => { this.keys['KeyR'] = false; }, 150); });
    bindBtn(btnJump, () => { this.keys['Space'] = true; setTimeout(() => { this.keys['Space'] = false; }, 150); });
  }
  _tc(e) { const t = e.touches ? e.touches[0] : e; return { x: t.clientX, y: t.clientY }; }

  get mobileInput() {
    const j = this.mobile.joy;
    return { forward: -j.delta.y, right: j.delta.x, jump: this.keys['Space'], shoot: this._shoot, reload: this.keys['KeyR'], lookX: -this.mobile.look.delta.y * 0.002, lookY: -this.mobile.look.delta.x * 0.002 };
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerChange);
    document.removeEventListener('mozpointerlockchange', this._onPointerChange);
    window.removeEventListener('mousemove', this._moveJoy);
  }
}

window.Input = Input;
