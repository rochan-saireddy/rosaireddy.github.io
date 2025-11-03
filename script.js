/* script.js
  - builds orb nav (center + outer nodes)
  - initial bumble circle -> hex layout
  - settles to side stacks on index scroll threshold
  - inner pages start settled
  - click: scroll if target exists, else navigate
  - theme toggle persisted in localStorage
*/

const NAV = [
  { id: 'home', label: 'Home', href: 'index.html' },
  { id: 'about', label: 'About', href: 'about.html' },
  { id: 'projects', label: 'Projects', href: 'projects.html' },
  { id: 'skills', label: 'Skills', href: 'skills.html' },
  { id: 'contact', label: 'Contact', href: 'contact.html' }
];
// center orb is Vegetable Fish
const CENTER = { id: 'vegetable-fish', label: 'Vegetable Fish', href: 'vegetable-fish.html' };

const orbNav = document.getElementById('orbNav');
const page = document.body.dataset.page || 'index';

// build orbs: center first, then outer
const centerOrb = createOrb(CENTER, true);
const outerOrbs = NAV.map((n) => createOrb(n, false));
const orbs = [centerOrb, ...outerOrbs];

function createOrb(item, isCenter=false){
  const el = document.createElement('button');
  el.className = 'nav-orb idle';
  if (isCenter) el.classList.add('center');
  el.dataset.page = item.id;
  el.dataset.href = item.href;
  el.setAttribute('aria-label', item.label);
  el.innerHTML = `<span class="orb-label">${item.label}</span>`;
  orbNav.appendChild(el);
  // click
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const href = el.dataset.href || 'index.html';
    const targetId = href.replace('.html','');
    // if same page and there's an element with that id, smooth scroll
    if (window.location.pathname.endsWith(href) || (href === 'index.html' && page === 'index')) {
      if (document.getElementById(targetId)) {
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 340 });
        return;
      }
    }
    // navigate (fade)
    document.documentElement.style.transition = 'opacity .28s ease';
    document.documentElement.style.opacity = '0';
    setTimeout(()=> window.location.href = href, 280);
  });
  return el;
}

// positioning helpers
function positionCircle(radius = Math.min(innerWidth, innerHeight) * 0.12){
  const cx = innerWidth/2, cy = innerHeight/2;
  const nodes = orbs;
  const step = (Math.PI*2)/nodes.length;
  nodes.forEach((orb, i) => {
    const angle = i * step;
    const left = cx + Math.cos(angle)*radius - orb.offsetWidth/2;
    const top  = cy + Math.sin(angle)*radius - orb.offsetHeight/2;
    orb.style.left = `${left}px`; orb.style.top = `${top}px`;
  });
}

function positionHex(radius = Math.min(innerWidth, innerHeight) * 0.18){
  const cx = innerWidth/2, cy = innerHeight/2;
  orbs.forEach((orb, idx) => {
    if (idx === 0) {
      orb.style.left = `${cx - orb.offsetWidth/2}px`;
      orb.style.top  = `${cy - orb.offsetHeight/2}px`;
    } else {
      const angle = (idx-1) * (Math.PI*2) / (orbs.length-1);
      const left = cx + Math.cos(angle)*radius - orb.offsetWidth/2;
      const top  = cy + Math.sin(angle)*radius - orb.offsetHeight/2;
      orb.style.left = `${left}px`; orb.style.top = `${top}px`;
    }
  });
}

// settle to sides (stacked)
function settleToSides(){
  document.body.classList.add('settled');
  const leftX = 18;
  const rightX = innerWidth - 18;
  const startY = window.scrollY + 100;
  const gap = Math.min(140, innerHeight / 6);

  orbs.forEach((orb, i) => {
    orb.classList.remove('idle');
    orb.classList.add('settled');
    const half = Math.ceil(orbs.length/2);
    const side = (i < half) ? 'left' : 'right';
    orb.dataset.side = side;
    const idx = (side === 'left') ? i : i - half;
    const top = startY + idx * gap;
    const targetLeft = (side === 'left') ? leftX : (rightX - orb.offsetWidth);
    orb.style.left = `${Math.max(8, Math.min(innerWidth - orb.offsetWidth - 8, targetLeft))}px`;
    orb.style.top  = `${Math.max(20, Math.min(document.body.scrollHeight - orb.offsetHeight - 20, top))}px`;
  });
}

// restore to center hex
function restoreCenter(){
  document.body.classList.remove('settled');
  orbs.forEach(o => { o.classList.add('idle'); o.classList.remove('settled'); o.style.transform=''; });
  positionHex();
}

// bumble motion (rAF)
function startBumble(orb){
  let t = 0;
  const ampX = 6 + Math.random()*8;
  const ampY = 4 + Math.random()*6;
  const speed = 0.0025 + Math.random()*0.003;

  function frame(){
    if (orb.classList.contains('settled')) return;
    t += speed * 16;
    const dx = Math.cos(t*(0.8+Math.random()*0.4)) * ampX;
    const dy = Math.sin(t*(0.7+Math.random()*0.4)) * ampY;
    orb.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// theme toggle
const themeToggle = () => {
  const btns = document.querySelectorAll('#themeToggle');
  btns.forEach(b => b.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('site-theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
  }));
};

function loadTheme(){
  const t = localStorage.getItem('site-theme');
  if (t === 'light') document.body.classList.add('light-theme');
}

// initialize behavior
function init(){
  loadTheme(); themeToggle();

  // small delay so orbs exist & have dimensions
  setTimeout(() => {
    if (page === 'index') {
      positionCircle(Math.min(innerWidth, innerHeight) * 0.12);
      setTimeout(()=> positionHex(Math.min(innerWidth, innerHeight) * 0.18), 420);
      orbs.forEach(o => { o.classList.add('idle'); startBumble(o); });
    } else {
      settleToSides();
    }
  }, 120);

  // scroll handling (only index matters)
  if (page === 'index'){
    let didSettle = false;
    const threshold = innerHeight * 0.45;
    window.addEventListener('scroll', () => {
      if (window.scrollY > threshold && !didSettle){
        didSettle = true; settleToSides();
      } else if (window.scrollY <= threshold && didSettle){
        didSettle = false; restoreCenter();
      }
    });
  }

  // responsive reposition
  window.addEventListener('resize', () => {
    if (!document.body.classList.contains('settled')) positionHex(Math.min(innerWidth, innerHeight) * 0.18);
    else settleToSides();
  });
}

window.addEventListener('load', init);
