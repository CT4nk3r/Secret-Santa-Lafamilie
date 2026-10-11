// Shared by index.html (browser) and the node scripts/tests.

export function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function shuffle(array, rand) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Every forbidden giver -> receiver pair: couples (both ways), one-way
// exclusions, and last years' pairings (so nobody gets the same person twice).
export function buildForbidden({ couples = [], exclusions = [] }, history = {}) {
  const forbidden = new Map();
  const add = (a, b) => {
    if (!forbidden.has(a)) forbidden.set(a, new Set());
    forbidden.get(a).add(b);
  };
  for (const [a, b] of couples) { add(a, b); add(b, a); }
  for (const [a, b] of exclusions) add(a, b);
  for (const pairings of Object.values(history)) {
    for (const [giver, receiver] of Object.entries(pairings)) add(giver, receiver);
  }
  return forbidden;
}

// Deterministic for a given seed. Randomised backtracking, so it finds a valid
// draw whenever one exists (and says so clearly when none does).
export function generateAssignments(names, forbidden, seed, { avoidSwaps = true } = {}) {
  const rand = seededRandom(seed);
  const result = {};
  const taken = new Set();

  // Most constrained givers first, so dead ends show up early.
  const allowed = name => names.filter(n => n !== name && !forbidden.get(name)?.has(n));
  const order = [...names].sort((a, b) => allowed(a).length - allowed(b).length || rand() - 0.5);

  function place(i) {
    if (i === order.length) return true;
    const giver = order[i];
    for (const receiver of shuffle(allowed(giver), rand)) {
      if (taken.has(receiver)) continue;
      if (avoidSwaps && result[receiver] === giver) continue;
      result[giver] = receiver;
      taken.add(receiver);
      if (place(i + 1)) return true;
      delete result[giver];
      taken.delete(receiver);
    }
    return false;
  }

  if (!place(0)) {
    throw new Error("No valid draw exists - the exclusions/history are too strict for this group.");
  }
  // Keep participant order for display.
  return Object.fromEntries(names.map(n => [n, result[n]]));
}

export function drawFor(config, history, seed = config.event.seed) {
  const names = config.participants.map(p => p.name);
  const forbidden = buildForbidden(config, history);
  return generateAssignments(names, forbidden, seed, { avoidSwaps: config.avoidSwaps !== false });
}

export async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
