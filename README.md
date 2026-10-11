# Secret Santa 🎅 La Famille

A static page (no build step) where everyone clicks their name, enters their password and sees who they're gifting.

## Files
- `participants.json` – event info (year, seed, date, budget, note), participants + password hashes, `couples` (can't draw each other) and one-way `exclusions`.
- `history.json` – past years' pairings. They are automatically excluded, so nobody gets the same person two years in a row.
- `santa.js` – the draw (seeded, deterministic backtracking solver), shared by the page and the tests.
- `hash_passwords.js` – turns a `passwords.json` (git-ignored) into password hashes.

## Each new year
1. Update `event.year` and `event.seed` in `participants.json` (plus `date` as `YYYY-MM-DD`, `budget`, `note` if you want them shown).
2. Add/remove participants. For new people, put their name + password in `passwords.json` and run `npm run hash` (it rewrites all hashes in `participants.json`, so include everyone), or paste a SHA-256 hash by hand.
3. Update `couples` / `exclusions`.
4. Run `npm test` – it checks hundreds of seeds against the rules and fails if the constraints can't be satisfied.
5. Once the draw is final, add this year's result to `history.json` (it's what the page shows for the configured seed).
6. Serve the folder (e.g. GitHub Pages). Locally: `python3 -m http.server`.

> Note: the draw runs in the browser, so it's "secret enough" for family fun, not cryptographically secret.
