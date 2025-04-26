# Firefox Recap

**Firefox Recap** is a browser extension that analyzes and visualizes your Firefox browsing history. It fetches your history, categorizes pages via an on‑device ML model, and presents insights—like your most visited sites, peak browsing times, category trends, and transition patterns—in an interactive slideshow.

## Features

- Fetch & store browsing history for a configurable time window (day, week, month)  
- ML‑powered URL & title classification using an on‑device model [URLTITLE-classifier](https://huggingface.co/firefoxrecap/URL-TITLE-classifier) 
- Store data in IndexedDB using [Dexie](https://github.com/dexie/Dexie.js) for efficient queryin  
- Handlers for:
  - Unique website count
  - Most visited sites
  - Recency & frequency metrics
  - Visits per hour histogram
  - Daily visit counts
  - Category trends over time
  - URL‑to‑URL transition patterns  
- Interactive slideshow UI built with React and Recharts  

## Prerequisites

- Firefox Nightly  
- Enable these flags in `about:config`:
  - `browser.ml.enable → true`
  - `extensions.ml.enabled → true`  
- Node.js (v18+) and npm  

## Installation

```bash
git clone https://github.com/Firefox-Recap/Firefox-Recap.git
cd Firefox-Recap
npm install
```

## Loading the Extension

1. Open `about:debugging` in Firefox Nightly  
2. Click **Load Temporary Add-on**  
3. Select `dist/manifest.json`  
4. Ensure ML flags are enabled and refresh the extension  

## Development

- Start a dev build with live reloading:  
  ```bash
  npm run dev
  ```
- Generate documentation:  
  ```bash
  npm run docs
  npm run docs:serve
  ```
- Run tests:  
  ```bash
  npm test
  ```
- Build production extension:  
  ```bash
  npm run build
  npm run build:ext
  ```

## Usage

1. Click the toolbar icon to open the popup  
2. Select a time range (day, week, or month)  
3. Sit back and enjoy the slideshow of your browsing recap!  
4. Navigate slides with the arrow buttons or close with “×”  

## Contributing

Issues and pull requests are welcome! Please use our [GitHub Issues](https://github.com/Firefox-Recap/Firefox-Recap/issues) page.

## License

This project is licensed under the GNU GPLv3 License. See the [LICENSE](LICENSE) file for details.
```
