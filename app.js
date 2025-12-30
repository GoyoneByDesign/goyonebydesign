(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Header elevation
  const header = document.querySelector(".header");
  const setHeaderElevation = () => {
    const elevated = window.scrollY > 8;
    header?.setAttribute("data-elevate", elevated ? "true" : "false");
  };
  setHeaderElevation();
  window.addEventListener("scroll", setHeaderElevation, { passive: true });

  // Mobile nav toggle
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.getAttribute("data-open") === "true";
      menu.setAttribute("data-open", isOpen ? "false" : "true");
      toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });

    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menu.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Smooth scrolling for anchors
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  // Scroll reveal
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  // Cursor glow (follows mouse) - desktop only
  const glow = document.querySelector(".cursorGlow");
  if (glow && !prefersReduced) {
    let raf = 0;
    window.addEventListener(
      "pointermove",
      (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          glow.style.transform = `translate(${e.clientX - 120}px, ${e.clientY - 120}px)`;
        });
      },
      { passive: true }
    );
  }

  // Card glow tracking (services cards)
  const glowCards = Array.from(document.querySelectorAll("[data-glow]"));
  if (!prefersReduced) {
    glowCards.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty("--gx", `${x}%`);
        card.style.setProperty("--gy", `${y}%`);
      });
    });
  }

  // Magnetic buttons (subtle)
  const magnetic = Array.from(document.querySelectorAll(".magnetic"));
  if (!prefersReduced) {
    magnetic.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.06}px, ${y * 0.08}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "translate(0,0)";
      });
    });
  }

  // Tilt (hero device + work cards)
  const tiltEls = Array.from(document.querySelectorAll("[data-tilt]"));
  if (!prefersReduced) {
    tiltEls.forEach((el) => {
      el.style.willChange = "transform";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rotY = (px - 0.5) * 10; // left/right
        const rotX = (0.5 - py) * 10; // up/down
        el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  // Contact form -> mailto (works on GitHub Pages)
  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const emailLink = document.getElementById("emailLink");
  const toEmail = "admin@goyonebydesign.com"; // change if needed
  if (emailLink) emailLink.href = `mailto:${toEmail}`;

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const service = (data.get("service") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();

      const subject = encodeURIComponent(`GBD Inquiry: ${service} — ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nService: ${service}\n\nDetails:\n${message}\n\n— Sent from goyonebydesign.github.io`
      );
    });
  }

  // Particle canvas (lightweight)
  const canvas = document.getElementById("particles");
  if (!canvas || prefersReduced) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const particles = [];
  const count = 60;

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const rand = (a, b) => a + Math.random() * (b - a);

  for (let i = 0; i < count; i++) {
    particles.push({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.8, 2.2),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.18, 0.18),
      a: rand(0.12, 0.28)
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.fill();
    }

    // Lines (subtle)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.10;
          ctx.strokeStyle = `rgba(38,167,222,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
