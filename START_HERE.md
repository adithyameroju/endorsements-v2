# How to see the app (important)

## Why “Preview” in Cursor can look broken

This project is **Vite + React**. The file `index.html` is **not** a static page.

- **Cursor / VS Code “Simple Browser” on `index.html`** → will **not** run the app (no Vite, no JSX compile).
- **Double‑clicking `index.html` in Finder** → same problem.

You **must** start the dev server first.

---

## Do this (2 steps)

### 1. Open a terminal in this folder

```bash
cd "/path/to/V2 designs"
npm install
npm run dev
```

### 2. Open the URL Vite prints

**Primary:** **http://localhost:5173/**

If that does not connect (some Mac setups resolve `localhost` to IPv6 only), run:

```bash
npm run dev:ip
```

Then open **http://127.0.0.1:5173/**

If the page stays **blank**, try **http://localhost:5173/#/** — the app also redirects an empty hash to `#/` after React loads.

---

## In Cursor specifically

1. **Terminal → Run Task → “Start app (Vite)”**  
   (or press the default build shortcut if you use tasks)

2. Or run **`npm run dev`** in the integrated terminal.

3. **Cmd+Click** / **Ctrl+Click** the `localhost` or `127.0.0.1` link in the terminal.

---

## After you run `npm run build`

Preview the built files:

```bash
npm run preview
```

Then open **http://localhost:4173/** (or **`npm run preview:ip`** and **http://127.0.0.1:4173/**). Use **`/#/`** if the screen is blank.

---

## Still blank?

1. In the browser: **F12 → Console** — any red errors?
2. **Network** tab — is `main.jsx` or `*.js` **200** (not 404)?
3. In terminal, is **Node** working? Run `node -v` and `npm -v`.
