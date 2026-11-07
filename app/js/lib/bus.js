// Tiny app-wide event bus: screens announce what is happening (an answer, a story, speech starting),
// and the companions (Jiji in the corner, the background music) react without screens knowing about them.
const subs = new Map();

export function on(type, fn) {
  if (!subs.has(type)) subs.set(type, new Set());
  subs.get(type).add(fn);
  return () => subs.get(type)?.delete(fn);
}
export function emit(type, data) {
  for (const fn of subs.get(type) || []) { try { fn(data); } catch (e) { console.warn('bus', type, e); } }
}
