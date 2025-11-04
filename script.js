/* script.js
   - builds orb nav (center + outer nodes)
   - physics swarm (bumble) with cursor attraction
   - wide hex / float formation (idle)
   - settle-to-sides on scroll
   - theme toggle with localStorage
   - click: smooth-scroll if target exists else navigate
*/

const NAV = [
  { id: 'home', label: 'Home', href: 'index.html' },
  { id: 'about', label: 'About', href: 'about.html' },
  { id: 'projects', label: 'Projects', href: 'projects.html' },
  { id: 'skills', label: 'Skills', href: 'skills.html' },
  { id: 'contact', label: 'Contact', href: 'contact.html' }
];
const CENTER = { id: 'vegetable-fish', label: 'Vegetable Fish', href: 'vegetable-fish.html' };

const orbNav = document.getElementById('orbNav');
const page = document.body.dataset.page || 'index';

// create orbs
function createOrb(item, isCenter=false) {
  const el = document.createElement('button');
  el.className = 'nav-orb';
  if (isCenter) el.classList.add('center');
  el.dataset.page = item.id;
  el.dataset.href = item.href;
  el.setAttribute('aria-label', item.label);
  el.innerHTML = `<span class="orb-label">${item.label}</span>`;
  orbNav.appendChild(el);
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const href = el.dataset.href || 'index.html';
    const targetId = href.replace('.html','');
    // if same page and element exists, scroll to it
    if ((page === 'index' && href === 'index.html') || window.location.pathname.endsWith(href)) {
      if (document.getElementById(targetId)) {
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.animate([{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 320 });
        return;
      }
    }
    // fallback: navigate w/ fade
    document.documentElement.style.transition = 'opacity .28s ease';
    document.documentElement.style.opacity = '0';
    setTimeout(()=> window.location.href = href, 280);
  });
  return el;
}

const centerOrb = createOrb(CENTER, true);
const outerOrbs = NAV.map(n => createOrb(n, false));
const orbs = [centerOrb, ...outerOrbs];

// assign initial random positions and target % positions for wide hex
const wideHexTargets = [
  { x: 50, y: 44 }, // center
  { x: 18, y: 36 },
  { x: 82, y: 36 },
  { x: 10, y: 70 },
  { x: 90, y: 70 },
  { x: 50, y: 88 }
];

orbs.forEach((orb, i) => {
  // start scattered near center-ish
  const startX = (window.innerWidth * 0.5) + (Math.random()-0.5) * window.innerWidth * 0.18;
  const startY = (window.innerHeight * 0.5) + (Math.random()-0.5) * window.innerHeight * 0.18;
  orb.style.left = `${startX - orb.offsetWidth/2}px`;
  orb.style.top  = `${startY - orb.offsetHeight/2}px`;

  orb._vx = (Math.random()-0.5) * 1.4;
  orb._vy = (Math.random()-0.5) * 1.4;
  orb._tx = wideHexTargets[i].x;
  orb._ty = wideHexTargets[i].y;
  orb.classList.add('float'); // floaty visual
});

// float physics with gentle attraction toward target wide-hex
let settled = false;
const drag = 0.985;
const attractStrength = 0.018;
const jitterStrength = 0.6;

function physicsTick() {
  orbs.forEach((orb, i) => {
    if (!settled) {
      // current center position
      const rect = orb.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;

      // target pixel positions (wide hex)
      const tx = window.innerWidth * (orb._tx / 100);
      const ty = window.innerHeight * (orb._ty / 100);

      // velocity towards target + jitter
      const ax = (tx - cx) * attractStrength + (Math.random()-0.5) * 0.6;
      const ay = (ty - cy) * attractStrength + (Math.random()-0.5) * 0.6;

      orb._vx = (orb._vx + ax) * drag;
      orb._vy = (orb._vy + ay) * drag;

      // apply
      let left = (orb.offsetLeft || 0) + orb._vx;
      let top  = (orb.offsetTop  || 0) + orb._vy;

      // keep inside window bounds
      left = Math.max(8, Math.min(window.innerWidth - orb.offsetWidth - 8, left));
      top  = Math.max(8, Math.min(window.innerHeight - orb.offsetHeight - 8, top));

      orb.style.left = `${left}px`;
      orb.style.top  = `${top}px`;
    }
    // if settled mode is on we do nothing here (positions set explicitly)
  });

  requestAnimationFrame(physicsTick);
}
requestAnimationFrame(physicsTick);

// cursor magnetism (only while not settled)
window.addEventListener('mousemove', (ev) => {
  if (settled) return;
  const mx = ev.clientX, my = ev.clientY;
  orbs.forEach((orb) => {
    const rect = orb.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 240) {
      // add small velocity toward cursor
      orb._vx += (dx / dist) * 0.03;
      orb._vy += (dy / dist) * 0.03;
    }
  });
});

// wide hex snapping (used for idle & restore)
function positionWideHexInstant() {
  orbs.forEach((orb, i) => {
    const target = wideHexTargets[i];
    const left = window.innerWidth * (target.x / 100) - orb.offsetWidth / 2;
    const top  = window.innerHeight * (target.y / 100) - orb.offsetHeight / 2;
    orb.style.left = `${left}px`;
    orb.style.top  = `${top}px`;
  });
}

// settle to side stacks (used when user scrolls down)
function settleToSides() {
  settled = true;
  document.body.classList.add('settled');
  const leftX = 18;
  const rightX = window.innerWidth - 18;
  const startY = window.scrollY + 120;
  const gap = Math.min(140, window.innerHeight / 6);

  orbs.forEach((orb, i) => {
    orb.classList.remove('float');
    orb.classList.add('settled');
    const half = Math.ceil(orbs.length / 2);
    const side = (i < half) ? 'left' : 'right';
    const idx = (side === 'left') ? i : i - half;
    const top = startY + idx * gap;
    const targetLeft = (side === 'left') ? leftX : (rightX - orb.offsetWidth);
    orb.style.left = `${Math.max(8, Math.min(window.innerWidth - orb.offsetWidth - 8, targetLeft))}px`;
    orb.style.top  = `${Math.max(20, Math.min(document.body.scrollHeight - orb.offsetHeight - 20, top))}px`;
  });
}

// restore from settled -> wide hex (used when user scrolls back up)
function restoreFromSettled() {
  settled = false;
  document.body.classList.remove('settled');
  orbs.forEach((orb) => {
    orb.classList.remove('settled');
    orb.classList.add('float');
  });
  positionWideHexInstant();
}

// scroll listener: settle/restore
if (page === 'index') {
  let didSettle = false;
  const threshold = window.innerHeight * 0.45;
  window.addEventListener('scroll', () => {
    if (window.scrollY > threshold && !didSettle) {
      didSettle = true;
      settleToSides();
    } else if (window.scrollY <= threshold && didSettle) {
      didSettle = false;
      restoreFromSettled();
    }
  });
} else {
  // inner pages start settled to sides for clarity
  setTimeout(settleToSides, 180);
}

// reposition on resize
window.addEventListener('resize', () => {
  if (!settled) positionWideHexInstant();
  else settleToSides();
});

// initial startup sequence
window.addEventListener('load', () => {
  // theme load
  loadTheme();
  bindThemeToggle();

  // tiny startup delay to let DOM settle
  setTimeout(() => {
    // place wide hex visually, then let physics nudge into place
    positionWideHexInstant();
    orbs.forEach(o => { o.classList.add('float'); });
  }, 120);
});

/* THEME HANDLING */
function bindThemeToggle() {
  document.querySelectorAll('#themeToggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      localStorage.setItem('site-theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    });
  });
}
function loadTheme() {
  const saved = localStorage.getItem('site-theme');
  if (saved === 'light') document.body.classList.add('light-theme');
}
