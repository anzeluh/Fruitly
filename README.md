# 🍎 Fruit Scanner — AI-Powered Fruit Recognition App

A production-ready, mobile-first PWA that uses TensorFlow.js to identify fruits from camera or uploaded photos.

---

## 📁 File Structure

```
FruitScanner/
├── index.html          ← Main app shell
├── style.css           ← All styles (mobile-first)
├── app.js              ← App logic + TF.js inference
├── manifest.json       ← PWA manifest
├── service-worker.js   ← Offline caching
├── metadata.json       ← Fruit class labels (edit for your model)
├── model/
│   ├── model.json      ← TF.js model topology (add your own)
│   └── *.bin           ← Weight files (auto-referenced by model.json)
└── icons/
    ├── icon-192.png    ← PWA icon
    └── icon-512.png    ← PWA icon
```

---

## 🚀 Quick Start

### 1. Add Your TensorFlow.js Model

Export from **Teachable Machine** (https://teachablemachine.withgoogle.com/):
- Train your fruit classifier
- Export → TensorFlow.js → **Keras** format
- Place `model.json` + `.bin` weight files in the `model/` folder

**OR** train a custom model and convert to TF.js format:
```bash
tensorflowjs_converter --input_format=keras my_model.h5 model/
```

### 2. Update `metadata.json`

Edit the `labels` array to match your model's output classes in exact order:
```json
{
  "imageSize": 224,
  "labels": ["Apple", "Banana", "Orange", ...]
}
```

### 3. Serve Locally (required for camera + SW)

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code: use Live Server extension
```

Open `http://localhost:8080` in Chrome/Firefox.

> ⚠️ **Important**: The app must be served over `http://localhost` or `https://` for camera access and service workers to work. Opening `index.html` directly (file://) won't work.

---

## 🌐 Deploy to GitHub Pages

```bash
# 1. Create a GitHub repo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/fruit-scanner.git
git push -u origin main

# 2. Go to repo Settings → Pages → Branch: main → Save
# 3. App available at: https://YOUR_USER.github.io/fruit-scanner/
```

---

## 📱 Install as Android App (PWA)

1. Open the app in Chrome on Android
2. Tap the 3-dot menu → "Add to Home Screen"
3. The app installs like a native app

---

## 🤖 Demo Mode

If no `model/model.json` is found, the app runs in **Demo Mode**:
- Labels are loaded from `metadata.json`
- Predictions are simulated with realistic probability distributions
- All UI features work normally

This lets you develop/test the UI without a trained model.

---

## 🔧 Customisation

| Setting | Location | Description |
|---------|----------|-------------|
| Fruit labels | `metadata.json` → `labels` | Class names matching model output |
| Input image size | `metadata.json` → `imageSize` | Default: 224 |
| Normalisation | `app.js` → `runPrediction()` | Currently: `[0,255] → [-1,1]` (Teachable Machine style) |
| History limit | `app.js` → `saveToHistory()` | Default: 50 entries |
| Color theme | `style.css` → `:root` | Change `--primary` and friends |

### Normalisation Options

```js
// Teachable Machine style (default): [-1, 1]
tensor = tensor.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1.0));

// MobileNet standard: [0, 1]
tensor = tensor.toFloat().div(tf.scalar(255.0));

// ImageNet mean subtraction
tensor = tf.sub(tensor.toFloat().div(255), [0.485, 0.456, 0.406])
           .div([0.229, 0.224, 0.225]);
```

---

## 📦 Tech Stack

- **TensorFlow.js** 4.15 — in-browser ML inference
- **Vanilla JS** — no framework dependencies
- **CSS3** — animations, variables, flexbox
- **PWA** — manifest + service worker for installability
- **LocalStorage** — scan history persistence

---

## 🍃 License

MIT — free to use, modify, and distribute.
