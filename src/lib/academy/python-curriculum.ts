/* ------------------------------------------------------------------ */
/* آکادمی پایتون، نمای برنامهٔ درسی (تجمیع سطح‌های ۰ تا ۸)             */
/* ۲۶ درس (۸+۱۴+۴) | تمرین‌ها با CPython واقعی (Pyodide)              */
/* ------------------------------------------------------------------ */

import { LESSONS_A, PY_LEVELS, PY_PASS, type PyLesson, type PyExercise, type PyQuizQ } from './python-a'
import { LESSONS_B } from './python-b'
import { LESSONS_C } from './python-c'

export type { PyLesson, PyExercise, PyQuizQ }
export { PY_LEVELS, PY_PASS }

export const PYTHON_LESSONS: PyLesson[] = [...LESSONS_A, ...LESSONS_B, ...LESSONS_C]

export const PY_TOTAL_EXERCISES = PYTHON_LESSONS.length

export function lessonsOfLevel(level: number): PyLesson[] {
  return PYTHON_LESSONS.filter((l) => l.level === level)
}

/** ذخیرهٔ پیشرفت، کلید واحد آکادمی پایتون */
export interface PyProgress {
  done: string[]
  ex: string[]
  quizBest: Record<string, number>
  projects: string[]
}

export function loadPyProgress(): PyProgress {
  try {
    const raw = localStorage.getItem('sunjob-py-v1')
    if (raw) {
      const p = JSON.parse(raw) as Partial<PyProgress>
      return {
        done: Array.isArray(p.done) ? p.done : [],
        ex: Array.isArray(p.ex) ? p.ex : [],
        quizBest: p.quizBest ?? {},
        projects: Array.isArray(p.projects) ? p.projects : [],
      }
    }
  } catch {
    /* ignore */
  }
  return { done: [], ex: [], quizBest: {}, projects: [] }
}

export function savePyProgress(p: PyProgress) {
  try {
    localStorage.setItem('sunjob-py-v1', JSON.stringify(p))
  } catch {
    /* ignore */
  }
}
