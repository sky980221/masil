// 여러 장면에서 함께 쓰는 소품: 트리, 선물 상자, 가로등, 집, 마켓 부스, 회전목마 등
import { type Ctx, PX, type Light, type Rand, R, P, mix, pick, glow, line } from './pixel';

export function drawStar(c: Ctx, x: number, y: number, col: string, big = false): void {
  R(c, x - 1, y - 1, 3, 3, col);
  for (let d = 2; d <= (big ? 4 : 3); d++) {
    P(c, x, y - d, col);
    P(c, x, y + d, col);
    P(c, x - d, y, col);
    P(c, x + d, y, col);
  }
  if (big) {
    P(c, x - 2, y - 2, col);
    P(c, x + 2, y - 2, col);
    P(c, x - 2, y + 2, col);
    P(c, x + 2, y + 2, col);
  }
  P(c, x, y, '#ffffff');
}

export interface TreeOptions {
  cx: number;
  /** 화분이 놓이는 줄기 아래 y */
  base: number;
  h: number;
  w: number;
  tiers: number;
  green: string;
  dark: string;
  orn: string[];
  ornN: number;
  light: string[];
  lightN: number;
  star?: string;
  garland?: string;
  gifts?: string[];
  trunk?: string;
  pot?: string;
  potTop?: string;
  glow?: string;
  glowA?: number;
}

export function drawTree(c: Ctx, r: Rand, o: TreeOptions): Light[] {
  const L: Light[] = [];
  const top = o.base - o.h;
  const tierH = o.h / o.tiers;
  const half = (i: number) => {
    const k = Math.min(o.tiers - 1, Math.floor(i / tierH));
    const p = (i - k * tierH) / tierH;
    return (o.w / 2) * ((k + 1) / o.tiers) * (0.42 + 0.58 * p);
  };
  const hiC = mix(o.green, '#ffffff', 0.2);
  const dk2 = mix(o.dark, '#000000', 0.25);
  glow(c, o.cx, o.base - o.h * 0.45, o.h * 0.75, o.glow ?? '#ffcf7a', o.glowA ?? 0.22);

  // 잎: 층마다 넓어지는 삼각형 + 오른쪽 그늘 + 왼쪽 하이라이트 + 잎결 점
  for (let i = 0; i < o.h; i++) {
    const y = top + i;
    const hw = Math.max(1, half(i));
    R(c, o.cx - hw, y, hw * 2, 1, o.green);
    R(c, o.cx + hw * 0.5, y, hw * 0.5, 1, o.dark);
    R(c, o.cx - hw, y, Math.max(1, hw * 0.16), 1, hiC);
    for (let x = -hw + 1; x < hw - 1; x++) {
      const q = r();
      if (q < 0.09) P(c, o.cx + x, y, x > hw * 0.5 ? dk2 : o.dark);
      else if (q < 0.13) P(c, o.cx + x, y, hiC);
    }
  }
  // 층 아래 가장자리를 들쭉날쭉하게
  for (let k = 0; k < o.tiers; k++) {
    const i = Math.round((k + 1) * tierH) - 1;
    const y = top + i;
    const hw = half(i);
    for (let x = -hw + 1; x < hw - 1; x += 3) {
      const col = x > hw * 0.5 ? o.dark : o.green;
      P(c, o.cx + x, y + 1, col);
      if ((x + 99) % 6 < 3) P(c, o.cx + x + 1, y + 2, col);
    }
    R(c, o.cx - hw + 2, y + 1, hw * 2 - 4, 1, 'rgba(0,0,0,.18)');
  }
  // 층마다 늘어진 갈랜드
  if (o.garland) {
    const shade = mix(o.garland, '#000000', 0.3);
    for (let k = 0; k < o.tiers; k++) {
      const i0 = k * tierH + tierH * 0.45;
      for (let x = -o.w / 2; x <= o.w / 2; x++) {
        const i = i0 + Math.abs(Math.sin(x / (o.w / 9))) * 5 + (x / o.w) * 8;
        const hw = half(i) * 0.93;
        if (Math.abs(x) >= hw) continue;
        P(c, o.cx + x, top + i, o.garland);
        P(c, o.cx + x, top + i + 1, shade);
      }
    }
  }
  // 줄기와 화분
  // 줄기와 화분은 트리 폭에 맞춰 크기를 정한다 (작은 트리에 큰 화분이 붙지 않게)
  const pw = Math.round(Math.min(28, Math.max(6, o.w * 0.32)));
  const ph = Math.round(Math.min(10, Math.max(3, o.w * 0.12)));
  const tw = Math.max(2, Math.round(pw * 0.36));
  R(c, o.cx - tw / 2, o.base, tw, ph * 0.7, o.trunk ?? '#5a3a24');
  R(c, o.cx - pw / 2, o.base + ph * 0.5, pw, ph, o.pot ?? '#a8323f');
  R(c, o.cx - pw / 2, o.base + ph * 0.5, pw, Math.max(0.5, ph * 0.2), o.potTop ?? '#f6c453');
  R(c, o.cx + pw * 0.2, o.base + ph * 0.7, pw * 0.3, ph * 0.8, 'rgba(0,0,0,.18)');
  // 오너먼트
  for (let n = 0; n < o.ornN; n++) {
    const i = 10 + r() * (o.h - 14);
    const hw = half(i) * 0.82;
    const x = o.cx + (r() * 2 - 1) * hw;
    const y = top + i;
    const col = pick(r, o.orn);
    const big = r() < 0.35;
    R(c, x, y, big ? 3 : 2, big ? 3 : 2, col);
    P(c, x, y, 'rgba(255,255,255,.65)');
    if (big) P(c, x + 2, y + 2, 'rgba(0,0,0,.25)');
  }
  // 전구
  for (let n = 0; n < o.lightN; n++) {
    const i = 5 + r() * (o.h - 8);
    const hw = half(i) * 0.92;
    const x = Math.round(o.cx + (r() * 2 - 1) * hw);
    const y = Math.round(top + i);
    const col = pick(r, o.light);
    c.globalAlpha = 0.45;
    P(c, x, y, col);
    c.globalAlpha = 1;
    L.push({ x, y, col, s: 1 + r() * 3, p: r() * 7 });
  }
  if (o.star) {
    glow(c, o.cx, top - 4, 22, '#fff1b0', 0.5);
    drawStar(c, o.cx, top - 4, o.star, true);
    L.push({ x: o.cx, y: top - 4, col: '#fff7c2', s: 2, p: 0, big: true });
  }
  if (o.gifts) drawGifts(c, o.cx, o.base + 15, o.w * 0.36, o.gifts);
  return L;
}

export function drawGifts(c: Ctx, cx: number, ground: number, spread: number, cols: string[]): void {
  const boxes: [number, number, number][] = [
    [-spread, 11, 9],
    [-spread * 0.68, 8, 7],
    [-spread * 0.36, 7, 6],
    [spread * 0.34, 9, 7],
    [spread * 0.68, 11, 9],
    [spread, 7, 7],
    [-spread * 0.85, 6, 5],
  ];
  boxes.forEach(([dx, w, h], i) => {
    const x = Math.round(cx + dx - w / 2);
    const col = cols[i % cols.length];
    const rib = i % 2 ? '#ffd34d' : '#ffffff';
    const mid = w >> 1;
    R(c, x, ground - h, w, h, col);
    R(c, x, ground - h, w, 1, mix(col, '#ffffff', 0.3));
    R(c, x + w - 2, ground - h + 1, 2, h - 1, mix(col, '#000000', 0.2));
    R(c, x + mid, ground - h, 1, h, rib);
    R(c, x, ground - h + (h >> 1), w, 1, rib);
    P(c, x + mid - 1, ground - h - 1, rib);
    P(c, x + mid + 1, ground - h - 1, rib);
    P(c, x + mid - 2, ground - h - 2, rib);
    P(c, x + mid + 2, ground - h - 2, rib);
  });
}

export function drawLamp(c: Ctx, r: Rand, x: number, base: number, col: string, h = 40): Light[] {
  glow(c, x, base - h - 1, 18, '#ffe2a0', 0.45);
  R(c, x, base - h, 2, h, col);
  R(c, x - 2, base - 3, 6, 3, col);
  R(c, x - 3, base - h - 5, 8, 2, col);
  R(c, x - 2, base - h - 3, 6, 4, '#ffe9a8');
  R(c, x - 1, base - h - 7, 4, 2, col);
  return [{ x, y: base - h - 2, col: '#fff3c4', s: 0.6, p: r() * 7, big: true }];
}

/** 나무 뼈대가 보이는 유럽풍 집 */
export function drawHouseEU(c: Ctx, r: Rand, x: number, base: number, w: number, h: number, body: string, roof: string): Light[] {
  const L: Light[] = [];
  const tim = '#6b4a32';
  const hh = h >> 1;
  R(c, x, base - h, w, h, body);
  R(c, x + w - 3, base - h, 3, h, mix(body, '#000000', 0.15));
  R(c, x, base - h, w, 1, tim);
  R(c, x, base - hh, w, 1, tim);
  R(c, x, base - h, 1, h, tim);
  R(c, x + w - 1, base - h, 1, h, tim);
  R(c, x + (w >> 1), base - h, 1, hh, tim);
  line(c, x + 1, base - hh - 1, x + (w >> 2), base - h + 1, tim);
  line(c, x + w - 2, base - hh - 1, x + w - (w >> 2), base - h + 1, tim);
  const rh = Math.ceil(w / 2) + 2;
  for (let i = 0; i < rh; i++) {
    const ww = w + 4 - 2 * i;
    R(c, x - 2 + i, base - h - 1 - i, ww, 1, i % 3 === 0 ? mix(roof, '#000000', 0.2) : roof);
    P(c, x - 2 + i, base - h - 1 - i, '#f4f6fb');
    P(c, x - 2 + i + ww - 1, base - h - 1 - i, '#f4f6fb');
  }
  R(c, x + w - 8, base - h - rh + 1, 4, 6, '#7a4a3a');
  R(c, x + w - 8, base - h - rh + 1, 4, 1, '#f4f6fb');
  for (const wx of [x + 3, x + w - 8]) {
    R(c, wx, base - h + 3, 5, 5, '#ffd970');
    R(c, wx + 2, base - h + 3, 1, 5, tim);
    R(c, wx, base - h + 5, 5, 1, tim);
    L.push({ x: wx + 1, y: base - h + 4, col: '#fff6c8', s: 0.5 + r(), p: r() * 7 });
  }
  R(c, x + (w >> 1) - 3, base - 9, 6, 9, '#7a4a2a');
  R(c, x + (w >> 1) - 3, base - 9, 6, 1, '#5a3420');
  P(c, x + (w >> 1) + 1, base - 5, '#ffd34d');
  R(c, x + 3, base - hh + 3, 5, 4, '#ffd970');
  L.push({ x: x + 4, y: base - hh + 4, col: '#fff6c8', s: 0.5 + r(), p: r() * 7 });
  glow(c, x + w / 2, base - h / 2, w * 0.7, '#ffcf7a', 0.12);
  return L;
}

/** 크리스마스 마켓 나무 부스 */
export function drawChalet(c: Ctx, r: Rand, x: number, base: number, w: number, h: number, roofCol: string): Light[] {
  const L: Light[] = [];
  R(c, x, base - h, w, h, '#8a5a3a');
  for (let px = x + 3; px < x + w; px += 4) R(c, px, base - h, 1, h, '#7a4e32');
  // 통나무 결: 판자 사이 그늘, 왼쪽 빛, 오른쪽 그늘
  for (let px = x + 3; px < x + w; px += 4) R(c, px + 1, base - h, PX, h, '#9a6a46');
  R(c, x, base - h, 1, h, '#a87a52');
  R(c, x + w - 3, base - h, 3, h, '#6e4428');
  R(c, x + 3, base - h + 5, w - 6, h * 0.42, '#ffcf7a');
  R(c, x + 3, base - h + 5, w - 6, 1, '#c9873a');
  for (let k = 0; k < (w - 8) / 3; k++) {
    R(c, x + 5 + k * 3, base - h + 6 + h * 0.42 - 4, 2, 3, pick(r, ['#d6334a', '#2f7a52', '#ffffff', '#5b8fd6', '#f6c453']));
  }
  R(c, x + 2, base - h + 5 + h * 0.42, w - 4, 2, '#6b4226');
  glow(c, x + w / 2, base - h + 10, w * 0.6, '#ffcf7a', 0.25);
  const roofDark = mix(roofCol, '#000000', 0.2);
  for (let i = 0; i < 9; i++) {
    const ww = w + 8 - i * 2;
    R(c, x - 4 + i, base - h - 1 - i, ww, 1, i < 2 ? '#f4f6fb' : Math.floor(i / 2) % 2 ? roofDark : roofCol);
  }
  for (let i = 0; i < w + 6; i += 3) L.push({ x: x - 3 + i, y: base - h, col: '#ffe08a', s: 1 + r() * 2, p: r() * 7 });
  R(c, x, base - 2, w, 2, '#5a3a24');
  return L;
}

export function drawCarousel(c: Ctx, r: Rand, cx: number, base: number): Light[] {
  const L: Light[] = [];
  glow(c, cx, base - 30, 40, '#ffcf7a', 0.3);
  for (let i = 0; i < 16; i++) {
    for (let x = -i * 2; x <= i * 2; x++) P(c, cx + x, base - 62 + i, Math.floor((x + 60) / 4) % 2 ? '#f4f1ea' : '#d6334a');
  }
  drawStar(c, cx, base - 65, '#ffd34d');
  R(c, cx - 32, base - 46, 64, 5, '#f6c453');
  R(c, cx - 32, base - 42, 64, 1, '#c9a14a');
  for (let x = -30; x <= 30; x += 4) L.push({ x: cx + x, y: base - 44, col: '#fff2b0', s: 2 + r() * 2, p: r() * 7 });
  R(c, cx - 28, base - 41, 56, 32, 'rgba(255,207,122,.25)');
  const horses: [number, number][] = [[-24, 20], [-14, 26], [-4, 18], [6, 25], [16, 19], [25, 24]];
  for (const [k, h] of horses) {
    R(c, cx + k, base - 41, 1, 33, '#e8d08a');
    const hy = base - h;
    R(c, cx + k - 3, hy, 7, 4, '#f4f1ea');
    R(c, cx + k + 3, hy - 3, 2, 3, '#f4f1ea');
    P(c, cx + k + 4, hy - 3, '#2a1f2b');
    R(c, cx + k - 4, hy + 1, 1, 3, '#f4f1ea');
    R(c, cx + k - 2, hy + 4, 1, 3, '#d6c7b0');
    R(c, cx + k + 2, hy + 4, 1, 3, '#d6c7b0');
    R(c, cx + k - 1, hy - 1, 3, 1, '#d6334a');
  }
  R(c, cx - 33, base - 9, 66, 6, '#b8873e');
  R(c, cx - 30, base - 3, 60, 3, '#7a5a2a');
  return L;
}

/** 잎 없는 나무에 전구를 감은 가로수 */
export function drawLightTree(c: Ctx, r: Rand, x: number, base: number, h: number): Light[] {
  const L: Light[] = [];
  const branch = (x0: number, y0: number, a: number, len: number, d: number): void => {
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    line(c, x0, y0, x1, y1, d > 2 ? '#3a2c2c' : '#4a3838');
    for (let t = 0; t < 1; t += 4 / len) {
      if (r() < 0.75) {
        const lx = Math.round(x0 + (x1 - x0) * t + (r() * 2 - 1));
        const ly = Math.round(y0 + (y1 - y0) * t + (r() * 2 - 1));
        L.push({ x: lx, y: ly, col: '#fff6dc', s: 1 + r() * 2, p: r() * 7 });
      }
    }
    if (d > 0) {
      branch(x1, y1, a - 0.45 - r() * 0.2, len * 0.68, d - 1);
      branch(x1, y1, a + 0.45 + r() * 0.2, len * 0.68, d - 1);
    }
  };
  R(c, x - 1, base - h * 0.45, 3, h * 0.45, '#3a2c2c');
  branch(x, base - h * 0.45, -Math.PI / 2, h * 0.28, 4);
  glow(c, x, base - h * 0.6, h * 0.5, '#fff3c8', 0.18);
  return L;
}

/** 멀리 있는 사람들 실루엣 */
export function drawCrowd(c: Ctx, r: Rand, y: number, x0: number, x1: number, n: number, col: string): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const s = r() < 0.5 ? 1 : 0;
    R(c, x, y - 7 - s, 3, 5 + s, col);
    R(c, x + 0.5, y - 9 - s, 2, 2, col);
  }
}
