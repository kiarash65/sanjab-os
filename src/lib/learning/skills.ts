/**
 * Skill Registry، ثبت مهارت‌ها، پیش‌نیازها و نگاشت درس‌ها
 *
 * گراف مهارت‌ها باید بدون چرخه باشد (در تست توسعه بررسی شده است).
 * هر مهارت به درس‌های واقعی آکادمی‌ها نگاشت می‌شود تا «تکمیل دوره» و
 * «تسلط بر مهارت» دو معیار جدا بمانند.
 */
import type { TrackId } from './types'

export interface SkillDef {
  id: string
  track: TrackId
  title: string
  /** پیش‌نیازها، id مهارت */
  prereq: string[]
  /** درس‌هایی که این مهارت را می‌آموزند */
  lessons: string[]
}

export const SKILLS: SkillDef[] = [
  /* ---------------- پایتون ---------------- */
  {
    id: 'py-foundations',
    track: 'python',
    title: 'مبانی پایتون',
    prereq: [],
    lessons: ['l0-what', 'l0-python'],
  },
  {
    id: 'py-vars',
    track: 'python',
    title: 'متغیرها و عملگرها',
    prereq: ['py-foundations'],
    lessons: ['l1-vars', 'l1-fstring', 'l1-ops'],
  },
  {
    id: 'py-data',
    track: 'python',
    title: 'ساختارهای داده',
    prereq: ['py-vars'],
    lessons: ['l2-lists', 'l2-dicts'],
  },
  {
    id: 'py-control',
    track: 'python',
    title: 'شرط و حلقه',
    prereq: ['py-vars'],
    lessons: ['l3-if', 'l3-loops'],
  },
  {
    id: 'py-algo-think',
    track: 'python',
    title: 'تفکر الگوریتمی',
    prereq: ['py-control'],
    lessons: ['l3-algo'],
  },
  {
    id: 'py-funcs',
    track: 'python',
    title: 'توابع و Scope',
    prereq: ['py-control'],
    lessons: ['l4-funcs', 'l4-scope', 'l4-args'],
  },
  {
    id: 'py-errors',
    track: 'python',
    title: 'مدیریت خطا',
    prereq: ['py-funcs'],
    lessons: ['l5-errors'],
  },
  {
    id: 'py-files',
    track: 'python',
    title: 'فایل و JSON',
    prereq: ['py-errors'],
    lessons: ['l5-files', 'l5-json'],
  },
  {
    id: 'py-oop',
    track: 'python',
    title: 'برنامه‌نویسی شیءگرا',
    prereq: ['py-funcs', 'py-data'],
    lessons: ['l6-oop', 'l6-dataclass'],
  },
  {
    id: 'py-iter',
    track: 'python',
    title: 'Iterator و Generator',
    prereq: ['py-funcs'],
    lessons: ['l6-generators', 'l2-comp'],
  },
  {
    id: 'py-typing',
    track: 'python',
    title: 'Type Hinting',
    prereq: ['py-funcs'],
    lessons: ['l7-typing'],
  },
  {
    id: 'py-async',
    track: 'python',
    title: 'برنامه‌نویسی Async',
    prereq: ['py-funcs'],
    lessons: ['l7-async'],
  },
  {
    id: 'py-projects',
    track: 'python',
    title: 'پروژه‌های پایتون',
    prereq: ['py-oop', 'py-files'],
    lessons: ['l8-calc', 'l8-guess', 'l8-tasks', 'l8-csv'],
  },

  /* ---------------- لینوکس ---------------- */
  {
    id: 'lx-basics',
    track: 'linux',
    title: 'مبانی لینوکس',
    prereq: [],
    lessons: ['what', 'where'],
  },
  {
    id: 'lx-distros',
    track: 'linux',
    title: 'توزیع‌ها و نصب',
    prereq: ['lx-basics'],
    lessons: ['distros', 'install'],
  },
  {
    id: 'lx-terminal',
    track: 'linux',
    title: 'کار با ترمینال',
    prereq: ['lx-basics'],
    lessons: ['terminal'],
  },
  {
    id: 'lx-permissions',
    track: 'linux',
    title: 'دسترسی‌ها و امنیت',
    prereq: ['lx-terminal'],
    lessons: ['permissions'],
  },
  {
    id: 'lx-admin',
    track: 'linux',
    title: 'فرآیندها و بسته‌ها',
    prereq: ['lx-terminal'],
    lessons: ['procs'],
  },

  /* ---------------- راست ---------------- */
  {
    id: 'rs-basics',
    track: 'rust',
    title: 'مبانی راست',
    prereq: [],
    lessons: [
      'rust-what',
      'rust-cargo',
      'rust-vars',
      'rust-types',
      'rust-fn',
      'rust-control',
    ],
  },
  {
    id: 'rs-ownership',
    track: 'rust',
    title: 'مالکیت و Borrowing',
    prereq: ['rs-basics'],
    lessons: ['own-what', 'own-move', 'own-borrow', 'own-mutborrow', 'own-slices', 'own-lifetime'],
  },
  {
    id: 'rs-types',
    track: 'rust',
    title: 'Struct و Enum و Trait',
    prereq: ['rs-basics'],
    lessons: ['st-struct', 'st-enum', 'st-option', 'st-result', 'st-traits', 'st-collections'],
  },
  {
    id: 'rs-conc',
    track: 'rust',
    title: 'همروندی در راست',
    prereq: ['rs-ownership', 'rs-types'],
    lessons: ['conc-thread', 'conc-mutex', 'conc-async', 'conc-unsafe'],
  },

  /* ---------------- هوش مصنوعی ---------------- */
  {
    id: 'ai-foundations',
    track: 'ai',
    title: 'مبانی و اخلاق AI',
    prereq: [],
    lessons: ['home', 'ethics'],
  },
  {
    id: 'ai-perceptron',
    track: 'ai',
    title: 'پرسپترون',
    prereq: ['ai-foundations'],
    lessons: ['perceptron'],
  },
  {
    id: 'ai-gradient',
    track: 'ai',
    title: 'نزول گرادیان و فعال‌سازها',
    prereq: ['ai-perceptron'],
    lessons: ['gradient', 'activations'],
  },
  {
    id: 'ai-networks',
    track: 'ai',
    title: 'شبکه‌های عصبی',
    prereq: ['ai-gradient'],
    lessons: ['network', 'lab'],
  },
  {
    id: 'ai-llm',
    track: 'ai',
    title: 'مدل‌های زبانی و توکن‌ساز',
    prereq: ['ai-networks'],
    lessons: ['llm', 'tokenizer'],
  },
  {
    id: 'ai-attention',
    track: 'ai',
    title: 'مکانیزم توجه',
    prereq: ['ai-llm'],
    lessons: ['attention'],
  },
  {
    id: 'ai-rag',
    track: 'ai',
    title: 'RAG',
    prereq: ['ai-llm'],
    lessons: ['rag'],
  },
  {
    id: 'ai-overfit',
    track: 'ai',
    title: 'بیش‌برازش',
    prereq: ['ai-gradient'],
    lessons: ['overfit'],
  },

  /* ---------------- پاورشل ---------------- */
  {
    id: 'ps-pipeline',
    track: 'powershell',
    title: 'پایپ‌لاین پاورشل',
    prereq: [],
    lessons: ['ps-1', 'ps-2', 'ps-3'],
  },
  {
    id: 'ps-objects',
    track: 'powershell',
    title: 'کار با آبجکت‌ها',
    prereq: ['ps-pipeline'],
    lessons: ['ps-4', 'ps-5', 'ps-6'],
  },
  {
    id: 'ps-scripting',
    track: 'powershell',
    title: 'اسکریپت‌نویسی',
    prereq: ['ps-objects'],
    lessons: ['ps-7', 'ps-8', 'ps-9'],
  },
  {
    id: 'ps-admin',
    track: 'powershell',
    title: 'مدیریت سیستم',
    prereq: ['ps-scripting'],
    lessons: ['ps-10', 'ps-11', 'ps-12'],
  },

  /* ---------------- الگوریتم ---------------- */
  {
    id: 'al-thinking',
    track: 'algorithm',
    title: 'تفکر محاسباتی',
    prereq: [],
    lessons: ['al-what', 'al-decompose', 'al-pattern', 'al-abstraction', 'al-pseudocode'],
  },
  {
    id: 'al-fundamentals',
    track: 'algorithm',
    title: 'مبانی الگوریتم',
    prereq: ['al-thinking'],
    lessons: ['al-ipo', 'al-variables', 'al-conditions', 'al-loops', 'al-recursion'],
  },
  {
    id: 'al-searching',
    track: 'algorithm',
    title: 'جست‌وجو',
    prereq: ['al-fundamentals'],
    lessons: ['al-linear-search', 'al-binary-search'],
  },
  {
    id: 'al-sorting',
    track: 'algorithm',
    title: 'مرتب‌سازی',
    prereq: ['al-fundamentals'],
    lessons: ['al-bubble', 'al-selection', 'al-insertion', 'al-merge', 'al-quick'],
  },
  {
    id: 'al-structures',
    track: 'algorithm',
    title: 'ساختارهای داده',
    prereq: ['al-fundamentals'],
    lessons: ['al-arrays', 'al-linkedlist', 'al-stack', 'al-queue', 'al-hashtable', 'al-trees', 'al-bst', 'al-heap', 'al-graphs'],
  },
  {
    id: 'al-advanced',
    track: 'algorithm',
    title: 'الگوریتم‌های پیشرفته',
    prereq: ['al-sorting', 'al-structures'],
    lessons: ['al-divide', 'al-greedy', 'al-backtracking', 'al-dp', 'al-bfs-dfs', 'al-dijkstra'],
  },
  {
    id: 'al-analysis',
    track: 'algorithm',
    title: 'تحلیل پیچیدگی',
    prereq: ['al-fundamentals'],
    lessons: ['al-bigo', 'al-cases', 'al-amortized'],
  },
]

const byId = new Map(SKILLS.map((s) => [s.id, s]))

export function getSkill(id: string): SkillDef | undefined {
  return byId.get(id)
}

export function skillsOfTrack(track: TrackId): SkillDef[] {
  return SKILLS.filter((s) => s.track === track)
}

/** مهارت‌های مرتبط با یک درس */
export function skillsOfLesson(track: TrackId, lessonId: string): SkillDef[] {
  return SKILLS.filter(
    (s) => s.track === track && s.lessons.includes(lessonId)
  )
}

/** اعتبارسنجی گراف، چرخه و پیش‌نیاز ناموجود پیدا می‌کند (ابزار توسعه) */
export function validateSkillGraph(): string[] {
  const problems: string[] = []
  for (const s of SKILLS) {
    for (const p of s.prereq) {
      if (!byId.has(p)) problems.push(`${s.id}: پیش‌نیاز ناموجود ${p}`)
    }
  }
  // تشخیص چرخه با DFS
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const walk = (id: string, chain: string[]) => {
    if (visiting.has(id)) {
      problems.push(`چرخه: ${[...chain, id].join(' → ')}`)
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    const skill = byId.get(id)
    for (const p of skill?.prereq ?? []) walk(p, [...chain, id])
    visiting.delete(id)
    visited.add(id)
  }
  for (const s of SKILLS) walk(s.id, [])
  return problems
}

/** آیا پیش‌نیازهای یک مهارت برآورده شده؟ */
export function prereqsMet(
  skillId: string,
  mastered: Set<string>
): { met: boolean; missing: string[] } {
  const skill = byId.get(skillId)
  if (!skill) return { met: true, missing: [] }
  const missing = skill.prereq.filter((p) => !mastered.has(p))
  return { met: missing.length === 0, missing }
}
