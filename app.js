/**
 * =====================================================
 *  FRUIT SCANNER — app.js
 *  TensorFlow.js powered fruit recognition app
 *  Mobile-first, Android-style UI
 * =====================================================
 */

'use strict';

// ── STATE ──────────────────────────────────────────
const state = {
  model: null,
  labels: [],
  inputSize: 224,         // default; overridden by metadata
  currentPage: 'home',
  prevPage: null,
  cameraStream: null,
  facingMode: 'environment',
  currentScanData: null,  // { imageDataURL, fruit, confidence, topPreds }
  scanSaved: false,
};

// ── FRUIT EMOJI MAP ────────────────────────────────
const FRUIT_EMOJI = {
  apple: '🍎', banana: '🍌', orange: '🍊', grape: '🍇',
  mango: '🥭', strawberry: '🍓', watermelon: '🍉', pineapple: '🍍',
  lemon: '🍋', cherry: '🍒', peach: '🍑', pear: '🍐',
  kiwi: '🥝', coconut: '🥥', blueberry: '🫐', fig: '🫐',
  pomegranate: '🍎', papaya: '🥭', lime: '🍋', avocado: '🥑',
  guava: '🍈', dragonfruit: '🐉', jackfruit: '🍈', lychee: '🍈',
  passion: '🍈', plum: '🫐', raspberry: '🫐', blackberry: '🫐',
  tomato: '🍅', default: '🍑',
};

function getFruitEmoji(name = '') {
  const key = name.toLowerCase().replace(/\s+/g, '');
  for (const k in FRUIT_EMOJI) {
    if (key.includes(k)) return FRUIT_EMOJI[k];
  }
  return FRUIT_EMOJI.default;
}

// ── FRUIT KNOWLEDGE DATABASE ──────────────────────
const FRUIT_INFO = {
  apple: {
    benefits: [
      'Rich in dietary fiber (pectin) that supports healthy digestion',
      'Contains antioxidants like quercetin and catechin that reduce oxidative stress',
      'Supports heart health by lowering LDL cholesterol levels',
      'Helps regulate blood sugar due to its low glycemic index',
      'Boosts immune function through Vitamin C content',
      'Promotes gut microbiome health and reduces inflammation',
    ],
    pros: [
      'Low in calories (~95 cal per medium apple)',
      'Widely available year-round and affordable',
      'Naturally sweet — great healthy snack replacement for sugar cravings',
      'High water content (~86%) keeps you hydrated',
      'Long shelf life compared to most fruits',
    ],
    cons: [
      'Apple skin may contain pesticide residue — always wash thoroughly',
      'High in natural sugars (fructose) — moderation advised for diabetics',
      'Seeds contain amygdalin which can release cyanide — avoid eating seeds',
      'Can cause bloating in people with IBS due to fructose content',
      'Acidic nature may erode tooth enamel if consumed excessively',
    ],
    cautions: [
      'Diabetics should monitor portion size — 1 medium apple per serving',
      'People with fructose malabsorption should limit intake',
      'Those on blood-thinning medications: Vitamin K content may interact',
      'Rinse thoroughly to reduce pesticide residue, or choose organic',
      'Cutting and leaving apple exposed to air causes browning (oxidation) — eat fresh',
    ],
    avoid: [
      '🩸 People with fructose intolerance or hereditary fructose malabsorption',
      '💊 Those taking certain medications that interact with Vitamin K',
      '🦷 People with severe enamel erosion should limit frequency',
      '🤰 Apple seeds must never be consumed — especially dangerous for children',
      '🫁 People allergic to Rosaceae family fruits (peach, pear, cherry cross-reactivity)',
    ],
  },

  banana: {
    benefits: [
      'Excellent source of potassium — supports heart function and blood pressure',
      'Rich in Vitamin B6 which aids brain health and serotonin production',
      'Provides quick natural energy — ideal pre/post-workout snack',
      'Contains resistant starch (in unripe bananas) that feeds beneficial gut bacteria',
      'High magnesium content supports muscle function and sleep quality',
      'Dopamine and catechins act as powerful antioxidants',
    ],
    pros: [
      'One of the most affordable and accessible fruits globally',
      'Comes in natural packaging — no washing needed for the flesh',
      'Versatile — eaten raw, blended, baked, or frozen',
      'Filling due to fiber content, helps reduce overeating',
      'Natural antacid effect — may soothe acid reflux and heartburn',
    ],
    cons: [
      'High glycemic index (ripe bananas) — causes rapid blood sugar spike',
      'Relatively high in calories (~105 per banana) compared to other fruits',
      'Overripe bananas are very high in sugar',
      'May cause constipation if eaten in large amounts (unripe)',
      'Not suitable as a standalone meal — lacks protein and fat',
    ],
    cautions: [
      'Diabetics should prefer unripe/green bananas with lower GI',
      'People with kidney disease: high potassium may worsen kidney function',
      'Migraine sufferers: tyramine in bananas may trigger headaches',
      'Do not eat more than 2–3 bananas per day',
      'Banana peels contain latex — those with latex allergy should be careful',
    ],
    avoid: [
      '🩺 People with chronic kidney disease (CKD) — high potassium risk',
      '💊 Those taking beta-blockers — potassium overload risk',
      '🩸 Uncontrolled type 2 diabetics — especially ripe bananas',
      '🤧 People with latex-fruit syndrome (latex allergy cross-reaction)',
      '🫀 Anyone advised to follow a low-potassium diet by their doctor',
    ],
  },

  pineapple: {
    benefits: [
      'Contains bromelain — a powerful enzyme with anti-inflammatory properties',
      'Rich in Vitamin C — boosts immunity and collagen production',
      'Aids digestion by breaking down protein-rich foods efficiently',
      'High manganese content supports bone strength and metabolism',
      'May reduce symptoms of osteoarthritis due to bromelain',
      'Antioxidants help neutralize free radicals and fight chronic disease',
    ],
    pros: [
      'Naturally sweet and satisfying with relatively low calorie count',
      'Bromelain acts as a natural meat tenderizer',
      'Good source of thiamine (B1) supporting energy metabolism',
      'High water content helps with hydration',
      'Anti-nausea properties — may help with motion sickness',
    ],
    cons: [
      'Very acidic — can cause mouth sores, tongue irritation if eaten excessively',
      'Bromelain can cause allergic reactions in sensitive individuals',
      'High natural sugar content — not ideal for blood sugar management',
      'May interact with blood-thinning medications',
      'Canned pineapple often loses much of its bromelain benefit',
    ],
    cautions: [
      'Pregnant women should avoid large amounts — bromelain may stimulate contractions',
      'Rinse mouth with water after eating to protect tooth enamel from acidity',
      'People on blood thinners (warfarin, aspirin) consult doctor before large intake',
      'Limit to 1 cup per day to avoid digestive upset from bromelain',
      'Do not apply pineapple directly to skin for extended periods — enzyme irritation',
    ],
    avoid: [
      '🤰 Pregnant women — especially in first trimester (large amounts of bromelain)',
      '💊 People taking anticoagulants (blood thinners)',
      '🦷 Those with mouth ulcers or oral sensitivity',
      '🩸 Diabetics should monitor portion carefully',
      '🤧 Anyone with known bromelain or pineapple allergy',
    ],
  },

  cucumber: {
    benefits: [
      'Composed of ~96% water — one of the most hydrating foods available',
      'Low in calories (~16 cal per 100g) — excellent for weight management',
      'Contains cucurbitacins that have anti-inflammatory and anti-cancer properties',
      'Rich in Vitamin K supporting bone density and blood clotting',
      'Silica content promotes healthy skin, hair, and nail growth',
      'Antioxidants like beta-carotene and flavonoids reduce oxidative stress',
    ],
    pros: [
      'Virtually zero fat and very low sugar — safe for most diets',
      'Natural cooling effect — reduces body heat, great in hot weather',
      'Alkaline-forming food that helps balance body pH',
      'Excellent for skin hydration when consumed or applied topically',
      'High in B vitamins supporting nerve function and energy',
    ],
    cons: [
      'Very low in protein, fat, and most macronutrients — limited nutritional density',
      'Skin may contain pesticides — peel or wash thoroughly',
      'Can cause bloating and gas in some people due to cucurbitacins',
      'Bitter varieties contain higher cucurbitacin levels that cause digestive upset',
      'Not a complete nutrition source — must be paired with other foods',
    ],
    cautions: [
      'People with sensitive digestive systems may experience bloating',
      'Those on blood-thinning medications: Vitamin K content can affect efficacy',
      'Avoid bitter-tasting cucumbers — high cucurbitacin may cause nausea',
      'Store-bought cucumbers may be wax-coated — peel before eating',
      'Those with kidney issues should moderate — mild diuretic effect',
    ],
    avoid: [
      '💊 People on warfarin or blood thinners (high Vitamin K)',
      '🫁 Those with known cucumber or gourd family allergy',
      '🫃 People prone to acid reflux may find cucumber triggers symptoms',
      '🚰 Those advised to restrict fluid intake (certain kidney/heart conditions)',
      '⚠️ Never eat unusually bitter cucumbers — toxicity risk',
    ],
  },

  orange: {
    benefits: [
      'Outstanding Vitamin C source — one orange provides ~117% of daily requirement',
      'Flavonoids like hesperidin reduce blood pressure and inflammation',
      'Folate content supports healthy cell division and fetal development',
      'Supports iron absorption when consumed with iron-rich foods',
      'Pectin fiber promotes gut health and reduces cholesterol',
      'Thiamine supports energy metabolism and nervous system function',
    ],
    pros: [
      'Widely available, affordable, and portable',
      'Natural sweetness with high water content (~87%) for hydration',
      'Immune-boosting properties well-documented',
      'Low glycemic index — slower sugar release than many fruits',
      'Peel contains more flavonoids than the fruit — useful in cooking/zesting',
    ],
    cons: [
      'High acidity can aggravate GERD, heartburn, or mouth ulcers',
      'Orange juice lacks fiber and spikes blood sugar faster than whole fruit',
      'Can interfere with certain medications (less than grapefruit but still notable)',
      'Overconsumption may cause diarrhea due to high Vitamin C',
      'Teeth enamel can erode with frequent consumption of juice',
    ],
    cautions: [
      'People with GERD or acid reflux should limit intake',
      'Diabetics should choose whole orange over juice for fiber benefit',
      'Rinse mouth after eating to protect tooth enamel',
      'Those with kidney stones: moderate oxalate intake',
      'Consult doctor if taking statins or other medications — mild CYP interaction',
    ],
    avoid: [
      '🔥 People with severe GERD, gastritis, or stomach ulcers',
      '🦷 Those with severe enamel sensitivity should limit juice',
      '🩸 Diabetics who drink orange juice without monitoring blood sugar',
      '💊 People on certain medications sensitive to citrus compounds',
      '🤧 Those with citrus fruit allergies (rare but possible)',
    ],
  },

  strawberry: {
    benefits: [
      'Exceptionally high in Vitamin C — one cup provides 149% daily requirement',
      'Anthocyanins give strong antioxidant and anti-inflammatory effects',
      'May improve HDL (good) cholesterol and lower blood pressure',
      'Ellagic acid has shown anti-cancer properties in research studies',
      'Supports blood sugar regulation due to low glycemic index',
      'Folate supports brain health and reduces risk of neural tube defects',
    ],
    pros: [
      'Low calorie (~49 cal per cup) and low sugar compared to most fruits',
      'Bright flavor profile makes healthy eating enjoyable',
      'Versatile — fresh, frozen, blended, baked',
      'High in fiber supporting gut regularity',
      'Rich in potassium and magnesium for heart and muscle health',
    ],
    cons: [
      'Among the highest pesticide residue fruits — always buy organic if possible',
      'Can trigger allergic reactions including oral allergy syndrome',
      'Perishable — short shelf life even when refrigerated',
      'High oxalate content may contribute to kidney stones',
      'Acidic nature may irritate sensitive stomachs or mouth sores',
    ],
    cautions: [
      'Wash thoroughly under running water before eating — high pesticide crop',
      'People prone to kidney stones should moderate due to oxalates',
      'Oral allergy syndrome sufferers may react (itchy mouth/throat)',
      'Those with eczema: some people report skin flare-ups',
      'Avoid if taking MAO inhibitors — amine content interaction risk',
    ],
    avoid: [
      '🤧 People with known strawberry or tree pollen allergy (cross-reaction)',
      '🫁 Those with oral allergy syndrome related to birch pollen',
      '🩺 Kidney stone formers should limit (high in oxalates)',
      '💊 People on MAO inhibitor antidepressants',
      '🔴 Infants under 12 months — potential allergy trigger in early introduction',
    ],
  },
};

// ── DOM HELPERS ────────────────────────────────────
const $ = (id) => document.getElementById(id);
const show = (id) => $(id) && $(id).classList.remove('hidden');
const hide = (id) => $(id) && $(id).classList.add('hidden');

// ── STATUS BAR CLOCK ──────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const el = $('status-time');
  if (el) el.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 10000);

// ── SPLASH SCREEN ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const splash = $('splash-screen');
  // Let the loader animation play (≈2.4s), then transition
  setTimeout(() => {
    splash.classList.add('splash-exit');
    setTimeout(() => {
      splash.style.display = 'none';
      show('app');
      $('app').classList.remove('hidden');
    }, 550);
  }, 2600);

  // Start async init
  initApp();
});

// ── APP INIT ──────────────────────────────────────
async function initApp() {
  renderHomeRecent();
  renderHistory();
  await loadModel();
}

// ── MODEL LOADING ─────────────────────────────────
async function loadModel() {
  const overlay = $('model-loading-overlay');
  const badge = $('model-status-badge');
  const badgeDot = badge.querySelector('.badge-dot');
  const badgeText = badge.querySelector('span');

  try {
    // Load metadata first to get labels and input size
    let metadataLoaded = false;
    try {
      const metaResp = await fetch('metadata.json');
      if (metaResp.ok) {
        const meta = await metaResp.json();
        // Teachable Machine format
        state.labels = meta.labels || [];
        state.inputSize = meta.imageSize || 224;
        metadataLoaded = true;
        console.log('[FruitScan] Metadata loaded:', state.labels);
      }
    } catch (e) {
      console.warn('[FruitScan] metadata.json not found, using demo labels.');
    }

    // If no metadata, use demo labels
    if (!metadataLoaded || state.labels.length === 0) {
      state.labels = [
        'Apple', 'Banana', 'Orange', 'Grape', 'Mango',
        'Strawberry', 'Watermelon', 'Pineapple', 'Lemon', 'Cherry'
      ];
      console.log('[FruitScan] Using demo labels:', state.labels);
    }

    // Try to load TF model
    try {
      state.model = await tf.loadLayersModel('model/model.json');
      console.log('[FruitScan] Model loaded successfully.');
    } catch (e) {
      console.warn('[FruitScan] model/model.json not found. Running in demo mode.');
      state.model = null; // demo mode
    }

    // Ready
    hide('model-loading-overlay');
    badgeDot.className = 'badge-dot ready';
    badgeText.textContent = state.model ? 'AI Ready' : 'Demo Mode';

  } catch (err) {
    console.error('[FruitScan] Model load error:', err);
    hide('model-loading-overlay');
    badgeDot.className = 'badge-dot error';
    badgeText.textContent = 'AI Error';
    showToast('Model failed to load. Running in demo mode.', 'error');
  }
}

// ── PREDICTION ────────────────────────────────────
/**
 * Run inference on an HTMLImageElement or HTMLCanvasElement or HTMLVideoElement.
 * Returns { topLabel, confidence, predictions: [{label, prob}] }
 */
async function runPrediction(imageElement) {
  // DEMO MODE — no real model
  if (!state.model) {
    await sleep(700 + Math.random() * 500);
    const labels = state.labels;
    // Generate plausible fake predictions
    const probs = generateDemoProbabilities(labels.length);
    const sorted = probs
      .map((p, i) => ({ label: labels[i], prob: p }))
      .sort((a, b) => b.prob - a.prob);
    return {
      topLabel: sorted[0].label,
      confidence: sorted[0].prob,
      predictions: sorted.slice(0, 3),
    };
  }

  // REAL INFERENCE ─────────────────────────────────
  return tf.tidy(() => {
    // 1. Convert to tensor
    let tensor = tf.browser.fromPixels(imageElement);

    // 2. Resize to model input size
    tensor = tf.image.resizeBilinear(tensor, [state.inputSize, state.inputSize]);

    // 3. Normalize [0, 255] → [0, 1]  (Teachable Machine style)
    tensor = tensor.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1.0));

    // 4. Add batch dimension
    tensor = tensor.expandDims(0);

    // 5. Run model
    const outputTensor = state.model.predict(tensor);
    const probabilities = outputTensor.dataSync();

    // 6. Map to labels
    const predictions = Array.from(probabilities)
      .map((prob, i) => ({ label: state.labels[i] || `Class ${i}`, prob }))
      .sort((a, b) => b.prob - a.prob);

    return {
      topLabel: predictions[0].label,
      confidence: predictions[0].prob,
      predictions: predictions.slice(0, 3),
    };
  });
}

function generateDemoProbabilities(n) {
  // Produce realistic-looking softmax output
  const raw = Array.from({ length: n }, () => Math.random() * 2);
  const max = Math.max(...raw);
  // Make one dominant
  raw[Math.floor(Math.random() * n)] = max + 2 + Math.random() * 2;
  const expArr = raw.map(v => Math.exp(v - Math.max(...raw)));
  const sum = expArr.reduce((a, b) => a + b, 0);
  return expArr.map(v => v / sum);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── FRUIT INFO PANEL ──────────────────────────────
/**
 * Get fruit info data by fruit name key.
 */
function getFruitInfo(fruitName) {
  const key = fruitName.toLowerCase().replace(/\s+/g, '');
  for (const k in FRUIT_INFO) {
    if (key.includes(k)) return FRUIT_INFO[k];
  }
  return null;
}

/**
 * Render info panel inside upload result card.
 */
function renderFruitInfoPanel(fruitName) {
  const info = getFruitInfo(fruitName);
  const panel = $('fruit-info-panel');
  if (!info || !panel) return;

  // Reset to first tab
  panel.querySelectorAll('.info-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  renderInfoTabContent('benefits', info, $('info-tab-content'));
  panel.classList.remove('hidden');
}

/**
 * Switch tab inside upload info panel.
 */
function switchInfoTab(tab, btn) {
  const fruitName = $('result-fruit-name').textContent;
  const info = getFruitInfo(fruitName);
  if (!info) return;

  document.querySelectorAll('#fruit-info-panel .info-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderInfoTabContent(tab, info, $('info-tab-content'));
}

/**
 * Render tab content (shared by panel and modal).
 */
function renderInfoTabContent(tab, info, container) {
  if (!container || !info) return;
  const items = info[tab] || [];
  const colors = {
    benefits: { bg: '#F0FDF4', border: '#86EFAC', dot: '#16A34A', icon: '✅' },
    pros:     { bg: '#EFF6FF', border: '#93C5FD', dot: '#2563EB', icon: '👍' },
    cons:     { bg: '#FFF7ED', border: '#FDba74', dot: '#EA580C', icon: '👎' },
    cautions: { bg: '#FFFBEB', border: '#FCD34D', dot: '#D97706', icon: '⚠️' },
    avoid:    { bg: '#FFF1F2', border: '#FCA5A5', dot: '#DC2626', icon: '🚫' },
  };
  const c = colors[tab] || colors.benefits;
  container.innerHTML = `
    <div class="info-items" style="background:${c.bg};border-color:${c.border}">
      ${items.map(item => `
        <div class="info-item">
          <span class="info-dot" style="background:${c.dot}"></span>
          <span class="info-text">${item}</span>
        </div>
      `).join('')}
    </div>`;
}

// ── FRUIT INFO MODAL (camera result) ─────────────
function openFruitInfoFromCamera() {
  const fruitName = $('cam-result-name').textContent;
  const conf = $('cam-result-conf').textContent;
  const emoji = getFruitEmoji(fruitName);
  const info = getFruitInfo(fruitName);

  $('modal-emoji').textContent = emoji;
  $('modal-name').textContent = fruitName;
  $('modal-conf').textContent = `${conf} confidence`;

  // Reset tabs
  document.querySelectorAll('#fruit-modal .info-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  renderInfoTabContent('benefits', info || {}, $('modal-tab-content'));

  if (!info) {
    $('modal-tab-content').innerHTML = `<div class="no-info-msg">No detailed info available for this fruit.</div>`;
  }

  show('fruit-modal-overlay');
  document.getElementById('fruit-modal-overlay').classList.remove('hidden');
  // Animate in
  setTimeout(() => $('fruit-modal').classList.add('modal-open'), 10);
}

function switchModalTab(tab, btn) {
  const fruitName = $('modal-name').textContent;
  const info = getFruitInfo(fruitName);

  document.querySelectorAll('#fruit-modal .info-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderInfoTabContent(tab, info || {}, $('modal-tab-content'));
}

function closeFruitModal(event) {
  if (event && event.target !== $('fruit-modal-overlay')) return;
  $('fruit-modal').classList.remove('modal-open');
  setTimeout(() => hide('fruit-modal-overlay'), 280);
}

// ── NAVIGATION ────────────────────────────────────
function navigateTo(page) {
  if (page === state.currentPage) return;

  const prevEl = $(`page-${state.currentPage}`);
  const nextEl = $(`page-${page}`);
  if (!nextEl) return;

  // Stop camera if leaving camera page
  if (state.currentPage === 'camera' && page !== 'camera') {
    stopCamera();
  }

  // Start camera if entering camera page
  if (page === 'camera') {
    // slight delay for DOM
    setTimeout(() => startCamera(), 80);
  }

  // Animate out
  if (prevEl) {
    prevEl.classList.remove('active');
    prevEl.classList.add('slide-out');
    setTimeout(() => prevEl.classList.remove('slide-out'), 350);
  }

  // Animate in
  nextEl.classList.add('active');

  // Nav bar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  state.prevPage = state.currentPage;
  state.currentPage = page;

  // Page-specific logic
  if (page === 'history') renderHistory();
  if (page === 'home') renderHomeRecent();
}

// ── CAMERA ────────────────────────────────────────
async function startCamera() {
  const video = $('camera-video');
  const hint  = $('camera-hint');

  // Stop existing stream first
  stopCamera();
  hide('camera-denied');
  hide('camera-result-overlay');

  // Show "starting" hint while camera initialises
  if (hint) { hint.textContent = 'Starting camera…'; hint.style.display = ''; }

  const constraints = {
    video: {
      facingMode: { ideal: state.facingMode },
      width:  { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.cameraStream = stream;
    video.srcObject = stream;

    // Wait until the video has actual frame dimensions
    await new Promise((resolve) => {
      if (video.readyState >= 2) { resolve(); return; }
      video.addEventListener('loadeddata', resolve, { once: true });
      video.addEventListener('canplay',    resolve, { once: true });
    });

    video.play().catch(() => {});
    hide('camera-denied');
    if (hint) hint.textContent = 'Center the fruit in the frame';

  } catch (err) {
    console.error('[FruitScan] Camera error:', err);
    show('camera-denied');
    if (hint) hint.style.display = 'none';
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  const video = $('camera-video');
  if (video) { video.srcObject = null; }
}

function flipCamera() {
  state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
  startCamera();
}

async function captureAndPredict() {
  const video = $('camera-video');
  const btn = $('shutter-btn');

  // Guard: stream must be active
  if (!video.srcObject) {
    showToast('Camera not ready.', 'error');
    return;
  }

  // Guard: video must have actual frame data
  if (video.readyState < 2) {
    showToast('Camera is still starting…', 'error');
    return;
  }

  // Disable button immediately to prevent double-tap
  btn.style.opacity = '0.6';
  btn.style.pointerEvents = 'none';

  try {
    // Capture current video frame to canvas
    const w = video.videoWidth  || video.clientWidth  || 640;
    const h = video.videoHeight || video.clientHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    // Flash effect
    const flashEl = document.createElement('div');
    flashEl.style.cssText = `position:absolute;inset:0;background:#fff;opacity:0.55;pointer-events:none;transition:opacity 0.25s;z-index:5;`;
    $('camera-feed-container').appendChild(flashEl);
    setTimeout(() => {
      flashEl.style.opacity = '0';
      setTimeout(() => flashEl.remove(), 260);
    }, 40);

    const result = await runPrediction(canvas);
    showCameraResult(result, canvas.toDataURL('image/jpeg', 0.8));

  } catch (e) {
    console.error('[FruitScan] Predict error:', e);
    showToast('Prediction failed. Please try again.', 'error');
  } finally {
    // Always re-enable button
    btn.style.opacity = '';
    btn.style.pointerEvents = '';
  }
}

function showCameraResult(result, imageDataURL) {
  const emoji = getFruitEmoji(result.topLabel);
  const confPct = (result.confidence * 100).toFixed(1);

  $('cam-result-emoji').textContent = emoji;
  $('cam-result-name').textContent = result.topLabel;
  $('cam-result-conf').textContent = `${confPct}%`;

  show('camera-result-overlay');

  // Store for potential save
  state.currentScanData = {
    imageDataURL,
    fruit: result.topLabel,
    confidence: result.confidence,
    topPreds: result.predictions,
  };
  state.scanSaved = false;

  // Auto-save to history
  saveToHistory(state.currentScanData);

  // Dismiss after 3s, re-enable scanning
  setTimeout(() => {
    const ov = $('camera-result-overlay');
    if (ov && !ov.classList.contains('hidden')) {
      hide('camera-result-overlay');
    }
  }, 3500);
}

// ── UPLOAD ────────────────────────────────────────
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataURL = e.target.result;
    const img = new Image();
    img.onload = async () => {
      // Show preview
      const previewEl = $('upload-preview');
      previewEl.src = dataURL;
      show('upload-preview');
      hide('upload-placeholder');
      hide('upload-result-section');

      // Show analyzing
      show('analyzing-overlay');

      try {
        const result = await runPrediction(img);
        hide('analyzing-overlay');
        displayUploadResult(result, dataURL);
      } catch (err) {
        hide('analyzing-overlay');
        showToast('Analysis failed. Please try another image.', 'error');
        console.error(err);
      }
    };
    img.src = dataURL;
  };
  reader.readAsDataURL(file);

  // Reset input so the same file can be re-uploaded
  event.target.value = '';
}

function displayUploadResult(result, imageDataURL) {
  const emoji = getFruitEmoji(result.topLabel);
  const confPct = (result.confidence * 100).toFixed(1);

  $('result-emoji-big').textContent = emoji;
  $('result-fruit-name').textContent = result.topLabel;
  $('result-confidence-text').textContent = `Confidence: ${confPct}%`;

  // Animate confidence bar
  setTimeout(() => {
    $('confidence-bar-fill').style.width = `${confPct}%`;
  }, 100);

  // Top predictions
  const container = $('top-predictions');
  container.innerHTML = '';
  result.predictions.forEach((pred, i) => {
    const pct = (pred.prob * 100).toFixed(1);
    const div = document.createElement('div');
    div.className = 'pred-item';
    div.innerHTML = `
      <span class="pred-rank">#${i + 1}</span>
      <span class="pred-name">${pred.label}</span>
      <div class="pred-bar-wrap">
        <div class="pred-bar"><div class="pred-fill" style="width:0%" data-w="${pct}%"></div></div>
      </div>
      <span class="pred-pct">${pct}%</span>
    `;
    container.appendChild(div);
  });

  // Animate pred bars
  setTimeout(() => {
    container.querySelectorAll('.pred-fill').forEach(el => {
      el.style.width = el.dataset.w;
    });
  }, 200);

  show('upload-result-section');

  // Render fruit info panel
  renderFruitInfoPanel(result.topLabel);

  // Store
  state.currentScanData = {
    imageDataURL,
    fruit: result.topLabel,
    confidence: result.confidence,
    topPreds: result.predictions,
  };
  state.scanSaved = false;

  // Update save button
  const saveBtn = $('save-btn');
  saveBtn.textContent = '';
  saveBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13"/><polyline points="7 3 7 8 15 8"/></svg>
    Save Scan
  `;
  saveBtn.disabled = false;
}

function saveCurrentScan() {
  if (!state.currentScanData) return;
  if (state.scanSaved) { showToast('Already saved!'); return; }
  saveToHistory(state.currentScanData);
  state.scanSaved = true;

  const btn = $('save-btn');
  btn.innerHTML = `✅ Saved!`;
  btn.disabled = true;
}

function resetUpload() {
  hide('upload-preview');
  hide('upload-result-section');
  hide('fruit-info-panel');
  show('upload-placeholder');
  $('confidence-bar-fill').style.width = '0%';
  state.currentScanData = null;
  state.scanSaved = false;
  const saveBtn = $('save-btn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13"/><polyline points="7 3 7 8 15 8"/></svg>
      Save Scan
    `;
  }
}

// ── HISTORY ───────────────────────────────────────
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('fruitscan_history') || '[]');
  } catch { return []; }
}

function saveToHistory(scanData) {
  const history = getHistory();
  const entry = {
    id: Date.now(),
    fruit: scanData.fruit,
    confidence: scanData.confidence,
    imageDataURL: scanData.imageDataURL,
    timestamp: new Date().toISOString(),
  };
  history.unshift(entry); // newest first
  // Keep max 50 entries
  if (history.length > 50) history.splice(50);
  try {
    localStorage.setItem('fruitscan_history', JSON.stringify(history));
  } catch (e) {
    // localStorage might be full; remove oldest
    history.splice(40);
    localStorage.setItem('fruitscan_history', JSON.stringify(history));
  }
  // Refresh history page if open
  if (state.currentPage === 'history') renderHistory();
  renderHomeRecent();
}

function deleteHistoryEntry(id) {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem('fruitscan_history', JSON.stringify(history));
  renderHistory();
  renderHomeRecent();
  showToast('Entry deleted.');
}

function clearAllHistory() {
  if (!getHistory().length) { showToast('No history to clear.'); return; }
  localStorage.removeItem('fruitscan_history');
  renderHistory();
  renderHomeRecent();
  showToast('History cleared.');
}

function renderHistory() {
  const container = $('history-list');
  if (!container) return;
  const history = getHistory();

  if (!history.length) {
    container.innerHTML = `
      <div class="empty-history">
        <span class="empty-history-icon">📭</span>
        <p class="empty-history-text">No history yet</p>
        <p class="empty-history-sub">Your scanned fruits will appear here</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(entry => {
    const emoji = getFruitEmoji(entry.fruit);
    const confPct = (entry.confidence * 100).toFixed(1);
    const timeStr = formatTime(entry.timestamp);
    const thumbHtml = entry.imageDataURL
      ? `<img class="hist-thumb" src="${entry.imageDataURL}" alt="${entry.fruit}" loading="lazy" />`
      : `<div class="hist-thumb-emoji">${emoji}</div>`;
    return `
      <div class="history-item" data-id="${entry.id}">
        ${thumbHtml}
        <div class="hist-info">
          <div class="hist-name">${entry.fruit}</div>
          <div class="hist-conf">${confPct}% confidence</div>
          <div class="hist-time">${timeStr}</div>
        </div>
        <button class="hist-delete-btn" onclick="deleteHistoryEntry(${entry.id})" aria-label="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`;
  }).join('');
}

function renderHomeRecent() {
  const container = $('home-recent-list');
  if (!container) return;
  const history = getHistory().slice(0, 4);

  if (!history.length) {
    container.innerHTML = `
      <div class="empty-recent">
        <span class="empty-icon">🍃</span>
        <p>No scans yet. Try scanning a fruit!</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(entry => {
    const emoji = getFruitEmoji(entry.fruit);
    const confPct = (entry.confidence * 100).toFixed(1);
    const timeStr = formatTime(entry.timestamp);
    const thumbHtml = entry.imageDataURL
      ? `<img class="recent-thumb" src="${entry.imageDataURL}" alt="${entry.fruit}" loading="lazy" />`
      : `<div class="recent-thumb-emoji">${emoji}</div>`;
    return `
      <div class="recent-item">
        ${thumbHtml}
        <div class="recent-info">
          <div class="recent-name">${entry.fruit}</div>
          <div class="recent-meta">${timeStr}</div>
        </div>
        <div class="recent-conf">${confPct}%</div>
      </div>`;
  }).join('');
}

// ── UTILITIES ─────────────────────────────────────
function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

let toastTimeout = null;
function showToast(msg, type = '') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = `toast${type ? ' ' + type : ''}`;
  show('toast');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => hide('toast'), 2800);
}

// ── PWA SERVICE WORKER ────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('[FruitScan] SW registered:', reg.scope))
      .catch(err => console.warn('[FruitScan] SW registration failed:', err));
  });
}