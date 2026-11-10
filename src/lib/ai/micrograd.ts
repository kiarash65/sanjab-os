/* ------------------------------------------------------------------ */
/* موتور خودکار مشتق‌گیری اسکالر، برگرفته از ایده micrograd (MIT)      */
/* پیاده‌سازی اصلی سان‌جاب‌اواس برای آموزش پس‌انتشار در آکادمی AI        */
/* ------------------------------------------------------------------ */

export type Loss = 'mse' | 'bce'

export class Value {
  data: number
  grad = 0
  private _backward: () => void = () => {}
  private _prev: Set<Value>
  private _op: string

  constructor(data: number, prev: Value[] = [], op = '') {
    this.data = data
    this._prev = new Set(prev)
    this._op = op
  }

  static wrap(a: Value | number): Value {
    return a instanceof Value ? a : new Value(a)
  }

  add(other: Value | number): Value {
    const o = Value.wrap(other)
    const out = new Value(this.data + o.data, [this, o], '+')
    out._backward = () => {
      this.grad += out.grad
      o.grad += out.grad
    }
    return out
  }

  mul(other: Value | number): Value {
    const o = Value.wrap(other)
    const out = new Value(this.data * o.data, [this, o], '*')
    out._backward = () => {
      this.grad += o.data * out.grad
      o.grad += this.data * out.grad
    }
    return out
  }

  sub(other: Value | number): Value {
    const o = Value.wrap(other)
    return this.add(o.mul(-1))
  }

  div(other: Value | number): Value {
    const o = Value.wrap(other)
    // x / y = x * y^-1
    return this.mul(o.pow(-1))
  }

  pow(n: number): Value {
    const out = new Value(Math.pow(this.data, n), [this], `**${n}`)
    out._backward = () => {
      this.grad += n * Math.pow(this.data, n - 1) * out.grad
    }
    return out
  }

  neg(): Value {
    return this.mul(-1)
  }

  exp(): Value {
    const out = new Value(Math.exp(this.data), [this], 'exp')
    out._backward = () => {
      this.grad += out.data * out.grad
    }
    return out
  }

  log(): Value {
    const out = new Value(Math.log(this.data), [this], 'log')
    out._backward = () => {
      this.grad += (1 / this.data) * out.grad
    }
    return out
  }

  tanh(): Value {
    const t = Math.tanh(this.data)
    const out = new Value(t, [this], 'tanh')
    out._backward = () => {
      this.grad += (1 - t * t) * out.grad
    }
    return out
  }

  relu(): Value {
    const out = new Value(this.data > 0 ? this.data : 0, [this], 'relu')
    out._backward = () => {
      this.grad += (this.data > 0 ? 1 : 0) * out.grad
    }
    return out
  }

  sigmoid(): Value {
    const s = 1 / (1 + Math.exp(-this.data))
    const out = new Value(s, [this], 'sigmoid')
    out._backward = () => {
      this.grad += s * (1 - s) * out.grad
    }
    return out
  }

  /** پس‌انتشار، مرتب‌سازی توپولوژیک و اعمال زنجیره قانون */
  backward(): void {
    const topo: Value[] = []
    const visited = new Set<Value>()
    const build = (v: Value) => {
      if (visited.has(v)) return
      visited.add(v)
      v._prev.forEach(build)
      topo.push(v)
    }
    build(this)
    this.grad = 1
    for (let i = topo.length - 1; i >= 0; i--) topo[i]._backward()
  }
}

/* --------------------------- شبکه عصبی --------------------------- */

export interface ParamHolder {
  parameters(): Value[]
}

class Neuron implements ParamHolder {
  w: Value[]
  b: Value

  constructor(nin: number, nonlin: boolean) {
    // مقداردهی Xavier-مانند کوچک
    const scale = Math.sqrt(1 / nin)
    this.w = Array.from({ length: nin }, () => new Value((Math.random() * 2 - 1) * scale))
    this.b = new Value(0)
    void nonlin
  }

  forward(x: Value[]): Value {
    let act = this.b
    for (let i = 0; i < this.w.length; i++) act = act.add(this.w[i].mul(x[i]))
    return act.tanh()
  }

  parameters(): Value[] {
    return [...this.w, this.b]
  }
}

class Layer implements ParamHolder {
  neurons: Neuron[]
  constructor(nin: number, nout: number) {
    this.neurons = Array.from({ length: nout }, () => new Neuron(nin, true))
  }
  forward(x: Value[]): Value[] {
    return this.neurons.map((n) => n.forward(x))
  }
  parameters(): Value[] {
    return this.neurons.flatMap((n) => n.parameters())
  }
}

export class MLP implements ParamHolder {
  layers: Layer[]
  constructor(sizes: number[]) {
    this.layers = []
    for (let i = 0; i < sizes.length - 1; i++) this.layers.push(new Layer(sizes[i], sizes[i + 1]))
  }
  forward(x: Value[]): Value[] {
    let out = x
    for (const layer of this.layers) out = layer.forward(out)
    return out
  }
  parameters(): Value[] {
    return this.layers.flatMap((l) => l.parameters())
  }
  zeroGrad(): void {
    for (const p of this.parameters()) p.grad = 0
  }
}

/* --------------------------- داده و آموزش --------------------------- */

export interface Point {
  x: number
  y: number
  label: 0 | 1
}

export type DatasetId = 'circles' | 'xor' | 'moons' | 'spiral'

/** تولید مجموعه‌داده‌های کوچک آموزشی با نویز */
export function makeDataset(id: DatasetId, n = 120): Point[] {
  const pts: Point[] = []
  const rnd = () => Math.random() * 2 - 1
  if (id === 'circles') {
    for (let i = 0; i < n; i++) {
      const inner = i % 2 === 0
      const r = inner ? Math.random() * 0.45 : 0.75 + Math.random() * 0.2
      const a = Math.random() * Math.PI * 2
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a), label: inner ? 1 : 0 })
    }
  } else if (id === 'xor') {
    for (let i = 0; i < n; i++) {
      const x = rnd()
      const y = rnd()
      const label = (x > 0) !== (y > 0) ? 1 : 0
      pts.push({ x, y, label: label as 0 | 1 })
    }
  } else if (id === 'moons') {
    for (let i = 0; i < n; i++) {
      const upper = i % 2 === 0
      const t = Math.random() * Math.PI
      const dx = upper ? Math.cos(t) * 0.8 : Math.cos(t + Math.PI) * 0.8 + 0.35
      const dy = upper ? Math.sin(t) * 0.8 - 0.15 : Math.sin(t + Math.PI) * 0.8 + 0.3
      pts.push({ x: dx + rnd() * 0.08, y: dy + rnd() * 0.08, label: upper ? 1 : 0 })
    }
  } else {
    // spiral دو بازو
    for (let i = 0; i < n; i++) {
      const cls = i % 2 === 0 ? 1 : 0
      const t = (i / n) * 3.2 * Math.PI + (cls ? 0 : Math.PI)
      const r = 0.12 + (i / n) * 0.85
      pts.push({ x: r * Math.cos(t) + rnd() * 0.05, y: r * Math.sin(t) + rnd() * 0.05, label: cls as 0 | 1 })
    }
  }
  return pts
}

export interface TrainOptions {
  lr: number
  epochs: number
  loss: Loss
}

export interface TrainStepResult {
  loss: number
  accuracy: number
  epoch: number
}

/** یک گام آموزش (minibatch کامل، دیتاست کوچک است) */
export function trainStep(net: MLP, data: Point[], opts: TrainOptions, epoch: number): TrainStepResult {
  net.zeroGrad()
  let totalLoss = new Value(0)
  let correct = 0
  for (const p of data) {
    const out = net.forward([new Value(p.x), new Value(p.y)])[0]
    const target = p.label === 1 ? 1 : -1
    const pred = out.data > 0 ? 1 : 0
    if (pred === p.label) correct++
    let diff: Value
    if (opts.loss === 'mse') {
      diff = out.sub(target).pow(2)
    } else {
      // BCE روی خروجی sigmoid، برای پایداری از margin-softplus استفاده می‌کنیم
      // loss = log(1 + exp(-target*out))
      diff = out.mul(-target).exp().add(1).log()
    }
    totalLoss = totalLoss.add(diff)
  }
  const n = data.length
  const loss = totalLoss.mul(1 / n)
  loss.backward()
  for (const param of net.parameters()) {
    param.data -= opts.lr * param.grad
  }
  return { loss: loss.data, accuracy: correct / n, epoch }
}

/** خروجی شبکه برای یک نقطه، در [-1, 1] با tanh */
export function predict(net: MLP, x: number, y: number): number {
  return net.forward([new Value(x), new Value(y)])[0].data
}
