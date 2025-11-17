window.plausible = window.plausible || function () { (plausible.q = plausible.q || []).push(arguments) };
window.plausible.init = window.plausible.init || function (i) { plausible.o = i || {} };
if (typeof plausible !== 'undefined' && typeof plausible.init === 'function') {
  plausible.init();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration);
    }).catch((error) => {
      console.log('SW registration failed:', error);
    });
  });
}

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const topBar = document.querySelector(".top-bar");
const scrollLinks = document.querySelectorAll("[data-scroll]");
const navLinks = new Map();
const navToggle = document.querySelector(".top-nav__toggle");
const navToggleLabel = navToggle?.querySelector(".visually-hidden");
const siteNav = document.getElementById("site-nav");
const navBackdrop = document.querySelector("[data-nav-backdrop]");
const mobileNavQuery = window.matchMedia("(max-width: 768px)");

const setNavState = (isOpen) => {
  if (!navToggle || !siteNav) return;
  navToggle.setAttribute("aria-expanded", String(isOpen));
  if (navToggleLabel) {
    navToggleLabel.textContent = isOpen ? "Cerrar menú" : "Abrir menú";
  }
  siteNav.classList.toggle("is-open", isOpen);
  if (mobileNavQuery.matches) {
    siteNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
  } else {
    siteNav.setAttribute("aria-hidden", "false");
  }
  document.body.classList.toggle("nav-open", isOpen);
  if (navBackdrop) {
    navBackdrop.classList.toggle("is-visible", isOpen);
  }
};

const closeNav = (focusToggle = false) => {
  if (!navToggle || !siteNav) return;
  setNavState(false);
  if (focusToggle) {
    navToggle.focus({ preventScroll: true });
  }
};

const openNav = () => {
  if (!navToggle || !siteNav) return;
  setNavState(true);
  if (mobileNavQuery.matches) {
    const firstLink = siteNav.querySelector("a");
    firstLink?.focus({ preventScroll: true });
  }
};

navToggle?.addEventListener("click", () => {
  const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
  if (isExpanded) {
    closeNav();
  } else {
    openNav();
  }
});

navBackdrop?.addEventListener("click", () => closeNav());

siteNav?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.matches("[data-scroll]")) {
    closeNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
    closeNav(true);
  }
});

const handleNavBreakpoint = (event) => {
  if (!event.matches) {
    closeNav();
  }
};

if (typeof mobileNavQuery.addEventListener === "function") {
  mobileNavQuery.addEventListener("change", handleNavBreakpoint);
} else if (typeof mobileNavQuery.addListener === "function") {
  mobileNavQuery.addListener(handleNavBreakpoint);
}

if (navToggle && siteNav) {
  setNavState(false);
}

let recaptchaLoaded = false;
let recaptchaLoadPromise = null;

const loadRecaptcha = () => {
  if (recaptchaLoadPromise) return recaptchaLoadPromise;
  
  recaptchaLoadPromise = new Promise((resolve, reject) => {
    if (typeof grecaptcha !== "undefined" && typeof grecaptcha.execute === "function") {
      recaptchaLoaded = true;
      resolve();
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6LcoUw0sAAAAAKh0J7BR0wCRUwywWkacrr7nu4Wz";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      recaptchaLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
  
  return recaptchaLoadPromise;
};

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  const statusRegion = contactForm.querySelector("[data-form-status]");
  const fields = Array.from(contactForm.querySelectorAll("[data-validate]"));
  const messageField = contactForm.querySelector("[data-validate='message']");
  const messageCounter = contactForm.querySelector("[data-counter='message']");
  const messageMinLength = messageField ? Number(messageField.getAttribute("minlength") || "0") : 0;
  const recaptchaSiteKey = "6LcoUw0sAAAAAKh0J7BR0wCRUwywWkacrr7nu4Wz";
  const recaptchaResponseField = contactForm.querySelector("[data-recaptcha-response]");
  const recaptchaAction = "contact_form";
  let isRecaptchaSubmitting = false;
  let prefetchAdded = false;

  contactForm.addEventListener("focus", () => {
    if (!recaptchaLoaded) {
      loadRecaptcha().catch(() => {});
    }
    if (!prefetchAdded) {
      const prefetchLink = document.createElement("link");
      prefetchLink.rel = "prefetch";
      prefetchLink.href = "/gracias.html";
      document.head.appendChild(prefetchLink);
      prefetchAdded = true;
    }
  }, { once: true, capture: true });

  const formatCounterText = (current, min) => {
    if (!min) return `${current} caracteres`;
    return `${current} / ${min} caracteres`;
  };

  const syncMessageCounter = () => {
    if (!messageField || !messageCounter) return;
    const currentLength = messageField.value.trim().length;
    messageCounter.textContent = formatCounterText(currentLength, messageMinLength);
    messageCounter.dataset.state = currentLength < messageMinLength ? "under" : "valid";
  };

  const setMessageCounterFocus = (isFocused) => {
    if (!messageCounter) return;
    if (isFocused) {
      messageCounter.dataset.focused = "true";
    } else {
      delete messageCounter.dataset.focused;
    }
  };

  const validators = {
    name(value) {
      const normalized = value.trim().replace(/\s+/g, " ");
      if (!normalized) return "Ingresa tu nombre completo.";
      if (normalized.length < 3) return "El nombre debe tener al menos 3 caracteres.";
      if (!/^[\p{L}''.\-]+(?:\s+[\p{L}''.\-]+)+$/u.test(normalized)) {
        return "Incluye nombre y apellido usando solo letras.";
      }
      return "";
    },
    email(value) {
      const trimmed = value.trim();
      if (!trimmed) return "Necesitamos un correo electrónico para responderte.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
        return "Ingresa un correo válido con dominio.";
      }
      return "";
    },
    company(value) {
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (trimmed.length > 80) return "Máximo 80 caracteres para este campo.";
      if (/(https?:\/\/|www\.)/i.test(trimmed)) return "Evita incluir enlaces en este campo.";
      return "";
    },
    message(value) {
      const trimmed = value.trim();
      if (trimmed.length < 20) return "Detalla tu necesidad con al menos 20 caracteres.";
      if (/(https?:\/\/|www\.)/i.test(trimmed)) return "Describe tu necesidad sin enlaces directos.";
      return "";
    },
  };

  const setFieldState = (field, message) => {
    const errorEl = field.id ? contactForm.querySelector(`#${field.id}-error`) : null;
    if (errorEl) {
      errorEl.textContent = message || "";
    }
    if (message) {
      field.setAttribute("aria-invalid", "true");
      field.dataset.invalid = "true";
      delete field.dataset.valid;
    } else {
      field.removeAttribute("aria-invalid");
      delete field.dataset.invalid;
      if (field.value.trim()) {
        field.dataset.valid = "true";
      } else {
        delete field.dataset.valid;
      }
      if (statusRegion && !contactForm.querySelector("[data-invalid='true']")) {
        statusRegion.textContent = "";
      }
    }
    if (field === messageField) {
      syncMessageCounter();
    }
  };

  const validateField = (field) => {
    const key = field.dataset.validate;
    if (!key || !validators[key]) {
      return true;
    }
    const error = validators[key](field.value || "");
    if (field.dataset.touched === "true") {
      setFieldState(field, error);
    }
    return !error;
  };

  const touchField = (field) => {
    field.dataset.touched = "true";
  };

  fields.forEach((field) => {
    field.addEventListener("blur", () => {
      touchField(field);
      validateField(field);
    });
    field.addEventListener("input", () => {
      if (field.dataset.touched === "true") {
        validateField(field);
      }
    });
    if (field === messageField) {
      field.addEventListener("input", () => {
        syncMessageCounter();
      });
      field.addEventListener("focus", () => {
        setMessageCounterFocus(true);
        syncMessageCounter();
      });
      field.addEventListener("blur", () => {
        setMessageCounterFocus(false);
        syncMessageCounter();
      });
    }
  });

  syncMessageCounter();
  setMessageCounterFocus(false);

  contactForm.addEventListener("submit", (event) => {
    let hasErrors = false;
    fields.forEach((field) => {
      touchField(field);
      if (!validateField(field)) {
        hasErrors = true;
      }
    });
    if (hasErrors) {
      event.preventDefault();
      const firstInvalid = fields.find((input) => input.dataset.invalid === "true");
      if (statusRegion) {
        statusRegion.textContent = "Revisa los campos marcados para continuar con el envío.";
      }
      firstInvalid?.focus({ preventScroll: false });
    } else {
      fields.forEach((field) => {
        if (typeof field.value !== "string") return;
        if (field.dataset.validate === "name") {
          field.value = field.value.trim().replace(/\s+/g, " ");
        } else if (field.dataset.validate === "message") {
          field.value = field.value.trim();
        } else {
          field.value = field.value.trim();
        }
        if (field === messageField) {
          syncMessageCounter();
        }
      });
      if (statusRegion) {
        statusRegion.textContent = "";
      }
      if (!recaptchaSiteKey || !recaptchaResponseField) {
        return;
      }
      event.preventDefault();
      if (statusRegion) {
        statusRegion.textContent = "Verificando reCAPTCHA...";
      }
      
      loadRecaptcha().then(() => {
        if (typeof grecaptcha === "undefined" || typeof grecaptcha.execute !== "function") {
          if (statusRegion) {
            statusRegion.textContent = "El servicio de reCAPTCHA no está disponible. Actualiza la página e inténtalo nuevamente.";
          }
          return;
        }
        
        if (isRecaptchaSubmitting) {
          return;
        }
        
        isRecaptchaSubmitting = true;
        grecaptcha.ready(() => {
          grecaptcha.execute(recaptchaSiteKey, { action: recaptchaAction }).then((token) => {
            recaptchaResponseField.value = token;
            if (statusRegion) {
              statusRegion.textContent = "";
            }
            isRecaptchaSubmitting = false;
            contactForm.submit();
          }).catch(() => {
            isRecaptchaSubmitting = false;
            if (statusRegion) {
              statusRegion.textContent = "No pudimos verificar el reCAPTCHA. Intenta nuevamente.";
            }
          });
        });
      }).catch(() => {
        if (statusRegion) {
          statusRegion.textContent = "Error al cargar reCAPTCHA. Intenta nuevamente.";
        }
      });
    }
  });
}

const updateActiveLink = (sectionId) => {
  navLinks.forEach((link, id) => {
    link.classList.toggle("active", id === sectionId);
  });
};

const getScrollOffset = () => {
  return (topBar ? topBar.offsetHeight : 0) + 12;
};

scrollLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href && href.startsWith("#")) {
    const id = href.slice(1);
    if (!navLinks.has(id)) {
      navLinks.set(id, link);
    }
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(id);
      if (!target) return;
      const offset = getScrollOffset();
      const targetY = window.scrollY + target.getBoundingClientRect().top - offset;
      window.scrollTo({ top: targetY, behavior: "smooth" });
      updateActiveLink(id);
    });
  }
});

const sections = document.querySelectorAll("section[data-section]");
if (sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateActiveLink(entry.target.id);
        }
      });
    },
    {
      threshold: 0.55,
      rootMargin: "-10% 0px -35% 0px",
    }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

const revealEls = document.querySelectorAll("[data-reveal]");
if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -5% 0px",
    }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

const cookieBanner = document.querySelector(".cookie-banner");
if (cookieBanner) {
  const storageKey = "huiro-cookie-info";
  const dismissBtn = cookieBanner.querySelector(".cookie-banner__button");
  const showBanner = () => cookieBanner.classList.add("is-visible");

  try {
    if (!window.localStorage.getItem(storageKey)) {
      requestAnimationFrame(showBanner);
    }
  } catch (err) {
    requestAnimationFrame(showBanner);
  }

  dismissBtn?.addEventListener("click", () => {
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch (err) {
      /* ignore storage errors */
    }
    cookieBanner.classList.remove("is-visible");
  });
}

const floatCta = document.querySelector(".float-cta");
if (floatCta) {
  const aboutSection = document.querySelector(".section--about");
  const contactSection = document.getElementById("contacto");
  const footerEl = document.querySelector("footer");

  const toggleFloatCta = () => {
    const viewportMid = window.innerHeight * 0.5;
    const aboutRect = aboutSection ? aboutSection.getBoundingClientRect() : null;
    const aboutReady = aboutRect ? aboutRect.top <= viewportMid : false;
    const contactRect = contactSection ? contactSection.getBoundingClientRect() : null;
    const contactInView = contactRect ? contactRect.top <= viewportMid && contactRect.bottom >= 0 : false;
    const footerRect = footerEl ? footerEl.getBoundingClientRect() : null;
    const footerVisible = footerRect ? footerRect.top <= viewportMid : false;
    const isVisible = aboutReady && !contactInView && !footerVisible;
    floatCta.classList.toggle("is-visible", isVisible);
    floatCta.setAttribute("aria-hidden", String(!isVisible));
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        toggleFloatCta();
        ticking = false;
      });
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  toggleFloatCta();
}

const scrollPanel = document.querySelector(".scroll-panel");
if (scrollPanel) {
  const meter = scrollPanel.querySelector(".scroll-panel__meter span");
  const toTopBtn = scrollPanel.querySelector(".scroll-panel__btn");
  const contactSection = document.getElementById("contacto");
  const footerEl = document.querySelector("footer");

  const togglePanel = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    const contactRect = contactSection ? contactSection.getBoundingClientRect() : null;
    const contactInView = contactRect ? contactRect.top <= window.innerHeight * 0.6 : false;
    const footerRect = footerEl ? footerEl.getBoundingClientRect() : null;
    const footerVisible = footerRect ? footerRect.top <= window.innerHeight * 0.75 : false;
    const isVisible = progress >= 0.3 && !contactInView && !footerVisible;
    if (meter) {
      meter.style.width = `${Math.min(progress * 100, 100)}%`;
    }
    scrollPanel.classList.toggle("is-visible", isVisible);
    scrollPanel.setAttribute("aria-hidden", String(!isVisible));
  };

  let tickingPanel = false;
  const onPanelScroll = () => {
    if (!tickingPanel) {
      tickingPanel = true;
      requestAnimationFrame(() => {
        togglePanel();
        tickingPanel = false;
      });
    }
  };

  window.addEventListener("scroll", onPanelScroll, { passive: true });
  window.addEventListener("resize", onPanelScroll);
  togglePanel();

  toTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const modalTriggers = document.querySelectorAll("[data-modal-target]");
if (modalTriggers.length) {
  const bodyEl = document.body;
  let activeModal = null;
  let previousFocus = null;

  const closeModal = () => {
    if (!activeModal) return;
    activeModal.classList.remove("is-visible");
    activeModal.setAttribute("aria-hidden", "true");
    bodyEl.classList.remove("modal-open");
    const restoredFocus = previousFocus;
    activeModal = null;
    previousFocus = null;
    if (restoredFocus && typeof restoredFocus.focus === "function") {
      restoredFocus.focus({ preventScroll: true });
    }
  };

  const openModal = (modal, trigger) => {
    if (!modal || modal === activeModal) return;
    previousFocus = trigger;
    activeModal = modal;
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    bodyEl.classList.add("modal-open");
    const dialog = modal.querySelector(".modal__dialog");
    dialog?.focus({ preventScroll: true });
  };

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = trigger.getAttribute("data-modal-target");
      if (!targetId) return;
      const modal = document.getElementById(targetId);
      openModal(modal, trigger);
    });
  });

  const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
  modalCloseButtons.forEach((btn) => {
    btn.addEventListener("click", () => closeModal());
  });

  const modalElements = document.querySelectorAll(".modal");
  modalElements.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}
