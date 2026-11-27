/**
 * HUD.js — Crosshair, health bar, ammo, damage flash, hitmarker, kill feed.
 */
class HUD {
  constructor() {
    this.healthEl = document.getElementById('healthFill');
    this.healthVal = document.getElementById('healthValue');
    this.ammoEl = document.getElementById('ammoDisplay');
    this.ammoStatus = document.getElementById('ammoStatus');
    this.killfeed = document.getElementById('killfeed');
    this.hudEl = document.getElementById('hud');
    this.crosshair = document.querySelector('.crosshair');
  }

  show() { this.hudEl.classList.remove('hidden'); }
  hide() { this.hudEl.classList.add('hidden'); }

  setHealth(hp, max) {
    const pct = Math.max(0, Math.min(100, (hp / max) * 100));
    if (this.healthEl) this.healthEl.style.width = `${pct}%`;
    if (this.healthVal) this.healthVal.textContent = Math.max(0, hp);
    if (hp <= 30 && this.healthEl) this.healthEl.style.background = '#ff4444';
    else if (this.healthEl) this.healthEl.style.background = '#e74c3c';
  }

  setAmmo(text, status) {
    if (this.ammoEl) this.ammoEl.textContent = text;
    if (this.ammoStatus) this.ammoStatus.textContent = status;
  }

  showDamageFlash() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.background = 'rgba(231,76,60,0.35)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '30';
    flash.style.transition = 'opacity 0.15s';
    document.body.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = 0; });
    setTimeout(() => flash.remove(), 150);
  }

  showHitmarker() {
    const hm = document.createElement('div');
    hm.style.position = 'fixed';
    hm.style.top = '50%';
    hm.style.left = '50%';
    hm.style.width = '16px';
    hm.style.height = '16px';
    hm.style.border = '2px solid #0f0';
    hm.style.transform = 'translate(-50%,-50%)';
    hm.style.pointerEvents = 'none';
    hm.style.zIndex = '30';
    hm.style.opacity = '1';
    hm.style.transition = 'opacity 0.1s, transform 0.1s';
    document.body.appendChild(hm);
    setTimeout(() => { hm.style.opacity = '0'; hm.style.transform = 'translate(-50%,-50%) scale(1.4)'; }, 0);
    setTimeout(() => hm.remove(), 100);
  }

  addKillFeed(text, kind = 'info') {
    const div = document.createElement('div');
    div.innerHTML = text;
    if (kind === 'kill') { div.style.borderLeftColor = '#2ecc71'; }
    else if (kind === 'hit') { div.style.borderLeftColor = '#f1c40f'; div.style.fontSize = '0.7rem'; }
    this.killfeed.prepend(div);
    setTimeout(() => { div.style.opacity = '0'; div.style.transform = 'translateX(10px)'; }, 2500);
    setTimeout(() => div.remove(), 3000);
    // Limit feed length
    while (this.killfeed.children.length > 8) this.killfeed.lastChild.remove();
  }
}

window.HUD = HUD;
