// Single-process request ordering prevents concurrent tabs from overwriting a cart.
const tails = new Map();
export async function serializeSession(req, run) {
  if (
    /^\/(?:images|fonts)\//.test(req.url) ||
    /^\/(?:modern\.css|fonts\.css|app\.js)(?:\?|$)/.test(req.url)
  )
    return run();
  const id = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("bg_session="))
    ?.slice(11);
  if (!id || !/^[A-Za-z0-9_-]{40,60}$/.test(id)) return run();
  const previous = tails.get(id) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  tails.set(id, current);
  await previous;
  try {
    return await run();
  } finally {
    release();
    if (tails.get(id) === current) tails.delete(id);
  }
}
