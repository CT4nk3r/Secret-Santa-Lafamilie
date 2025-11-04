async function hash(pw) {
  const e = new TextEncoder();
  const d = e.encode(pw);
  const h = await crypto.subtle.digest('SHA-256', d);
  return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
hash("mySecret123").then(console.log);
