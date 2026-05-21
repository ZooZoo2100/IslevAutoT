const header = document.querySelector(".site-header");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll("[data-nav] a")];
const parallaxItems = [...document.querySelectorAll("[data-parallax] img")];
const serviceEditorial = document.querySelector(".service-editorial");
const serviceRows = [...document.querySelectorAll(".service-row")];

const scrollToHash = (hash, behavior = "smooth") => {
  if (!hash || hash === "#") return;
  const target = document.querySelector(hash);
  if (!target) return;
  const headerHeight = header?.getBoundingClientRect().height || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
  window.scrollTo({ top: Math.max(0, top), behavior });
};

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (menuToggle && nav) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest?.('a[href^="#"]');
  if (!(link instanceof HTMLAnchorElement)) return;
  const hash = link.getAttribute("href");
  if (!hash || hash === "#") return;
  const target = document.querySelector(hash);
  if (!target) return;
  event.preventDefault();
  history.pushState(null, "", hash);
  scrollToHash(hash);
});

window.addEventListener("load", () => {
  if (window.location.hash) {
    [80, 350, 900, 1600].forEach((delay) => {
      window.setTimeout(() => scrollToHash(window.location.hash, "auto"), delay);
    });
  }
});

window.addEventListener("hashchange", () => {
  scrollToHash(window.location.hash, "auto");
});

const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-42% 0px -48% 0px", threshold: 0 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && parallaxItems.length) {
  let ticking = false;

  const updateParallax = () => {
    const viewportHeight = window.innerHeight || 1;
    const isCompact = window.matchMedia("(max-width: 760px)").matches;
    const movement = isCompact ? 10 : 24;

    parallaxItems.forEach((image) => {
      const rect = image.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;
      const progress = (rect.top / viewportHeight) * -movement;
      image.style.translate = `0 ${progress.toFixed(2)}px`;
    });
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateParallax();
}

if (serviceEditorial && serviceRows.length) {
  serviceRows.forEach((row) => {
    row.addEventListener("pointerenter", () => {
      serviceEditorial.classList.add("is-service-hovered");
    });

    row.addEventListener("pointerleave", () => {
      serviceEditorial.classList.remove("is-service-hovered");
    });
  });
}
