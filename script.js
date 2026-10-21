(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = $("#theme-toggle");
  const setThemeIcon = () => {
    const dark = root.dataset.theme !== "light";
    themeBtn.innerHTML = dark
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-sun"></i>';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#14121d" : "#f6f7fb";
  };
  setThemeIcon();
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch (e) {}
    setThemeIcon();
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menu-btn");
  const navLinks = $("#nav-links");
  const overlay = $("#nav-overlay");

  const setMenu = (open) => {
    navLinks.classList.toggle("open", open);
    overlay.classList.toggle("show", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.innerHTML = open
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
    document.body.style.overflow = open ? "hidden" : "";
  };
  menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  overlay.addEventListener("click", () => setMenu(false));
  $$(".nav-link").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Scroll: header, progress bar, back-to-top ---------- */
  const header = $("#site-header");
  const progress = $("#scroll-progress");
  const toTop = $("#to-top");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("scrolled", y > 20);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    toTop.classList.toggle("show", y > 600);
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();
  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  );

  /* ---------- Active nav link on scroll ---------- */
  const sections = $$("main section[id]");
  const links = $$(".nav-link");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((l) =>
            l.classList.toggle("active", l.getAttribute("href") === `#${en.target.id}`)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll (with stagger) ---------- */
  $$(".skills-grid, .projects-grid, .contact-info, .stats").forEach((group) => {
    $$(".reveal, .project-card", group).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--d", `${Math.min(i, 8) * 0.07}s`);
    });
  });

  const revealObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          obs.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Count-up stats ---------- */
  const countObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = Number(el.dataset.count);
        if (reduceMotion) {
          el.textContent = target;
        } else {
          const start = performance.now();
          const dur = 1200;
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Typing effect ---------- */
  const typed = $("#typed");
  const words = ["Frontend Developer", "React Developer", "Python Developer", "Python Full-Stack Learner"];
  if (typed && !reduceMotion) {
    let w = 0,
      c = 0,
      deleting = false;
    const step = () => {
      const word = words[w];
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 90;
      if (!deleting && c === word.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && c === 0) {
        deleting = false;
        w = (w + 1) % words.length;
        delay = 350;
      } else {
        c += deleting ? -1 : 1;
      }
      setTimeout(step, delay);
    };
    typed.textContent = "";
    step();
  }

  /* ---------- Project filter ---------- */
  const chips = $$(".chip");
  const cards = $$(".project-card");
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("active", c === chip));
      const f = chip.dataset.filter;
      cards.forEach((card) => {
        const match = f === "all" || card.dataset.category.split(" ").includes(f);
        card.classList.toggle("hide", !match);
      });
    })
  );

  /* ---------- Contact form (opens email client, no backend needed) ---------- */
  const form = $("#contact-form");
  const status = $("#form-status");
  const EMAIL = "manikrishna9345@gmail.com";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    let ok = true;
    [form.name, form.email, form.message].forEach((f) => f.classList.remove("invalid"));
    if (!name) (form.name.classList.add("invalid"), (ok = false));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) (form.email.classList.add("invalid"), (ok = false));
    if (!message) (form.message.classList.add("invalid"), (ok = false));

    status.className = "form-status";
    if (!ok) {
      status.textContent = "Please fill in all fields with a valid email.";
      status.classList.add("error");
      return;
    }

    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    status.textContent = "Opening your email app…";
    status.classList.add("ok");
    form.reset();
  });

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();