/* ------------------------------------------------------------------ */
/* ورکر پایتون واقعی (CPython via Pyodide) — سان‌جاب‌اواس ۲.۰           */
/* نسخه pyodide پین‌شده: v0.26.4 (jsDelivr)                            */
/* خروجی streem می‌شود؛ محدودیت خروجی و تایم‌اوت سمت ورکر/والد رعایت   */
/* می‌شود. این ورکر Web Worker است — اجرا از رشته اصلی جدا است.        */
/* ------------------------------------------------------------------ */
/* eslint-disable */

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`
const MAX_OUTPUT_LINES = 800

let pyodide = null
let loading = null

function post(msg) {
  self.postMessage(msg)
}

async function ensurePyodide() {
  if (pyodide) return pyodide
  if (!loading) {
    loading = (async () => {
      post({ type: 'status', text: `دانلود CPython (Pyodide v${PYODIDE_VERSION}) — حدود ۱۰ مگابایت…` })
      self.importScripts(PYODIDE_URL)
      const idx = self.indexURL || `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
      pyodide = await self.loadPyodide({ indexURL: idx })
      const v = pyodide.runPython('import sys; sys.version.split()[0]')
      post({ type: 'ready', text: `CPython ${v} آماده است (Pyodide v${PYODIDE_VERSION})` })
      return pyodide
    })()
  }
  return loading
}

async function runCode(id, code) {
  const py = await ensurePyodide()
  let lines = 0
  const send = (type, text) => {
    if (lines >= MAX_OUTPUT_LINES) return
    lines++
    if (lines === MAX_OUTPUT_LINES) {
      post({ type: 'stderr', id, text: '… خروجی از حد مجاز گذشت و بقیه نشان داده نمی‌شود' })
      return
    }
    post({ type, id, text })
  }
  py.setStdout({ batched: (s) => send('stdout', s) })
  py.setStderr({ batched: (s) => send('stderr', s) })

  const t0 = performance.now()
  try {
    // نتیجه آخرین عبارت اگر مقدار داشته باشد چاپ می‌شود (مثل REPL)
    const wrapped =
      'import sys\n' +
      'def __sanjab_exec__():\n' +
      code
        .split('\n')
        .map((l) => (l.length ? '    ' + l : ''))
        .join('\n') +
      '\n'
    // اجرای مستقیم با runPythonAsync — پشتیبانی از await و top-level
    let result = await py.runPythonAsync(code)
    if (result !== undefined && result !== null) {
      let text
      try {
        text = result.toString()
      } catch {
        text = String(result)
      }
      if (text && text !== 'None') send('stdout', text)
    }
    post({ type: 'done', id, ok: true, ms: performance.now() - t0 })
  } catch (err) {
    send('stderr', String(err && err.message ? err.message : err))
    post({ type: 'done', id, ok: false, ms: performance.now() - t0 })
  }
}

self.onmessage = async (e) => {
  const msg = e.data || {}
  if (msg.type === 'run') {
    try {
      await runCode(msg.id, msg.code)
    } catch (err) {
      post({ type: 'done', id: msg.id, ok: false, ms: 0 })
      post({ type: 'stderr', id: msg.id, text: 'خطای ورکر: ' + String(err) })
    }
  } else if (msg.type === 'preload') {
    try {
      await ensurePyodide()
    } catch (err) {
      post({ type: 'error-fatal', text: 'بارگذاری پایتون واقعی ناموفق بود: ' + String(err && err.message ? err.message : err) })
    }
  }
}
