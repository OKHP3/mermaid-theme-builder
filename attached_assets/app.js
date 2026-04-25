// Shared scripts for OverKill Hill P³ + subsites

// ──────────────────────────────────────────────────────────────
// Reading progress bar
// ──────────────────────────────────────────────────────────────
(function () {
  const bar = document.getElementById("reading-progress");
  if (!bar) return;

  window.addEventListener(
    "scroll",
    function () {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(pct, 100) + "%";
    },
    { passive: true }
  );
})();

// ──────────────────────────────────────────────────────────────
// Theme toggle, nav, and page interactions
// ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.querySelector(".theme-toggle");
  const savedTheme = localStorage.getItem("okh-theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("okh-theme", newTheme);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const yearSpans = document.querySelectorAll(
    "#current-year, #current-year-about, #current-year-manifesto, #current-year-projects, #current-year-glee, #current-year-askjamie"
  );
  const body = document.body;

  // Mobile nav
  if (navToggle && header) {
    navToggle.addEventListener("click", () => {
      header.classList.toggle("nav-open");
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
    });
  }

  // Header shadow
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  // Year stamps
  const year = new Date().getFullYear();
  yearSpans.forEach((el) => {
    if (el) el.textContent = year;
  });

  // Theme toggle – only for core OverKill Hill pages
  const brandLocked =
    body.classList.contains("glee-main") ||
    body.classList.contains("askjamie-main");

  if (!brandLocked) {
    const themeToggle = document.createElement("button");
    themeToggle.classList.add("theme-toggle");
    themeToggle.setAttribute("aria-label", "Toggle theme");
    themeToggle.textContent = "🌓";

    if (header && header.querySelector(".container")) {
      header.querySelector(".container").appendChild(themeToggle);
    }

    const savedTheme = localStorage.getItem("okh-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    themeToggle.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("okh-theme", next);
    });
  } else {
    // Subsites stay on their brand "light" look
    document.documentElement.setAttribute("data-theme", "light");
  }

  // Scroll reveal
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealEls = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    document
      .querySelectorAll(".reveal-on-scroll")
      .forEach((el) => el.classList.add("is-visible"));
  }

  // Smooth scroll for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

    // -----------------------------------------
  // Under-construction overlay gate (Glee, etc.)
  // -----------------------------------------
  const constructionOverlay = document.querySelector(".construction-overlay");

  if (constructionOverlay) {
    const body = document.body;
    const wipKey =
      constructionOverlay.getAttribute("data-wip-key") ||
      window.location.pathname;

    const storageKey = `glee-wip-dismissed:${wipKey}`;

    // If user already dismissed this specific WIP page, hide overlay
    if (localStorage.getItem(storageKey) === "true") {
      body.classList.add("construction-dismissed");
      constructionOverlay.setAttribute("hidden", "true");
    } else {
      // Wire up dismiss buttons
      const dismissButtons = constructionOverlay.querySelectorAll(
        "[data-wip-dismiss]"
      );

      dismissButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          body.classList.add("construction-dismissed");
          constructionOverlay.setAttribute("aria-hidden", "true");
          localStorage.setItem(storageKey, "true");
        });
      });

      // Optional: clicking the dark scrim (outside the card) also dismisses
      constructionOverlay.addEventListener("click", (event) => {
        if (event.target === constructionOverlay) {
          const primaryDismiss = constructionOverlay.querySelector(
            "[data-wip-dismiss]"
          );
          if (primaryDismiss) primaryDismiss.click();
        }
      });
    }
  }

});

// ──────────────────────────────────────────────────────────────────────────
// Sticky TOC: smooth-lerp scroll-follow for #toc-widget
// Only activates on wide viewports (≥1024 px) when widget exists.
// ──────────────────────────────────────────────────────────────────────────
(function () {
  if (window.innerWidth < 1024) return;

  var toc    = document.getElementById('toc-widget');
  var footer = document.querySelector('.site-footer');
  if (!toc || !footer) return;

  var lerpedY = 0;
  var targetY = 0;
  var SPEED   = 0.08;   /* 0 = no movement, 1 = instant */
  var NAV_H   = 112;    /* minimum px from viewport top — clears sticky nav */
  var PAD     = 32;     /* px breathing room above the footer */

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Natural document position of the TOC widget before any transforms */
  function getNaturalTop(el) {
    var top = 0;
    while (el) { top += el.offsetTop; el = el.offsetParent; }
    return top;
  }

  var tocNaturalTop = getNaturalTop(toc);
  var tocH          = toc.offsetHeight;

  function tick() {
    var scrollY   = window.scrollY;
    var footerTop = footer.offsetTop;

    var centeredOffset = Math.max(NAV_H, (window.innerHeight - tocH) / 2);
    var raw = Math.max(0, scrollY + centeredOffset - tocNaturalTop);
    var max = Math.max(0, footerTop - PAD - tocNaturalTop - tocH);
    targetY = Math.min(raw, max);

    lerpedY = lerp(lerpedY, targetY, SPEED);
    toc.style.transform = 'translateY(' + lerpedY.toFixed(2) + 'px)';

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  window.addEventListener('resize', function () {
    if (window.innerWidth < 1024) {
      toc.style.transform = '';
    } else {
      toc.style.transform = '';
      tocNaturalTop = getNaturalTop(toc);
      tocH = toc.offsetHeight;
    }
  });
}());
