import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'
import { PYTHON_LESSONS, PY_PASS } from '../src/lib/academy/python-curriculum'
import { TERMINAL_MISSIONS } from '../src/lib/os/academy-data'
import { readJsonLimited, utf8ByteLength } from '../src/lib/api/guard'

describe('quality of learning content', () => {
  it('keeps Python lesson identifiers unique and stable in shape', () => {
    const ids = PYTHON_LESSONS.map((lesson) => lesson.id)
    expect(ids).toHaveLength(26)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('l0-what')
    expect(ids).toContain('l8-csv')
  })

  it('gives every Python exercise at least two staged hints and a real assertion marker', () => {
    const weakLessons = PYTHON_LESSONS
      .filter((lesson) => lesson.exercise.hints.length < 2 || !lesson.exercise.tests.includes(PY_PASS))
      .map((lesson) => lesson.id)
    expect(weakLessons).toEqual([])
  })

  it('keeps quiz answer indexes within their option lists', () => {
    for (const lesson of PYTHON_LESSONS) {
      for (const question of lesson.quiz) {
        expect(question.options.length).toBeGreaterThanOrEqual(2)
        expect(question.answer).toBeGreaterThanOrEqual(0)
        expect(question.answer).toBeLessThan(question.options.length)
      }
    }
  })

  it('keeps Linux terminal missions unique and scaffolded', () => {
    const ids = TERMINAL_MISSIONS.map((mission) => mission.id)
    expect(ids).toHaveLength(10)
    expect(new Set(ids).size).toBe(ids.length)
    expect(TERMINAL_MISSIONS.every((mission) => mission.hints.length >= 2)).toBe(true)
  })
})

describe('API request byte limits', () => {
  it('measures UTF-8 bytes rather than JavaScript string length', () => {
    const body = JSON.stringify({ name: 'سنجاب‌اواس 🐿️' })
    expect(utf8ByteLength(body)).toBeGreaterThan(body.length)
  })

  it('rejects a multibyte JSON body when its UTF-8 byte length exceeds the limit', async () => {
    const body = JSON.stringify({ name: 'سنجاب‌اواس 🐿️' })
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })
    const result = await readJsonLimited(req, body.length)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.resp.status).toBe(413)
  })

  it('accepts valid JSON at its exact UTF-8 byte limit', async () => {
    const body = JSON.stringify({ name: 'سلام' })
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })
    const result = await readJsonLimited(req, utf8ByteLength(body))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({ name: 'سلام' })
  })
})
