# Employer Portal — Endorsements (V2)

## Cursor / browser not loading?

**Do not use “Preview” on `index.html` alone** — this app needs the Vite dev server.

Read **`START_HERE.md`** (short step‑by‑step).

---

## Run locally (dev)

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:5173/** (terminal opens this for you).  
If **`localhost:5173`** does not load, use **`127.0.0.1`** instead (common on macOS IPv6 vs IPv4).

**Cursor:** *Terminal → Run Task → “Start app (Vite)”* or run `npm run dev` in the integrated terminal.

---

## Production build + preview

```bash
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/**

---

## Live demo (GitHub Pages)

https://adithya.meroju.github.io/endorsements-v2/

Production builds use **relative** asset paths (`./assets/...`) so the site works in that subfolder.
