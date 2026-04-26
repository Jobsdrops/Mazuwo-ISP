const MazuwoLocalAI = (() => {
  const fallbackModel = {
    assistantName: "Lucy",
    coverage: "Mazuwo Wireless is available around Thohoyandou and the Vhembe District.",
    contacts: {
      whatsapp: "+27 66 066 8508",
      phone: "087 897 3731",
      email: "info@mazuwo.co.za",
      support: "support@mazuwo.co.za",
      accounts: "accounts@mazuwo.co.za"
    },
    packages: [
      { slug: "BASIC", name: "Basic", price: "R350 p/m", down: "4 Mbps", up: "2 Mbps", bestFor: "1 to 2 people and light browsing", keywords: ["basic", "cheap", "school", "whatsapp", "light"] },
      { slug: "PRO", name: "Pro", price: "R550 p/m", down: "6 Mbps", up: "4 Mbps", bestFor: "families, streaming and remote work", keywords: ["pro", "family", "stream", "work", "gaming"] },
      { slug: "ULTIMATE", name: "Ultimate", price: "R850 p/m", down: "10 Mbps", up: "6 Mbps", bestFor: "heavy streaming, gaming and many devices", keywords: ["ultimate", "heavy", "many", "gaming", "download"] },
      { slug: "BUSINESS", name: "Business", price: "from R550 p/m", down: "custom", up: "custom", bestFor: "offices, shops, VoIP and custom capacity", keywords: ["business", "office", "shop", "voip", "quote"] }
    ],
    knowledge: [
      { id: "coverage", patterns: ["coverage", "area", "available", "village", "suburb"], answer: "Mazuwo serves Thohoyandou and surrounding Vhembe District areas. Send your area on the Coverage page so the team can confirm your signal." },
      { id: "payment", patterns: ["pay", "payment", "bank", "eft", "bill"], answer: "Pay by EFT to Mazuwo Networks, FNB account 62847813244, branch code 250117, using your full names as reference. Send proof to info@mazuwo.co.za." },
      { id: "support", patterns: ["slow", "offline", "support", "router", "problem"], answer: "Restart the router, place it higher and test close to it. If it is still slow, WhatsApp +27 66 066 8508 or email support@mazuwo.co.za." }
    ],
    quickPrompts: ["Which package is best for 5 people?", "Do you cover my area?", "How do I pay?", "My Wi-Fi is slow"]
  };

  let model = fallbackModel;

  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "for", "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or", "our", "the", "to", "we", "with", "you", "your"
  ]);

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9+\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token && !stopWords.has(token));
  }

  function uniqueTokens(text) {
    return new Set(tokenize(text));
  }

  function countMatches(text, patterns = []) {
    const normalized = String(text || "").toLowerCase();
    const tokens = uniqueTokens(text);
    return patterns.reduce((score, pattern) => {
      const p = String(pattern || "").toLowerCase();
      if (!p) return score;
      if (normalized.includes(p)) return score + 4;
      return score + tokenize(p).filter((token) => tokens.has(token)).length;
    }, 0);
  }

  function extractDeviceCount(text) {
    const match = String(text || "").match(/(\d+)\s*(people|person|users|devices|phones|family|kids)?/i);
    return match ? Number(match[1]) : 0;
  }

  function recommendPlan(text) {
    const t = String(text || "").toLowerCase();
    const devices = extractDeviceCount(t);
    const scores = new Map(model.packages.map((pkg) => [pkg.slug, countMatches(t, pkg.keywords)]));

    if (devices >= 5) scores.set("ULTIMATE", (scores.get("ULTIMATE") || 0) + 6);
    if (devices >= 3 && devices < 5) scores.set("PRO", (scores.get("PRO") || 0) + 5);
    if (devices > 0 && devices <= 2) scores.set("BASIC", (scores.get("BASIC") || 0) + 4);
    if (/business|office|shop|company|voip|landline|pos|quote/.test(t)) scores.set("BUSINESS", (scores.get("BUSINESS") || 0) + 8);
    if (/gaming|stream|netflix|youtube|download|playstation|xbox/.test(t)) {
      scores.set("PRO", (scores.get("PRO") || 0) + 3);
      scores.set("ULTIMATE", (scores.get("ULTIMATE") || 0) + 4);
    }
    if (/cheap|affordable|budget|basic|school|whatsapp|facebook/.test(t)) scores.set("BASIC", (scores.get("BASIC") || 0) + 4);

    const [slug] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0] || ["PRO"];
    return model.packages.find((pkg) => pkg.slug === slug) || model.packages[1] || model.packages[0];
  }

  function bestKnowledge(text) {
    return [...(model.knowledge || [])]
      .map((entry) => ({ entry, score: countMatches(text, entry.patterns) }))
      .sort((a, b) => b.score - a.score)[0];
  }

  function buildPlanReply(text) {
    const plan = recommendPlan(text);
    const why = plan.slug === "BUSINESS"
      ? "because business setups usually need a quick quote for capacity, VoIP and installation details"
      : `because it fits ${plan.bestFor}`;

    return `I would start with ${plan.name} (${plan.price}). It gives ${plan.down} download and ${plan.up} upload, ${why}.\n\nNext step: open Services to compare packages, or Apply and choose ${plan.slug}.`;
  }

  function replyFor(text) {
    const t = String(text || "").toLowerCase();
    const planWords = /package|plan|speed|mbps|netflix|stream|gaming|devices|people|family|work|business|office|cheap|affordable|which|recommend|best/;

    if (/hello|hi|hey|morning|afternoon|evening/.test(t) && tokenize(t).length <= 2) {
      return "Hi, I am Lucy. I can recommend a Mazuwo package, explain payments, help with coverage, or point you to support. Tell me your area, number of people and what you use the internet for.";
    }

    if (planWords.test(t)) return buildPlanReply(text);

    const match = bestKnowledge(text);
    if (match && match.score > 0) {
      if (match.entry.id === "coverage") {
        return `${match.entry.answer}\n\nTip: include your village or suburb, nearest landmark and phone number so the team can check faster.`;
      }
      return match.entry.answer;
    }

    return "I can help with packages, coverage, applications, payments, CCTV, VoIP and support. For a package recommendation, tell me how many people or devices will be online and what you use most, like Netflix, school work, gaming or office work.";
  }

  async function loadModel() {
    try {
      const res = await fetch("/assets/data/mazuwo-ai-model.json", { cache: "no-store" });
      if (!res.ok) throw new Error("model not available");
      model = await res.json();
    } catch (error) {
      model = fallbackModel;
    }
  }

  function addMsg(text, me = false) {
    const body = document.getElementById("aiBody");
    if (!body) return;
    const p = document.createElement("p");
    p.className = `ai-msg${me ? " me" : ""}`;
    p.textContent = text;
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  function setBusy(isBusy) {
    const send = document.getElementById("aiSend");
    const input = document.getElementById("aiInput");
    if (send) send.disabled = isBusy;
    if (input) input.disabled = isBusy;
  }

  function ask(text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    addMsg(clean, true);
    setBusy(true);
    window.setTimeout(() => {
      addMsg(replyFor(clean));
      setBusy(false);
      document.getElementById("aiInput")?.focus();
    }, 180);
  }

  function suggestionsHtml() {
    return (model.quickPrompts || fallbackModel.quickPrompts)
      .slice(0, 5)
      .map((prompt) => `<button class="ai-chip" type="button" data-ai-prompt="${prompt.replace(/"/g, "&quot;")}">${prompt}</button>`)
      .join("");
  }

  function initWidget() {
    const fab = document.createElement("button");
    fab.className = "btn ai-fab";
    fab.id = "aiFab";
    fab.type = "button";
    fab.innerHTML = '<span class="ai-dot"></span><span>Ask Lucy</span>';
    document.body.appendChild(fab);

    const box = document.createElement("section");
    box.className = "ai";
    box.id = "aiBox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Mazuwo local AI assistant");
    box.innerHTML = `
      <div class="ai-top">
        <div class="ai-title">
          <div class="ai-avatar">L</div>
          <div><b>Lucy</b><span>Local Mazuwo assistant</span></div>
        </div>
        <button class="btn ai-close" id="aiClose" type="button" aria-label="Close assistant">&times;</button>
      </div>
      <div class="ai-body" id="aiBody">
        <p class="ai-msg">Hi, I am Lucy. I run from this website's engine.</p>
        <p class="ai-msg">Tell me your area, how many people will connect, and what you use most. I can recommend a plan or route you to the right Mazuwo team.</p>
        <div class="ai-suggestions">${suggestionsHtml()}</div>
      </div>
      <form class="ai-form" id="aiForm">
        <input id="aiInput" autocomplete="off" placeholder="Example: 5 people, Netflix and gaming">
        <button class="btn" id="aiSend" type="submit">Send</button>
      </form>
    `;
    document.body.appendChild(box);

    const open = () => {
      box.classList.add("open");
      document.getElementById("aiInput")?.focus();
    };
    const close = () => box.classList.remove("open");

    fab.addEventListener("click", open);
    box.querySelector("#aiClose")?.addEventListener("click", close);
    box.querySelector("#aiForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("aiInput");
      const text = input?.value || "";
      if (input) input.value = "";
      ask(text);
    });
    box.querySelectorAll("[data-ai-prompt]").forEach((button) => {
      button.addEventListener("click", () => ask(button.getAttribute("data-ai-prompt")));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  async function init() {
    await loadModel();
    initWidget();
  }

  return { init, replyFor };
})();

document.addEventListener("DOMContentLoaded", MazuwoLocalAI.init);
