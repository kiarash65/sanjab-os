/* ------------------------------------------------------------------ */
/* اجراکننده پایتون واقعی (CPython/Pyodide)، رابط تمیز روی Worker     */
/* نسخه پین‌شده v0.26.4، بارگیری فقط با اقدام صریح کاربر              */
/* ------------------------------------------------------------------ */

export type PyOutKind = 'stdout' | 'stderr' | 'status' | 'ready' | 'fatal'

export interface PyRunResult {
  ok: boolean
  ms: number
}

export class PyodideRunner {
  private worker: Worker | null = null
  private resolveRun: ((r: PyRunResult) => void) | null = null
  private runId = 0
  private timeout: ReturnType<typeof setTimeout> | null = null

  onOut: (kind: PyOutKind, text: string) => void = () => {}

  get isBusy(): boolean {
    return this.resolveRun !== null
  }

  /** ورکر را می‌سازد و pyodide را از CDN پین‌شده preload می‌کند */
  ensure(onProgress?: (text: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.worker) return resolve()
      let worker: Worker
      try {
        worker = new Worker('/pyodide-worker.js')
      } catch (e) {
        reject(e instanceof Error ? e : new Error('ساخت Worker ناموفق بود'))
        return
      }
      this.worker = worker
      worker.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as { type: string; text?: string; id?: number; ok?: boolean; ms?: number }
        switch (msg.type) {
          case 'status':
          case 'ready':
          case 'error-fatal':
            this.onOut(msg.type === 'error-fatal' ? 'fatal' : msg.type === 'status' ? 'status' : 'ready', msg.text ?? '')
            if (msg.type === 'status') onProgress?.(msg.text ?? '')
            if (msg.type === 'ready') resolve()
            if (msg.type === 'error-fatal') {
              this.terminate()
              reject(new Error(msg.text ?? 'خطای بارگذاری'))
            }
            break
          case 'stdout':
          case 'stderr':
            if (msg.id === this.runId) this.onOut(msg.type, msg.text ?? '')
            break
          case 'done':
            if (msg.id === this.runId && this.resolveRun) {
              const r = { ok: !!msg.ok, ms: msg.ms ?? 0 }
              this.resolveRun(r)
              this.resolveRun = null
              if (this.timeout) clearTimeout(this.timeout)
              this.timeout = null
            }
            break
        }
      }
      worker.onerror = (e) => {
        this.onOut('fatal', 'خطای ورکر پایتون: ' + (e.message ?? 'ناشناخته'))
        this.terminate()
        reject(new Error('خطای ورکر'))
      }
      worker.postMessage({ type: 'preload' })
    })
  }

  run(code: string, timeoutMs = 15000): Promise<PyRunResult> {
    return new Promise((resolve) => {
      if (!this.worker) {
        this.onOut('fatal', 'ورکر پایتون هنوز آماده نیست')
        resolve({ ok: false, ms: 0 })
        return
      }
      const id = ++this.runId
      this.resolveRun = resolve
      this.timeout = setTimeout(() => {
        this.onOut('stderr', `✗ اجرا بیش از ${Math.round(timeoutMs / 1000)} ثانیه طول کشید، متوقف شد (ورکر ری‌استارت می‌شود)`)
        this.terminate()
        resolve({ ok: false, ms: timeoutMs })
      }, timeoutMs)
      this.worker.postMessage({ type: 'run', id, code })
    })
  }

  terminate() {
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = null
    this.worker?.terminate()
    this.worker = null
    this.resolveRun = null
  }
}
