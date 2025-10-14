
// ======================================
// Main App Script (app.js)
// ======================================

// App version for cache busting
const APP_VERSION = '1.1.0';

// Cache busting utilities
function getCacheBustingUrl(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${APP_VERSION}&t=${Date.now()}`;
}

function checkForUpdates() {
  // Check if this is a new version
  const lastVersion = localStorage.getItem('app_version');
  if (lastVersion !== APP_VERSION) {
    console.log(`🔄 New app version detected: ${APP_VERSION}`);
    localStorage.setItem('app_version', APP_VERSION);
    
    // Clear any cached data to force fresh load
    localStorage.removeItem('solutions_preview_enabled');
    localStorage.removeItem('solutions_preview_data');
    
    // Force reload if this is a version change
    if (lastVersion && lastVersion !== APP_VERSION) {
      console.log('🔄 Version changed, forcing page reload...');
      window.location.reload(true);
      return;
    }
    
    // Show update notification
    showUpdateNotification();
  }
}

function showUpdateNotification() {
  // Create a subtle notification that the app has been updated
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 glass text-white px-6 py-3 rounded-xl shadow-2xl z-50 text-sm border border-cyan-400';
  notification.style.background = 'linear-gradient(135deg, #001122 0%, #003366 100%)';
  notification.style.boxShadow = '0 0 30px rgba(0, 191, 255, 0.4)';
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg" style="text-shadow: 0 0 10px var(--neon-blue);">●</span>
      <span class="font-bold">App updated to latest version!</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white hover:bg-cyan-500/20 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200">×</button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Prefer preview data saved by Admin in THIS browser; otherwise fetch live file
async function loadAppData() {
  try {
    const enabled = localStorage.getItem('solutions_preview_enabled') === '1';
    const preview = localStorage.getItem('solutions_preview_data');
    if (enabled && preview) {
      console.log("⚡ Using preview data from localStorage");
      return JSON.parse(preview);
    }
  } catch (_) {}
  
  // Use cache-busting URL for the JSON data
  const cacheBustedUrl = getCacheBustingUrl('data/solutions.json');
  const res = await fetch(cacheBustedUrl, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return await res.json();
}

/* ===== State ===== */
let step = 1;
let bizType = null;
let selected = [];
let openSolution = null;
let DATA = null;

/* ===== DOM refs ===== */
const stepper = document.getElementById('stepper');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const needsTitle = document.getElementById('needsTitle');
const needsGrid = document.getElementById('needsGrid');
const solutionsGrid = document.getElementById('solutionsGrid');
const resetBtn = document.getElementById('resetBtn');
const adjustNeedsBtn = document.getElementById('adjustNeeds');
const promptEl = document.getElementById('categoryPrompt');
const promptTextEl = document.getElementById('promptText');
const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalLinks = document.getElementById('modalLinks');
const modalMatches = document.getElementById('modalMatches');
const modalMisses = document.getElementById('modalMisses');
const allFeatures = document.getElementById('allFeatures');
const terminalDetails = document.getElementById('terminalDetails');
const shift4Details = document.getElementById('shift4Details');
const specialBlocksSection = document.getElementById('specialBlocksSection');
const specialBlocksList = document.getElementById('specialBlocksList');

function escapeHTML(s){ 
  return String(s ?? "").replace(/[&<>\"']/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]
  )); 
}


/* ===== Rendering ===== */

function renderPrompt() {
  if (!promptEl || !promptTextEl) return;

  let msg = '';
  if (step === 1) {
    msg = 'What type of business are you working with today?';
  } else if (step === 2) {
    msg = `Select the needs/features for this ${bizType || 'business'}.`;
  } else if (step === 3) {
    msg = 'Here are your matches (highest score first). Tap a card to see details.';
  }

  promptTextEl.textContent = msg;
}


function renderStepper() {
  [...stepper.children].forEach((el, i) => {
    const idx = i + 1;
    const active = step === idx;
    const done = step > idx;
    el.className =
      "rounded-xl border px-4 py-3 font-medium transition-all duration-200 " +
      (active
        ? "border-cyan-400 bg-gradient-to-r from-blue-900 to-cyan-900 text-white shadow-lg pulse-glow"
        : done
        ? "border-blue-400 bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md"
        : "border-blue-600 glass text-slate-300");
  });
}

function makeTypeButton(label, icon) {
  const btn = document.createElement('button');
  btn.type = "button";
  btn.className =
    "btn-3d group flex w-full items-center gap-4 rounded-2xl modern-card p-6 transition-all duration-300 hover:scale-105";
  btn.onclick = () => { bizType = label; step = 2; render(); };

  const iconDiv = document.createElement('div');
  iconDiv.className = "text-3xl filter drop-shadow-lg";
  iconDiv.style.textShadow = "0 0 4px var(--neon-blue)";
  iconDiv.textContent = icon;

  const left = document.createElement('div');
  left.className = "flex-1 text-left";
  left.innerHTML = `
    <div class="font-bold text-xl text-white mb-1">${label}</div>
    <div class="text-sm text-slate-300">Tap to select this business type</div>
  `;

  const bullet = document.createElement('div');
  bullet.className = "h-6 w-6 rounded-full border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent";
  bullet.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.3)";

  btn.append(iconDiv, left, bullet);
  return btn;
}

function renderStep1() {
  step1.innerHTML = "";
  step1.classList.toggle('hidden', step !== 1);
  const map = { Restaurant: "🍕", Retail: "🏪", Service: "🔧", Ecommerce: "💻" };
  DATA.categories.forEach(t => step1.appendChild(makeTypeButton(t, map[t] || "💼")));
}

function renderStep2() {
  step2.classList.toggle('hidden', step !== 2);
  if (step !== 2) return;
  needsTitle.textContent = `What does this ${bizType} need?`;
  needsGrid.innerHTML = "";
  const menu = (DATA.features[bizType] || []);
  menu.forEach(f => {
    const label = document.createElement('label');
    label.className = "btn-3d flex cursor-pointer items-center gap-3 rounded-xl modern-card p-4 hover:scale-105 transition-all duration-200";

    const input = document.createElement('input');
    input.type = "checkbox";
    input.className = "h-5 w-5 rounded border-2 border-cyan-400 bg-transparent";
    input.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.3)";
    input.checked = selected.includes(f.label);
    input.onchange = () => {
      if (selected.includes(f.label)) selected = selected.filter(x => x !== f.label);
      else selected.push(f.label);
    };

    const span = document.createElement('span');
    span.className = "text-sm font-medium text-white";
    span.textContent = f.label;

    label.append(input, span);
    needsGrid.appendChild(label);
  });

  document.getElementById('selectAll').onclick = () => { selected = menu.map(m=>m.label); renderStep2(); };
  document.getElementById('clearAll').onclick = () => { selected = []; renderStep2(); };
  document.getElementById('backTo1').onclick = () => { step = 1; render(); };
  document.getElementById('toStep3').onclick  = () => { step = 3; render(); };
}

function scoreSolution(item) {
  if (selected.length === 0) return 100;

  const featLabelsMap = (DATA.features[item.category] || [])
    .reduce((acc, f) => { acc[f.id] = f.label; return acc; }, {});

  const overlap = (item.tags || [])
    .map(tag => featLabelsMap[tag] || null)
    .filter(Boolean)
    .filter(label => selected.includes(label)).length;

  return Math.round((overlap / Math.max(selected.length, 1)) * 100);
}


function makeSolutionCard(item, score) {
  const btn = document.createElement('button');
  btn.type = "button";
  btn.className = "text-left w-full";
  btn.onclick = () => openAnalysis(item);

  const card = document.createElement('div');
  card.className = "btn-3d rounded-2xl modern-card p-6 transition-all duration-300 hover:scale-105";

  const top = document.createElement('div');
  top.className = "mb-3 flex items-start justify-between gap-3";

  const title = document.createElement('h3');
  title.className = "text-lg font-bold text-white";
  title.textContent = item.name;

  const badge = document.createElement('span');
  badge.className = "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white";
  badge.style.background = "linear-gradient(135deg, #001122 0%, #003366 100%)";
  badge.style.border = "1px solid var(--neon-blue)";
  badge.style.boxShadow = "0 0 15px rgba(0, 191, 255, 0.3)";
  badge.textContent = item.category;

  top.append(title, badge);

  const desc = document.createElement('p');
  desc.className = "mb-4 text-sm text-slate-300 leading-relaxed";
  desc.textContent = item.summary;

  const ms = document.createElement('div');
  const scoreColor = score > 0 ? "text-green-400" : "text-red-400";
  const scoreGlow = score > 0 ? "0 0 20px rgba(34, 197, 94, 0.5)" : "0 0 20px rgba(255, 0, 0, 0.5)";
  const scoreBorder = score > 0 ? "1px solid #22c55e" : "1px solid #ef4444";
  ms.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${scoreColor}`;
  ms.style.background = "rgba(0, 0, 0, 0.8)";
  ms.style.border = scoreBorder;
  ms.style.boxShadow = scoreGlow;
  ms.innerHTML = `${score}% Match`;

  card.append(top, desc, ms);
  btn.appendChild(card);
  return btn;
}

function renderStep3() {
  step3.classList.toggle('hidden', step !== 3);
  if (step !== 3) return;
  solutionsGrid.innerHTML = "";
  const pool = DATA.solutions.filter(c => c.category === bizType);
  const scored = pool.map(item => ({ item, score: scoreSolution(item) }))
                     .sort((a,b) => b.score - a.score);
  if (scored.length === 0) {
    const empty = document.createElement('div');
    empty.className = "rounded-xl border border-slate-700 bg-slate-800 p-6 text-sm text-slate-300";
    empty.textContent = "No matches yet. Try adding or removing needs.";
    solutionsGrid.appendChild(empty);
  } else {
    scored.forEach(({item, score}) => solutionsGrid.appendChild(makeSolutionCard(item, score)));
  }
  adjustNeedsBtn.onclick = () => { step = 2; render(); };
}

/* ===== Modal control ===== */
function openAnalysis(item) {
  openSolution = item;

  modalTitle.textContent = item.name;
  modalLinks.innerHTML = "";
  if (item.links && item.links.product) {
    const a = document.createElement('a');
    a.href = item.links.product; a.target = "_blank"; a.rel = "noreferrer";
    a.className = "btn-3d rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200";
    a.style.background = "linear-gradient(135deg, #001122 0%, #003366 100%)";
    a.style.border = "1px solid var(--neon-blue)";
    a.style.boxShadow = "0 0 20px rgba(0, 191, 255, 0.3)";
    a.textContent = "Official Product Page ↗";
    modalLinks.appendChild(a);
  }
  if (item.links && item.links.paperwork) {
    const a2 = document.createElement('a');
    a2.href = item.links.paperwork; a2.target = "_blank"; a2.rel = "noreferrer";
    a2.className = "btn-3d rounded-lg glass px-4 py-2 text-sm font-bold text-white border border-cyan-400 hover:bg-cyan-500/20 transition-all duration-200";
    a2.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.3)";
    a2.textContent = "Paperwork ↗";
    modalLinks.appendChild(a2);
  }

  const featLabels = (DATA.features[item.category] || []).reduce((acc,f)=>{acc[f.id]=f.label;return acc;}, {});
  const matches = selected.filter(f => item.tags.map(t=>featLabels[t]).includes(f));
  const misses  = selected.filter(f => !item.tags.map(t=>featLabels[t]).includes(f));
  modalMatches.innerHTML = matches.length ? matches.map(f => `<li>${f}</li>`).join("") : "<li>No direct matches selected.</li>";
  modalMisses.innerHTML = selected.length ? misses.map(f => `<li>${f}</li>`).join("") : "<li>No needs selected.</li>";

  allFeatures.innerHTML = (item.tags || []).map(t =>
    `<span class="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-200">${featLabels[t]||t}</span>`
  ).join("");

  // Special Blocks (data-driven)
if (Array.isArray(item.specialBlocks) && item.specialBlocks.length) {
  specialBlocksList.innerHTML = item.specialBlocks.map(b => `
    <li class="rounded-lg border border-slate-700 p-3 text-sm">
      <div class="font-medium">${escapeHTML(b.name)}</div>
      <div class="text-xs text-slate-400">${escapeHTML(b.description)}</div>
      ${b.link ? `<a href="${escapeHTML(b.link)}" target="_blank" rel="noreferrer" class="mt-2 inline-block text-xs font-medium text-blue-300 underline">View product ↗</a>` : ``}
    </li>
  `).join("");
  specialBlocksSection.classList.remove('hidden');
} else {
  specialBlocksSection.classList.add('hidden');
  specialBlocksList.innerHTML = "";
}

// Hide old hardcoded blocks (now superseded)


  terminalDetails.classList.add('hidden');
  shift4Details.classList.add('hidden');

  modal.classList.remove('hidden'); modal.classList.add('flex');
  document.documentElement.classList.add('scroll-lock');
  document.body.classList.add('scroll-lock');
}
function closeModal() {
  modal.classList.add('hidden'); modal.classList.remove('flex');
  openSolution = null;
  document.documentElement.classList.remove('scroll-lock');
  document.body.classList.remove('scroll-lock');
}

/* ===== Wire events ===== */
document.getElementById('modalBackdrop').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
resetBtn.addEventListener('click', () => { step = 1; bizType = null; selected = []; render(); });

/* ===== Init ===== */
async function bootstrap() {
  // Check for app updates first
  checkForUpdates();
  
  DATA = await loadAppData();
  render();
}
function render(){ renderStepper(); renderStep1(); renderStep2(); renderStep3(); renderPrompt(); }
bootstrap();