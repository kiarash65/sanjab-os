/* ------------------------------------------------------------------ */
/* یکپارچه‌سازی‌های کاربر — کلیدهای هوش مصنوعی و توکن گیت‌هاب          */
/* همه‌چیز فقط در localStorage مرورگر خود کاربر ذخیره می‌شود           */
/* و درخواست‌ها مستقیم از مرورگر به سرویس مقصد فرستاده می‌شوند.        */
/* ------------------------------------------------------------------ */

/* --------------------------- هوش مصنوعی --------------------------- */

export type AIKind = 'openai' | 'anthropic'

export interface AICfg {
  kind: AIKind
  baseUrl: string
  apiKey: string
  model: string
}

export interface AIPreset {
  id: string
  label: string
  kind: AIKind
  baseUrl: string
  model: string
  note: string
}

/** سرویس‌های آماده — همه با OpenAI API سازگارند جز Claude */
export const AI_PRESETS: AIPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    note: 'کلید از platform.openai.com/api-keys',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    note: 'صدها مدل با یک کلید واحد',
  },
  {
    id: 'groq',
    label: 'Groq',
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    note: 'خیلی سریع و با حجم رایگان',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    kind: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    note: 'اقتصادی و قوی برای کد',
  },
  {
    id: 'claude',
    label: 'Claude (Anthropic)',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-haiku-latest',
    note: 'کلید از console.anthropic.com',
  },
  {
    id: 'glm',
    label: 'GLM (چی‌پو)',
    kind: 'openai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    note: 'کلید از open.bigmodel.cn — مدل‌های چینی قوی و اقتصادی',
  },
]

const AI_STORAGE = 'pengo-ai-cfg-v1'

export function loadAICfg(): AICfg | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(AI_STORAGE)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AICfg>
    if (!parsed.apiKey || !parsed.baseUrl || !parsed.model) return null
    return {
      kind: parsed.kind === 'anthropic' ? 'anthropic' : 'openai',
      baseUrl: parsed.baseUrl,
      apiKey: parsed.apiKey,
      model: parsed.model,
    }
  } catch {
    return null
  }
}

export function saveAICfg(cfg: AICfg): void {
  try {
    window.localStorage.setItem(AI_STORAGE, JSON.stringify(cfg))
  } catch {
    /* حافظه پر؟ غصه نخور */
  }
}

export function clearAICfg(): void {
  try {
    window.localStorage.removeItem(AI_STORAGE)
  } catch {
    /* ignore */
  }
}

export function hasAICfg(): boolean {
  return (loadAICfg()?.apiKey ?? '').trim().length > 0
}

export interface ChatMsg {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** پیام خطای فارسی بر اساس وضعیت HTTP */
function aiHttpError(status: number, bodyText: string): string {
  if (status === 401 || status === 403) return 'کلید API نامعتبر است یا دسترسی ندارد (۴۰۱)'
  if (status === 404) return 'آدرس سرویس یا نام مدل اشتباه است (۴۰۴)'
  if (status === 429) return 'محدودیت تعداد درخواست! کمی صبر کن (۴۲۹)'
  if (status >= 500) return 'سرور سرویس‌دهنده حسابی خسته است، بعداً امتحان کن (۵xx)'
  const snippet = bodyText.slice(0, 160)
  return `خطای ${status}: ${snippet || 'نامشخص'}`
}

/**
 * گفتگو با هر سرویس سازگار با OpenAI یا Anthropic — مستقیم از مرورگر.
 * اگر رد شد، Error با پیام فارسی پرتاب می‌شود.
 */
export async function aiComplete(
  messages: ChatMsg[],
  cfg: AICfg,
  signal?: AbortSignal
): Promise<string> {
  const base = cfg.baseUrl.replace(/\/+$/, '')
  try {
    if (cfg.kind === 'anthropic') {
      const system = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n')
      const res = await fetch(`${base}/v1/messages`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: 2000,
          ...(system ? { system } : {}),
          messages: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(aiHttpError(res.status, await res.text()))
      const data = (await res.json()) as {
        content?: { type: string; text?: string }[]
      }
      const text = (data.content ?? [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('')
        .trim()
      if (!text) throw new Error('پاسخی از مدل نیامد')
      return text
    }

    /* ---------- OpenAI-compatible ---------- */
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
      }),
    })
    if (!res.ok) throw new Error(aiHttpError(res.status, await res.text()))
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('پاسخی از مدل نیامد')
    return text
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    if (err instanceof TypeError) {
      throw new Error(
        'اتصال برقرار نشد — اینترنت/CORS؟ بعضی سرویس‌ها از مرورگر مستقیم قبول نمی‌کنند. OpenRouter و Groq و OpenAI معمولاً کار می‌کنند.'
      )
    }
    throw err instanceof Error ? err : new Error('خطای ناشناخته')
  }
}

/* ----------------------------- گیت‌هاب ----------------------------- */

const GH_STORAGE = 'pengo-gh-token-v1'

export function loadGhToken(): string {
  try {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(GH_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function saveGhToken(token: string): void {
  try {
    window.localStorage.setItem(GH_STORAGE, token.trim())
  } catch {
    /* ignore */
  }
}

export function clearGhToken(): void {
  try {
    window.localStorage.removeItem(GH_STORAGE)
  } catch {
    /* ignore */
  }
}

function ghError(status: number): string {
  if (status === 401) return 'توکن نامعتبر است یا منقضی شده (۴۰۱)'
  if (status === 403)
    return 'دسترسی رد شد — یا محدودیت نرخ API (۶۰ درخواست در ساعت بدون توکن) یا توکن اجازه لازم را ندارد (۴۰۳)'
  if (status === 404) return 'پیدا نشد — ریپو خصوصی است؟ بدون توکن فقط عمومی‌ها دیده می‌شوند (۴۰۴)'
  if (status === 422) return 'درخواست نامعتبر است (۴۲۲)'
  if (status >= 500) return 'گیت‌هاب حسابی شلوغ است، بعداً امتحان کن (۵xx)'
  return `خطای گیت‌هاب (${status})`
}

/** GET از REST API گیت‌هاب — با یا بدون توکن */
export async function ghApi<T = unknown>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`
  let res: Response
  try {
    res = await fetch(`https://api.github.com${path}`, { ...init, headers })
  } catch {
    throw new Error('اتصال به گیت‌هاب برقرار نشد — اینترنت چک کن')
  }
  if (!res.ok) throw new Error(ghError(res.status))
  return (await res.json()) as T
}
