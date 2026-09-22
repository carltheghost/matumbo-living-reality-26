export const AIR_TYPING_SCHEMA = "matumbo-air-typing-0.26";
export const DEBOUNCE_MS = 250;
export const TAP_COMPLETE_MS = 90;
export const LATERAL_MOVE_RATIO = 0.12;

const safe = value => value == null ? "" : String(value);

export function createAirTyping({ onControlKey = null } = {}) {
  let keyMap = [];
  let layer = "letters";
  let shiftArmed = false;
  const lastFire = new Map();
  const pending = new Map();

  function hitTest(x, y) {
    return keyMap.find(entry => {
      const r = entry.rect || {};
      return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    }) || null;
  }

  function resolve(keyId) {
    if (keyId === "Backspace") return { type: "backspace" };
    if (keyId === "Enter") return { type: "enter" };
    if (keyId === "Dismiss") return { type: "dismiss" };
    if (keyId === "Symbols") {
      layer = layer === "symbols" ? "letters" : "symbols";
      if (typeof onControlKey === "function") onControlKey("Symbols", layer === "symbols");
      return { type: "symbols", layer };
    }
    if (keyId === "Shift") {
      shiftArmed = !shiftArmed;
      if (typeof onControlKey === "function") onControlKey("Shift", shiftArmed);
      return null;
    }
    if (keyId === " ") return { type: "char", char: " " };
    let ch = safe(keyId);
    if (layer === "letters" && ch.length === 1) ch = ch.toLowerCase();
    if (shiftArmed && ch.length === 1 && /[a-z]/.test(ch)) {
      ch = ch.toUpperCase();
      shiftArmed = false;
    }
    return { type: "char", char: ch };
  }

  function fire(keyId, nowMs) {
    const last = lastFire.get(keyId) ?? -Infinity;
    if (nowMs - last < DEBOUNCE_MS) return null;
    lastFire.set(keyId, nowMs);
    return resolve(keyId);
  }

  function flush(nowMs) {
    const out = [];
    for (const [finger, tap] of pending) {
      if (tap.cancelled) {
        pending.delete(finger);
        continue;
      }
      if (nowMs - tap.t0 >= TAP_COMPLETE_MS) {
        pending.delete(finger);
        if (tap.key) {
          const event = fire(tap.key, nowMs);
          if (event) out.push(event);
        }
      }
    }
    return out;
  }

  function setKeyMap(rects) {
    keyMap = Array.isArray(rects)
      ? rects.filter(x => x && x.rect).map(x => ({ key: safe(x.key), rect: { ...x.rect } }))
      : [];
  }

  function setLayer(next) {
    if (next === "letters" || next === "symbols") layer = next;
  }

  function setShiftArmed(next) {
    shiftArmed = Boolean(next);
  }

  function registerTap(fingerId, x, y, nowMs) {
    const completed = flush(nowMs);
    if (pending.size >= 10 && !pending.has(fingerId)) {
      pending.delete(pending.keys().next().value);
    }
    const hit = hitTest(x, y);
    pending.set(fingerId, {
      x0: x,
      t0: nowMs,
      key: hit?.key ?? null,
      rect: hit?.rect ?? null,
      cancelled: false
    });
    return completed;
  }

  function registerMove(fingerId, x, nowMs) {
    const completed = flush(nowMs);
    const tap = pending.get(fingerId);
    if (tap?.rect && Math.abs(x - tap.x0) > tap.rect.w * LATERAL_MOVE_RATIO) {
      tap.cancelled = true;
    }
    return completed;
  }

  return {
    setKeyMap,
    setLayer,
    setShiftArmed,
    registerTap,
    registerMove,
    poll: flush,
    getState: () => ({
      schemaVersion: AIR_TYPING_SCHEMA,
      layer,
      shiftArmed,
      pendingFingers: pending.size
    })
  };
}
