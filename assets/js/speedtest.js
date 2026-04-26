(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    start: $("speedStart"),
    startTop: $("speedStartTop"),
    stop: $("speedStop"),
    guideBtn: $("speedGuideBtn"),
    guide: $("speedGuide"),
    guideStart: $("guideStart"),
    dontShow: $("dontShowGuide"),
    phase: $("speedPhase"),
    status: $("speedStatus"),
    live: $("liveSpeed"),
    ping: $("pingResult"),
    down: $("downloadResult"),
    up: $("uploadResult"),
    needle: $("gaugeNeedle"),
    fill: $("gaugeFill"),
    note: $("speedNote")
  };

  if (!els.start || !els.live) return;

  let controller = null;
  let running = false;
  let displaySpeed = 0;
  let animationFrame = null;
  const GUIDE_KEY = "mazuwo_speedtest_guide_hidden";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setGauge(speed) {
    const max = 100;
    const percent = clamp(speed / max, 0, 1);
    const angle = -90 + percent * 180;
    els.live.textContent = speed.toFixed(speed >= 10 ? 0 : 1);
    if (els.needle) els.needle.style.transform = `rotate(${angle}deg)`;
    if (els.fill) els.fill.style.strokeDasharray = `${Math.round(percent * 100)} 100`;
  }

  function animateGauge(target) {
    cancelAnimationFrame(animationFrame);
    const tick = () => {
      displaySpeed += (target - displaySpeed) * 0.18;
      if (Math.abs(displaySpeed - target) < 0.08) displaySpeed = target;
      setGauge(displaySpeed);
      if (displaySpeed !== target) animationFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  function setPhase(phase, status) {
    els.phase.textContent = phase;
    els.status.textContent = status;
  }

  function setRunning(value) {
    running = value;
    els.start.disabled = value;
    if (els.startTop) els.startTop.disabled = value;
    els.stop.disabled = !value;
  }

  function openGuide() {
    if (!els.guide) return;
    els.guide.classList.add("show");
    els.guide.setAttribute("aria-hidden", "false");
  }

  function closeGuide() {
    if (!els.guide) return;
    if (els.dontShow?.checked) localStorage.setItem(GUIDE_KEY, "1");
    els.guide.classList.remove("show");
    els.guide.setAttribute("aria-hidden", "true");
  }

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pingTest(signal) {
    const samples = [];
    for (let i = 0; i < 5; i += 1) {
      const start = performance.now();
      await fetch(`/speedtest/ping?t=${Date.now()}-${i}`, { cache: "no-store", signal });
      samples.push(performance.now() - start);
      await sleep(90);
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];
  }

  async function downloadOnce(signal, mb = 12, onSpeed = () => {}) {
    const start = performance.now();
    let received = 0;
    const response = await fetch(`/speedtest/download?mb=${mb}&t=${Date.now()}-${Math.random()}`, {
      cache: "no-store",
      signal
    });

    if (!response.ok) throw new Error("Download endpoint failed");

    if (!response.body) {
      const blob = await response.blob();
      received = blob.size;
      const seconds = Math.max((performance.now() - start) / 1000, 0.001);
      const speed = (received * 8) / seconds / 1048576;
      onSpeed(speed);
      return speed;
    }

    const reader = response.body.getReader();
    let lastUpdate = start;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      const now = performance.now();
      if (now - lastUpdate > 120) {
        const seconds = Math.max((now - start) / 1000, 0.001);
        onSpeed((received * 8) / seconds / 1048576);
        lastUpdate = now;
      }
    }

    const seconds = Math.max((performance.now() - start) / 1000, 0.001);
    const speed = (received * 8) / seconds / 1048576;
    onSpeed(speed);
    return speed;
  }

  async function downloadTest(signal) {
    const runs = [];
    const first = await downloadOnce(signal, 8, animateGauge);
    runs.push(first);
    const second = await Promise.all([
      downloadOnce(signal, 12, animateGauge),
      downloadOnce(signal, 12, animateGauge),
      downloadOnce(signal, 12, animateGauge)
    ]);
    runs.push(...second);
    runs.sort((a, b) => a - b);
    return runs[Math.floor(runs.length / 2)];
  }

  async function uploadOnce(signal, mb = 6) {
    const size = Math.floor(mb * 1024 * 1024);
    const payload = new Uint8Array(size);
    const start = performance.now();
    const response = await fetch(`/speedtest/upload?t=${Date.now()}-${Math.random()}`, {
      method: "POST",
      body: payload,
      cache: "no-store",
      signal,
      headers: { "Content-Type": "application/octet-stream" }
    });
    if (!response.ok) throw new Error("Upload endpoint failed");
    const seconds = Math.max((performance.now() - start) / 1000, 0.001);
    return (size * 8) / seconds / 1048576;
  }

  async function uploadTest(signal) {
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      const speed = await uploadOnce(signal, 5);
      runs.push(speed);
      animateGauge(speed);
      await sleep(180);
    }
    runs.sort((a, b) => a - b);
    return runs[Math.floor(runs.length / 2)];
  }

  async function startTest() {
    if (running) return;
    controller = new AbortController();
    setRunning(true);
    els.ping.textContent = "-- ms";
    els.down.textContent = "-- Mbps";
    els.up.textContent = "-- Mbps";
    els.note.textContent = "Testing now. Keep this tab open and avoid starting other downloads.";
    animateGauge(0);

    try {
      setPhase("Checking ping", "Testing");
      const ping = await pingTest(controller.signal);
      els.ping.textContent = `${Math.round(ping)} ms`;

      setPhase("Testing download", "Running");
      const down = await downloadTest(controller.signal);
      els.down.textContent = `${down.toFixed(down >= 10 ? 0 : 1)} Mbps`;
      animateGauge(down);

      setPhase("Testing upload", "Running");
      const up = await uploadTest(controller.signal);
      els.up.textContent = `${up.toFixed(up >= 10 ? 0 : 1)} Mbps`;
      animateGauge(up);

      setPhase("Test complete", "Done");
      els.note.textContent = "Result complete. For a better average, run it twice and compare both results.";
    } catch (error) {
      if (error.name === "AbortError") {
        setPhase("Test stopped", "Stopped");
        els.note.textContent = "The test was stopped before completion.";
      } else {
        setPhase("Could not complete test", "Error");
        els.note.textContent = "The speed test endpoints did not respond. After deploying to Cloudflare Pages, check that the /functions folder is included in Git.";
        if (window.Mazuwo?.toast) window.Mazuwo.toast("Speed test could not reach the test endpoints.");
      }
    } finally {
      setRunning(false);
      controller = null;
    }
  }

  function stopTest() {
    if (controller) controller.abort();
  }

  els.start.addEventListener("click", startTest);
  els.startTop?.addEventListener("click", startTest);
  els.stop.addEventListener("click", stopTest);
  els.guideBtn?.addEventListener("click", openGuide);
  els.guideStart?.addEventListener("click", () => {
    closeGuide();
    startTest();
  });
  document.querySelectorAll("[data-close-guide]").forEach((button) => button.addEventListener("click", closeGuide));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGuide();
  });

  if (!localStorage.getItem(GUIDE_KEY)) {
    setTimeout(openGuide, 700);
  }
})();
