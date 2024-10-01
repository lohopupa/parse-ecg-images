export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get xy(): [number, number] {
    return [this.x, this.y]
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  hadmard(v: Vector2): Vector2 {
    return new Vector2(this.x * v.x, this.y * v.y)
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    return mag == 0 ? new Vector2(0, 0) : this.scale(1 / mag)
  }

  distance(v: Vector2): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  angle(v: Vector2): number {
    return Math.atan2(...this.subtract(v).xy)
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  rotate90(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  rotate270(): Vector2 {
    return new Vector2(this.y, -this.x);
  }

  abs(): Vector2 {
    return new Vector2(Math.abs(this.x), Math.abs(this.y))
  }

  apply(f: (x: number) => number) {
    return new Vector2(f(this.x), f(this.y))
  }

  set(x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }

  isZero(): boolean {
    return this.x == 0 && this.y == 0
  }


  toSize() {
    return { width: this.x, height: this.y }
  }

  static get Zero() {
    return new Vector2(0, 0)
  }

  static FromValue(v: number) {
    return new Vector2(v, v)
  }

  static FromArray(a: [number, number]) {
    return new Vector2(...a)
  }

}

type Line = { p: Vector2; d: Vector2 }

export function findIntersection(line1: Line, line2: Line): Vector2 | null {
  const { p: P1, d: D1 } = line1
  const { p: P2, d: D2 } = line2

  const denom = D1.x * D2.y - D1.y * D2.x
  if (denom == 0) return null

  const t = ((P2.x - P1.x) * D2.y - (P2.y - P1.y) * D2.x) / denom
  const s = ((P2.x - P1.x) * D1.y - (P2.y - P1.y) * D1.x) / denom

  if (t < 0 || s < 0) return null

  return new Vector2(P1.x + t * D1.x, P1.y + t * D1.y)
}

