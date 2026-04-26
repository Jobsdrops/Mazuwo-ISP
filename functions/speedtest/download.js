export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const requestedMb = Number(url.searchParams.get("mb") || "12");
  const safeMb = Math.min(Math.max(requestedMb, 2), 24);
  const size = Math.floor(safeMb * 1024 * 1024);
  const chunk = new Uint8Array(size);

  return new Response(chunk, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "X-Speedtest-Size": String(size)
    }
  });
}
