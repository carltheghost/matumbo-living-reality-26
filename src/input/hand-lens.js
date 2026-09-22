export const HAND_LENS_SCHEMA = "matumbo-hand-lens-0.26";
export const GESTURES = Object.freeze(["point","pinch","grab","open","swipe"]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0), (a?.z ?? 0) - (b?.z ?? 0));

export function normalizeHandLandmarks(input) {
  const hands = Array.isArray(input) ? input.slice(0, 2) : [];
  return hands.map((landmarks, hand) => {
    const points = Array.isArray(landmarks) ? landmarks.slice(0, 21).map(point => ({
      x: clamp(Number(point?.x) || 0, 0, 1),
      y: clamp(Number(point?.y) || 0, 0, 1),
      z: Number(point?.z) || 0
    })) : [];
    return {
      hand,
      points,
      pinchDistance: distance(points[4], points[8]),
      indexTip: points[8] || null,
      middleTip: points[12] || null,
      wrist: points[0] || null
    };
  });
}

export function classifyHandGesture(hand) {
  if (!hand) return "point";
  if (Number(hand.pinchDistance) < 0.055) return "pinch";
  const index = hand.indexTip;
  const middle = hand.middleTip;
  if (index && middle && Math.abs(index.x - middle.x) < 0.08 && Math.abs(index.y - middle.y) < 0.08) return "grab";
  return "point";
}

export function createHandLens({ now = () => Date.now() } = {}) {
  let enabled = false;
  let previous = [];
  function setEnabled(value) { enabled = Boolean(value); if (!enabled) previous = []; }
  function update(input) {
    if (!enabled) return { schemaVersion: HAND_LENS_SCHEMA, enabled: false, hands: [], events: [] };
    const hands = normalizeHandLandmarks(input);
    const timestamp = typeof now === "function" ? now() : now;
    const events = hands.map(hand => ({
      type: "gesture",
      hand: hand.hand,
      gesture: classifyHandGesture(hand),
      x: hand.indexTip?.x ?? 0,
      y: hand.indexTip?.y ?? 0,
      timestamp
    }));
    previous = hands;
    return { schemaVersion: HAND_LENS_SCHEMA, enabled: true, hands, events };
  }
  return { setEnabled, update, get enabled() { return enabled; }, get previous() { return previous; } };
}