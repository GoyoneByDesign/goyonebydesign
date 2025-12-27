(function () {
  const header = document.querySelector(".header");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  function setHeaderElevation() {
    const elevated = window.scrollY > 6;
    header?.setAttribute("data-elevate", elevated ? "true" : "false");
  }
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

    // Close menu after clicking a link
    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menu.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    // Close if clicking outside
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Smooth scrolling for in-page anchors (respects reduced motion)
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  // Contact form -> mailto (works on GitHub Pages)
  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const emailLink = document.getElementById("emailLink");

  // CHANGE THIS to your real email if needed
  const toEmail = "hello@goyonebydesign.com";
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
        `Name: ${name}\nEmail: ${email}\nService: ${service}\n\nDetails:\n${message}\n\n— Sent from goyonebydesign.com`
      );

      window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;

      if (formNote) {
        formNote.textContent = "Opening your email app… If nothing happens, copy/paste the info and email it manually.";
      }
    });
  }
})();
