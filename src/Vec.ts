const F32_BYTE_LENGTH = 4;

export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    static add(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x + v2.x, v1.y + v2.y)
    }

    static sub(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x - v2.x, v1.y - v2.y)
    }

    static one(): Vec2 {
        return new Vec2(1, 1)
    }

    static zero(): Vec2 {
        return new Vec2(0, 0)
    }

    createView(): Float32Array {
      return new Float32Array([this.x, this.y])
    }

    static byteLength(): number {
      return F32_BYTE_LENGTH * 2;
    }

}

export class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    }

    static add(v1: Vec3, v2: Vec3, v3: Vec3): Vec3 {
        return new Vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)
    }

    static sub(v1: Vec3, v2: Vec3, v3: Vec3): Vec3 {
        return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z)
    }

    static one(): Vec3 {
        return new Vec3(1, 1, 1)
    }

    static zero(): Vec3 {
        return new Vec3(0, 0, 0)
    }

    createView(): Float32Array {
      return new Float32Array([this.x, this.y, this.z])
    }

    static byteLength(): number {
      return F32_BYTE_LENGTH * 3;
    }
}

export class Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number, y: number, z: number, w: number) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  static add(v1: Vec4, v2: Vec4): Vec4 {
    return new Vec4(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z, v1.w + v2.w);
  }

  static sub(v1: Vec4, v2: Vec4) {
    return new Vec4(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z, v1.w - v2.w);
  }

  static one(): Vec4 {
    return new Vec4(1, 1, 1, 1);
  }

  static zero(): Vec4 {
    return new Vec4(0, 0, 0, 0);
  }

  createView(): Float32Array {
    return new Float32Array([this.x, this.y, this.z, this.w]);
  }

  static byteLength(): number {
    return F32_BYTE_LENGTH * 4;
  }
}

export class Rect {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.w = width;
    this.h = height;
  }

  view(): Float32Array {
    return new Float32Array([
      this.x, this.y, this.w, this.h
    ])
  }
}
