/* Progressive enhancement only. Content, project images and contact POST work without JavaScript. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("navMenu");
  const closeMenu = () => {
    menu.dataset.open = "false";
    toggle.setAttribute("aria-expanded", "false");
  };
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      menu.dataset.open = String(open);
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.dataset.open === "true") {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header")) closeMenu();
    });
    window
      .matchMedia("(min-width: 701px)")
      .addEventListener("change", closeMenu);
  }
  const dialog = document.getElementById("preview");
  const previews = [...document.querySelectorAll("[data-preview]")];
  const image = document.getElementById("previewImage");
  const title = document.getElementById("previewTitle");
  let index = 0,
    returnFocus;
  const showImage = (i) => {
    index = (i + previews.length) % previews.length;
    image.src = previews[index].href;
    image.alt = previews[index].querySelector("img").alt;
    title.textContent = `${previews[index].dataset.title} / ${index + 1} of ${previews.length}`;
  };
  if (dialog && typeof dialog.showModal === "function") {
    previews.forEach((link, i) =>
      link.addEventListener("click", (e) => {
        e.preventDefault();
        returnFocus = link;
        showImage(i);
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }),
    );
    document
      .getElementById("previous")
      .addEventListener("click", () => showImage(index - 1));
    document
      .getElementById("next")
      .addEventListener("click", () => showImage(index + 1));
    document
      .getElementById("closePreview")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showImage(index - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showImage(index + 1);
      }
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
      returnFocus?.focus();
    });
  }
  const form = document.getElementById("contactForm");
  if (!form) return;
  const note = document.getElementById("formNote"),
    button = document.getElementById("sendBtn");
  let sending = false,
    lastSent = 0;
  const fields = ["name", "email", "service", "message"];
  const setNote = (text, state = "") => {
    note.textContent = text;
    note.className = `formNote ${state}`;
  };
  const validate = () => {
    let firstInvalid;
    fields.forEach((name) => {
      const input = form.elements.namedItem(name);
      const valid = input.checkValidity() && input.value.trim().length > 0;
      const field = input.closest(".field"),
        error = field.querySelector(".errorText");
      error.id = `${name}-error`;
      input.setAttribute("aria-describedby", error.id);
      input.setAttribute("aria-invalid", String(!valid));
      field.classList.toggle("is-error", !valid);
      if (!valid && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  };
  // Keep browser validation as the no-JS fallback; use accessible inline errors when JS runs.
  form.noValidate = true;
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (
      field?.classList.contains("is-error") &&
      e.target.checkValidity() &&
      e.target.value.trim()
    ) {
      field.classList.remove("is-error");
      e.target.setAttribute("aria-invalid", "false");
    }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!validate()) {
      setNote("Please check the highlighted fields.", "is-bad");
      return;
    }
    if (form.elements.namedItem("_gotcha").value) return;
    if (Date.now() - lastSent < 45000) {
      setNote("Please wait a moment before sending another message.");
      return;
    }
    sending = true;
    button.disabled = true;
    button.textContent = "Sending…";
    setNote("Sending your message…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Message not accepted");
      lastSent = Date.now();
      form.reset();
      fields.forEach((name) =>
        form.elements.namedItem(name).removeAttribute("aria-invalid"),
      );
      setNote("Message sent. Thank you! Michael will be in touch.", "is-good");
    } catch {
      setNote(
        "Your message could not be confirmed. Please try again or email admin@goyonebydesign.com.",
        "is-bad",
      );
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = "Send request";
    }
  });
})();
