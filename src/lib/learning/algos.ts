/**
 * Algorithm Execution Traces — رد اجرای واقعی الگوریتم‌ها
 *
 * هر trace از اجرای واقعی الگوریتم روی آرایه تولید می‌شود (نه انیمیشن دستی).
 * هر Step وضعیت کامل را دارد: آرایه، اشاره‌گرها، مقایسه/جابه‌جایی جاری،
 * پشتهٔ فراخوانی، خط شبه‌کد در حال اجرا، آمار تجمعی و توضیح فارسی.
 * سازگاری: خروجی نهایی trace همیشه برابر خروجی پیاده‌سازی اصلی است
 * (Edge Caseها: آرایه خالی، تک‌عنصری، تکراری، مرتب، معکوس، منفی).
 */
import type { TrackId } from './types'

export interface AlgoStep {
  /** وضعیت آرایه پس از این گام */
  arr: number[]
  /** دو ایندکس در حال مقایسه */
  compare?: [number, number]
  /** دو ایندکس در حال جابه‌جایی */
  swap?: [number, number]
  /** ایندکس‌های مرتب‌شدهٔ نهایی */
  sorted: number[]
  /** اشاره‌گرهای نامی (lo، hi، mid، i، j، key …) */
  pointers: Record<string, number>
  /** پشتهٔ فراخوانی — برای Merge/Quick */
  callStack?: string[]
  /** شمارهٔ خط شبه‌کد در حال اجرا (0-based) */
  pseudoLine: number
  /** توضیح فارسی گام */
  note: string
  stats: { comparisons: number; swaps: number }
}

export interface TraceResult {
  steps: AlgoStep[]
  /** شبه‌کد رسمی الگوریتم */
  pseudocode: string[]
  final: number[]
  ok: boolean
}

export type AlgoId =
  | 'linear-search'
  | 'binary-search'
  | 'bubble-sort'
  | 'selection-sort'
  | 'insertion-sort'
  | 'merge-sort'
  | 'quick-sort'

export const ALGO_TITLES: Record<AlgoId, string> = {
  'linear-search': 'جست‌وجوی خطی',
  'binary-search': 'جست‌وجوی دودویی',
  'bubble-sort': 'مرتب‌سازی حبابی',
  'selection-sort': 'مرتب‌سازی انتخابی',
  'insertion-sort': 'مرتب‌سازی درجی',
  'merge-sort': 'مرتب‌سازی ادغامی',
  'quick-sort': 'مرتب‌سازی سریع',
}

/** سؤال جست‌وجو هدف دارد؛ مرتب‌سازی undefined */
export function needsTarget(algo: AlgoId): boolean {
  return algo === 'linear-search' || algo === 'binary-search'
}

const clone = (a: number[]) => [...a]

/* ---------------- جست‌وجوی خطی ---------------- */
const LINEAR_PSEUDO = [
  'for i from 0 to n-1:',
  '    if A[i] == target:',
  '        return i',
  'return -1',
]

export function linearSearchTrace(input: number[], target: number): TraceResult {
  const arr = clone(input)
  const steps: AlgoStep[] = []
  let comparisons = 0
  const baseStats = () => ({ comparisons, swaps: 0 })
  for (let i = 0; i < arr.length; i++) {
    comparisons++
    steps.push({
      arr: clone(arr),
      compare: [i, i],
      sorted: [],
      pointers: { i, target },
      pseudoLine: 1,
      note: `A[${i}] = ${arr[i]} را با هدف ${target} مقایسه می‌کنیم (مقایسهٔ ${comparisons})`,
      stats: baseStats(),
    })
    if (arr[i] === target) {
      steps.push({
        arr: clone(arr),
        sorted: [i],
        pointers: { i, target },
        pseudoLine: 2,
        note: `🎯 پیدا شد! هدف در ایندکس ${i} است — با ${comparisons} مقایسه`,
        stats: baseStats(),
      })
      return { steps, pseudocode: LINEAR_PSEUDO, final: [i], ok: true }
    }
  }
  steps.push({
    arr: clone(arr),
    sorted: [],
    pointers: { target },
    pseudoLine: 3,
    note: `هدف ${target} در آرایه نیست — بعد از ${comparisons} مقایسه -1 برمی‌گردد`,
    stats: baseStats(),
  })
  return { steps, pseudocode: LINEAR_PSEUDO, final: [-1], ok: false }
}

/* ---------------- جست‌وجوی دودویی ---------------- */
const BINARY_PSEUDO = [
  'lo = 0, hi = n - 1',
  'while lo <= hi:',
  '    mid = (lo + hi) / 2',
  '    if A[mid] == target: return mid',
  '    elif A[mid] < target: lo = mid + 1',
  '    else: hi = mid - 1',
  'return -1',
]

export function binarySearchTrace(input: number[], target: number): TraceResult {
  const arr = clone(input).sort((a, b) => a - b)
  const steps: AlgoStep[] = []
  let comparisons = 0
  let lo = 0
  let hi = arr.length - 1
  const base = () => ({ comparisons, swaps: 0 })
  steps.push({
    arr: clone(arr),
    sorted: [],
    pointers: { lo, hi },
    pseudoLine: 0,
    note: `آرایه ابتدا باید مرتب باشد — lo=0 و hi=${hi}`,
    stats: base(),
  })
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    comparisons++
    steps.push({
      arr: clone(arr),
      compare: [mid, mid],
      sorted: [],
      pointers: { lo, hi, mid },
      pseudoLine: 3,
      note: `mid = ${mid} → A[${mid}] = ${arr[mid]} مقایسه با هدف ${target} (مقایسهٔ ${comparisons})`,
      stats: base(),
    })
    if (arr[mid] === target) {
      steps.push({
        arr: clone(arr),
        sorted: [mid],
        pointers: { mid, lo, hi },
        pseudoLine: 3,
        note: `🎯 پیدا شد! ${target} در ایندکس ${mid} — فقط ${comparisons} مقایسه`,
        stats: base(),
      })
      return { steps, pseudocode: BINARY_PSEUDO, final: [mid], ok: true }
    } else if (arr[mid] < target) {
      steps.push({
        arr: clone(arr),
        sorted: [],
        pointers: { lo: mid + 1, hi, mid },
        pseudoLine: 4,
        note: `${arr[mid]} < ${target} ⇒ نیمهٔ چپ دور ریخته می‌شود؛ lo = mid + 1 = ${mid + 1}`,
        stats: base(),
      })
      lo = mid + 1
    } else {
      steps.push({
        arr: clone(arr),
        sorted: [],
        pointers: { lo, hi: mid - 1, mid },
        pseudoLine: 5,
        note: `${arr[mid]} > ${target} ⇒ نیمهٔ راست دور ریخته می‌شود؛ hi = mid − 1 = ${mid - 1}`,
        stats: base(),
      })
      hi = mid - 1
    }
  }
  steps.push({
    arr: clone(arr),
    sorted: [],
    pointers: {},
    pseudoLine: 6,
    note: `بازه خالی شد — هدف ${target} وجود ندارد (−1)`,
    stats: base(),
  })
  return { steps, pseudocode: BINARY_PSEUDO, final: [-1], ok: false }
}

/* ---------------- حبابی ---------------- */
const BUBBLE_PSEUDO = [
  'for i from 0 to n-2:',
  '    for j from 0 to n-2-i:',
  '        if A[j] > A[j+1]:',
  '            swap A[j], A[j+1]',
]

export function bubbleSortTrace(input: number[]): TraceResult {
  const arr = clone(input)
  const n = arr.length
  const steps: AlgoStep[] = []
  const sortedIdx: number[] = []
  let comparisons = 0
  let swaps = 0
  steps.push({
    arr: clone(arr),
    sorted: [],
    pointers: {},
    pseudoLine: 0,
    note: 'شروع حبابی: در هر گذر بزرگ‌ترین حباب به انتها می‌رسد',
    stats: { comparisons, swaps },
  })
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++
      steps.push({
        arr: clone(arr),
        compare: [j, j + 1],
        sorted: [...sortedIdx],
        pointers: { i, j },
        pseudoLine: 2,
        note: `A[${j}]=${arr[j]} با A[${j + 1}]=${arr[j + 1]} مقایسه (${comparisons} مقایسه، ${swaps} جابه‌جایی)`,
        stats: { comparisons, swaps },
      })
      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        swaps++
        steps.push({
          arr: clone(arr),
          swap: [j, j + 1],
          sorted: [...sortedIdx],
          pointers: { i, j },
          pseudoLine: 3,
          note: `${arr[j + 1]} > ${arr[j]} بود ⇒ جابه‌جا شد ⇒ [${arr.join(', ')}]`,
          stats: { comparisons, swaps },
        })
      }
    }
    sortedIdx.unshift(n - 1 - i)
    steps.push({
      arr: clone(arr),
      sorted: [...sortedIdx],
      pointers: { i },
      pseudoLine: 0,
      note: `پایان گذر ${i + 1} — A[${n - 1 - i}] = ${arr[n - 1 - i]} در جای نهایی خود است`,
      stats: { comparisons, swaps },
    })
  }
  for (let k = 0; k < n; k++) if (!sortedIdx.includes(k)) sortedIdx.push(k)
  steps.push({
    arr: clone(arr),
    sorted: [...Array(n).keys()],
    pointers: {},
    pseudoLine: 0,
    note: `مرتب شد! ✓ [${arr.join(', ')}] با ${comparisons} مقایسه و ${swaps} جابه‌جایی`,
    stats: { comparisons, swaps },
  })
  return { steps, pseudocode: BUBBLE_PSEUDO, final: arr, ok: true }
}

/* ---------------- انتخابی ---------------- */
const SELECTION_PSEUDO = [
  'for i from 0 to n-2:',
  '    min = i',
  '    for j from i+1 to n-1:',
  '        if A[j] < A[min]: min = j',
  '    swap A[i], A[min]',
]

export function selectionSortTrace(input: number[]): TraceResult {
  const arr = clone(input)
  const n = arr.length
  const steps: AlgoStep[] = []
  const sortedIdx: number[] = []
  let comparisons = 0
  let swaps = 0
  for (let i = 0; i < n - 1; i++) {
    let min = i
    steps.push({
      arr: clone(arr),
      sorted: [...sortedIdx],
      pointers: { i, min },
      pseudoLine: 1,
      note: `گذر ${i + 1}: فرض می‌کنیم A[${i}]=${arr[i]} کوچک‌ترین بقیه است`,
      stats: { comparisons, swaps },
    })
    for (let j = i + 1; j < n; j++) {
      comparisons++
      steps.push({
        arr: clone(arr),
        compare: [j, min],
        sorted: [...sortedIdx],
        pointers: { i, j, min },
        pseudoLine: 3,
        note: `A[${j}]=${arr[j]} با کوچک‌ترین فعلی A[${min}]=${arr[min]} مقایسه شد`,
        stats: { comparisons, swaps },
      })
      if (arr[j] < arr[min]) {
        min = j
        steps.push({
          arr: clone(arr),
          sorted: [...sortedIdx],
          pointers: { i, min: j },
          pseudoLine: 3,
          note: `کوچک‌ترین جدید: A[${j}] = ${arr[j]}`,
          stats: { comparisons, swaps },
        })
      }
    }
    if (min !== i) {
      ;[arr[i], arr[min]] = [arr[min], arr[i]]
      swaps++
    }
    sortedIdx.push(i)
    steps.push({
      arr: clone(arr),
      swap: min !== i ? [i, min] : undefined,
      sorted: [...sortedIdx],
      pointers: { i },
      pseudoLine: 4,
      note: `جابه‌جایی نهایی گذر: A[${i}] = ${arr[i]} در جای نهایی (${swaps} جابه‌جایی کل)`,
      stats: { comparisons, swaps },
    })
  }
  sortedIdx.push(n - 1)
  steps.push({
    arr: clone(arr),
    sorted: [...Array(n).keys()],
    pointers: {},
    pseudoLine: 0,
    note: `مرتب شد! ✓ همیشه n(n−1)/2 = ${comparisons} مقایسه — جابه‌جایی‌ها فقط ${swaps} بار`,
    stats: { comparisons, swaps },
  })
  return { steps, pseudocode: SELECTION_PSEUDO, final: arr, ok: true }
}

/* ---------------- درجی ---------------- */
const INSERTION_PSEUDO = [
  'for i from 1 to n-1:',
  '    key = A[i]',
  '    j = i - 1',
  '    while j >= 0 and A[j] > key:',
  '        A[j+1] = A[j]',
  '        j = j - 1',
  '    A[j+1] = key',
]

export function insertionSortTrace(input: number[]): TraceResult {
  const arr = clone(input)
  const n = arr.length
  const steps: AlgoStep[] = []
  let comparisons = 0
  let swaps = 0
  steps.push({
    arr: clone(arr),
    sorted: [0],
    pointers: {},
    pseudoLine: 0,
    note: 'درجی: بخش چپ همیشه مرتب است — عنصر بعدی در جای درستش «درج» می‌شود',
    stats: { comparisons, swaps },
  })
  for (let i = 1; i < n; i++) {
    const key = arr[i]
    let j = i - 1
    steps.push({
      arr: clone(arr),
      sorted: [...Array(i).keys()],
      pointers: { i, key },
      pseudoLine: 1,
      note: `key = A[${i}] = ${key} — باید در بخش مرتبِ چپ جا باز کنیم`,
      stats: { comparisons, swaps },
    })
    while (j >= 0 && arr[j] > key) {
      comparisons++
      arr[j + 1] = arr[j]
      swaps++
      steps.push({
        arr: clone(arr),
        compare: [j, j + 1],
        sorted: [...Array(i).keys()],
        pointers: { j, i, key },
        pseudoLine: 4,
        note: `A[${j}]=${arr[j]} > key=${key} ⇒ یک قدم به راست شیفت (${swaps} شیفت کل)`,
        stats: { comparisons, swaps },
      })
      j--
    }
    if (j >= 0) comparisons++
    arr[j + 1] = key
    steps.push({
      arr: clone(arr),
      sorted: [...Array(i + 1).keys()],
      pointers: { j: j + 1 },
      pseudoLine: 6,
      note: `key=${key} در ایندکس ${j + 1} درج شد ⇒ [${arr.slice(0, i + 1).join(', ')}] مرتب است`,
      stats: { comparisons, swaps },
    })
  }
  steps.push({
    arr: clone(arr),
    sorted: [...Array(n).keys()],
    pointers: {},
    pseudoLine: 0,
    note: `مرتب شد! ✓ ${comparisons} مقایسه، ${swaps} شیفت — روی آرایهٔ تقریباً مرتب فوق‌العاده سریع است`,
    stats: { comparisons, swaps },
  })
  return { steps, pseudocode: INSERTION_PSEUDO, final: arr, ok: true }
}

/* ---------------- ادغامی ---------------- */
const MERGE_PSEUDO = [
  'if n <= 1: return A',
  'mid = n / 2',
  'L = mergeSort(A[0..mid])',
  'R = mergeSort(A[mid..n])',
  'return merge(L, R)',
]

interface MergeFrame {
  label: string
  range: [number, number]
}

export function mergeSortTrace(input: number[]): TraceResult {
  const arr = clone(input)
  const n = arr.length
  const steps: AlgoStep[] = []
  let comparisons = 0
  let swaps = 0
  const stack: MergeFrame[] = []

  const note = (msg: string, pseudoLine: number, extra: Partial<AlgoStep> = {}) => {
    steps.push({
      arr: clone(arr),
      sorted: [],
      pointers: {},
      callStack: stack.map((f) => f.label),
      pseudoLine,
      note: msg,
      stats: { comparisons, swaps },
      ...extra,
    })
  }

  note('شروع ادغامی: «تجزیه به نیمه‌ها، مرتب کن، ادغام کن»', 0)

  const work = (lo: number, hi: number) => {
    if (hi - lo <= 1) return
    const mid = Math.floor((lo + hi) / 2)
    stack.push({ label: `mergeSort[${lo}..${hi})`, range: [lo, hi] })
    note(
      `تجزیهٔ بازهٔ [${lo}..${hi}) به [${lo}..${mid}) و [${mid}..${hi}) — عمق پشته: ${stack.length}`,
      1
    )
    work(lo, mid)
    work(mid, hi)
    // ادغام
    const merged: number[] = []
    let i = lo
    let j = mid
    while (i < mid && j < hi) {
      comparisons++
      if (arr[i] <= arr[j]) {
        merged.push(arr[i++])
      } else {
        merged.push(arr[j++])
      }
      note(
        `ادغام: مقایسهٔ ${arr[Math.min(i, arr.length - 1)]} و … — تا اینجا: [${merged.join(', ')}]`,
        4,
        { pointers: { i, j } }
      )
    }
    while (i < mid) merged.push(arr[i++])
    while (j < hi) merged.push(arr[j++])
    for (let k = 0; k < merged.length; k++) {
      if (arr[lo + k] !== merged[k]) swaps++
      arr[lo + k] = merged[k]
    }
    note(
      `ادغام کامل شد: بازهٔ [${lo}..${hi}) = [${merged.join(', ')}]`,
      4,
      { sorted: [...Array(n).keys()].filter((k) => k >= lo && k < hi) }
    )
    stack.pop()
  }

  work(0, n)
  note(
    `مرتب شد! ✓ ${comparisons} مقایسه — تضمینی O(n log n) حتی در بدترین حالت`,
    0,
    { sorted: [...Array(n).keys()] }
  )
  return { steps, pseudocode: MERGE_PSEUDO, final: arr, ok: true }
}

/* ---------------- سریع ---------------- */
const QUICK_PSEUDO = [
  'if n <= 1: return A',
  'pivot = A[hi]',
  'partition: کوچک‌ترها چپ، بزرگ‌ترها راست',
  'quickSort(چپ) و quickSort(راست)',
]

export function quickSortTrace(input: number[]): TraceResult {
  const arr = clone(input)
  const n = arr.length
  const steps: AlgoStep[] = []
  let comparisons = 0
  let swaps = 0
  const stack: string[] = []

  const note = (msg: string, pseudoLine: number, extra: Partial<AlgoStep> = {}) => {
    steps.push({
      arr: clone(arr),
      sorted: [],
      pointers: {},
      callStack: [...stack],
      pseudoLine,
      note: msg,
      stats: { comparisons, swaps },
      ...extra,
    })
  }

  note('شروع سریع: انتخاب pivot و تقسیم (Lomuto)', 0)

  const work = (lo: number, hi: number) => {
    if (lo >= hi) return
    stack.push(`quickSort[${lo}..${hi}]`)
    const pivot = arr[hi]
    note(`pivot = A[${hi}] = ${pivot} — بازهٔ [${lo}..${hi}]`, 1, { pointers: { lo, hi, pivot: hi } })
    let i = lo
    for (let j = lo; j < hi; j++) {
      comparisons++
      if (arr[j] < pivot) {
        if (i !== j) {
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          swaps++
        }
        note(
          `A[${j}]=${arr[j]} < pivot ⇒ به بخش چپ رفت (جابه‌جایی با A[${i}])`,
          2,
          { pointers: { i, j, pivot: hi }, swap: i !== j ? [i, j] : undefined }
        )
        i++
      } else {
        note(`A[${j}]=${arr[j]} ≥ pivot ⇒ سر جای خودش می‌ماند`, 2, {
          pointers: { i, j, pivot: hi },
        })
      }
    }
    ;[arr[i], arr[hi]] = [arr[hi], arr[i]]
    swaps++
    note(
      `pivot در جای نهایی ${i} نشست — چپ همه کوچک‌تر و راست همه بزرگ‌ترند`,
      2,
      { pointers: { i }, sorted: [i] }
    )
    work(lo, i - 1)
    work(i + 1, hi)
    stack.pop()
  }

  work(0, n - 1)
  note(
    `مرتب شد! ✓ ${comparisons} مقایسه، ${swaps} جابه‌جایی — میانگین O(n log n)`,
    0,
    { sorted: [...Array(n).keys()] }
  )
  return { steps, pseudocode: QUICK_PSEUDO, final: arr, ok: true }
}

/* ---------------- درگاه عمومی ---------------- */
export function traceAlgo(
  algo: AlgoId,
  arr: number[],
  target?: number
): TraceResult {
  switch (algo) {
    case 'linear-search':
      return linearSearchTrace(arr, target ?? arr[Math.floor(arr.length / 2)] ?? 0)
    case 'binary-search':
      return binarySearchTrace(arr, target ?? arr[Math.floor(arr.length / 2)] ?? 0)
    case 'bubble-sort':
      return bubbleSortTrace(arr)
    case 'selection-sort':
      return selectionSortTrace(arr)
    case 'insertion-sort':
      return insertionSortTrace(arr)
    case 'merge-sort':
      return mergeSortTrace(arr)
    case 'quick-sort':
      return quickSortTrace(arr)
  }
}

/** شمارش عملیات برای Complexity Playground — مدل محاسباتی واقعی، نه رند */
export function complexityModel(n: number): { id: string; label: string; ops: number }[] {
  const safe = Math.max(1, Math.min(n, 512))
  return [
    { id: 'o1', label: 'O(1)', ops: 1 },
    { id: 'ologn', label: 'O(log n)', ops: Math.ceil(Math.log2(safe + 1)) },
    { id: 'on', label: 'O(n)', ops: safe },
    { id: 'onlogn', label: 'O(n log n)', ops: Math.round(safe * Math.log2(safe + 1)) },
    { id: 'on2', label: 'O(n²)', ops: safe * safe },
    { id: 'o2n', label: 'O(2ⁿ)', ops: Math.min(2 ** Math.min(safe, 40), Number.MAX_SAFE_INTEGER) },
  ]
}

/** نگاشت trace به مسیر یادگیری — برای شواهد */
export const ALGO_SKILL: Record<AlgoId, { track: TrackId; lessonId: string; skill: string }> = {
  'linear-search': { track: 'algorithm', lessonId: 'al-linear-search', skill: 'al-searching' },
  'binary-search': { track: 'algorithm', lessonId: 'al-binary-search', skill: 'al-searching' },
  'bubble-sort': { track: 'algorithm', lessonId: 'al-bubble', skill: 'al-sorting' },
  'selection-sort': { track: 'algorithm', lessonId: 'al-selection', skill: 'al-sorting' },
  'insertion-sort': { track: 'algorithm', lessonId: 'al-insertion', skill: 'al-sorting' },
  'merge-sort': { track: 'algorithm', lessonId: 'al-merge', skill: 'al-sorting' },
  'quick-sort': { track: 'algorithm', lessonId: 'al-quick', skill: 'al-sorting' },
}
