// 픽셀 캔버스 공용 도구. 모든 장면은 W×H 저해상도 캔버스에 그린 뒤 화면에서 확대한다.
export const W = 270;
export const H = 480;

export type Ctx = CanvasRenderingContext2D;
export type Rand = () => number;

/** 반짝이는 전구 하나. 배경에는 흐리게 그려 두고, 매 프레임 밝기만 바꾼다. */
export interface Light {
  x: number;
  y: number;
  col: string;
  /** 깜빡이는 속도 */
  s: number;
  /** 위상 */
  p: number;
  /** 항상 켜 두고 빛 번짐까지 그리는 큰 전구 */
  big?: boolean;
}

export function rng(seed: number): Rand {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(n: number): number {
  n |= 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

export function R(c: Ctx, x: number, y: number, w: number, h: number, col: string): void {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  if (w <= 0 || h <= 0) return;
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
}

export function P(c: Ctx, x: number, y: number, col: string): void {
  R(c, x, y, 1, 1, col);
}

function hexToRgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** 두 hex 색을 t 비율로 섞는다. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export function pick<T>(r: Rand, a: readonly T[]): T {
  return a[(r() * a.length) | 0];
}

// 4×4 베이어 행렬: 두 색 사이를 점무늬로 섞어 픽셀 아트다운 그라데이션을 만든다
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/**
 * 위에서 아래로 a → b 그라데이션. 매끈하게 칠하지 않고 steps 단계로 나눈 뒤
 * 단계 경계를 디더링(점무늬)으로 섞는다.
 */
export function vgrad(c: Ctx, y0: number, y1: number, a: string, b: string, steps = 8): void {
  const h = y1 - y0;
  if (h <= 0) return;
  const img = c.createImageData(W, h);
  const d = img.data;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const level = (k: number) => A.map((v, i) => Math.round(v + ((B[i] - v) * k) / steps));
  const levels = Array.from({ length: steps + 1 }, (_, k) => level(k));
  for (let y = 0; y < h; y++) {
    const t = (y / Math.max(1, h - 1)) * steps;
    const k = Math.min(steps - 1, Math.floor(t));
    const frac = t - k;
    for (let x = 0; x < W; x++) {
      const col = frac > BAYER[(y & 3) * 4 + (x & 3)] ? levels[k + 1] : levels[k];
      const o = (y * W + x) * 4;
      d[o] = col[0];
      d[o + 1] = col[1];
      d[o + 2] = col[2];
      d[o + 3] = 255;
    }
  }
  c.putImageData(img, 0, y0);
}

/**
 * 완성된 배경의 색을 채널마다 levels 단계로 줄이고, 단계 사이는 베이어 점무늬로 섞는다.
 * 매끈한 빛 번짐까지 픽셀 아트처럼 보이게 그림 전체의 질감을 맞춘다.
 */
export function posterize(c: Ctx, levels = 18): void {
  const img = c.getImageData(0, 0, W, H);
  const d = img.data;
  const step = 255 / (levels - 1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const th = BAYER[(y & 3) * 4 + (x & 3)];
      for (let ch = 0; ch < 3; ch++) {
        const v = d[o + ch] / step;
        const lo = Math.floor(v);
        d[o + ch] = Math.min(255, Math.round((v - lo > th ? lo + 1 : lo) * step));
      }
    }
  }
  c.putImageData(img, 0, 0);
}

/** 장면을 그리는 동안 빛 번짐(glow) 위치를 모아 조명 레이어의 광원으로 쓴다. */
export interface Glow {
  x: number;
  y: number;
  r: number;
  a: number;
}
let glowSink: Glow[] | null = null;

export function collectGlows<T>(draw: () => T): { result: T; glows: Glow[] } {
  const prev = glowSink;
  const glows: Glow[] = [];
  glowSink = glows;
  try {
    return { result: draw(), glows };
  } finally {
    glowSink = prev;
  }
}

/** 빛 번짐. 'lighter' 합성으로 부드럽게 더한다. 장면을 그리는 중이면 광원으로도 기록한다. */
export function glow(c: Ctx, x: number, y: number, rad: number, col: string, a: number): void {
  glowSink?.push({ x, y, r: rad, a });
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a;
  c.fillStyle = g;
  c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  c.restore();
}

export function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    P(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, col);
  }
}

export interface Vanish {
  x: number;
  y: number;
}

/**
 * 열마다 painter를 부르는 화면 가장자리 → 소실점 방향의 옆벽.
 * s: 가까울수록 1인 원근 비율, u: 벽을 따라 들어간 깊이(1/s), k: 위에서부터 몇 번째 칸인지.
 */
export type WallPainter = (c: Ctx, X: number, s: number, u: number, k: number, ya: number, yb: number) => void;

export function perspWall(
  c: Ctx,
  side: 'L' | 'R',
  vp: Vanish,
  xFar: number,
  yTopNear: number,
  yBotNear: number,
  rows: number,
  paint: WallPainter,
): void {
  const dx = side === 'L' ? vp.x : W - 1 - vp.x;
  for (let i = 0; i < xFar; i++) {
    const X = side === 'L' ? i : W - 1 - i;
    const f = i / dx;
    const s = 1 - f;
    const u = 1 / s;
    const top = yTopNear + (vp.y - yTopNear) * f;
    const bot = yBotNear + (vp.y - yBotNear) * f;
    for (let k = 0; k < rows; k++) {
      paint(c, X, s, u, k, top + ((bot - top) * k) / rows, top + ((bot - top) * (k + 1)) / rows);
    }
  }
}

/** 소실점으로 모이는 타일 바닥 */
export function perspFloor(c: Ctx, vp: Vanish, y0: number, y1: number, base: string, ln: string, step: number): void {
  R(c, 0, y0, W, y1 - y0, base);
  for (let y = y0 + 2, g = 3; y < y1; y += g, g *= 1.17) R(c, 0, y, W, 1, ln);
  for (let x = -W * 2; x <= W * 3; x += step) {
    for (let y = y0; y < y1; y++) {
      const t = (y - vp.y) / (y1 - vp.y);
      P(c, vp.x + (x - vp.x) * t, y, ln);
    }
  }
}

/** yF 위쪽 h줄을 뒤집어 반짝이는 바닥에 비친 것처럼 그린다. */
export function reflect(c: Ctx, yF: number, h: number, a: number): void {
  const t = document.createElement('canvas');
  t.width = W;
  t.height = h;
  t.getContext('2d')!.drawImage(c.canvas, 0, yF - h, W, h, 0, 0, W, h);
  c.save();
  c.globalAlpha = a;
  c.translate(0, 2 * yF);
  c.scale(1, -1);
  c.drawImage(t, 0, yF - h);
  c.restore();
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}

export const BOOK = ['#9b4a3c', '#c58a4a', '#5d7a6a', '#3f5a7a', '#d8c3a0', '#7a5a8a', '#b8a06a', '#8c3b4f', '#4e6b8a', '#a8743a'] as const;
