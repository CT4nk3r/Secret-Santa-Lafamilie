// hash_passwords.js
// Usage: node hash_passwords.js passwords.json participants.json [template.json]

import fs from "fs/promises";
import crypto from "crypto";
import path from "path";

async function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: node hash_passwords.js passwords.json participants.json [template.json]");
    process.exit(1);
  }

  const [pwFile, outFile, templateFile] = args.map(a => path.resolve(a));

  try {
    const pwRaw = await fs.readFile(pwFile, "utf8");
    const pwList = JSON.parse(pwRaw);

    if (!Array.isArray(pwList)) {
      throw new Error("passwords.json must be an array of {name, password}");
    }

    const participants = [];
    for (const entry of pwList) {
      if (!entry || typeof entry.name !== "string" || typeof entry.password !== "string") {
        throw new Error("Each entry must be { name: string, password: string }");
      }
      const hash = await sha256Hex(entry.password);
      participants.push({ name: entry.name, passwordHash: hash });
    }

    // Build output object: either merge with template or create minimal structure
    let outObj = { participants };
    if (templateFile) {
      try {
        const tplRaw = await fs.readFile(templateFile, "utf8");
        const tpl = JSON.parse(tplRaw);
        // merge but do not overwrite participants
        outObj = { ...tpl, participants };
      } catch (e) {
        console.warn("Warning: could not read template file, continuing without it:", e.message);
      }
    }

    await fs.writeFile(outFile, JSON.stringify(outObj, null, 2), "utf8");
    console.log(`Wrote ${outFile} (${participants.length} participants).`);
    console.log("IMPORTANT: delete passwords.json or keep it out of source control.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(2);
  }
}

main();
