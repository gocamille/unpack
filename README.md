# Unpack

**Unpack** is a Chrome extension and integrated API that simplifies complex text into plain, easy-to-understand language. Select any confusing legal jargon, technical documentation, or dense academic writing, right-click, and get an instant simplified version.

## 🚀 Developer Preview

This extension uses a **hosted API**—you don't need your own API keys. Just install and start using it.

> **Note for hackathon judges:** The API is fully functional and hosted. No setup required beyond installing the extension.

## 📦 Installation

Since the extension is pending Chrome Web Store review, install manually:

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `extension` folder from this repo

## 🎯 Usage

1. Select any text on a webpage
2. Right-click and choose **"Unpack this"**
3. A tooltip appears with the simplified version

Or use the popup:
1. Click the Unpack extension icon
2. Paste or type text
3. Click "Simplify"

## 🏗️ Project Structure

```
unpack/
├── extension/       # Chrome extension (manifest v3)
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   └── manifest.json
├── api/             # Express.js backend (hosted on Railway)
│   ├── index.js     # Main server
│   ├── llm.js       # LLM provider abstraction
│   └── prompt.js    # Simplification prompts
└── HOMEPAGE.html    # Landing page
```

## 🔒 Privacy

- Text you select is sent to our API for simplification
- We do not store or log your text
- See `/privacy` endpoint for full privacy policy

## 🛠️ Running Locally (For Development)

If you want to run your own instance:

1. **API Setup:**
   ```bash
   cd api
   npm install
   # Create .env with your keys:
   # ANTHROPIC_API_KEY=your-key
   # or GEMINI_API_KEY=your-key
   # LLM_PROVIDER=anthropic (or gemini)
   npm start
   ```

2. **Update extension:** Change `API_URL` in `extension/background.js` and `extension/popup/popup.js` to `http://localhost:3000/simplify`

## 📝 License

MIT
