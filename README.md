# Gnoke Receipt

**Professional receipts for small businesses — offline-first.**  
Part of the **Gnoke Suite** by [Edmund Sparrow](https://github.com/edmundsparrow).

---

> ❤️ This app is free. If it saves you time or makes your business look better, consider buying me a coffee — [selar.com/showlove/edmundsparrow](https://selar.com/showlove/edmundsparrow)

---

Issue receipts. Track history. Print clean paper records. All from the browser — no server, no account, no internet required after the first load. Your data lives in a real SQLite database on your own device.

## Pages

| | |
|---|---|
| 🧾 **New Receipt** | Customer info, line items, auto-calculated total, auto-numbered `RCP-00001` onwards |
| 📋 **History** | Search by name or receipt number, filter by date range, expand rows, delete |
| 🖨️ **Preview** | Print-ready receipt — your logo, address, contact info, social handles |
| ⚙️ **Settings** | Edit profile, toggle dark mode, export a real `.sqlite` backup file |

## Stack

- [sql.js](https://github.com/sql-js/sql.js) — SQLite compiled to WebAssembly, runs entirely in the browser
- IndexedDB — persists the database between sessions
- PWA — installable, works offline after first load
- Zero frameworks — HTML, CSS variables, vanilla JS

## File Structure

```
gnoke-receipt/
├── index.html        Splash + router
├── setup.html        Business profile setup (first-run & edit)
├── receipt.html      Create a receipt
├── history.html      Sales history + search
├── preview.html      Print-ready receipt view
├── settings.html     Settings + About
├── style.css         Shared design system
├── js/
│   ├── db.js         sql.js + IndexedDB layer
│   ├── theme.js      Dark mode (anti-FOUC)
│   └── ui.js         Toast · Loading overlay · Drawer
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Run Locally

> sql-wasm requires a proper server. Opening `index.html` directly as a `file://` URL will not work.

```bash
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Personalise

1. Drop your icons into `icons/icon-192.png` and `icons/icon-512.png`
2. Open the app and complete the **Business Setup** — logo, address, contacts, social handles
3. Done. Every receipt you issue from that point carries your branding

## Author

**Edmund Sparrow**

| | |
|---|---|
| ✉ Email | [edmundsparrow@gmail.com](mailto:edmundsparrow@gmail.com) |
| 💬 WhatsApp | [wa.me/2349024054758](https://wa.me/2349024054758) |
| ⌥ GitHub | [github.com/edmundsparrow](https://github.com/edmundsparrow) |
| ❤️ Support | [selar.com/showlove/edmundsparrow](https://selar.com/showlove/edmundsparrow) |

---

*Gnoke Suite · GPL-3.0*
