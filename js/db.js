/**
 * db.js — Gnoke Ledger
 * All data operations. sql.js (WASM) persisted to IndexedDB.
 * Loaded on every page before any app logic.
 *
 * Public API:
 *   await DB.init()
 *   DB.getBusiness(key)                 → string
 *   await DB.setBusiness(key, value)
 *   DB.getAllBusiness()                 → {key: value, ...}
 *   DB.nextReceiptNumber()              → 'RCP-00001'
 *   await DB.saveReceipt(data, items)   → receipt_id (number)
 *   DB.getAllReceipts()                 → [{id, receipt_number, ...}]
 *   DB.getReceiptWithItems(id)          → {receipt, items}
 *   await DB.deleteReceipt(id)
 *   DB.searchReceipts(q, range)         → filtered rows
 */

const DB = (() => {

  const IDB_NAME  = 'gnoke_ledger_db';
  const IDB_STORE = 'sqlite_binary';
  const IDB_KEY   = 'db';

  let _sql = null;
  let _db  = null;

  /* ── Init ──────────────────────────────────────────────────── */
  async function init() {
    _sql = await initSqlJs({
      locateFile: f =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`
    });
    const saved = await _idbLoad();
    _db = saved ? new _sql.Database(saved) : new _sql.Database();
    _migrate();
  }

  /* ── Schema ────────────────────────────────────────────────── */
  function _migrate() {
    _db.run(`
      CREATE TABLE IF NOT EXISTS receipts (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT    NOT NULL UNIQUE,
        customer_name  TEXT    NOT NULL,
        customer_phone TEXT    DEFAULT '',
        date_display   TEXT    NOT NULL,
        date_iso       TEXT    NOT NULL,
        total          REAL    NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS receipt_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER NOT NULL,
        name       TEXT    NOT NULL,
        qty        REAL    NOT NULL DEFAULT 1,
        rate       REAL    NOT NULL DEFAULT 0,
        amount     REAL    NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS business (
        key   TEXT PRIMARY KEY,
        value TEXT DEFAULT ''
      );
    `);
    _persist();
  }

  /* ── Business profile ──────────────────────────────────────── */
  function getBusiness(key) {
    const r = _db.exec(
      `SELECT value FROM business WHERE key = ?`, [key]
    );
    return _rows(r).length ? _rows(r)[0].value : '';
  }

  function getAllBusiness() {
    const r = _db.exec(`SELECT key, value FROM business`);
    const out = {};
    _rows(r).forEach(row => { out[row.key] = row.value; });
    return out;
  }

  async function setBusiness(key, value) {
    _db.run(
      `INSERT INTO business(key,value) VALUES(?,?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      [key, String(value)]
    );
    await _persist();
  }

  /* ── Receipt numbering ─────────────────────────────────────── */
  function nextReceiptNumber() {
    const r = _db.exec(`SELECT COUNT(*) as n FROM receipts`);
    const n = (_rows(r)[0]?.n || 0) + 1;
    return `RCP-${String(n).padStart(5, '0')}`;
  }

  /* ── Save receipt + items ──────────────────────────────────── */
  async function saveReceipt(receipt, items) {
    /* receipt: { receipt_number, customer_name, customer_phone,
                  date_display, date_iso, total } */
    _db.run(
      `INSERT INTO receipts
         (receipt_number, customer_name, customer_phone, date_display, date_iso, total)
       VALUES (?,?,?,?,?,?)`,
      [receipt.receipt_number, receipt.customer_name, receipt.customer_phone,
       receipt.date_display, receipt.date_iso, receipt.total]
    );
    const idR = _db.exec(`SELECT last_insert_rowid() as id`);
    const id  = _rows(idR)[0].id;

    items.forEach(item => {
      _db.run(
        `INSERT INTO receipt_items (receipt_id, name, qty, rate, amount)
         VALUES (?,?,?,?,?)`,
        [id, item.name, item.qty, item.rate, item.amount]
      );
    });

    await _persist();
    return id;
  }

  /* ── Read receipts ─────────────────────────────────────────── */
  function getAllReceipts() {
    const r = _db.exec(
      `SELECT id, receipt_number, customer_name, customer_phone,
              date_display, date_iso, total
       FROM receipts ORDER BY id ASC`
    );
    return _rows(r);
  }

  function getReceiptWithItems(id) {
    const rr = _db.exec(
      `SELECT id, receipt_number, customer_name, customer_phone,
              date_display, date_iso, total
       FROM receipts WHERE id = ?`, [id]
    );
    const receipt = _rows(rr)[0] || null;
    if (!receipt) return null;
    const ri = _db.exec(
      `SELECT name, qty, rate, amount FROM receipt_items
       WHERE receipt_id = ? ORDER BY id`, [id]
    );
    return { receipt, items: _rows(ri) };
  }

  /* ── Search / filter ───────────────────────────────────────── */
  function searchReceipts(q, range) {
    let rows = getAllReceipts();

    if (range && range !== 'all') {
      const now = new Date();
      rows = rows.filter(r => {
        const d = new Date(r.date_iso);
        if (range === 'today')
          return d.toDateString() === now.toDateString();
        if (range === 'week') {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0,0,0,0);
          return d >= start;
        }
        if (range === 'month')
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (range === 'year')
          return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    if (q) {
      const lq = q.toLowerCase();
      rows = rows.filter(r =>
        r.receipt_number.toLowerCase().includes(lq) ||
        r.customer_name.toLowerCase().includes(lq) ||
        (r.customer_phone || '').includes(lq)
      );
    }

    return rows;
  }

  /* ── Delete receipt ────────────────────────────────────────── */
  async function deleteReceipt(id) {
    _db.run(`DELETE FROM receipt_items WHERE receipt_id = ?`, [id]);
    _db.run(`DELETE FROM receipts WHERE id = ?`, [id]);
    await _persist();
  }

  /* ── IndexedDB persistence ─────────────────────────────────── */
  function _persist() {
    return new Promise((resolve, reject) => {
      const data = _db.export();
      const req  = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
      req.onsuccess = e => {
        const tx    = e.target.result.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(data, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror    = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  function _idbLoad() {
    return new Promise(resolve => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
      req.onsuccess = e => {
        const tx    = e.target.result.transaction(IDB_STORE, 'readonly');
        const get   = tx.objectStore(IDB_STORE).get(IDB_KEY);
        get.onsuccess = () => resolve(get.result || null);
        get.onerror   = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  }

  /* ── Utility ───────────────────────────────────────────────── */
  function _rows(result) {
    if (!result?.length) return [];
    const { columns, values } = result[0];
    return values.map(row =>
      Object.fromEntries(columns.map((c, i) => [c, row[i]]))
    );
  }

  return {
    init, getBusiness, getAllBusiness, setBusiness,
    nextReceiptNumber, saveReceipt,
    getAllReceipts, getReceiptWithItems, searchReceipts,
    deleteReceipt,
  };
})();
