export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const requestedMb = Number(url.searchParams.get("mb") || "12");
  const safeMb = Math.min(Math.max(requestedMb, 1), 16);
  const size = Math.floor(safeMb * 1024 * 1024);
  const chunkSize = 64 * 1024;
  const fullChunk = new Uint8Array(chunkSize);
  for (let i = 0; i < fullChunk.length; i += 1) {
    fullChunk[i] = (i * 31 + 17) & 255;
  }
  let sent = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= size) {
        controller.close();
        return;
      }

      const remaining = size - sent;
      const nextSize = Math.min(chunkSize, remaining);
      controller.enqueue(nextSize === chunkSize ? fullChunk : fullChunk.slice(0, nextSize));
      sent += nextSize;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "none",
      "X-Speedtest-Size": String(size)
    }
  });
}
