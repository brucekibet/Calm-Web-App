/* ===========================
   UTILITIES & STATE
   =========================== */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const storeKey = 'calm-web:v1';

const state = {
  mode: 'chaos', // 'chaos' | 'calm'
  prefs: {
    fontSize: 18,
    lineHeight: 1.7,
    maxWidth: 65,
    gap: 1.25,
  },
  ambient: false
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey));
    if (saved) Object.assign(state, saved);
  } catch {}
}
function save() { localStorage.setItem(storeKey, JSON.stringify(state)); }

function updateLabel() {
  const label = $('#modeLabel');
  label.textContent = state.mode === 'calm' ? 'Calm Mode' : 'Chaos Mode';
  $('.breathe').style.display = state.mode === 'calm' ? 'inline-block' : 'none';
}

function applyPrefs() {
  document.documentElement.style.setProperty('--font-size', state.prefs.fontSize + 'px');
  document.documentElement.style.setProperty('--line-height', state.prefs.lineHeight);
  document.documentElement.style.setProperty('--max-ch', state.prefs.maxWidth + 'ch');
  document.documentElement.style.setProperty('--content-gap', state.prefs.gap + 'rem');
  // sync UI
  $('#fontSize').value = state.prefs.fontSize;
  $('#lineHeight').value = state.prefs.lineHeight;
  $('#maxWidth').value = state.prefs.maxWidth;
  $('#gap').value = state.prefs.gap;
}

/* ===========================
   CALM TOGGLE
   =========================== */
function setMode(next) {
  state.mode = next;
  document.body.classList.toggle('calm', next === 'calm');
  $('#toggleMode').setAttribute('aria-pressed', String(next === 'calm'));
  updateLabel();
  updateScore();
  save();
}
function toggleMode() {
  setMode(state.mode === 'calm' ? 'chaos' : 'calm');
}

/* ===========================
   DISTRACTION SCORE
   =========================== */
function getNoiseNodes() {
  return $$('.noise').filter(n => n.offsetParent !== null); // visible only
}
function updateScore() {
  const score = state.mode === 'calm' ? 0 : getNoiseNodes().length;
  $('#score').textContent = String(score);
}

/* Remove one visible noise node for the demo */
function reduceOneNoise() {
  const nodes = getNoiseNodes();
  if (!nodes.length) return;
  const n = nodes[Math.floor(Math.random() * nodes.length)];
  n.remove();
  updateScore();
}

/* ===========================
   READING PREFS HANDLERS
   =========================== */
function bindPrefs() {
  $('#fontSize').addEventListener('input', (e) => {
    state.prefs.fontSize = Number(e.target.value);
    applyPrefs(); save();
  });
  $('#lineHeight').addEventListener('input', (e) => {
    state.prefs.lineHeight = Number(e.target.value).toFixed(2);
    applyPrefs(); save();
  });
  $('#maxWidth').addEventListener('input', (e) => {
    state.prefs.maxWidth = Number(e.target.value);
    applyPrefs(); save();
  });
  $('#gap').addEventListener('input', (e) => {
    state.prefs.gap = Number(e.target.value);
    applyPrefs(); save();
  });
}

/* ===========================
   AMBIENT SOUND (optional)
   =========================== */
let audioCtx, osc, gain;
function toggleAmbient() {
  const btn = $('#ambientBtn');
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 140; // gentle hum
    gain.gain.value = 0.0008;  // very quiet
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
  }
  state.ambient = !state.ambient;
  btn.textContent = state.ambient ? 'On' : 'Off';
  btn.setAttribute('aria-pressed', String(state.ambient));
  if (state.ambient) audioCtx.resume(); else audioCtx.suspend();
  save();
}

/* ===========================
   BOOKMARKLET
   =========================== */
function generateBookmarklet() {
  const code = `
    (function(){
      if(window.__calm_on){ document.documentElement.classList.remove('___calm'); window.__calm_on=false; return;}
      window.__calm_on=true;
      const s=document.createElement('style');
      s.id='___calm_css';
      s.textContent=\`
        .___calm *{animation:none!important;transition:none!important}
        .___calm :is([role="dialog"], .modal, .popup, [class*="ad"], [id*="ad"], .banner, .marquee, video[autoplay]){display:none!important}
        .___calm body{background:#fdfaf5!important;color:#2e2e2e!important}
        .___calm p, .___calm h1, .___calm h2, .___calm h3{max-width:65ch!important;line-height:1.7!important}
      \`;
      document.head.appendChild(s);
      document.documentElement.classList.add('___calm');
    })();
  `.trim().replace(/\n+/g,'');
  return 'javascript:' + encodeURIComponent(code);
}

/* ===========================
   INIT
   =========================== */
function init() {
  load();
  applyPrefs();

  if (state.mode === 'calm') document.body.classList.add('calm');

  // Controls
  $('#toggleMode').addEventListener('click', toggleMode);
  $('#reduceNoise').addEventListener('click', reduceOneNoise);
  $('#ambientBtn').addEventListener('click', toggleAmbient);
  $('#bookmarkletLink').addEventListener('click', (e) => {
    e.preventDefault();
    const code = generateBookmarklet();
    navigator.clipboard.writeText(code).then(() => {
      alert('Bookmarklet copied! Paste into a bookmark URL.');
    });
  });

  bindPrefs();
  if (state.ambient) toggleAmbient(); // restore ambient state

  updateLabel();
  updateScore();
}

document.addEventListener('DOMContentLoaded', init);
