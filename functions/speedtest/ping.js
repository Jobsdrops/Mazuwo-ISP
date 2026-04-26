export async function onRequestGet() {
  return Response.json({ ok: true, pong: Date.now() }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
