/* =========================================================
   Slotra landing page — interactions
   1. Mobile menu            2. Navbar state + active link
   3. Scroll reveal          4. Animated counters
   5. Business-type tabs     6. Pricing toggle
   7. FAQ accordion          8. Validation helpers
   9. Demo request form      10. Sign-up modal
   11. Sticky demo nudge     12. Toast
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  $("#year").textContent = new Date().getFullYear();

  /* ---------- 1. Mobile menu ---------- */
  const menuToggle = $("#menu-toggle");
  const navLinks = $("#nav-links");

  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) setMenu(false);
  });

  /* ---------- 2. Navbar state + active link ---------- */
  const navbar = $("#navbar");
  const links = $$(".nav-link");

  // Highlight the nav link for the section in the middle of the screen
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  links.forEach((l) => {
    const section = $(l.getAttribute("href"));
    if (section) spy.observe(section);
  });

  /* ---------- 3. Scroll reveal ---------- */
  const revealer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      obs.unobserve(entry.target); // animate once only
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  // Stagger siblings (e.g. cards in a grid) so they appear one after another
  $$(".reveal").forEach((el) => {
    const siblings = $$(":scope > .reveal", el.parentElement);
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
    revealer.observe(el);
  });

  /* ---------- 4. Animated counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || "";
    // Users who prefer reduced motion see the final number straight away
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400;
    const start = performance.now();

    function frame(now) {
      const t = duration ? Math.min((now - start) / duration, 1) : 1;
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = (target * eased).toFixed(decimals);
      el.textContent = Number(value).toLocaleString("en-IN", { minimumFractionDigits: decimals }) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const counter = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  $$("[data-count]").forEach((el) => counter.observe(el));

  /* ---------- 5. Business-type tabs ---------- */
  const tabs = $$(".tab");

  function selectTab(tab) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.classList.toggle("active", selected);
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      $(`#${t.getAttribute("aria-controls")}`).hidden = !selected;
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    // Arrow keys move between tabs (standard tablist keyboard pattern)
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  /* ---------- 6. Pricing toggle ---------- */
  const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  $$(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const period = btn.dataset.billing; // "monthly" | "yearly"
      $$(".toggle-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });

      $$(".amount").forEach((el) => {
        el.textContent = rupees(el.dataset[period]);
      });

      // Yearly = pay for 10 months, get 12
      $$(".yearly-note").forEach((note) => {
        const monthly = Number(note.closest(".price-card").querySelector(".amount").dataset.monthly);
        note.textContent = period === "yearly" ? `${rupees(monthly * 10)} billed yearly` : "Billed monthly";
      });
    });
  });

  /* ---------- 7. FAQ: keep one answer open at a time ---------- */
  const faqs = $$(".faq");
  faqs.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqs.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  /* ---------- 8. Validation helpers ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits starting 6–9

  function setError(input, message) {
    const field = input.closest(".field");
    field.classList.toggle("invalid", Boolean(message));
    field.querySelector(".error-msg").textContent = message || "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  const validators = {
    name: (el) => {
      const v = el.value.trim();
      if (!v) return setError(el, "Please enter your name.");
      if (v.length < 2) return setError(el, "Name looks too short.");
      return setError(el, "");
    },
    business: (el) => setError(el, el.value.trim().length >= 2 ? "" : "Please enter your business name."),
    email: (el) => {
      const v = el.value.trim();
      if (!v) return setError(el, "Please enter your email.");
      return setError(el, EMAIL_RE.test(v) ? "" : "Please enter a valid email address.");
    },
    phone: (el) => {
      const digits = el.value.replace(/\D/g, "");
      if (!digits) return setError(el, "Please enter your mobile number.");
      return setError(el, PHONE_RE.test(digits) ? "" : "Enter a valid 10-digit mobile number.");
    },
    type: (el) => setError(el, el.value ? "" : "Please choose your business type."),
    date: (el) => {
      if (!el.value) return setError(el, "Please pick a date.");
      return setError(el, el.value >= el.min ? "" : "Please choose today or a later date.");
    },
    terms: (el) => setError(el, el.checked ? "" : "Please accept the terms to continue."),
  };

  // Validate a whole form. Returns true if every field passes.
  function validateForm(form) {
    const fields = $$("[data-validate]", form);
    const results = fields.map((el) => validators[el.dataset.validate](el)); // run all, show all errors
    const firstBad = fields[results.indexOf(false)];
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  // Attach validators and re-check live once a field has been flagged
  function wireForm(form, map) {
    Object.entries(map).forEach(([id, rule]) => {
      const el = $(`#${id}`);
      el.dataset.validate = rule;
      const evt = el.type === "checkbox" || el.tagName === "SELECT" || el.type === "date" ? "change" : "input";
      el.addEventListener(evt, () => {
        if (el.closest(".field").classList.contains("invalid")) validators[rule](el);
      });
    });
  }

  /* ---------- 9. Demo request form ---------- */
  const demoForm = $("#demo-form");
  const demoSuccess = $(".success-msg", demoForm);
  const dateInput = $("#demo-date");

  // Earliest selectable date = today (local time)
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);

  wireForm(demoForm, {
    "demo-name": "name",
    "demo-phone": "phone",
    "demo-email": "email",
    "demo-type": "type",
    "demo-date": "date",
  });

  demoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    demoSuccess.hidden = true;
    if (!validateForm(demoForm)) return;

    // No backend required: simulate a successful request
    const name = $("#demo-name").value.trim().split(" ")[0];
    const date = new Date(dateInput.value + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    demoSuccess.textContent = `Thank you, ${name}! Your demo is requested for ${date}. We'll call you on WhatsApp to confirm a time.`;
    demoSuccess.hidden = false;
    demoForm.reset();
    showToast("Demo request received ✓");
  });

  /* ---------- 10. Sign-up modal ---------- */
  const modal = $("#signup-modal");
  const signupForm = $("#signup-form");
  const modalSuccess = $(".modal-success", modal);
  const planLabel = $("#modal-plan");
  let lastFocused = null;

  wireForm(signupForm, {
    "signup-business": "business",
    "signup-email": "email",
    "signup-terms": "terms",
  });

  function openModal(plan) {
    lastFocused = document.activeElement;
    planLabel.textContent = plan === "Free" || plan === "Starter" ? "Starter (free)" : plan;
    signupForm.hidden = false;
    modalSuccess.hidden = true;
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    $("#signup-business").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    signupForm.reset();
    $$(".field", signupForm).forEach((f) => f.classList.remove("invalid"));
    $$(".error-msg", signupForm).forEach((m) => (m.textContent = ""));
    if (lastFocused) lastFocused.focus();
  }

  $$("[data-open-modal]").forEach((btn) => btn.addEventListener("click", () => openModal(btn.dataset.plan)));
  $$("[data-close-modal]", modal).forEach((btn) => btn.addEventListener("click", closeModal));
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
    if (e.key === "Escape" && navLinks.classList.contains("open")) setMenu(false);
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(signupForm)) return;

    const business = $("#signup-business").value.trim();
    const slug = business.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    $(".modal-success-text", modal).textContent =
      `${business} is on the ${planLabel.textContent} plan. Your booking page slotra.in/${slug} is ready, and we've sent the details to ${$("#signup-email").value.trim()}.`;
    signupForm.hidden = true;
    modalSuccess.hidden = false;
    $("button", modalSuccess).focus();
  });

  /* ---------- 11. Sticky demo nudge ---------- */
  const nudge = $("#nudge");
  const hero = $("#home");
  const contact = $("#contact");
  let nudgeDismissed = false;

  function updateNudge() {
    const pastHero = hero.getBoundingClientRect().bottom < 0;
    const atContact = contact.getBoundingClientRect().top < window.innerHeight;
    const show = pastHero && !atContact && !nudgeDismissed;
    nudge.classList.toggle("show", show);
    nudge.setAttribute("aria-hidden", String(!show));
    $$("a, button", nudge).forEach((el) => (el.tabIndex = show ? 0 : -1));
  }

  $("#nudge-close").addEventListener("click", () => {
    nudgeDismissed = true;
    updateNudge();
  });

  // One scroll listener for the navbar border and the nudge
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 8);
    updateNudge();
  }, { passive: true });

  /* ---------- 12. Toast ---------- */
  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }
});
