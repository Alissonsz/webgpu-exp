export class Rect {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  isLeftOf(r: Rect): boolean {
    if (this.right < r.left) return true;
    return false;
  }

  isRightOf(r: Rect): boolean {
    if (this.left > r.right) return true;
    return false;
  }

  isTopOf(r: Rect): boolean {
    if (this.bottom < r.top) return true;
    return false;
  }

  ifBottomOf(r: Rect): boolean {
    if (this.top > r.bottom) return true;
    return false;
  }

  set(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.w;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.h;
  }

}
