/* ------------------------------------------------------------------ */
/* موتور اجرای زبان‌های آموزشی «سان‌جاب‌او‌اس»                          */
/* پایتونِ کوچک (mini-python) + زبان سنجابی                            */
/* بدون وابستگی — کاملاً آفلاین و در مرورگر                            */
/* ------------------------------------------------------------------ */

export type ScriptLang = 'python' | 'squirrel'

export interface RunResult {
  output: string[]
  error: string | null
  ms: number
}

/* --------------------------- خطاها --------------------------- */

class LangError extends Error {
  line: number
  constructor(msg: string, line = 0) {
    super(msg)
    this.line = line
  }
}

/* --------------------------- توکن --------------------------- */

type TokType =
  | 'num'
  | 'str'
  | 'fstr'
  | 'ident'
  | 'op'
  | 'kw'
  | 'newline'

interface Tok {
  t: TokType
  v: string
  /** برای fstr: قطعات رشته و کد */
  parts?: string[]
  line: number
}

const KW: Record<ScriptLang, Record<string, string>> = {
  python: {
    if: 'if',
    elif: 'elif',
    else: 'else',
    while: 'while',
    for: 'for',
    in: 'in',
    def: 'def',
    return: 'return',
    break: 'break',
    continue: 'continue',
    pass: 'pass',
    True: 'True',
    False: 'False',
    None: 'None',
    and: 'and',
    or: 'or',
    not: 'not',
  },
  squirrel: {
    اگه: 'if',
    وگرنه: 'elif',
    پس: 'else',
    تاوقتی: 'while',
    برای: 'for',
    در: 'in',
    تابع: 'def',
    برگردون: 'return',
    بس‌کن: 'break',
    ادامه‌بده: 'continue',
    ردشو: 'pass',
    درست: 'True',
    غلط: 'False',
    هیچی: 'None',
    و: 'and',
    یا: 'or',
    نیست: 'not',
  },
}

const BUILTIN_ALIASES: Record<ScriptLang, Record<string, string>> = {
  python: {},
  squirrel: {
    چاپ: 'print',
    طول: 'len',
    بازه: 'range',
    عدد: 'int',
    اعشاری: 'float',
    رشته: 'str',
    جمع: 'sum',
    بیشترین: 'max',
    کمترین: 'min',
    قدرمطلق: 'abs',
    گرد: 'round',
    مرتب: 'sorted',
  },
}

const OPS = [
  '==', '!=', '<=', '>=', '**', '//', '+=', '-=', '*=', '/=',
  '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', '{', '}', ',', ':', '.',
]

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_\u0600-\u06FF]/.test(ch)
}
function isIdentChar(ch: string): boolean {
  return /[A-Za-z0-9_\u0600-\u06FF]/.test(ch)
}

/* --------------------------- لکسر --------------------------- */

interface LineTok {
  indent: number
  toks: Tok[]
  line: number
  blank: boolean
}

function lexLine(src: string, line: number, kw: Record<string, string>, allF = false): LineTok {
  const indentMatch = src.match(/^[ \t]*/)
  let indent = 0
  for (const c of indentMatch ? indentMatch[0] : '') indent += c === '\t' ? 4 : 1
  let s = src.trim()
  const toks: Tok[] = []

  // خط کامنت
  if (s.startsWith('#')) return { indent, toks, line, blank: true }

  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ' || ch === '\t') {
      i++
      continue
    }
    // کامنت وسط خط
    if (ch === '#') break
    // رشته (با پشتیبانی f-string ساده)
    if (ch === '"' || ch === "'" || ((ch === 'f' || ch === 'F') && (s[i + 1] === '"' || s[i + 1] === "'"))) {
      const isF = ch === 'f' || ch === 'F'
      if (isF) i++
      const quote = s[i]
      i++
      let raw = ''
      const parts: string[] = []
      let buf = ''
      let closed = false
      while (i < s.length) {
        const c = s[i]
        if (c === '\\' && i + 1 < s.length) {
          const nx = s[i + 1]
          const esc = nx === 'n' ? '\n' : nx === 't' ? '\t' : nx
          buf += esc
          i += 2
          continue
        }
        if (c === quote) {
          closed = true
          i++
          break
        }
        if (isF && c === '{') {
          // پیدا کردن } متناظر
          let depth = 1
          let j = i + 1
          while (j < s.length && depth > 0) {
            if (s[j] === '{') depth++
            if (s[j] === '}') depth--
            if (depth === 0) break
            j++
          }
          if (depth !== 0) throw new LangError('فارسی‌بند { بدون بسته‌شدن', line)
          if (buf) parts.push(buf)
          buf = ''
          parts.push('‘' + s.slice(i + 1, j) + '’')
          i = j + 1
          continue
        }
        buf += c
        i++
      }
      if (!closed) throw new LangError('رشته بسته نشده — کوتیشن یادت رفته!', line)
      if (buf || parts.length === 0) parts.push(buf)
      raw = ''
      void raw
      if (isF || allF) toks.push({ t: 'fstr', v: '', parts, line })
      else toks.push({ t: 'str', v: parts.join(''), line })
      continue
    }
    // عدد
    if (/[0-9]/.test(ch)) {
      let j = i
      while (j < s.length && /[0-9_.]/.test(s[j])) j++
      let num = s.slice(i, j).replace(/_+/g, '_')
      if ((num.match(/_/g) ?? []).length > 0) {
        // 1_000 پشتیبانی
        num = num.replace(/_/g, '')
      }
      toks.push({ t: 'num', v: num, line })
      i = j
      continue
    }
    // شناسه
    if (isIdentStart(ch)) {
      let j = i
      while (j < s.length && isIdentChar(s[j])) j++
      const word = s.slice(i, j)
      if (kw[word]) toks.push({ t: 'kw', v: kw[word], line })
      else toks.push({ t: 'ident', v: word, line })
      i = j
      continue
    }
    // عملگر
    const two = s.slice(i, i + 2)
    const three = s.slice(i, i + 3)
    void three
    const found = OPS.find((o) => s.startsWith(o, i))
    if (found) {
      toks.push({ t: 'op', v: found, line })
      i += found.length
      continue
    }
    throw new LangError(`کاراکتر عجیب «${ch}» رو نمی‌شناسم`, line)
  }

  return { indent, toks, line, blank: toks.length === 0 }
}

/* --------------------------- AST --------------------------- */

type Expr =
  | { k: 'num'; v: number; line: number }
  | { k: 'str'; v: string; line: number }
  | { k: 'fstr'; parts: (string | Expr)[]; line: number }
  | { k: 'bool'; v: boolean; line: number }
  | { k: 'none'; line: number }
  | { k: 'var'; name: string; line: number }
  | { k: 'list'; items: Expr[]; line: number }
  | { k: 'dict'; pairs: [Expr, Expr][]; line: number }
  | { k: 'bin'; op: string; l: Expr; r: Expr; line: number }
  | { k: 'cmp'; op: string; l: Expr; r: Expr; line: number }
  | { k: 'logic'; op: string; l: Expr; r: Expr; line: number }
  | { k: 'not'; e: Expr; line: number }
  | { k: 'neg'; e: Expr; line: number }
  | { k: 'call'; name: string; args: Expr[]; line: number }
  | { k: 'index'; obj: Expr; idx: Expr; line: number }
  | { k: 'method'; obj: Expr; name: string; args: Expr[]; line: number }

type Stmt =
  | { k: 'assign'; name: string; e: Expr; line: number }
  | { k: 'setindex'; obj: Expr; idx: Expr; e: Expr; line: number }
  | { k: 'multi'; names: string[]; values: Expr[] | null; single: Expr | null; line: number }
  | { k: 'aug'; name: string; op: string; e: Expr; line: number }
  | { k: 'expr'; e: Expr; line: number }
  | { k: 'if'; branches: { cond: Expr | null; body: Stmt[] }[]; line: number }
  | { k: 'while'; cond: Expr; body: Stmt[]; line: number }
  | { k: 'for'; vars: string[]; iter: Expr; body: Stmt[]; line: number }
  | { k: 'def'; name: string; params: string[]; body: Stmt[]; line: number }
  | { k: 'return'; e: Expr | null; line: number }
  | { k: 'break'; line: number }
  | { k: 'continue'; line: number }
  | { k: 'pass'; line: number }
  | { k: 'import'; mod: string; line: number }

/* --------------------------- پارسر --------------------------- */

class Parser {
  private lines: LineTok[]
  private pos = 0
  private kw: Record<string, string>
  private builtinAlias: Record<string, string>

  constructor(lines: LineTok[], kw: Record<string, string>, alias: Record<string, string>) {
    this.lines = lines
    this.kw = kw
    this.builtinAlias = alias
  }

  parseProgram(): Stmt[] {
    const body: Stmt[] = []
    while (this.pos < this.lines.length) {
      const lt = this.lines[this.pos]
      if (lt.blank) {
        this.pos++
        continue
      }
      body.push(...this.parseBlock(lt.indent))
      break
    }
    return body
  }

  /** از موقعیت فعلی، بلوکی با indent داده‌شده می‌خواند */
  private parseBlock(indent: number): Stmt[] {
    const body: Stmt[] = []
    while (this.pos < this.lines.length) {
      const lt = this.lines[this.pos]
      if (lt.blank) {
        this.pos++
        continue
      }
      if (lt.indent < indent) break
      if (lt.indent > indent) throw new LangError('تورفتگی عجیب! از راهنما کمک بگیر', lt.line)
      body.push(this.parseStmt())
    }
    return body
  }

  private parseStmt(): Stmt {
    const lt = this.lines[this.pos]
    const toks = lt.toks
    const line = lt.line
    if (toks.length === 0) {
      this.pos++
      return { k: 'pass', line }
    }
    const t0 = toks[0]

    if (t0.t === 'kw') {
      switch (t0.v) {
        case 'if':
        case 'elif': {
          const branches: { cond: Expr | null; body: Stmt[] }[] = []
          let cur: string = t0.v
          let guard = 0
          while (guard++ < 200) {
            const header = this.lines[this.pos]
            const condToks = header.toks.slice(1)
            // حذف : انتهایی
            this.expectColonEnd(condToks, header.line)
            const condSrc = condToks.slice(0, -1)
            let cond: Expr | null = null
            if (condSrc.length > 0) cond = this.parseExprFull(condSrc, header.line)
            else if (cur === 'if') throw new LangError('بعد از «اگه» شرط لازمه', header.line)
            this.pos++
            const body = this.parseSubBlock(header)
            branches.push({ cond, body })
            // دنبال کردن elif/else
            const nxt = this.lines[this.pos]
            if (nxt && !nxt.blank && nxt.indent === header.indent && nxt.toks[0]?.t === 'kw' && (nxt.toks[0].v === 'elif' || nxt.toks[0].v === 'else')) {
              cur = nxt.toks[0].v
              if (cur === 'else') {
                this.expectColonEnd(nxt.toks.slice(1), nxt.line)
                this.pos++
                const elseBody = this.parseSubBlock(nxt)
                branches.push({ cond: null, body: elseBody })
                return { k: 'if', branches, line }
              }
              continue
            }
            break
          }
          void cur
          return { k: 'if', branches, line }
        }
        case 'else': {
          throw new LangError('«وگرنه» بدون «اگه» معنی نداره!', line)
        }
        case 'while': {
          this.expectColonEnd(toks.slice(1), line)
          const cond = this.parseExprFull(toks.slice(1, -1), line)
          this.pos++
          const body = this.parseSubBlock(lt)
          return { k: 'while', cond, body, line }
        }
        case 'for': {
          // for x in expr:
          const inIdx = toks.findIndex((t) => t.t === 'kw' && t.v === 'in')
          if (inIdx < 1) throw new LangError('حلقهٔ «برای» باید شکل «برای x در بازه(10):» باشه', line)
          const vars: string[] = []
          for (let i = 1; i < inIdx; i++) {
            const t = toks[i]
            if (t.t === 'op' && t.v === ',') continue
            if (t.t !== 'ident') throw new LangError('اسم متغیر حلقه درست نیست', line)
            vars.push(t.v)
          }
          if (vars.length === 0) throw new LangError('بعد از «برای» اسم متغیر لازمه', line)
          this.expectColonEnd(toks.slice(1), line)
          const iterSrc = toks.slice(inIdx + 1, -1)
          this.pos++
          const body = this.parseSubBlock(lt)
          return { k: 'for', vars, iter: this.parseExprFull(iterSrc, line), body, line }
        }
        case 'def': {
          if (!toks[1] || toks[1].t !== 'ident') throw new LangError('بعد از «تابع/def» اسم تابع لازمه', line)
          const name = toks[1].v
          if (!toks[2] || toks[2].v !== '(') throw new LangError('بعد از اسم تابع، پرانتز لازمه', line)
          const params: string[] = []
          let i = 3
          for (; i < toks.length; i++) {
            const t = toks[i]
            if (t.t === 'op' && t.v === ')') break
            if (t.t === 'op' && t.v === ',') continue
            if (t.t === 'op' && t.v === ':') break
            if (t.t !== 'ident') throw new LangError('پارامتر تابع باید اسم باشه', line)
            params.push(t.v)
          }
          if (i >= toks.length || toks[i].v !== ')') throw new LangError('پرانتز تابع بسته نشده', line)
          this.expectColonEnd(toks.slice(i + 1), line)
          this.pos++
          const body = this.parseSubBlock(lt)
          return { k: 'def', name, params, body, line }
        }
        case 'return': {
          this.pos++
          const rest = toks.slice(1)
          return { k: 'return', e: rest.length ? this.parseExprFull(rest, line) : null, line }
        }
        case 'break':
          this.pos++
          return { k: 'break', line }
        case 'continue':
          this.pos++
          return { k: 'continue', line }
        case 'pass':
          this.pos++
          return { k: 'pass', line }
      }
    }

    // import؟
    if (t0.t === 'ident' && (t0.v === 'import' || t0.v === 'from')) {
      const mod = toks[1]?.t === 'ident' ? toks[1].v : ''
      this.pos++
      return { k: 'import', mod, line }
    }

    // انتصاب؟ name = / name += / name[idx] =
    const eq = this.findAssign(toks)
    if (eq) {
      const { idx, op } = eq
      const lhs = toks.slice(0, idx)
      const rhs = toks.slice(idx + 1)
      if (rhs.length === 0) throw new LangError('بعد از = یه چیزی بنویس', line)
      if (op === '=') {
        // چندمتغیره: a, b = 1, 2
        const names = this.identList(lhs)
        if (names && names.length > 1) {
          const parts = this.topLevelCommaSplit(rhs)
          this.pos++
          if (parts.length > 1) {
            return {
              k: 'multi',
              names,
              values: parts.map((p) => this.parseExprFull(p, line)),
              single: null,
              line,
            }
          }
          const e = this.parseExprFull(rhs, line)
          return { k: 'multi', names, values: null, single: e, line }
        }
        // تک‌متغیر
        const e = this.parseExprFull(rhs, line)
        if (lhs.length === 1 && lhs[0].t === 'ident') {
          this.pos++
          return { k: 'assign', name: lhs[0].v, e, line }
        }
        // list[...] = expr
        const lv = this.parseExprFull(lhs, line)
        if (lv.k === 'index') {
          this.pos++
          return { k: 'setindex', obj: lv.obj, idx: lv.idx, e, line }
        }
        throw new LangError('سمت چپ = باید یه متغیر یا list[i] باشه', line)
      }
      if (lhs.length === 1 && lhs[0].t === 'ident') {
        this.pos++
        const ea = this.parseExprFull(rhs, line)
        return { k: 'aug', name: lhs[0].v, op: op[0], e: ea, line }
      }
      throw new LangError('عملگر ترکیبی فقط روی متغیر ساده کار می‌کنه', line)
    }

    // عبارت ساده
    this.pos++
    return { k: 'expr', e: this.parseExprFull(toks, line), line }
  }

  private findAssign(toks: Tok[]): { idx: number; op: string } | null {
    let depth = 0
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]
      if (t.t === 'op') {
        if ('([{'.includes(t.v)) depth++
        else if (')]}'.includes(t.v)) depth--
        else if (depth === 0 && ['=', '+=', '-=', '*=', '/='].includes(t.v)) {
          return { idx: i, op: t.v }
        }
      }
    }
    return null
  }

  /** آیا دنبالهٔ توکن‌ها فقط شناسه‌های جدا‌شده با کاما است؟ */
  private identList(toks: Tok[]): string[] | null {
    const names: string[] = []
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]
      if (i % 2 === 0) {
        if (t.t !== 'ident') return null
        names.push(t.v)
      } else if (!(t.t === 'op' && t.v === ',')) {
        return null
      }
    }
    return names
  }

  /** شکستن توکن‌ها بر اساس کاماهای بیرون از پرانتز */
  private topLevelCommaSplit(toks: Tok[]): Tok[][] {
    const parts: Tok[][] = [[]]
    let depth = 0
    for (const t of toks) {
      if (t.t === 'op') {
        if ('([{'.includes(t.v)) depth++
        else if (')]}'.includes(t.v)) depth--
        else if (t.v === ',' && depth === 0) {
          parts.push([])
          continue
        }
      }
      parts[parts.length - 1].push(t)
    }
    return parts
  }

  private expectColonEnd(condToks: Tok[], line: number, consumed?: boolean): void {
    void consumed
    const last = condToks[condToks.length - 1]
    if (!last || last.t !== 'op' || last.v !== ':') {
      throw new LangError('آخر خط دو نقطه (:) یادت نره!', line)
    }
  }

  /** بعد از هدر بلوک، بدنه با تورفتگی بیشتر می‌خواند */
  private parseSubBlock(header: LineTok): Stmt[] {
    if (this.pos >= this.lines.length) throw new LangError('بدنه بلوک خالیه! بعد از : یه خط با تورفتگی بنویس', header.line)
    let nxt = this.lines[this.pos]
    // حذف خطوط خالی
    while (nxt && nxt.blank) {
      this.pos++
      nxt = this.lines[this.pos]
    }
    if (!nxt) throw new LangError('بدنه بلوک خالیه!', header.line)
    if (nxt.indent <= header.indent) {
      throw new LangError('بعد از : باید خط بعد رو با تورفتگی (۴ فاصله) بنویسی', nxt.line)
    }
    return this.parseBlock(nxt.indent)
  }

  /* ------------- عبارت‌ها ------------- */

  private parseExprFull(toks: Tok[], fallbackLine = 0): Expr {
    const p = new ExprParser(toks, this.kw, this.builtinAlias, fallbackLine)
    return p.parse()
  }
}

class ExprParser {
  private toks: Tok[]
  private pos = 0
  private alias: Record<string, string>
  private fallbackLine: number

  constructor(toks: Tok[], _kw: Record<string, string>, alias: Record<string, string>, fallbackLine: number) {
    this.toks = toks
    this.alias = alias
    this.fallbackLine = fallbackLine
  }

  private peek(): Tok | null {
    return this.toks[this.pos] ?? null
  }
  private next(): Tok | null {
    return this.toks[this.pos++] ?? null
  }
  private line(t: Tok | null): number {
    return t?.line ?? this.fallbackLine
  }

  parse(): Expr {
    const e = this.orExpr()
    if (this.pos < this.toks.length) {
      const t = this.toks[this.pos]
      throw new LangError(`چیز اضافه «${t.v}» وسط عبارت`, t.line)
    }
    return e
  }

  private orExpr(): Expr {
    let l = this.andExpr()
    while (this.peek()?.t === 'kw' && this.peek()!.v === 'or') {
      const line = this.line(this.next())
      const r = this.andExpr()
      l = { k: 'logic', op: 'or', l, r, line }
    }
    return l
  }
  private andExpr(): Expr {
    let l = this.notExpr()
    while (this.peek()?.t === 'kw' && this.peek()!.v === 'and') {
      const line = this.line(this.next())
      const r = this.notExpr()
      l = { k: 'logic', op: 'and', l, r, line }
    }
    return l
  }
  private notExpr(): Expr {
    if (this.peek()?.t === 'kw' && this.peek()!.v === 'not') {
      const line = this.line(this.next())
      return { k: 'not', e: this.notExpr(), line }
    }
    return this.compare()
  }
  private compare(): Expr {
    let l = this.addSub()
    for (;;) {
      const t = this.peek()
      if (t && t.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(t.v)) {
        this.next()
        const r = this.addSub()
        l = { k: 'cmp', op: t.v, l, r, line: t.line }
        continue
      }
      // «in» در عبارت (مثل: 'a' in list)
      if (t && t.t === 'kw' && t.v === 'in') {
        this.next()
        const r = this.addSub()
        l = { k: 'cmp', op: 'in', l, r, line: t.line }
        continue
      }
      break
    }
    return l
  }
  private addSub(): Expr {
    let l = this.mulDiv()
    for (;;) {
      const t = this.peek()
      if (t && t.t === 'op' && ['+', '-'].includes(t.v)) {
        this.next()
        const r = this.mulDiv()
        l = { k: 'bin', op: t.v, l, r, line: t.line }
        continue
      }
      break
    }
    return l
  }
  private mulDiv(): Expr {
    let l = this.unary()
    for (;;) {
      const t = this.peek()
      if (t && t.t === 'op' && ['*', '/', '//', '%'].includes(t.v)) {
        this.next()
        const r = this.unary()
        l = { k: 'bin', op: t.v, l, r, line: t.line }
        continue
      }
      break
    }
    return l
  }
  private unary(): Expr {
    const t = this.peek()
    if (t && t.t === 'op' && t.v === '-') {
      this.next()
      return { k: 'neg', e: this.unary(), line: t.line }
    }
    if (t && t.t === 'op' && t.v === '+') {
      this.next()
      return this.unary()
    }
    return this.power()
  }
  private power(): Expr {
    const base = this.postfix()
    const t = this.peek()
    if (t && t.t === 'op' && t.v === '**') {
      this.next()
      const exp = this.unary() // راست‌چین مثل پایتون
      return { k: 'bin', op: '**', l: base, r: exp, line: t.line }
    }
    return base
  }
  private postfix(): Expr {
    let e = this.primary()
    for (;;) {
      const t = this.peek()
      if (!t) break
      if (t.t === 'op' && t.v === '(') {
        if (e.k !== 'var') throw new LangError('این چیز قابل صدا زدن نیست!', t.line)
        this.next()
        const args: Expr[] = []
        for (;;) {
          const p = this.peek()
          if (!p) throw new LangError('پرانتز بسته نشده!', t.line)
          if (p.t === 'op' && p.v === ')') {
            this.next()
            break
          }
          args.push(this.orExpr())
          const c = this.peek()
          if (c && c.t === 'op' && c.v === ',') {
            this.next()
            continue
          }
          if (c && c.t === 'op' && c.v === ')') {
            this.next()
            break
          }
          throw new LangError('پرانتز یا کاما جا افتاده!', this.line(c))
        }
        const name = e.name
        const mapped = this.alias[name]
        e = { k: 'call', name: mapped ?? name, args, line: t.line }
        continue
      }
      if (t.t === 'op' && t.v === '[') {
        this.next()
        const idx = this.orExpr()
        const close = this.next()
        if (!close || close.v !== ']') throw new LangError('کروشه بسته نشده!', t.line)
        e = { k: 'index', obj: e, idx, line: t.line }
        continue
      }
      if (t.t === 'op' && t.v === '.') {
        this.next()
        const nameTok = this.next()
        if (!nameTok || nameTok.t !== 'ident') throw new LangError('بعد از نقطه اسم متد لازمه', t.line)
        const open = this.peek()
        if (open && open.t === 'op' && open.v === '(') {
          this.next()
          const args: Expr[] = []
          for (;;) {
            const p = this.peek()
            if (!p) throw new LangError('پرانتز بسته نشده!', open.line)
            if (p.t === 'op' && p.v === ')') {
              this.next()
              break
            }
            args.push(this.orExpr())
            const c = this.peek()
            if (c && c.t === 'op' && c.v === ',') {
              this.next()
              continue
            }
            if (c && c.t === 'op' && c.v === ')') {
              this.next()
              break
            }
            throw new LangError('پرانتز یا کاما جا افتاده!', this.line(c))
          }
          e = { k: 'method', obj: e, name: nameTok.v, args, line: t.line }
        } else {
          // attribute بدون پرانتز — فقط برای math.pi و امثالش
          e = { k: 'method', obj: e, name: `@${nameTok.v}`, args: [], line: t.line }
        }
        continue
      }
      break
    }
    return e
  }

  private primary(): Expr {
    const t = this.next()
    if (!t) throw new LangError('عبارت ناقصه', this.fallbackLine)
    if (t.t === 'num') {
      return { k: 'num', v: Number(t.v), line: t.line }
    }
    if (t.t === 'str') return { k: 'str', v: t.v, line: t.line }
    if (t.t === 'fstr') {
      const parts: (string | Expr)[] = (t.parts ?? []).map((p) =>
        p.startsWith('‘') ? this.parseSub(p.slice(1, -1), t.line) : p
      )
      return { k: 'fstr', parts, line: t.line }
    }
    if (t.t === 'kw') {
      if (t.v === 'True') return { k: 'bool', v: true, line: t.line }
      if (t.v === 'False') return { k: 'bool', v: false, line: t.line }
      if (t.v === 'None') return { k: 'none', line: t.line }
      throw new LangError(`«${t.v}» اینجا جاش نیست`, t.line)
    }
    if (t.t === 'ident') {
      // لیست / دیکشنری؟ — نه، فقط متغیر. لیست با [ شروع می‌شود.
      return { k: 'var', name: t.v, line: t.line }
    }
    if (t.t === 'op' && t.v === '(') {
      const e = this.orExpr()
      const close = this.next()
      if (!close || close.v !== ')') throw new LangError('پرانتز بسته نشده!', t.line)
      return e
    }
    if (t.t === 'op' && t.v === '[') {
      const items: Expr[] = []
      for (;;) {
        const p = this.peek()
        if (!p) throw new LangError('کروشه لیست بسته نشده!', t.line)
        if (p.t === 'op' && p.v === ']') {
          this.next()
          break
        }
        items.push(this.orExpr())
        const c = this.peek()
        if (c && c.t === 'op' && c.v === ',') {
          this.next()
          continue
        }
        if (c && c.t === 'op' && c.v === ']') {
          this.next()
          break
        }
        throw new LangError('کروشه یا کاما جا افتاده!', this.line(c))
      }
      return { k: 'list', items, line: t.line }
    }
    if (t.t === 'op' && t.v === '{') {
      const pairs: [Expr, Expr][] = []
      for (;;) {
        const p = this.peek()
        if (!p) throw new LangError('آکولاد دیکشنری بسته نشده!', t.line)
        if (p.t === 'op' && p.v === '}') {
          this.next()
          break
        }
        const key = this.orExpr()
        const colon = this.next()
        if (!colon || colon.v !== ':') throw new LangError('دیکشنری باید «کلید: مقدار» باشه', t.line)
        const val = this.orExpr()
        pairs.push([key, val])
        const c = this.peek()
        if (c && c.t === 'op' && c.v === ',') {
          this.next()
          continue
        }
        if (c && c.t === 'op' && c.v === '}') {
          this.next()
          break
        }
        throw new LangError('آکولاد یا کاما جا افتاده!', this.line(c))
      }
      return { k: 'dict', pairs, line: t.line }
    }
    throw new LangError(`«${t.v}» اینجا معنی نداره`, t.line)
  }

  /** پارس یک زیرعبارت برای f-string */
  private parseSub(code: string, line: number): Expr {
    const kw = KW.python
    void kw
    const toks: Tok[] = []
    // لکس ساده
    let i = 0
    while (i < code.length) {
      const ch = code[i]
      if (ch === ' ') {
        i++
        continue
      }
      if (/[0-9]/.test(ch)) {
        let j = i
        while (j < code.length && /[0-9.]/.test(code[j])) j++
        toks.push({ t: 'num', v: code.slice(i, j), line })
        i = j
        continue
      }
      if (isIdentStart(ch)) {
        let j = i
        while (j < code.length && isIdentChar(code[j])) j++
        toks.push({ t: 'ident', v: code.slice(i, j), line })
        i = j
        continue
      }
      const found = OPS.find((o) => code.startsWith(o, i))
      if (found) {
        toks.push({ t: 'op', v: found, line })
        i += found.length
        continue
      }
      throw new LangError(`داخل f-string کاراکتر «${ch}» مشکل داره`, line)
    }
    const p = new ExprParser(toks, {}, this.alias, line)
    return p.parse()
  }
}

/* --------------------------- مقادیر و محیط --------------------------- */

interface FuncValue {
  __func: true
  name: string
  params: string[]
  body: Stmt[]
  env: Env
}

type Env = Map<string, unknown>

class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
  v: unknown
  constructor(v: unknown) {
    this.v = v
  }
}

const MAX_STEPS = 300_000
const MAX_DEPTH = 150
const MAX_OUTPUT = 800

function fmt(v: unknown, repr = false): string {
  if (v === null || v === undefined) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v)
    const r = Number(v.toPrecision(10))
    return String(r)
  }
  if (typeof v === 'string') return repr ? `'${v}'` : v
  if (Array.isArray(v)) return '[' + v.map((x) => fmt(x, true)).join(', ') + ']'
  if (typeof v === 'object' && '__func' in (v as Record<string, unknown>)) {
    return `<تابع ${(v as FuncValue).name}>`
  }
  if (v instanceof Map) {
    return '{' + [...v.entries()].map(([k, x]) => `${fmt(k, true)}: ${fmt(x, true)}`).join(', ') + '}'
  }
  return String(v)
}

class Runtime {
  out: string[] = []
  steps = 0
  depth = 0
  globals = new Map<string, unknown>()
  mathOk = false

  emit(s: string) {
    if (this.out.length >= MAX_OUTPUT) {
      throw new LangError('خروجی خیلی طولانی شد! (شاید حلقه بی‌نهایت؟)')
    }
    this.out.push(s)
  }

  tick(line: number) {
    this.steps++
    if (this.steps > MAX_STEPS) {
      throw new LangError('برنامه زیادی طول کشید — شاید حلقه بی‌نهایت داری؟', line)
    }
  }

  run(body: Stmt[], env: Env) {
    for (const st of body) this.exec(st, env)
  }

  exec(st: Stmt, env: Env): void {
    this.tick((st as { line: number }).line)
    switch (st.k) {
      case 'assign':
        env.set(st.name, this.eval(st.e, env))
        return
      case 'multi': {
        let vals: unknown[]
        if (st.values) {
          if (st.values.length !== st.names.length) {
            throw new LangError(`تعداد متغیرها (${st.names.length}) با مقادیر (${st.values.length}) نمی‌خونه`, st.line)
          }
          vals = st.values.map((x) => this.eval(x, env))
        } else {
          const v = this.eval(st.single!, env)
          if (!Array.isArray(v) || v.length !== st.names.length) {
            throw new LangError(`سمت راست باید لیستی با ${st.names.length} عضو باشه`, st.line)
          }
          vals = v
        }
        st.names.forEach((n, i) => env.set(n, vals[i]))
        return
      }
      case 'setindex': {
        const obj = this.eval(st.obj, env)
        const idx = this.eval(st.idx, env)
        const val = this.eval(st.e, env)
        if (Array.isArray(obj)) {
          const i = typeof idx === 'number' ? idx : Number(idx)
          if (!Number.isInteger(i) || i < 0) throw new LangError(`اندیس لیست باید عدد مثبت باشه`, (st as { line: number }).line)
          obj[i] = val
          return
        }
        if (obj instanceof Map) {
          obj.set(idx, val)
          return
        }
        throw new LangError('روی این نوع داده نمی‌شه مقدار گذاشت', (st as { line: number }).line)
      }
      case 'aug': {
        const cur = env.get(st.name)
        if (cur === undefined) throw new LangError(`متغیر «${st.name}» هنوز ساخته نشده`, (st as { line: number }).line)
        env.set(st.name, this.binop(st.op, cur, this.eval(st.e, env), (st as { line: number }).line))
        return
      }
      case 'expr':
        this.eval(st.e, env)
        return
      case 'if': {
        for (const b of st.branches) {
          if (b.cond === null || truthy(this.eval(b.cond, env))) {
            this.run(b.body, env)
            return
          }
        }
        return
      }
      case 'while': {
        let guard = 0
        while (truthy(this.eval(st.cond, env))) {
          this.tick(st.line)
          if (++guard > MAX_STEPS) throw new LangError('حلقه while بی‌نهایت شد!', st.line)
          try {
            this.run(st.body, env)
          } catch (e) {
            if (e instanceof BreakSignal) return
            if (e instanceof ContinueSignal) continue
            throw e
          }
        }
        return
      }
      case 'for': {
        const it = this.eval(st.iter, env)
        const items = this.iterate(it, st.line)
        for (const item of items) {
          this.tick(st.line)
          if (st.vars.length === 1) {
            env.set(st.vars[0], item)
          } else if (Array.isArray(item) && item.length === st.vars.length) {
            st.vars.forEach((v, i) => env.set(v, item[i]))
          } else {
            throw new LangError('تعداد متغیرهای حلقه با داده نمی‌خونه', st.line)
          }
          try {
            this.run(st.body, env)
          } catch (e) {
            if (e instanceof BreakSignal) return
            if (e instanceof ContinueSignal) continue
            throw e
          }
        }
        return
      }
      case 'def':
        env.set(st.name, { __func: true, name: st.name, params: st.params, body: st.body, env } satisfies FuncValue)
        return
      case 'return':
        throw new ReturnSignal(st.e ? this.eval(st.e, env) : null)
      case 'break':
        throw new BreakSignal()
      case 'continue':
        throw new ContinueSignal()
      case 'pass':
        return
      case 'import': {
        if (st.mod === 'math') {
          this.mathOk = true
          return
        }
        if (st.mod === 'random' || st.mod === 'time' || st.mod === 'os' || st.mod === 'sys') {
          return // بی‌صدا قبول — برای آموزش بد نیست
        }
        throw new LangError(`ماژول «${st.mod}» توی پایتونِ کوچیک ما نیست!`, st.line)
      }
    }
  }

  iterate(it: unknown, line: number): unknown[] {
    if (typeof it === 'number') throw new LangError('عدد قابل حلقه‌زدن نیست — از بازه() استفاده کن', line)
    if (typeof it === 'string') return [...it]
    if (Array.isArray(it)) return it
    if (it instanceof Map) return [...it.keys()]
    throw new LangError('این نوع داده حلقه نمی‌شه', line)
  }

  eval(e: Expr, env: Env): unknown {
    this.tick(e.line)
    switch (e.k) {
      case 'num':
        return e.v
      case 'str':
        return e.v
      case 'fstr':
        return e.parts
          .map((p) => (typeof p === 'string' ? p : fmt(this.eval(p, env))))
          .join('')
      case 'bool':
        return e.v
      case 'none':
        return null
      case 'var': {
        const v = env.get(e.name)
        if (v !== undefined) return v
        if (this.globals.has(e.name)) return this.globals.get(e.name)
        // math.* ؟
        if (this.mathOk && e.name.startsWith('math.')) {
          const fn = e.name.slice(5)
          if (fn === 'pi') return Math.PI
          if (fn === 'e') return Math.E
        }
        throw new LangError(`متغیر «${e.name}» پیدا نشد — اسمش رو درست نوشتی؟`, e.line)
      }
      case 'list':
        return e.items.map((x) => this.eval(x, env))
      case 'dict': {
        const m = new Map<unknown, unknown>()
        for (const [k, v] of e.pairs) m.set(this.eval(k, env), this.eval(v, env))
        return m
      }
      case 'neg': {
        const v = this.eval(e.e, env)
        if (typeof v !== 'number') throw new LangError('منفی فقط روی عدد کار می‌کنه', e.line)
        return -v
      }
      case 'not':
        return !truthy(this.eval(e.e, env))
      case 'logic': {
        const l = this.eval(e.l, env)
        if (e.op === 'and') return truthy(l) ? this.eval(e.r, env) : l
        return truthy(l) ? l : this.eval(e.r, env)
      }
      case 'cmp': {
        const l = this.eval(e.l, env)
        const r = this.eval(e.r, env)
        switch (e.op) {
          case '==':
            return deepEq(l, r)
          case '!=':
            return !deepEq(l, r)
          case '<':
            return (l as number) < (r as number)
          case '>':
            return (l as number) > (r as number)
          case '<=':
            return (l as number) <= (r as number)
          case '>=':
            return (l as number) >= (r as number)
          case 'in':
            if (typeof r === 'string') return r.includes(String(l))
            if (Array.isArray(r)) return r.some((x) => deepEq(x, l))
            if (r instanceof Map) return r.has(l)
            throw new LangError('عملگر «در» برای این نوع پشتیبانی نمی‌شه', e.line)
        }
        return false
      }
      case 'bin': {
        const l = this.eval(e.l, env)
        const r = this.eval(e.r, env)
        return this.binop(e.op, l, r, e.line)
      }
      case 'index': {
        const obj = this.eval(e.obj, env)
        const idx = this.eval(e.idx, env)
        if (typeof obj === 'string') {
          const i = Math.trunc(Number(idx))
          if (Number.isNaN(i)) throw new LangError('اندیس رشته باید عدد باشه', e.line)
          const n = i < 0 ? obj.length + i : i
          if (n < 0 || n >= obj.length) throw new LangError(`اندیس ${i} بیرون از طول رشته است`, e.line)
          return obj[n]
        }
        if (Array.isArray(obj)) {
          const i = Math.trunc(Number(idx))
          if (Number.isNaN(i)) throw new LangError('اندیس لیست باید عدد باشه', e.line)
          const n = i < 0 ? obj.length + i : i
          if (n < 0 || n >= obj.length) throw new LangError(`اندیس ${i} بیرون از طول لیست است (طول: ${obj.length})`, e.line)
          return obj[n]
        }
        if (obj instanceof Map) {
          if (!obj.has(idx)) throw new LangError(`کلید «${fmt(idx)}» توی دیکشنری نیست`, e.line)
          return obj.get(idx)
        }
        throw new LangError('این نوع داده اندیس نمی‌خوره', e.line)
      }
      case 'method':
        return this.method(e, env)
      case 'call':
        return this.callFn(e, env)
    }
  }

  binop(op: string, l: unknown, r: unknown, line: number): unknown {
    if (op === '+') {
      if (typeof l === 'string' || typeof r === 'string') {
        if (typeof l === 'string' && typeof r === 'string') return l + r
        throw new LangError('جمع رشته با عدد؟ اول str() کن!', line)
      }
      if (Array.isArray(l) && Array.isArray(r)) return [...l, ...r]
      return this.num(l, line) + this.num(r, line)
    }
    if (op === '*') {
      if (typeof l === 'string' && typeof r === 'number') return l.repeat(Math.max(0, Math.trunc(r)))
      if (typeof r === 'string' && typeof l === 'number') return r.repeat(Math.max(0, Math.trunc(l)))
    }
    if (op === '/') {
      const rn = this.num(r, line)
      if (rn === 0) throw new LangError('تقسیم بر صفر؟! ریاضی‌ات یه لنگی داره دوست من', line)
      return this.num(l, line) / rn
    }
    if (op === '//') {
      const rn = this.num(r, line)
      if (rn === 0) throw new LangError('تقسیم بر صفر؟!', line)
      return Math.floor(this.num(l, line) / rn)
    }
    if (op === '%') {
      const rn = this.num(r, line)
      if (rn === 0) throw new LangError('باقیمانده بر صفر؟!', line)
      return this.num(l, line) % rn
    }
    if (op === '**') return Math.pow(this.num(l, line), this.num(r, line))
    const ln = this.num(l, line)
    const rn = this.num(r, line)
    switch (op) {
      case '-':
        return ln - rn
      case '*':
        return ln * rn
    }
    throw new LangError(`عملگر «${op}» رو نمی‌شناسم`, line)
  }

  num(v: unknown, line: number): number {
    if (typeof v === 'number') return v
    if (typeof v === 'boolean') return v ? 1 : 0
    throw new LangError(`«${fmt(v)}» عدد نیست!`, line)
  }

  method(e: Extract<Expr, { k: 'method' }>, env: Env): unknown {
    const obj = this.eval(e.obj, env)
    const name = e.name
    // attribute خواندنی
    if (name.startsWith('@')) {
      const attr = name.slice(1)
      if (this.mathOk && typeof obj === 'string' && obj === 'math') {
        if (attr === 'pi') return Math.PI
        if (attr === 'e') return Math.E
        throw new LangError(`math.${attr} رو نداریم`, e.line)
      }
      throw new LangError(`«.${attr}» بدون پرانتز اینجا معنی نداره`, e.line)
    }
    const args = e.args.map((a) => this.eval(a, env))
    // math.* تابع‌ها روی شیء رشته‌ای math
    if (obj === 'math' && this.mathOk) {
      const n = this.num(args[0] ?? 0, e.line)
      switch (name) {
        case 'sqrt':
          if (n < 0) throw new LangError('جذر عدد منفی؟! اینجا جهان اعداد حقیقیه', e.line)
          return Math.sqrt(n)
        case 'floor':
          return Math.floor(n)
        case 'ceil':
          return Math.ceil(n)
        case 'sin':
          return Math.sin(n)
        case 'cos':
          return Math.cos(n)
        case 'tan':
          return Math.tan(n)
        case 'fabs':
          return Math.abs(n)
        case 'log':
          return Math.log(n)
        case 'log10':
          return Math.log10(n)
        default:
          throw new LangError(`math.${name} رو نداریم`, e.line)
      }
    }
    if (typeof obj === 'string') {
      switch (name) {
        case 'upper':
          return obj.toUpperCase()
        case 'lower':
          return obj.toLowerCase()
        case 'strip':
          return obj.trim()
        case 'split':
          return args.length ? obj.split(String(args[0])) : obj.split(/\s+/).filter(Boolean)
        case 'join': {
          const parts = args[0]
          if (!Array.isArray(parts)) throw new LangError('join به یه لیست نیاز داره', e.line)
          return parts.map((p) => fmt(p)).join(obj)
        }
        case 'replace':
          return obj.split(String(args[0])).join(String(args[1]))
        case 'find':
          return obj.indexOf(String(args[0]))
        case 'count':
          return obj.split(String(args[0])).length - 1
        case 'startswith':
          return obj.startsWith(String(args[0]))
        case 'endswith':
          return obj.endsWith(String(args[0]))
      }
    }
    if (Array.isArray(obj)) {
      switch (name) {
        case 'append':
          obj.push(args[0])
          return null
        case 'pop': {
          if (obj.length === 0) throw new LangError('لیست خالیه، چی رو بندازم بیرون؟', e.line)
          const i = args.length ? Math.trunc(Number(args[0])) : obj.length - 1
          const n = i < 0 ? obj.length + i : i
          if (n < 0 || n >= obj.length) throw new LangError('اندیس pop بیرون از لیست است', e.line)
          return obj.splice(n, 1)[0]
        }
        case 'insert':
          obj.splice(Math.trunc(Number(args[0])), 0, args[1])
          return null
        case 'remove': {
          const i = obj.findIndex((x) => deepEq(x, args[0]))
          if (i >= 0) obj.splice(i, 1)
          return null
        }
        case 'reverse':
          obj.reverse()
          return null
        case 'sort':
          obj.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : fmt(a).localeCompare(fmt(b), 'fa')))
          return null
        case 'index':
          return obj.findIndex((x) => deepEq(x, args[0]))
        case 'count':
          return obj.filter((x) => deepEq(x, args[0])).length
        case 'clear':
          obj.length = 0
          return null
        case 'copy':
          return [...obj]
      }
    }
    if (obj instanceof Map) {
      switch (name) {
        case 'keys':
          return [...obj.keys()]
        case 'values':
          return [...obj.values()]
        case 'items':
          return [...obj.entries()].map(([k, v]) => [k, v])
        case 'get':
          return obj.has(args[0]) ? obj.get(args[0]) : (args[1] ?? null)
        case 'pop':
          if (!obj.has(args[0])) throw new LangError('این کلید توی دیکشنری نیست', e.line)
          {
            const v = obj.get(args[0])
            obj.delete(args[0])
            return v
          }
        case 'update': {
          const other = args[0]
          if (other instanceof Map) for (const [k, v] of other) obj.set(k, v)
          return null
        }
      }
    }
    throw new LangError(`متد «${name}» برای این نوع داده وجود نداره`, e.line)
  }

  callFn(e: Extract<Expr, { k: 'call' }>, env: Env): unknown {
    const args = e.args.map((a) => this.eval(a, env))
    // توابع داخلی
    switch (e.name) {
      case 'print': {
        const sep = args.length >= 1 && args[0] === 'sep=' ? ' ' : ' '
        void sep
        this.emit(args.map((a) => fmt(a)).join(' '))
        return null
      }
      case 'len': {
        const v = args[0]
        if (typeof v === 'string' || Array.isArray(v)) return v.length
        if (v instanceof Map) return v.size
        throw new LangError('روی این نوع داده طول نداریم', e.line)
      }
      case 'range': {
        const a = args.map((x) => Math.trunc(this.num(x, e.line)))
        let start = 0
        let stop = 0
        let step = 1
        if (a.length === 1) stop = a[0]
        else if (a.length >= 2) {
          start = a[0]
          stop = a[1]
          if (a.length >= 3) step = a[2] || 1
        } else throw new LangError('بازه به حداقل یه عدد نیاز داره', e.line)
        const out: number[] = []
        if (step > 0) for (let i = start; i < stop; i += step) out.push(i)
        else for (let i = start; i > stop; i += step) out.push(i)
        return out
      }
      case 'int': {
        const v = args[0]
        if (typeof v === 'number') return Math.trunc(v)
        if (typeof v === 'string') {
          const n = Number(v)
          if (Number.isNaN(n)) throw new LangError(`«${v}» به عدد تبدیل نمی‌شه`, e.line)
          return Math.trunc(n)
        }
        throw new LangError('int فقط روی عدد یا رشتهٔ عددی کار می‌کنه', e.line)
      }
      case 'float': {
        const n = Number(args[0])
        if (Number.isNaN(n)) throw new LangError('تبدیل به اعشاری نشد', e.line)
        return n
      }
      case 'str':
        return fmt(args[0])
      case 'bool':
        return truthy(args[0])
      case 'sum': {
        const arr = args[0]
        if (!Array.isArray(arr)) throw new LangError('جمع به یه لیست نیاز داره', e.line)
        return arr.reduce((s: number, x) => s + this.num(x, e.line), 0)
      }
      case 'max': {
        const arr = Array.isArray(args[0]) ? args[0] : args
        if (arr.length === 0) throw new LangError('لیست خالیه', e.line)
        return arr.reduce((m, x) => (this.num(x, e.line) > this.num(m, e.line) ? x : m))
      }
      case 'min': {
        const arr = Array.isArray(args[0]) ? args[0] : args
        if (arr.length === 0) throw new LangError('لیست خالیه', e.line)
        return arr.reduce((m, x) => (this.num(x, e.line) < this.num(m, e.line) ? x : m))
      }
      case 'abs':
        return Math.abs(this.num(args[0], e.line))
      case 'round': {
        const n = this.num(args[0], e.line)
        const d = args.length > 1 ? Math.trunc(this.num(args[1], e.line)) : 0
        const f = Math.pow(10, d)
        return Math.round(n * f) / f
      }
      case 'sorted': {
        const arr = args[0]
        if (!Array.isArray(arr)) throw new LangError('مرتب به یه لیست نیاز داره', e.line)
        return [...arr].sort((a, b) =>
          typeof a === 'number' && typeof b === 'number' ? a - b : fmt(a).localeCompare(fmt(b), 'fa')
        )
      }
      case 'list': {
        const v = args[0]
        if (Array.isArray(v)) return [...v]
        if (typeof v === 'string') return [...v]
        if (v instanceof Map) return [...v.keys()]
        throw new LangError('لیست‌سازی از این نوع ممکن نیست', e.line)
      }
      case 'dict':
        return new Map()
      case 'reversed': {
        const v = args[0]
        if (Array.isArray(v)) return [...v].reverse()
        if (typeof v === 'string') return [...v].reverse()
        throw new LangError('برعکس‌سازی روی این نوع ممکن نیست', e.line)
      }
      case 'input':
        throw new LangError('ورودی از کاربر (input) توی نسخهٔ مرورگریمون نداریم — از متغیر استفاده کن!', e.line)
      case 'sqrt': {
        const n = this.num(args[0], e.line)
        if (n < 0) throw new LangError('جذر عدد منفی؟! اینجا جهان اعداد حقیقیه', e.line)
        return Math.sqrt(n)
      }
      case 'pow':
        return Math.pow(this.num(args[0], e.line), this.num(args[1], e.line))
      case 'floor':
        return Math.floor(this.num(args[0], e.line))
      case 'ceil':
        return Math.ceil(this.num(args[0], e.line))
      case 'random':
        return Math.random()
    }
    // توابع کاربر
    const fn = env.get(e.name) ?? this.globals.get(e.name)
    if (fn && typeof fn === 'object' && '__func' in (fn as Record<string, unknown>)) {
      const f = fn as FuncValue
      if (f.params.length !== args.length) {
        throw new LangError(`تابع «${f.name}» ${f.params.length} پارامتر می‌خواد، ${args.length} دادی`, e.line)
      }
      const local: Env = new Map()
      f.params.forEach((p, i) => local.set(p, args[i]))
      this.depth++
      if (this.depth > MAX_DEPTH) {
        this.depth--
        throw new LangError('تعمق بیش از حد! بازگشت بی‌پایان داری', e.line)
      }
      try {
        this.run(f.body, local)
        return null
      } catch (err) {
        if (err instanceof ReturnSignal) return err.v
        throw err
      } finally {
        this.depth--
      }
    }
    // math.x به‌عنوان تابع
    if (e.name.startsWith('math.')) {
      const fn2 = e.name.slice(5)
      const n = this.num(args[0], e.line)
      switch (fn2) {
        case 'sqrt':
          if (n < 0) throw new LangError('جذر عدد منفی؟!', e.line)
          return Math.sqrt(n)
        case 'floor':
          return Math.floor(n)
        case 'ceil':
          return Math.ceil(n)
        case 'sin':
          return Math.sin(n)
        case 'cos':
          return Math.cos(n)
        case 'tan':
          return Math.tan(n)
        case 'fabs':
          return Math.abs(n)
      }
    }
    throw new LangError(`تابع «${e.name}» وجود نداره — املاش چک کن!`, e.line)
  }
}

function deepEq(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-12
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEq(x, b[i]))
  }
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [k, v] of a) {
      if (!b.has(k) || !deepEq(v, b.get(k))) return false
    }
    return true
  }
  return false
}

function truthy(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  if (Array.isArray(v)) return v.length > 0
  return true
}

/* --------------------------- اجرا --------------------------- */

export function runScript(code: string, lang: ScriptLang): RunResult {
  const t0 = performance.now()
  const output: string[] = []
  try {
    const kw = KW[lang]
    const alias = BUILTIN_ALIASES[lang]
    const srcLines = code.split('\n')
    const lexed: LineTok[] = srcLines.map((src, i) =>
      lexLine(src, i + 1, kw, lang === 'squirrel')
    )
    // پرش از خطوط خالی ابتدایی
    const parser = new Parser(lexed, kw, alias)
    const program = parser.parseProgram()

    const rt = new Runtime()
    if (lang === 'python') {
      rt.globals.set('math', 'math')
      rt.mathOk = true
    }
    rt.run(program, rt.globals)
    return { output: rt.out, error: null, ms: performance.now() - t0 }
  } catch (err) {
    let msg = 'یه خطای عجیب پیش اومد!'
    if (err instanceof LangError) {
      msg = err.line ? `خط ${err.line}: ${err.message}` : err.message
    } else if (err instanceof Error) {
      msg = err.message
    }
    return { output, error: msg, ms: performance.now() - t0 }
  }
}

/** توضیح قابلیت‌ها برای نمایش در اپ */
export const LANG_INFO: Record<ScriptLang, string> = {
  python:
    'پایتونِ کوچک سان‌جاب — متغیر، شرط (اگه/وگرنه)، حلقه for و while، تابع def، لیست، دیکشنری، رشته و f-string. بدون input!',
  squirrel:
    'زبان سنجابی! مثل پایتونه ولی کلیدواژه‌ها فارسی‌اند: اگه، وگرنه، پس، برای x در بازه(n)، تاوقتی، تابع، برگردون، چاپ، طول، بازه. رشته‌ها همیشه {متغیر} را جای‌گذاری می‌کنند.',
}
