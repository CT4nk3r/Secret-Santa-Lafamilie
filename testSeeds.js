import fs from "fs";

const SEEDS_TO_TEST = 300; // how many seeds to test
const OUTPUT_FILE = "pairings_log.txt";

// ------------------ Helper Functions ------------------

function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function seededShuffle(array, seed) {
  const rand = seededRandom(seed);
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValidPairing(names, shuffled, exclusions) {
  for (let i = 0; i < names.length; i++) {
    const giver = names[i];
    const receiver = shuffled[i];
    if (giver === receiver) return false;
    for (const [a, b] of exclusions) {
      if (giver === a && receiver === b) return false;
    }
  }
  return true;
}

function generateValidAssignments(names, exclusions, seed) {
  let shuffled = seededShuffle(names, seed);
  let attempts = 0;
  const MAX_ATTEMPTS = 10000;

  while (!isValidPairing(names, shuffled, exclusions)) {
    seed = seed + "_retry" + attempts;
    shuffled = seededShuffle(names, seed);
    attempts++;
    if (attempts > MAX_ATTEMPTS) {
      throw new Error("Could not find valid pairing — check exclusions or participant count.");
    }
  }

  const result = {};
  for (let i = 0; i < names.length; i++) {
    result[names[i]] = shuffled[i];
  }
  return result;
}

// ------------------ Test Runner ------------------

const data = JSON.parse(fs.readFileSync("participants.json", "utf-8"));
const names = data.participants.map(p => p.name);
const exclusions = data.exclusions || [];

let failures = [];
let outputText = "";

for (let i = 0; i < SEEDS_TO_TEST; i++) {
  const seed = "seed_" + i;
  try {
    const result = generateValidAssignments(names, exclusions, seed);

    const receivers = new Set(Object.values(result));
    if (receivers.size !== names.length) {
      throw new Error("Duplicate receivers detected");
    }

    // Add nicely formatted result to output
    outputText += `🎄 Seed: ${seed}\n`;
    for (const [giver, receiver] of Object.entries(result)) {
      outputText += `  ${giver} ➡️ ${receiver}\n`;
    }
    outputText += "\n";

  } catch (e) {
    failures.push({ seed, error: e.message });
    outputText += `❌ Seed ${seed} FAILED: ${e.message}\n\n`;
  }
}

// ------------------ Write to File ------------------

fs.writeFileSync(OUTPUT_FILE, outputText.trim());
console.log(`✅ Test complete. Results saved to "${OUTPUT_FILE}"`);

if (failures.length > 0) {
  console.log("⚠️ Some seeds failed:");
  console.table(failures);
} else {
  console.log("🎅 All seeds passed successfully!");
}
