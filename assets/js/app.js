const Mazuwo = (() => {
  const links = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/coverage", label: "Coverage" },
    { href: "/speedtest", label: "Speed Test" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" }
  ];

  const departments = {
    "Customer Relations": "info@mazuwo.co.za",
    "New application": "info@mazuwo.co.za",
    Sales: "info@mazuwo.co.za",
    "Customer service": "customerservice@mazuwo.co.za",
    "Technical support": "support@mazuwo.co.za",
    Accounts: "accounts@mazuwo.co.za",
    "Other queries": "info@mazuwo.co.za"
  };

  const pageTitles = {
    "/": "Mazuwo Wireless - Home",
    "/services": "Mazuwo Wireless - Services",
    "/coverage": "Mazuwo Wireless - Coverage",
    "/speedtest": "Mazuwo Wireless - Speed Test",
    "/faq": "Mazuwo Wireless - FAQ",
    "/contact": "Mazuwo Wireless - Contact",
    "/apply": "Mazuwo Wireless - Application",
    "/privacy": "Mazuwo Wireless - Privacy Policy",
    "/terms": "Mazuwo Wireless - Terms and Conditions",
    "/code-of-conduct": "Mazuwo Wireless - Code of Conduct"
  };

  function routePath() {
    return location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
  }

  function isActive(href) {
    return routePath() === href;
  }

  function navHtml() {
    return links
      .map((link) => `<a data-nav href="${link.href}" class="${isActive(link.href) ? "active" : ""}">${link.label}</a>`)
      .join("");
  }

  function renderHeader() {
    let header = document.querySelector("header");
    if (!header) {
      header = document.createElement("header");
      document.body.prepend(header);
    }

    header.className = "site-header";
    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="container nav">
        <a class="brand" href="/" aria-label="Mazuwo Wireless home">
          <img src="/assets/images/LOGO-.png" alt="Mazuwo Wireless" width="178" height="54">
        </a>
        <nav class="navlinks" aria-label="Primary navigation">
          ${navHtml()}
        </nav>
        <div class="nav-cta">
          <a class="btn" href="/apply">Get Connected</a>
          <button class="burger" id="burger" type="button" aria-label="Open menu" aria-controls="mobilemenu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="container mobilemenu" id="mobilemenu">
        ${navHtml()}
        <a class="btn" href="/apply">Get Connected</a>
      </div>
    `;
  }

  function renderFooter() {
    let footer = document.querySelector("footer");
    if (!footer) {
      footer = document.createElement("footer");
      document.body.appendChild(footer);
    }

    footer.className = "footer";
    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <a class="footer-brand" href="/" aria-label="Mazuwo Wireless home">
            <img src="/assets/images/LOGO-.png" alt="Mazuwo Wireless">
          </a>
          <p class="small">Uncapped Wi-Fi, CCTV, VoIP and event connectivity for homes and businesses around Thohoyandou and the Vhembe District.</p>
          <div class="pill">Mission: Connect and grow local communities through technology.</div>
        </div>
        <div>
          <h4>Contact</h4>
          <p class="small">WhatsApp: +27 (66) 066-8508<br>Call: 087 897 3731<br>Email: info@mazuwo.co.za<br>24 Mvudi Park, Thohoyandou, 0950</p>
          <div class="actions footer-contact-actions" style="margin-top:.8rem">
            <a class="btn small secondary footer-contact-btn" href="https://wa.me/27660668508" target="_blank" rel="noreferrer" aria-label="WhatsApp Mazuwo">WhatsApp</a>
            <a class="btn small secondary footer-contact-btn" href="tel:0878973731" aria-label="Call Mazuwo">Call</a>
          </div>
        </div>
        <div>
          <h4>Company</h4>
          <p class="small">
            <a href="/services">Services</a><br>
            <a href="/coverage">Coverage</a><br>
            <a href="/speedtest">Test Your Speed</a><br>
            <a href="/terms">Terms and Conditions</a><br>
            <a href="/privacy">Privacy Policy</a><br>
            <a href="/code-of-conduct">Code of Conduct</a>
          </p>
          <div class="actions" style="margin-top:.8rem">
            <a class="pill" href="https://www.facebook.com/MazuwoNetworks/" target="_blank" rel="noreferrer">Facebook</a>
            <a class="pill" href="https://www.instagram.com/mazuwonetworks/" target="_blank" rel="noreferrer">Instagram</a>
            <a class="pill" href="https://x.com/mazuwonetworks/" target="_blank" rel="noreferrer">X</a>
          </div>
        </div>
      </div>
      <div class="container copy">
        <span>(c) 2026 MAZUWO. All rights reserved.</span>
      </div>
    `;
  }

  function toast(message) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.id = "toast";
      document.body.appendChild(el);
    }

    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  function hookMobileMenu() {
    const burger = document.getElementById("burger");
    const menu = document.getElementById("mobilemenu");
    if (!burger || !menu) return;

    burger.addEventListener("click", () => {
      const open = !menu.classList.contains("show");
      menu.classList.toggle("show", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("show");
        burger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }

  function normalizePage() {
    const path = routePath();
    if (pageTitles[path]) document.title = pageTitles[path];
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main";
    if (["/privacy", "/terms", "/code-of-conduct"].includes(path) && main) {
      main.classList.add("legal-content");
    }
  }

  function prefillApplyFromQuery() {
    if (routePath() !== "/apply") return;
    const plan = new URLSearchParams(location.search).get("plan");
    const select = document.getElementById("tariff");
    if (plan && select) select.value = plan;
  }

  function openMail(to, subject, body) {
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    location.href = url;
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/27660668508?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function departmentEmail(department) {
    return departments[department] || "info@mazuwo.co.za";
  }

  function hookApplyForm() {
    const form = document.getElementById("applyForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const subject = `New Mazuwo application - ${values.tariff || "Selected service"}`;
      const body = [
        "New website application",
        "",
        `First name: ${values.firstName || ""}`,
        `Last name: ${values.lastName || ""}`,
        `Email: ${values.email || ""}`,
        `Phone: ${values.phone || ""}`,
        `Street: ${values.street || ""}`,
        `City / area: ${values.city || ""}`,
        `ZIP code: ${values.zip || ""}`,
        `Tariff: ${values.tariff || ""}`,
        `Notes: ${values.notes || ""}`
      ].join("\n");
      openMail(form.dataset.email || "info@mazuwo.co.za", subject, body);
      toast("Opening your email app with the application ready.");
    });
  }

  function hookContactForm() {
    const form = document.getElementById("contactForm");
    const dept = document.getElementById("departmentSelect");
    const sendTo = document.getElementById("sendToEmail");
    if (!form) return;

    const refreshTarget = () => {
      if (dept && sendTo) sendTo.textContent = departmentEmail(dept.value);
    };

    if (dept) dept.addEventListener("change", refreshTarget);
    refreshTarget();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const department = values.department || "Customer Relations";
      const to = departmentEmail(department);
      const subject = `Mazuwo website message - ${department}`;
      const body = [
        `Department: ${department}`,
        `Name: ${values.name || ""}`,
        `Email: ${values.email || ""}`,
        `Phone: ${values.phone || ""}`,
        `Address: ${values.address || "N/A"}`,
        "",
        "Message:",
        values.message || ""
      ].join("\n");
      openMail(to, subject, body);
      form.reset();
      refreshTarget();
      toast("Opening your email app with the message ready.");
    });
  }

  function hookCoverageForm() {
    const form = document.getElementById("coverageForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const message = [
        `Hi Mazuwo, I am ${values.name || ""}.`,
        `Phone: ${values.phone || ""}`,
        `Area: ${values.area || ""}`,
        `Notes: ${values.notes || "None"}`,
        "Please confirm coverage for my area."
      ].join("\n");
      openWhatsApp(message);
      form.reset();
      toast("Opening WhatsApp with your coverage request.");
    });
  }

  function hookAccordions() {
    document.querySelectorAll(".acc-btn").forEach((button, index) => {
      const panel = button.parentElement?.querySelector(".acc-panel");
      if (!panel) return;

      const id = panel.id || `faq-panel-${index + 1}`;
      panel.id = id;
      button.setAttribute("aria-controls", id);
      button.setAttribute("aria-expanded", panel.classList.contains("open") ? "true" : "false");

      button.addEventListener("click", () => {
        const open = !panel.classList.contains("open");
        panel.classList.toggle("open", open);
        button.setAttribute("aria-expanded", String(open));
        const marker = button.querySelector("span");
        if (marker) marker.textContent = open ? "-" : "+";
      });
    });
  }

  function hookButtons() {
    document.querySelectorAll("[data-whatsapp-message]").forEach((button) => {
      button.addEventListener("click", () => openWhatsApp(button.getAttribute("data-whatsapp-message") || "Hi Mazuwo, please help me get connected."));
    });
  }

  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function init() {
    renderHeader();
    renderFooter();
    normalizePage();
    hookMobileMenu();
    prefillApplyFromQuery();
    hookApplyForm();
    hookContactForm();
    hookCoverageForm();
    hookAccordions();
    hookButtons();
    initIcons();
  }

  return { init, toast, openWhatsApp };
})();

document.addEventListener("DOMContentLoaded", Mazuwo.init);
