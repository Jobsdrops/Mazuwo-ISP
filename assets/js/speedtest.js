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
    clock: $("speedClock"),
    live: $("liveSpeed"),
    liveLabel: $("liveGaugeLabel"),
    ping: $("pingResult"),
    pingDetail: $("pingDetail"),
    down: $("downloadResult"),
    downBytes: $("downloadBytes"),
    up: $("uploadResult"),
    upBytes: $("uploadBytes"),
    timeLeft: $("timeLeft"),
    needle: $("gaugeNeedle"),
    fill: $("gaugeFill"),
    note: $("speedNote")
  };

  if (!els.start || !els.live) return;

  const GUIDE_KEY = "mazuwo_speedtest_guide_hidden";
  const TEST_SECONDS = 30;
  const TEST_MS = TEST_SECONDS * 1000;
  const WARMUP_MS = 3000;
  const DOWNLOAD_MB_PER_REQUEST = 16;
  const DOWNLOAD_STREAMS = 3;
  const UPLOAD_STREAMS = 2;
  const UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024;
  const UI_INTERVAL_MS = 300;
  const PING_INTERVAL_MS = 900;
  const LIVE_WINDOW_MS = 1800;
  const SAMPLE_KEEP_MS = 7000;
  const LOCAL_PREVIEW = ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname) || window.location.protocol === "file:";
  const LOCAL_DOWNLOAD_URL = "/assets/data/speedtest-local.bin";
  const LOCAL_PING_URL = "/assets/data/ping.json";

  let controller = null;
  let running = false;
  let hasRun = false;
  let displaySpeed = 0;
  let animationFrame = null;
  let uiTimer = null;
  let activeXhrs = [];

  const uploadPayload = new Uint8Array(UPLOAD_CHUNK_BYTES);

  function createState() {
    return {
      startedAt: 0,
      endsAt: 0,
      finishedAt: 0,
      downloadBytes: 0,
      uploadBytes: 0,
      samples: [],
      warmupMarked: false,
      measureStartedAt: 0,
      measureStartDownloadBytes: 0,
      measureStartUploadBytes: 0,
      liveDownloadMbps: 0,
      liveUploadMbps: 0,
      liveDownloadBps: 0,
      liveUploadBps: 0,
      livePingMs: null,
      pingSamples: [],
      completed: false,
      stopped: false,
      localPreviewFallback: false,
      downloadErrors: 0,
      uploadErrors: 0,
      pingErrors: 0
    };
  }

  let state = createState();

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatSpeed(value) {
    if (!Number.isFinite(value) || value < 0) return "0.0 Mbps";
    return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} Mbps`;
  }

  function formatGaugeNumber(value) {
    if (!Number.isFinite(value) || value < 0) return "0.0";
    return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    const decimals = unit === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(decimals)} ${units[unit]}`;
  }

  function formatByteRate(bytesPerSecond) {
    if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "0 KB/s";
    return `${formatBytes(bytesPerSecond)}/s`;
  }

  function average(values) {
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function setGauge(speed) {
    const max = 100;
    const percent = clamp(speed / max, 0, 1);
    const angle = -90 + percent * 180;
    els.live.textContent = formatGaugeNumber(speed);
    if (els.needle) els.needle.style.transform = `rotate(${angle}deg)`;
    if (els.fill) els.fill.style.strokeDasharray = `${Math.round(percent * 100)} 100`;
  }

  function animateGauge(target) {
    cancelAnimationFrame(animationFrame);
    const safeTarget = Number.isFinite(target) ? Math.max(target, 0) : 0;
    const tick = () => {
      displaySpeed += (safeTarget - displaySpeed) * 0.22;
      if (Math.abs(displaySpeed - safeTarget) < 0.08) displaySpeed = safeTarget;
      setGauge(displaySpeed);
      if (displaySpeed !== safeTarget) animationFrame = requestAnimationFrame(tick);
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
    els.start.textContent = value ? "Testing..." : hasRun ? "Test Again" : "Start Test";
    if (els.startTop) {
      els.startTop.disabled = value;
      els.startTop.textContent = value ? "Testing..." : "Start 30-second test";
    }
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function addAbortListener(signal, callback) {
    if (!signal) return () => {};
    if (signal.aborted) {
      callback();
      return () => {};
    }
    signal.addEventListener("abort", callback, { once: true });
    return () => signal.removeEventListener("abort", callback);
  }

  function waitForTestEnd(signal) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve("complete"), TEST_MS);
      let removeAbort = () => {};
      removeAbort = addAbortListener(signal, () => {
        clearTimeout(timer);
        removeAbort();
        resolve("stopped");
      });
    });
  }

  function pushSample(now) {
    state.samples.push({
      t: now,
      d: state.downloadBytes,
      u: state.uploadBytes
    });

    const oldestAllowed = now - SAMPLE_KEEP_MS;
    while (state.samples.length > 2 && state.samples[0].t < oldestAllowed) {
      state.samples.shift();
    }

    if (!state.warmupMarked && now - state.startedAt >= WARMUP_MS) {
      state.warmupMarked = true;
      state.measureStartedAt = now;
      state.measureStartDownloadBytes = state.downloadBytes;
      state.measureStartUploadBytes = state.uploadBytes;
    }
  }

  function getLiveRates(now) {
    if (state.samples.length < 2) {
      return { downBps: 0, upBps: 0 };
    }

    const targetTime = now - LIVE_WINDOW_MS;
    let base = state.samples[0];
    for (const sample of state.samples) {
      if (sample.t <= targetTime) base = sample;
      else break;
    }

    const elapsedSeconds = Math.max((now - base.t) / 1000, 0.25);
    return {
      downBps: Math.max(state.downloadBytes - base.d, 0) / elapsedSeconds,
      upBps: Math.max(state.uploadBytes - base.u, 0) / elapsedSeconds
    };
  }

  function getFinalStats() {
    const finishedAt = state.finishedAt || performance.now();
    const startedAt = state.measureStartedAt || state.startedAt;
    const startDown = state.measureStartedAt ? state.measureStartDownloadBytes : 0;
    const startUp = state.measureStartedAt ? state.measureStartUploadBytes : 0;
    const measuredSeconds = Math.max((finishedAt - startedAt) / 1000, 1);
    const measuredDownBytes = Math.max(state.downloadBytes - startDown, 0);
    const measuredUpBytes = Math.max(state.uploadBytes - startUp, 0);
    const pingValues = state.pingSamples
      .filter((sample) => sample.t >= startedAt && sample.t <= finishedAt)
      .map((sample) => sample.ms);
    const fallbackPingValues = state.pingSamples.map((sample) => sample.ms);
    const pings = pingValues.length ? pingValues : fallbackPingValues;

    return {
      measuredSeconds,
      downloadMbps: (measuredDownBytes * 8) / measuredSeconds / 1048576,
      uploadMbps: (measuredUpBytes * 8) / measuredSeconds / 1048576,
      pingAverage: average(pings),
      pingMedian: median(pings),
      usedWarmup: Boolean(state.measureStartedAt)
    };
  }

  async function getDownloadResponse(url, signal) {
    const response = await fetch(url, { cache: "no-store", signal });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || contentType.includes("text/html")) {
      throw new Error("Download endpoint unavailable");
    }
    return response;
  }

  async function downloadWorker(signal, workerId) {
    while (!signal.aborted && performance.now() < state.endsAt) {
      try {
        const endpointUrl = `/speedtest/download?mb=${DOWNLOAD_MB_PER_REQUEST}&w=${workerId}&t=${Date.now()}-${Math.random()}`;
        let response;

        try {
          response = await getDownloadResponse(endpointUrl, signal);
        } catch (endpointError) {
          if (!LOCAL_PREVIEW) throw endpointError;
          state.localPreviewFallback = true;
          response = await getDownloadResponse(`${LOCAL_DOWNLOAD_URL}?w=${workerId}&t=${Date.now()}-${Math.random()}`, signal);
        }

        if (!response.body) {
          const blob = await response.blob();
          state.downloadBytes += blob.size;
          continue;
        }

        const reader = response.body.getReader();
        while (!signal.aborted && performance.now() < state.endsAt) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) state.downloadBytes += value.byteLength;
        }

        if (performance.now() >= state.endsAt) {
          try { await reader.cancel(); } catch (_) {}
        }
      } catch (error) {
        if (signal.aborted) break;
        state.downloadErrors += 1;
        await sleep(220);
      }
    }
  }

  function uploadChunkWithProgress(signal, workerId) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let loaded = 0;
      const removeAbort = addAbortListener(signal, () => xhr.abort());

      activeXhrs.push(xhr);

      xhr.upload.onprogress = (event) => {
        const nextLoaded = event.loaded || 0;
        const delta = Math.max(nextLoaded - loaded, 0);
        loaded = nextLoaded;
        state.uploadBytes += delta;
      };

      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        if (ok && loaded < UPLOAD_CHUNK_BYTES) {
          state.uploadBytes += UPLOAD_CHUNK_BYTES - loaded;
        }
        cleanup();
        if (ok) resolve();
        else reject(new Error("Upload endpoint failed"));
      };

      xhr.onerror = () => {
        cleanup();
        reject(new Error("Upload request failed"));
      };

      xhr.onabort = () => {
        cleanup();
        resolve();
      };

      function cleanup() {
        removeAbort();
        activeXhrs = activeXhrs.filter((item) => item !== xhr);
      }

      xhr.open("POST", `/speedtest/upload?w=${workerId}&t=${Date.now()}-${Math.random()}`, true);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.send(uploadPayload);
    });
  }

  async function uploadWorker(signal, workerId) {
    while (!signal.aborted && performance.now() < state.endsAt) {
      try {
        await uploadChunkWithProgress(signal, workerId);
      } catch (error) {
        if (signal.aborted) break;
        state.uploadErrors += 1;
        await sleep(260);
      }
    }
  }

  async function measurePing(url, signal) {
    const started = performance.now();
    const response = await fetch(url, { cache: "no-store", signal });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || contentType.includes("text/html")) {
      throw new Error("Ping endpoint unavailable");
    }
    return performance.now() - started;
  }

  async function pingLoop(signal) {
    while (!signal.aborted && performance.now() < state.endsAt) {
      const started = performance.now();
      try {
        let ms;
        try {
          ms = await measurePing(`/speedtest/ping?t=${Date.now()}-${Math.random()}`, signal);
        } catch (endpointError) {
          if (!LOCAL_PREVIEW) throw endpointError;
          state.localPreviewFallback = true;
          ms = await measurePing(`${LOCAL_PING_URL}?t=${Date.now()}-${Math.random()}`, signal);
        }
        const now = performance.now();
        state.livePingMs = ms;
        state.pingSamples.push({ t: now, ms });
      } catch (error) {
        if (signal.aborted) break;
        state.pingErrors += 1;
      }
      const wait = Math.max(PING_INTERVAL_MS - (performance.now() - started), 120);
      await sleep(wait);
    }
  }

  function updateLiveUi(final = false) {
    const now = performance.now();
    const calculationNow = final && state.finishedAt ? state.finishedAt : now;
    pushSample(calculationNow);

    const remainingMs = final ? 0 : Math.max(state.endsAt - now, 0);
    const remainingSec = Math.ceil(remainingMs / 1000);

    if (final) {
      const stats = getFinalStats();
      els.down.textContent = formatSpeed(stats.downloadMbps);
      els.downBytes.textContent = stats.usedWarmup ? "Average after warm-up" : "Measured average";
      els.up.textContent = formatSpeed(stats.uploadMbps);
      els.upBytes.textContent = stats.usedWarmup ? "Average after warm-up" : "Measured average";
      els.ping.textContent = stats.pingAverage === null ? "-- ms" : `${Math.round(stats.pingAverage)} ms`;
      els.pingDetail.textContent = stats.pingMedian === null ? "Loaded average" : `Loaded avg | median ${Math.round(stats.pingMedian)} ms`;
      els.timeLeft.textContent = state.stopped ? "Stopped" : "Done";
      if (els.liveLabel) els.liveLabel.textContent = "Average Mbps";
      animateGauge(Math.max(stats.downloadMbps, stats.uploadMbps));
      return;
    }

    const liveRates = getLiveRates(calculationNow);
    state.liveDownloadBps = liveRates.downBps;
    state.liveUploadBps = liveRates.upBps;
    state.liveDownloadMbps = (liveRates.downBps * 8) / 1048576;
    state.liveUploadMbps = (liveRates.upBps * 8) / 1048576;

    els.down.textContent = formatSpeed(state.liveDownloadMbps);
    els.downBytes.textContent = `Live rate: ${formatByteRate(state.liveDownloadBps)}`;
    els.up.textContent = formatSpeed(state.liveUploadMbps);
    els.upBytes.textContent = `Live rate: ${formatByteRate(state.liveUploadBps)}`;
    els.ping.textContent = state.livePingMs === null ? "-- ms" : `${Math.round(state.livePingMs)} ms`;
    els.pingDetail.textContent = state.warmupMarked ? "Loaded now" : "Warming up";
    els.timeLeft.textContent = `${remainingSec}s left`;
    if (els.liveLabel) els.liveLabel.textContent = "Live Mbps";
    animateGauge(Math.max(state.liveDownloadMbps, state.liveUploadMbps));
  }

  async function startTest() {
    if (running) return;

    controller = new AbortController();
    state = createState();
    state.startedAt = performance.now();
    state.endsAt = state.startedAt + TEST_MS;
    state.samples.push({ t: state.startedAt, d: 0, u: 0 });
    displaySpeed = 0;

    setRunning(true);
    setPhase("Live test running", "Live");
    if (els.clock) els.clock.hidden = false;
    els.down.textContent = "0.0 Mbps";
    els.downBytes.textContent = "Live rate: 0 KB/s";
    els.up.textContent = "0.0 Mbps";
    els.upBytes.textContent = "Live rate: 0 KB/s";
    els.ping.textContent = "-- ms";
    els.pingDetail.textContent = "Warming up";
    els.timeLeft.textContent = `${TEST_SECONDS}s left`;
    els.note.textContent = "Testing now: the page is moving real data and measuring the bytes this browser sends and receives. Keep this tab open.";
    animateGauge(0);

    const workers = [
      ...Array.from({ length: DOWNLOAD_STREAMS }, (_, index) => downloadWorker(controller.signal, index + 1)),
      ...Array.from({ length: UPLOAD_STREAMS }, (_, index) => uploadWorker(controller.signal, index + 1)),
      pingLoop(controller.signal)
    ];

    updateLiveUi(false);
    uiTimer = setInterval(() => updateLiveUi(false), UI_INTERVAL_MS);

    const result = await waitForTestEnd(controller.signal);
    state.completed = result === "complete";
    state.stopped = result !== "complete";
    await finishTest(workers);
  }

  async function finishTest(workers) {
    if (!controller) return;
    clearInterval(uiTimer);
    uiTimer = null;
    state.finishedAt = performance.now();

    if (!state.completed) state.stopped = true;
    controller.abort();
    activeXhrs.forEach((xhr) => {
      try { xhr.abort(); } catch (_) {}
    });
    activeXhrs = [];

    await Promise.allSettled(workers);
    updateLiveUi(true);

    if (!state.downloadBytes && !state.uploadBytes && !state.pingSamples.length) {
      setPhase("Could not complete test", "Error");
      els.note.textContent = "The speed test endpoints did not respond. On Cloudflare Pages, make sure the /functions folder is uploaded and deployed.";
    } else if (state.stopped) {
      setPhase("Test stopped", "Stopped");
      els.note.textContent = "The test stopped early. The numbers shown are based only on the real traffic captured before stopping.";
    } else {
      setPhase("Final results", "Complete");
      els.note.textContent = state.localPreviewFallback
        ? "Local preview used static fallback files because VS Code Live Server does not run Cloudflare Functions. Deploy to Cloudflare Pages for the real upload/download endpoints."
        : "These final averages come from real bytes moved by this browser. The first 3 seconds are treated as warm-up and excluded from the final averages.";
    }

    hasRun = true;
    setRunning(false);
    controller = null;
  }

  function stopTest() {
    if (!running || !controller) return;
    state.stopped = true;
    state.completed = false;
    state.finishedAt = performance.now();
    controller.abort();
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
