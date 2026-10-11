import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { drawFor, buildForbidden } from "./santa.js";

const config = JSON.parse(fs.readFileSync("participants.json", "utf8"));
const history = JSON.parse(fs.readFileSync("history.json", "utf8"));
const names = config.participants.map(p => p.name);

function check(draw, seedLabel) {
  const forbidden = buildForbidden(config, history);
  assert.deepEqual(Object.keys(draw), names, seedLabel);
  assert.equal(new Set(Object.values(draw)).size, names.length, `${seedLabel}: duplicate receivers`);
  for (const [giver, receiver] of Object.entries(draw)) {
    assert.notEqual(giver, receiver, `${seedLabel}: self gift`);
    assert.ok(!forbidden.get(giver)?.has(receiver), `${seedLabel}: ${giver} -> ${receiver} is forbidden`);
    if (config.avoidSwaps !== false) {
      assert.notEqual(draw[receiver], giver, `${seedLabel}: swap ${giver} <-> ${receiver}`);
    }
  }
}

test("the configured seed gives a valid, repeatable draw", () => {
  const a = drawFor(config, history);
  assert.deepEqual(a, drawFor(config, history));
  check(a, config.event.seed);
});

test("300 different seeds all give valid draws", () => {
  for (let i = 0; i < 300; i++) check(drawFor(config, history, "seed_" + i), "seed_" + i);
});

test("impossible constraints fail with a clear error", () => {
  const impossible = { ...config, exclusions: names.filter(n => n !== "Alex").map(n => [n, "Alex"]) };
  assert.throws(() => drawFor(impossible, history), /No valid draw/);
});

test("config is sane: unique names, valid unique password hashes, no typos in rules", () => {
  assert.equal(new Set(names).size, names.length, "duplicate participant names");
  const hashes = config.participants.map(p => p.passwordHash);
  for (const h of hashes) assert.match(h, /^[0-9a-f]{64}$/, "passwordHash must be a SHA-256 hex string");
  assert.equal(new Set(hashes).size, hashes.length, "two people share the same password");

  const known = new Set(names);
  for (const [a, b] of [...config.couples, ...config.exclusions]) {
    assert.ok(known.has(a) && known.has(b), `couples/exclusions mention an unknown name: ${a}, ${b}`);
  }
  assert.ok(config.event.seed && config.event.year, "event.year and event.seed are required");
});
