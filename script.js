/* ═══════════════════════════════════════════════════════════════
   BALAMURUGAN SIVARAMAN — PORTFOLIO
   script.js — Full interaction & animation system
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── UTILS ──────────────────────────────────────────────────── */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

/* ─── 1. THEME TOGGLE ─────────────────────────────────────────── */
(function initTheme() {
  const root   = document.documentElement;
  const btn    = $('#themeToggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply saved theme or system preference
  const initial = stored || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', initial);

  btn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();


/* ─── 2. NAVBAR — SCROLL HIDE/SHOW ──────────────────────────── */
(function initNavbar() {
  const wrapper = $('#navbarWrapper');
  if (!wrapper) return;

  let lastY    = window.scrollY;
  let ticking  = false;
  let hidden   = false;

  function update() {
    const y = window.scrollY;
    const delta = y - lastY;

    if (y < 80) {
      // Always show near top
      if (hidden) { wrapper.classList.remove('hidden'); hidden = false; }
    } else if (delta > 6 && !hidden) {
      wrapper.classList.add('hidden');
      hidden = true;
    } else if (delta < -6 && hidden) {
      wrapper.classList.remove('hidden');
      hidden = false;
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();


/* ─── 3. SCROLL SPY — Active section highlighting ───────────────*/
(function initScrollSpy() {
  const sections     = $$('section[id]');
  const desktopLinks = $$('.nav-link');
  const mobileLinks  = $$('.mob-link');

  if (!sections.length) return;

  function setActive(id) {
    [...desktopLinks, ...mobileLinks].forEach(a => {
      const active = a.dataset.section === id;
      a.classList.toggle('active', active);
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));

  // Smooth scroll on nav click
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ─── 4. SCROLL REVEAL — IntersectionObserver ───────────────── */
(function initReveal() {
  const items = $$('.reveal-up');
  if (!items.length) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  items.forEach(el => observer.observe(el));
})();


/* ─── 5. TYPING ANIMATION ─────────────────────────────────────── */
(function initTyping() {
  const el = $('#typedText');
  if (!el) return;

  const words  = ['digital world.', 'cloud frontier.', 'enterprise network.', 'future.'];
  let wi = 0, ci = 0, deleting = false;
  const SPEED_TYPE = 80, SPEED_DEL = 45, PAUSE_END = 2000, PAUSE_START = 400;

  function tick() {
    const word = words[wi];

    if (!deleting) {
      ci++;
      el.textContent = word.slice(0, ci);
      if (ci === word.length) {
        deleting = true;
        setTimeout(tick, PAUSE_END);
        return;
      }
    } else {
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        setTimeout(tick, PAUSE_START);
        return;
      }
    }

    setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE + Math.random() * 40);
  }

  setTimeout(tick, 800);
})();


/* ─── 6. COUNTER ANIMATION ────────────────────────────────────── */
(function initCounters() {
  const counters = $$('.counter');
  if (!counters.length) return;

  const DURATION = 1800; // ms

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const start  = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = clamp(elapsed / DURATION, 0, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();


/* ─── 7. PARALLAX BLOBS ──────────────────────────────────────── */
(function initParallax() {
  const blobs = $$('.blob');
  if (!blobs.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const factors = [0.03, 0.05, 0.02];
  let ticking   = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      blobs.forEach((b, i) => {
        const f = factors[i] ?? 0.03;
        b.style.transform = `translateY(${y * f}px)`;
      });
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();


/* ─── 8. PROJECT CARD MOUSE GLOW ─────────────────────────────── */
(function initCardGlow() {
  $$('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
      const y    = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
      card.style.setProperty('--mx', x);
      card.style.setProperty('--my', y);
    });
  });
})();


/* ─── 9. MAGNETIC HOVER ──────────────────────────────────────── */
(function initMagnetic() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window) return; // disable on touch

  const STRENGTH = 0.35;

  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect   = el.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * STRENGTH;
      const dy     = (e.clientY - cy) * STRENGTH;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
})();


/* ─── 10. FLOATING TOOLKIT ────────────────────────────────────── */
(function initToolkit() {
  const fab   = $('#toolkitFab');
  const menu  = $('#toolkitMenu');
  const wrap  = $('#toolkitWrap');
  if (!fab || !menu) return;

  let open = false;

  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open;
    fab.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);

    // Stagger items
    const items = $$('.tk-item', menu);
    items.forEach((item, i) => {
      item.style.transitionDelay = open
        ? `${i * 50}ms`
        : `${(items.length - 1 - i) * 30}ms`;
    });
  }

  fab.addEventListener('click', e => {
    e.stopPropagation();
    toggle();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (open && !wrap.contains(e.target)) toggle(false);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) toggle(false);
  });

  // Close when a toolkit link is clicked
  $$('.tk-item', menu).forEach(item => {
    item.addEventListener('click', () => toggle(false));
  });
})();


/* ─── 11. CONTACT FORM ────────────────────────────────────────── */
(function initContactForm() {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const data    = new FormData(form);
    const fname   = data.get('fname')?.toString().trim();
    const email   = data.get('email')?.toString().trim();
    const message = data.get('message')?.toString().trim();

    // Simple validation
    if (!fname || !email || !message) {
      // Shake invalid fields
      $$('input, select, textarea', form).forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          field.addEventListener('input', () => {
            field.style.borderColor = '';
          }, { once: true });
        }
      });
      return;
    }

    // Build mailto href
    const subject = encodeURIComponent(`Portfolio Inquiry from ${fname}`);
    const body    = encodeURIComponent(
      `Name: ${fname} ${data.get('lname') || ''}\n` +
      `Email: ${email}\n` +
      `Service: ${data.get('service') || 'Not specified'}\n\n` +
      `Message:\n${message}`
    );
    window.location.href = `mailto:balamurugan@example.com?subject=${subject}&body=${body}`;

    // Show success
    form.querySelectorAll('input, select, textarea').forEach(f => f.value = '');
    if (success) {
      success.hidden = false;
      success.style.display = '';
      setTimeout(() => {
        success.hidden = true;
      }, 6000);
    }
  });
})();


/* ─── 12. BUTTON RIPPLE / SHIMMER ────────────────────────────── */
(function initButtonShimmer() {
  $$('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
      btn.style.setProperty('--mx', x);
      btn.style.setProperty('--my', y);
    });
  });
})();


/* ─── 13. STACK ITEM STAGGER REVEAL ─────────────────────────── */
(function initStackReveal() {
  $$('.stack-row').forEach(row => {
    const items = $$('.sitem', row);
    items.forEach((item, i) => {
      // Extra stagger within each grid row
      item.style.transitionDelay = `${i * 40}ms`;
    });
  });
})();


/* ─── 14. SMOOTH SECTION ENTRY for hero specific elements ───── */
(function initHeroEntrance() {
  // The hero section elements use CSS reveal-up but hero itself 
  // is always visible - trigger immediately
  const heroReveals = $$('#hero .reveal-up');

  // Stagger them with rAF
  heroReveals.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 100 + i * 90);
  });
})();


/* ─── 15. SCROLL PROGRESS INDICATOR ─────────────────────────── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scrollProgress';
  Object.assign(bar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '2px',
    width: '0%',
    background: 'linear-gradient(90deg, #7C3AED, #22D3EE)',
    zIndex: '1000',
    transition: 'width 0.1s linear',
    pointerEvents: 'none',
  });
  document.body.appendChild(bar);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct  = docH > 0 ? (window.scrollY / docH * 100).toFixed(2) : 0;
      bar.style.width = pct + '%';
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();


/* ─── 16. CURSOR GLOW (desktop only) ────────────────────────── */
(function initCursorGlow() {
  if ('ontouchstart' in window) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cursor = document.createElement('div');
  Object.assign(cursor.style, {
    position: 'fixed',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: '-1',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.3s',
    willChange: 'left, top',
  });
  document.body.appendChild(cursor);

  let cx = -500, cy = -500;
  let ax = -500, ay = -500;

  document.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
  }, { passive: true });

  function lerp(a, b, t) { return a + (b - a) * t; }

  (function animate() {
    ax = lerp(ax, cx, 0.08);
    ay = lerp(ay, cy, 0.08);
    cursor.style.left = ax + 'px';
    cursor.style.top  = ay + 'px';
    requestAnimationFrame(animate);
  })();

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
})();


/* ─── 17. PROJECT CARD 3D TILT ──────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window) return;

  const TILT = 6; // max degrees

  $$('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const nx   = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to 0.5
      const ny   = (e.clientY - rect.top)  / rect.height - 0.5;
      const rx   = ny * -TILT;
      const ry   = nx *  TILT;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
      setTimeout(() => { card.style.transition = ''; }, 600);
    });
  });
})();


/* ─── 18. PILLAR HOVER GLOW ──────────────────────────────────── */
(function initPillarGlow() {
  $$('.pillar').forEach(p => {
    p.addEventListener('mousemove', e => {
      const rect = p.getBoundingClientRect();
      const x    = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
      const y    = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
      p.style.background = `radial-gradient(circle at ${x} ${y}, rgba(124,58,237,0.12), var(--bg-glass) 60%)`;
    });
    p.addEventListener('mouseleave', () => {
      p.style.background = '';
    });
  });
})();


/* ─── INIT COMPLETE ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Mark body as JS-loaded for progressive enhancement
  document.body.classList.add('js-ready');
});



/* Time and location
_____________
*/
// ⏰ Time-based greeting
function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning 🌅";
  if (hour < 17) return "Good Afternoon ☀️";
  return "Good Evening 🌙";
}

// 🌍 Multi-language greetings
const greetings = [
  "வணக்கம்",
  "Good Morning",
  "Buenos días",
  "Bonjour",
  "Guten Morgen",
  "नमस्ते",
  "வணக்கம்",
  "こんにちは",
  "Ciao"
];

let i = 0;

function rotateGreeting() {
  const el = document.getElementById("multiLang");

  el.style.opacity = 0;

  setTimeout(() => {
    el.innerText = greetings[i];
    el.style.opacity = 1;
    i = (i + 1) % greetings.length;
  }, 300);
}

// 📍 Location detection
async function getLocationStatus() {
  const el = document.getElementById("locationStatus");

  if (!navigator.geolocation) {
    el.innerText = "Geolocation not supported";
    return;
  }

  el.innerText = "Detecting location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const data = await res.json();

        const place =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "your area";

        el.innerText = `📍 Welcome from ${place}`;
      } catch (err) {
        el.innerText = "📍 Location detected";
      }
    },
    () => {
      el.innerText = "Location disabled ❌";
    }
  );
}

// 🔔 Toast (bonus)
function showToast(msg) {
  const toast = document.createElement("div");
  toast.innerText = msg;

  toast.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #111;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    opacity: 0;
    transition: 0.3s;
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.style.opacity = 1, 100);
  setTimeout(() => toast.remove(), 3000);
}

// ❌ Close popup
function closePopup() {
  document.getElementById("welcomePopup").classList.add("hidden");
  showToast("Welcome 👋");
}
/*
// 🚀 Init
window.onload = () => {
  const popup = document.getElementById("welcomePopup");

  // Show only once
  if (!localStorage.getItem("visited")) {
    popup.classList.remove("hidden");
    localStorage.setItem("visited", "true");
  }

  document.getElementById("mainGreeting").innerText = getGreeting();
  rotateGreeting();
  getLocationStatus();

  setInterval(rotateGreeting, 2000);
};
*/
window.onload = () => {
  const popup = document.getElementById("welcomePopup");

  if (!localStorage.getItem("visited")) {
    popup.classList.remove("hidden");
    localStorage.setItem("visited", "true");
  } else {
    // Already visited → directly show as top banner
    popup.classList.remove("hidden");
    popup.classList.add("top-banner");
  }

  document.getElementById("mainGreeting").innerText = getGreeting();
  rotateGreeting();
  getLocationStatus();

  setInterval(rotateGreeting, 2000);
};

/* SKILLS AND TOOLS WITH ANIMATION*/

/* =========================
   REVEAL ON SCROLL
========================= */
const reveals = document.querySelectorAll(".reveal-up");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, { threshold: 0.2 });

reveals.forEach(el => observer.observe(el));
/* =========================
   MOUSE GLOW EFFECT
========================= */
document.querySelectorAll(".sitem").forEach(item => {
  item.addEventListener("mousemove", (e) => {
    const rect = item.getBoundingClientRect();
    item.style.setProperty("--x", `${e.clientX - rect.left}px`);
    item.style.setProperty("--y", `${e.clientY - rect.top}px`);
  });
});

/* duplicate items for infinite scroll */
document.querySelectorAll(".stack-row").forEach(row => {
  row.innerHTML += row.innerHTML;
});

/* reveal on scroll */


/* mouse glow */
