/**
 * Network.js — Socket.io wrapper for GAMGAM FPS client.
 * Handles connection, join, input streaming, and incoming state/events.
 */
class Network {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.playerId = null;
    this.callbacks = {}; // eventName -> [fn]
    this.onStatusChange = null; // callback(statusText)
  }

  connect(url = '') {
    return new Promise((resolve, reject) => {
      this.socket = io(url, { transports: ['websocket', 'polling'] });
      this.socket.on('connect', () => {
        this.connected = true;
        this._bindDefault();
        if (this.onStatusChange) this.onStatusChange('Connected');
        resolve();
      });
      this.socket.on('connect_error', (err) => {
        if (this.onStatusChange) this.onStatusChange('Connection failed: ' + (err && err.message));
        reject(err);
      });
      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        if (this.onStatusChange) this.onStatusChange('Disconnected: ' + reason);
      });
      this.socket.on('reconnect_attempt', () => {
        if (this.onStatusChange) this.onStatusChange('Reconnecting...');
      });
    });
  }

  _bindDefault() {
    // Forward any socket event to registered callbacks
    const origEmit = this.socket.emit.bind(this.socket);
    this.socket.onAny((event, ...args) => {
      const cbs = this.callbacks[event] || [];
      cbs.forEach((fn) => { try { fn(...args); } catch (e) { console.error(e); } });
    });
  }

  on(event, fn) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(fn);
  }

  off(event, fn) {
    if (!this.callbacks[event]) return;
    this.callbacks[event] = this.callbacks[event].filter((f) => f !== fn);
  }

  emit(event, data) {
    if (this.socket && this.connected) this.socket.emit(event, data);
  }

  join(nickname, roomId) {
    this.emit('join', { nickname, roomId });
  }

  sendInput(input) {
    this.emit('input', input);
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}

window.Network = Network;
