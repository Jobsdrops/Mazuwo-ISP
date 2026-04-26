export async function onRequestPost({ request }) {
  const started = Date.now();
  let bytes = 0;

  if (request.body) {
    const reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) bytes += value.byteLength;
    }
  } else {
    const body = await request.arrayBuffer();
    bytes = body.byteLength;
  }

  const elapsedMs = Math.max(Date.now() - started, 1);

  return Response.json({
    ok: true,
    bytes,
    elapsedMs
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
