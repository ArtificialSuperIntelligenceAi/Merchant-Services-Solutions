
// ======================================
// Main App Script (app.js)
// ======================================

// App version for cache busting
const APP_VERSION = '1.2.3';

// Browser history management for mobile back button support
let historyInitialized = false;

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

// Browser history management functions
function initializeBrowserHistory() {
  if (historyInitialized) return;
  
  // Listen for browser back/forward button
  window.addEventListener('popstate', handleBrowserNavigation);
  
  // Add initial state to history
  history.replaceState({ step: 1, searchMode: false, modalOpen: false }, '', '#step1');
  
  historyInitialized = true;
  console.log('📱 Browser history initialized for mobile back button support');
}

function handleBrowserNavigation(event) {
  if (!event.state) {
    // No state, go back to step 1
    goToStep(1);
    return;
  }
  
  const { step, searchMode, modalOpen } = event.state;
  
  // Check if modal should be open/closed
  if (modalOpen && !openSolution) {
    // Modal should be open but isn't - this shouldn't happen
    console.log('📱 Modal state mismatch - modal should be open');
  } else if (!modalOpen && openSolution) {
    // Modal should be closed but is open - close it via back button
    closeModalViaBackButton();
    return;
  }
  
  // Restore app state
  if (searchMode) {
    // Handle search mode restoration
    searchMode = true;
    searchQuery = '';
    renderSearchMode();
  } else {
    // Handle normal step navigation
    goToStep(step, true); // Skip history to avoid infinite loop
  }
}

function pushToHistory(step, searchMode = false, modalOpen = false) {
  const state = { step, searchMode, modalOpen };
  const url = searchMode ? '#search' : `#step${step}`;
  
  history.pushState(state, '', url);
  console.log(`📱 Pushed to history: step ${step}, searchMode: ${searchMode}, modalOpen: ${modalOpen}`);
}

function clearHistory() {
  // Clear browser history and reset to step 1
  history.replaceState({ step: 1, searchMode: false, modalOpen: false }, '', '#step1');
  console.log('📱 Browser history cleared');
}

// Navigation function that handles browser history
function goToStep(newStep, skipHistory = false) {
  step = newStep;
  
  if (!skipHistory && historyInitialized) {
    pushToHistory(step, searchMode, !!openSolution);
  }
  
  render();
}

function showErrorMessage(message) {
  // Create an error notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 glass text-white px-6 py-3 rounded-xl shadow-2xl z-50 text-sm border border-red-400';
  notification.style.background = 'linear-gradient(135deg, #4a1a1a 0%, #7a2a2a 100%)';
  notification.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg" style="text-shadow: 0 0 10px #ef4444;">⚠</span>
      <span class="font-bold">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white hover:bg-red-500/20 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200">×</button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Auto-remove after 8 seconds (longer for errors)
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 8000);
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
  } catch (error) {
    console.warn("Failed to load preview data:", error);
    // Clear corrupted preview data
    localStorage.removeItem('solutions_preview_enabled');
    localStorage.removeItem('solutions_preview_data');
  }
  
  // Use cache-busting URL for the JSON data
  const cacheBustedUrl = getCacheBustingUrl('data/solutions.json');
  try {
    const res = await fetch(cacheBustedUrl, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load data: ${res.status} ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Failed to load app data:", error);
    // Show user-friendly error message
    showErrorMessage("Failed to load application data. Please refresh the page or try again later.");
    throw error;
  }
}

/* ===== State ===== */
let step = 1;
let bizType = null;
let selected = [];
let openSolution = null;
let DATA = null;
let searchMode = false;
let searchQuery = '';

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

// Search elements
const searchModeBtn = document.getElementById('searchModeBtn');
const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchResults = document.getElementById('searchResults');

function escapeHTML(s){ 
  return String(s ?? "").replace(/[&<>\"']/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]
  )); 
}


/* ===== Rendering ===== */

function renderPrompt() {
  if (!promptEl || !promptTextEl) return;

  let msg = '';
  if (searchMode) {
    msg = searchQuery ? `Search results for "${searchQuery}"` : 'Enter a keyword to search for solutions';
  } else if (step === 1) {
    msg = 'What type of business are you working with today?';
  } else if (step === 2) {
    msg = `Select the needs/features for this ${bizType || 'business'}.`;
  } else if (step === 3) {
    msg = 'Here are your matches (highest score first). Tap a card to see details.';
  }

  promptTextEl.textContent = msg;
}


function renderStepper() {
  if (!stepper) return;
  
  [...stepper.children].forEach((el, i) => {
    const idx = i + 1;
    const active = step === idx;
    const done = step > idx;
    el.className =
      "step-chev flex-1 border font-medium transition-all duration-200 " +
      (active
        ? "active border-cyan-400 bg-gradient-to-r from-blue-900 to-cyan-900 text-white shadow-lg pulse-glow"
        : done
        ? "inactive border-blue-400 bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md"
        : "inactive border-blue-600 glass text-slate-300");
  });
}

function makeTypeButton(label, icon) {
  const btn = document.createElement('button');
  btn.type = "button";
  btn.className =
    "btn-3d group flex w-full items-center gap-4 rounded-2xl modern-card p-6 transition-all duration-300 hover:scale-105";
  btn.onclick = () => { bizType = label; goToStep(2); };

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
  if (!step1 || !DATA?.categories) return;
  
  step1.innerHTML = "";
  step1.classList.toggle('hidden', step !== 1);
  const map = { Restaurant: "🍕", Retail: "🏪", Service: "🔧", Ecommerce: "💻" };
  DATA.categories.forEach(t => step1.appendChild(makeTypeButton(t, map[t] || "💼")));
}

function renderStep2() {
  if (!step2 || !needsTitle || !needsGrid) return;
  
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
  document.getElementById('backTo1').onclick = () => { goToStep(1); };
  document.getElementById('toStep3').onclick  = () => { goToStep(3); };
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


function makeSolutionCard(item, score, searchMatches = null) {
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
  
  if (searchMode && searchMatches !== null) {
    // Search mode: show keyword match count
    const matchCount = searchMatches;
    const scoreColor = matchCount > 0 ? "text-cyan-400" : "text-slate-400";
    const scoreGlow = matchCount > 0 ? "0 0 20px rgba(0, 191, 255, 0.5)" : "0 0 20px rgba(148, 163, 184, 0.3)";
    const scoreBorder = matchCount > 0 ? "1px solid #00bfff" : "1px solid #94a3b8";
    ms.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${scoreColor}`;
    ms.style.background = "rgba(0, 0, 0, 0.8)";
    ms.style.border = scoreBorder;
    ms.style.boxShadow = scoreGlow;
    ms.innerHTML = matchCount > 0 ? `"${searchQuery}" mentioned ${matchCount} time${matchCount > 1 ? 's' : ''}` : 'No matches';
  } else {
    // Normal mode: show percentage match
    const scoreColor = score > 0 ? "text-green-400" : "text-red-400";
    const scoreGlow = score > 0 ? "0 0 20px rgba(34, 197, 94, 0.5)" : "0 0 20px rgba(255, 0, 0, 0.5)";
    const scoreBorder = score > 0 ? "1px solid #22c55e" : "1px solid #ef4444";
    ms.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${scoreColor}`;
    ms.style.background = "rgba(0, 0, 0, 0.8)";
    ms.style.border = scoreBorder;
    ms.style.boxShadow = scoreGlow;
    ms.innerHTML = `${score}% Match`;
  }

  card.append(top, desc, ms);
  btn.appendChild(card);
  return btn;
}

function renderStep3() {
  if (!step3 || !solutionsGrid || !adjustNeedsBtn) return;
  
  step3.classList.toggle('hidden', step !== 3);
  if (step !== 3) return;
  solutionsGrid.innerHTML = "";
  
  // Show/hide "Adjust Needs" button based on mode
  if (searchMode) {
    adjustNeedsBtn.style.display = 'none';
  } else {
    adjustNeedsBtn.style.display = 'inline-block';
    adjustNeedsBtn.onclick = () => { goToStep(2); };
  }
  
  if (searchMode) {
    // Search mode: show search results
    const results = performSearch(searchQuery);
    if (results.length === 0) {
      const empty = document.createElement('div');
      empty.className = "rounded-xl border border-slate-700 bg-slate-800 p-6 text-sm text-slate-300";
      empty.textContent = searchQuery ? `No solutions found for "${searchQuery}". Try a different keyword.` : "Enter a keyword to search for solutions.";
      solutionsGrid.appendChild(empty);
    } else {
      results.forEach(({item, matches}) => solutionsGrid.appendChild(makeSolutionCard(item, 0, matches)));
    }
  } else {
    // Normal mode: show category-based results
    const pool = (DATA.solutions || []).filter(c => c.category === bizType);
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
  }
}

/* ===== Search Functions ===== */
function performSearch(query) {
  if (!query || !DATA?.solutions) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const results = [];
  
  DATA.solutions.forEach(solution => {
    let matchCount = 0;
    
    // Search in name
    matchCount += (solution.name?.toLowerCase().split(searchTerm).length - 1) || 0;
    
    // Search in summary
    matchCount += (solution.summary?.toLowerCase().split(searchTerm).length - 1) || 0;
    
    // Search in details
    if (Array.isArray(solution.details)) {
      solution.details.forEach(detail => {
        matchCount += (detail.toLowerCase().split(searchTerm).length - 1) || 0;
      });
    }
    
    // Search in feature labels (convert tags to labels)
    if (Array.isArray(solution.tags)) {
      const featLabels = (DATA.features[solution.category] || [])
        .reduce((acc, f) => { acc[f.id] = f.label; return acc; }, {});
      
      solution.tags.forEach(tag => {
        const label = featLabels[tag];
        if (label) {
          matchCount += (label.toLowerCase().split(searchTerm).length - 1) || 0;
        }
      });
    }
    
    // Search in special blocks
    if (Array.isArray(solution.specialBlocks)) {
      solution.specialBlocks.forEach(block => {
        matchCount += (block.name?.toLowerCase().split(searchTerm).length - 1) || 0;
        matchCount += (block.description?.toLowerCase().split(searchTerm).length - 1) || 0;
      });
    }
    
    if (matchCount > 0) {
      results.push({ item: solution, matches: matchCount });
    }
  });
  
  // Sort by match count (highest first)
  return results.sort((a, b) => b.matches - a.matches);
}

function toggleSearchMode() {
  searchMode = !searchMode;
  
  if (searchMode) {
    // Enter search mode
    searchContainer.classList.remove('hidden');
    searchInput.focus();
    goToStep(3); // Go directly to results
    searchModeBtn.textContent = '📋 Guided';
    searchModeBtn.style.background = 'linear-gradient(135deg, #4a1a1a 0%, #7a2a2a 100%)';
  } else {
    // Exit search mode
    searchContainer.classList.add('hidden');
    searchQuery = '';
    searchInput.value = '';
    searchResults.textContent = '';
    goToStep(1); // Go back to start
    searchModeBtn.textContent = '🔍 Search';
    searchModeBtn.style.background = '';
  }
  
  render();
}

function handleSearch() {
  searchQuery = searchInput.value.trim();
  
  if (searchQuery) {
    const results = performSearch(searchQuery);
    searchResults.textContent = `Found ${results.length} solution${results.length !== 1 ? 's' : ''} with "${searchQuery}"`;
    goToStep(3); // Show results
  } else {
    searchResults.textContent = '';
    goToStep(3); // Show empty state
  }
  
  render();
}

function clearSearch() {
  searchInput.value = '';
  searchQuery = '';
  searchResults.textContent = '';
  goToStep(3); // Show empty state
  render();
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
  
  // Add modal state to browser history
  if (historyInitialized) {
    pushToHistory(step, searchMode, true);
  }
}
function closeModal() {
  modal.classList.add('hidden'); modal.classList.remove('flex');
  openSolution = null;
  document.documentElement.classList.remove('scroll-lock');
  document.body.classList.remove('scroll-lock');
  
  // Update browser history to reflect modal is closed
  if (historyInitialized) {
    pushToHistory(step, searchMode, false);
  }
}

function closeModalViaBackButton() {
  modal.classList.add('hidden'); modal.classList.remove('flex');
  openSolution = null;
  document.documentElement.classList.remove('scroll-lock');
  document.body.classList.remove('scroll-lock');
  
  // Don't push new history - we're going back to previous state
  console.log('📱 Modal closed via back button');
}

/* ===== Wire events ===== */
document.getElementById('modalBackdrop').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
resetBtn.addEventListener('click', () => { 
  step = 1; 
  bizType = null; 
  selected = []; 
  searchMode = false;
  clearHistory();
  searchQuery = '';
  searchContainer.classList.add('hidden');
  searchInput.value = '';
  searchResults.textContent = '';
  searchModeBtn.textContent = '🔍 Search';
  searchModeBtn.style.background = '';
  render(); 
});

// Search event listeners
if (searchModeBtn) {
  searchModeBtn.addEventListener('click', toggleSearchMode);
}
if (searchInput) {
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
}
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', clearSearch);
}

/* ===== Init ===== */
async function bootstrap() {
  try {
    // Check for app updates first
    checkForUpdates();
    
    // Initialize browser history for mobile back button support
    initializeBrowserHistory();
    
    DATA = await loadAppData();
    render();
  } catch (error) {
    console.error("Failed to bootstrap app:", error);
    // Show error state in the UI
    showAppErrorState();
  }
}

function showAppErrorState() {
  // Hide all steps and show error message
  step1.classList.add('hidden');
  step2.classList.add('hidden');
  step3.classList.add('hidden');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'text-center py-12';
  errorDiv.innerHTML = `
    <div class="glass rounded-2xl p-8 max-w-md mx-auto">
      <div class="text-6xl mb-4">⚠️</div>
      <h2 class="text-xl font-bold text-white mb-4">Unable to Load Application</h2>
      <p class="text-slate-300 mb-6">There was a problem loading the application data. This could be due to a network issue or server problem.</p>
      <button onclick="location.reload()" class="btn-3d rounded-xl px-6 py-3 text-lg font-bold text-white transition-all duration-200" style="background: linear-gradient(135deg, #001122 0%, #003366 100%); border: 2px solid var(--neon-blue); box-shadow: 0 0 25px rgba(0, 191, 255, 0.4);">
        Try Again
      </button>
    </div>
  `;
  
  // Insert error message after the header
  const header = document.querySelector('header');
  header.insertAdjacentElement('afterend', errorDiv);
}
function render(){ renderStepper(); renderStep1(); renderStep2(); renderStep3(); renderPrompt(); }
bootstrap();