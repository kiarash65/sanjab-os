/* ------------------------------------------------------------------ */
/* ذخیره‌گاه IndexedDB، برای داده‌های بزرگ مثل وضعیت ماشین مجازی       */
/* (localStorage برای تنظیمات کوچک؛ این‌جا برای باینری/حجم بالا)        */
/* ------------------------------------------------------------------ */

const DB_NAME = 'sanjabos-idb'
const STORE = 'kv'
let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB باز نشد'))
  })
  return dbPromise
}

export async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('ذخیره در IndexedDB ناموفق بود'))
  })
}

export async function idbGet<T = unknown>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error ?? new Error('خواندن از IndexedDB ناموفق بود'))
  })
}

export async function idbDelete(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('حذف از IndexedDB ناموفق بود'))
  })
}
