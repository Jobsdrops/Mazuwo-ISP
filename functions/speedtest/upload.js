export async function onRequestPost({ request }) {
  const started = Date.now();
  const body = await request.arrayBuffer();
  const elapsedMs = Math.max(Date.now() - started, 1);

  return Response.json({
    ok: true,
    bytes: body.byteLength,
    elapsedMs
  }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
