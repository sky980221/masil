// 2등신 픽셀 아바타. (x, y)는 발밑 기준이고 키는 모자를 빼고 약 31px이다.
import { type Ctx, R, P, mix, glow, line } from '../engine/pixel';
import { drawStar } from '../engine/props';
import { type Look, SKIN, HAIRC, TOPC, SCARF } from './options';

export interface AvatarPose {
  x: number;
  y: number;
  /** -1 왼쪽, 0 정면, 1 오른쪽 */
  dir: number;
  moving: boolean;
  /** 깜빡임·걸음 박자를 아바타마다 다르게 */
  seed: number;
  look: Look;
}

const HEAD_W = [10, 12, 14, 16, 16, 16, 16, 16, 16, 16, 16, 16, 14, 12, 10];
const INK = '#2a1f2b';

/** 발밑에서 머리(모자 포함) 꼭대기까지 높이. 이름표 위치에 쓴다. */
export function headTop(look: Look): number {
  const tall = ['treehat', 'elf', 'halo'].includes(look.hat) ? 16 : ['none', 'ribbon', 'hairpin'].includes(look.hat) ? 3 : 10;
  return 31 + tall;
}

export function drawAvatar(c: Ctx, a: AvatarPose, t: number): void {
  const x = Math.round(a.x);
  const y = Math.round(a.y);
  const L = a.look;
  const d = a.dir;
  const sk = SKIN[L.skin];
  const hc = HAIRC[L.hairc];
  const step = a.moving ? Math.floor(t * 8 + a.seed) % 2 : 0;
  const bob = a.moving && step ? 1 : 0;
  const ty = y - 17 - bob; // 몸통 위
  const ht = y - 31 - bob; // 머리 위
  const hx = d < 0 ? x - 13 : x + 7; // 소품을 드는 손 옆

  // 그림자
  c.globalAlpha = 0.25;
  R(c, x - 8, y - 1, 16, 2, '#000');
  R(c, x - 6, y + 1, 12, 1, '#000');
  c.globalAlpha = 1;

  // 다리와 신발
  const l1 = a.moving && step ? 1 : 0;
  const l2 = a.moving && !step ? 1 : 0;
  const leg = L.bottom === 'pants' ? '#3d4a72' : '#4a3a4a';
  R(c, x - 4, y - 7 - l1, 3, 6, leg);
  R(c, x + 1, y - 7 - l2, 3, 6, leg);
  R(c, x - 5, y - 2 - l1, 5, 2, '#5a3a2a');
  R(c, x + 1, y - 2 - l2, 5, 2, '#5a3a2a');
  P(c, x - 4, y - 2 - l1, '#7a5440');
  P(c, x + 2, y - 2 - l2, '#7a5440');

  // 뒷머리
  if (L.hair === 'long') {
    R(c, x - 9, ht + 5, 18, 19, hc.c);
    R(c, x + 5, ht + 5, 4, 19, hc.d);
    R(c, x - 8, ht + 24, 16, 1, hc.d);
  }
  if (L.hair === 'bob') {
    R(c, x - 9, ht + 5, 18, 11, hc.c);
    R(c, x + 5, ht + 5, 4, 11, hc.d);
  }
  if (L.hair === 'curly') {
    for (let i = 0; i < 7; i++) {
      const an = Math.PI * (0.1 + i * 0.135);
      const bx = x + Math.cos(an) * 9;
      const by = ht + 8 + Math.sin(an) * 7;
      R(c, bx - 3, by - 2, 6, 5, hc.c);
      P(c, bx - 1, by - 1, hc.h);
    }
  }

  drawBody(c, L, x, ty);

  // 얼굴
  HEAD_W.forEach((w, i) => {
    R(c, x - w / 2, ht + i, w, 1, sk.c);
    if (i > 2 && i < 12) P(c, x + w / 2 - 1, ht + i, sk.d);
  });
  R(c, x - 5, ht + 14, 10, 1, sk.d);

  // 앞머리와 옆머리
  R(c, x - 5, ht - 1, 10, 1, hc.c);
  R(c, x - 7, ht, 14, 1, hc.c);
  R(c, x - 9, ht + 1, 18, 4, hc.c);
  for (let i = -8; i < 8; i++) {
    if ((i + 9) % 3 !== 2) P(c, x + i, ht + 5, hc.c);
    if ((i + 9) % 3 === 0) P(c, x + i, ht + 6, hc.c);
  }
  const side = L.hair === 'short' ? 3 : 6;
  R(c, x - 9, ht + 5, 2, side, hc.c);
  R(c, x + 7, ht + 5, 2, side, hc.d);
  R(c, x - 5, ht + 1, 4, 1, hc.h);
  P(c, x - 6, ht + 2, hc.h);
  R(c, x + 3, ht + 2, 5, 2, hc.d);
  if (L.hair === 'curly') {
    for (let i = -8; i < 8; i += 3) {
      P(c, x + i, ht - 2 + ((i + 9) % 2), hc.c);
      P(c, x + i + 1, ht - 1, hc.c);
    }
  }
  if (L.hair === 'twin') {
    for (const s of [-1, 1]) {
      const bx = s < 0 ? x - 13 : x + 9;
      const col = s < 0 ? hc.c : hc.d;
      R(c, bx, ht + 7, 4, 9, col);
      R(c, bx + 1, ht + 16, 2, 2, col);
      R(c, bx, ht + 7, 4, 1, '#ff6b8a');
      P(c, bx + 1, ht + 9, hc.h);
    }
  }

  drawFace(c, L, x, ht, d, t, a.seed);
  drawHat(c, L, x, ht);
  drawItem(c, L, a, hx, ty, ht, d, t);
}

function drawBody(c: Ctx, L: Look, x: number, ty: number): void {
  const sk = SKIN[L.skin];
  const tc = TOPC[L.topc];
  // 팔과 손
  R(c, x - 7, ty + 1, 2, 8, tc.d);
  R(c, x + 5, ty + 1, 2, 8, tc.d);
  R(c, x - 7, ty + 8, 2, 2, sk.c);
  R(c, x + 5, ty + 8, 2, 2, sk.c);
  // 몸통
  if (L.top === 'padding') {
    R(c, x - 6, ty, 12, 10, tc.c);
    R(c, x + 3, ty + 1, 3, 8, tc.d);
    R(c, x - 6, ty + 3, 12, 1, tc.d);
    R(c, x - 6, ty + 6, 12, 1, tc.d);
    R(c, x, ty, 1, 10, mix(tc.c, '#000000', 0.3));
    R(c, x - 6, ty, 1, 10, mix(tc.c, '#ffffff', 0.2));
  } else {
    R(c, x - 5, ty, 10, 10, tc.c);
    R(c, x + 3, ty + 1, 2, 9, tc.d);
  }
  switch (L.top) {
    case 'coat':
      R(c, x - 5, ty + 10, 10, 2, tc.c);
      R(c, x + 3, ty + 10, 2, 2, tc.d);
      R(c, x - 2, ty, 1, 4, tc.d);
      R(c, x + 1, ty, 1, 4, tc.d);
      P(c, x - 1, ty + 5, '#f6c453');
      P(c, x - 1, ty + 8, '#f6c453');
      R(c, x - 5, ty + 6, 10, 1, tc.d);
      break;
    case 'knit':
      for (let i = -5; i < 5; i++) P(c, x + i, ty + 4 + ((i + 6) % 2), '#ffffff');
      R(c, x - 5, ty + 9, 10, 1, tc.d);
      R(c, x - 7, ty + 7, 2, 1, '#ffffff');
      R(c, x + 5, ty + 7, 2, 1, '#ffffff');
      break;
    case 'santa':
      R(c, x - 5, ty + 8, 10, 2, '#ffffff');
      R(c, x, ty, 1, 8, '#ffffff');
      R(c, x - 5, ty + 5, 10, 1, '#2a2228');
      R(c, x - 1, ty + 5, 3, 1, '#f6c453');
      R(c, x - 7, ty + 7, 2, 1, '#ffffff');
      R(c, x + 5, ty + 7, 2, 1, '#ffffff');
      break;
    case 'treesweater': {
      const g = '#3fae6a';
      P(c, x, ty + 1, '#ffd34d');
      P(c, x, ty + 2, g);
      R(c, x - 1, ty + 3, 3, 1, g);
      R(c, x - 2, ty + 4, 5, 1, g);
      R(c, x - 3, ty + 5, 7, 1, g);
      P(c, x, ty + 6, '#6b4226');
      P(c, x - 1, ty + 4, '#e2333f');
      P(c, x + 1, ty + 5, '#ffd34d');
      R(c, x - 5, ty + 9, 10, 1, tc.d);
      P(c, x - 4, ty + 2, '#ffffff');
      P(c, x + 4, ty + 2, '#ffffff');
      break;
    }
    case 'elfsuit':
      for (let i = -5; i < 5; i++) P(c, x + i, ty + ((i + 6) % 2), (i + 6) % 2 ? '#d6334a' : '#ffffff');
      R(c, x - 5, ty + 6, 10, 1, '#2a2228');
      R(c, x - 1, ty + 6, 3, 1, '#f6c453');
      P(c, x, ty + 3, '#f6c453');
      R(c, x - 7, ty + 7, 2, 1, '#d6334a');
      R(c, x + 5, ty + 7, 2, 1, '#d6334a');
      break;
    case 'hoodie':
      R(c, x - 8, ty - 3, 16, 3, tc.d);
      for (const k of [-2, 1]) {
        P(c, x + k, ty + 1, '#ffffff');
        P(c, x + k, ty + 2, '#ffffff');
      }
      R(c, x - 3, ty + 6, 6, 2, tc.d);
      break;
  }
  if (L.bottom === 'skirt') {
    const sy = L.top === 'coat' ? ty + 12 : ty + 10;
    R(c, x - 6, sy, 12, 2, tc.d);
    R(c, x - 7, sy + 2, 14, 1, tc.d);
    for (let i = -6; i < 6; i += 3) P(c, x + i, sy + 1, mix(tc.d, '#000000', 0.25));
  }
  // 목도리
  const S = SCARF[L.scarf];
  if (S.a && S.d) {
    R(c, x - 6, ty - 1, 12, 3, S.a);
    R(c, x - 6, ty + 1, 12, 1, S.d);
    R(c, x + 2, ty + 2, 3, 6, S.a);
    P(c, x + 2, ty + 8, S.d);
    P(c, x + 4, ty + 8, S.d);
    if (S.b) {
      for (let i = -6; i < 6; i += 2) P(c, x + i, ty, S.b);
      P(c, x + 3, ty + 4, S.b);
      P(c, x + 3, ty + 6, S.b);
    }
  }
}

function drawFace(c: Ctx, L: Look, x: number, ht: number, d: number, t: number, seed: number): void {
  const e1 = x - 5 + d;
  const e2 = x + 2 + d;
  const blink = Math.floor(t * 10 + seed * 7) % 46 === 0;
  for (const ex of [e1, e2]) {
    const kind = L.eyes === 'wink' ? (ex === e2 ? 'smile' : 'round') : L.eyes;
    if (blink && kind !== 'smile' && kind !== 'staryes') {
      R(c, ex, ht + 9, 3, 1, INK);
      continue;
    }
    if (kind === 'round') {
      R(c, ex, ht + 8, 2, 3, INK);
      P(c, ex, ht + 8, '#ffffff');
    } else if (kind === 'smile') {
      R(c, ex, ht + 9, 3, 1, INK);
      P(c, ex - 1, ht + 10, INK);
      P(c, ex + 3, ht + 10, INK);
    } else if (kind === 'staryes') {
      P(c, ex + 1, ht + 7, '#f2b705');
      R(c, ex, ht + 8, 3, 1, '#f2b705');
      P(c, ex + 1, ht + 9, '#f2b705');
      P(c, ex + 1, ht + 8, '#fff7c2');
      P(c, ex - 1, ht + 8, INK);
      P(c, ex + 3, ht + 8, INK);
    } else {
      R(c, ex, ht + 7, 3, 4, INK);
      P(c, ex, ht + 7, '#ffffff');
      P(c, ex + 1, ht + 8, '#ffffff');
      P(c, ex + 2, ht + 10, '#7fb2ff');
    }
  }
  c.globalAlpha = 0.6;
  R(c, x - 7 + d, ht + 11, 2, 1, '#ff8fa3');
  R(c, x + 5 + d, ht + 11, 2, 1, '#ff8fa3');
  c.globalAlpha = 1;
  if (L.hat === 'antler') {
    R(c, x - 1 + d, ht + 11, 2, 2, '#e2333f');
    P(c, x - 1 + d, ht + 11, '#ff8a8a');
  } else {
    P(c, x - 1 + d, ht + 12, '#b4566a');
    P(c, x + d, ht + 12, '#b4566a');
  }
  // 안경
  if (L.glasses === 'round') {
    const G = '#3a2a2a';
    for (const ex of [e1, e2]) {
      R(c, ex - 1, ht + 7, 5, 1, G);
      R(c, ex - 1, ht + 11, 5, 1, G);
      R(c, ex - 1, ht + 7, 1, 5, G);
      R(c, ex + 3, ht + 7, 1, 5, G);
    }
    R(c, e1 + 4, ht + 8, e2 - e1 - 5, 1, G);
  } else if (L.glasses === 'heart') {
    const HC = '#e2333f';
    const shape = [[1, 1, 0, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0]];
    for (const ex of [e1, e2]) {
      shape.forEach((row, ry) => row.forEach((v, rx) => v && P(c, ex - 1 + rx, ht + 7 + ry, HC)));
      P(c, ex, ht + 7, '#ff9aa8');
    }
    R(c, e1 + 4, ht + 8, e2 - e1 - 5, 1, HC);
  } else if (L.glasses === 'star') {
    for (const ex of [e1, e2]) drawStar(c, ex + 1, ht + 9, '#ffd34d');
    R(c, e1 + 4, ht + 8, e2 - e1 - 5, 1, '#c9a14a');
  } else if (L.glasses === 'sunglasses') {
    for (const ex of [e1, e2]) {
      R(c, ex - 1, ht + 8, 4, 3, '#1a1a22');
      P(c, ex, ht + 8, '#6a6a84');
    }
    R(c, e1 + 3, ht + 8, e2 - e1 - 4, 1, '#1a1a22');
  }
}

function drawHat(c: Ctx, L: Look, x: number, ht: number): void {
  const hc = HAIRC[L.hairc];
  const tc = TOPC[L.topc];
  switch (L.hat) {
    case 'santa':
      [16, 14, 12, 10, 8, 6, 4].forEach((w, i) => R(c, x - 8 + i + (i > 2 ? i - 2 : 0), ht - 1 - i, w, 1, i % 2 ? '#c42a40' : '#d6334a'));
      R(c, x - 10, ht + 1, 20, 3, '#ffffff');
      R(c, x - 10, ht + 3, 20, 1, '#dfe3ea');
      R(c, x + 9, ht - 10, 3, 3, '#ffffff');
      break;
    case 'beanie': {
      const bc = tc.c === TOPC.cream.c ? '#5b8fd6' : tc.c;
      R(c, x - 9, ht - 2, 18, 5, bc);
      R(c, x - 7, ht - 3, 14, 1, bc);
      R(c, x - 4, ht - 4, 8, 1, bc);
      R(c, x + 4, ht - 2, 5, 5, mix(bc, '#000000', 0.2));
      R(c, x - 10, ht + 2, 20, 3, '#eef2f8');
      for (let i = -9; i < 10; i += 2) P(c, x + i, ht + 3, '#cfd6e2');
      R(c, x - 2, ht - 7, 4, 3, '#ffffff');
      break;
    }
    case 'antler':
      for (const s of [-1, 1]) {
        const bx = x + s * 6;
        const B = '#8a5a3a';
        R(c, bx, ht - 6, 1, 6, B);
        P(c, bx + s, ht - 3, B);
        P(c, bx + s * 2, ht - 4, B);
        P(c, bx - s, ht - 6, B);
        P(c, bx - s, ht - 7, B);
        P(c, bx + s, ht - 7, B);
      }
      break;
    case 'earmuff':
      R(c, x - 8, ht - 2, 16, 1, '#b88aa6');
      P(c, x - 9, ht - 1, '#b88aa6');
      P(c, x + 8, ht - 1, '#b88aa6');
      R(c, x - 9, ht, 1, 6, '#b88aa6');
      R(c, x + 8, ht, 1, 6, '#b88aa6');
      for (const bx of [x - 12, x + 8]) {
        R(c, bx, ht + 6, 4, 6, '#f7b6c8');
        R(c, bx + 1, ht + 5, 2, 8, '#f7b6c8');
        P(c, bx + 1, ht + 7, '#ffffff');
      }
      break;
    case 'ribbon':
      R(c, x + 1, ht - 3, 4, 4, '#e2333f');
      R(c, x + 7, ht - 3, 4, 4, '#e2333f');
      R(c, x + 5, ht - 2, 2, 3, '#ff6b6b');
      P(c, x + 4, ht + 1, '#e2333f');
      P(c, x + 8, ht + 1, '#e2333f');
      P(c, x + 2, ht - 3, '#ff8a8a');
      break;
    case 'catears':
      P(c, x - 8, ht - 4, hc.c);
      R(c, x - 8, ht - 3, 2, 1, hc.c);
      R(c, x - 8, ht - 2, 3, 1, hc.c);
      R(c, x - 8, ht - 1, 4, 1, hc.c);
      P(c, x - 7, ht - 2, '#ffb3c6');
      P(c, x + 7, ht - 4, hc.d);
      R(c, x + 6, ht - 3, 2, 1, hc.d);
      R(c, x + 5, ht - 2, 3, 1, hc.d);
      R(c, x + 4, ht - 1, 4, 1, hc.d);
      P(c, x + 6, ht - 2, '#ffb3c6');
      break;
    case 'bear':
      for (const bx of [x - 10, x + 5]) {
        R(c, bx, ht - 3, 5, 5, '#8a5a3a');
        R(c, bx + 1, ht - 4, 3, 1, '#8a5a3a');
        R(c, bx + 1, ht - 2, 3, 3, '#d9a57a');
      }
      break;
    case 'hairpin': {
      const sx = x + 5;
      const sy = ht + 3;
      const F = '#eaf6ff';
      R(c, sx, sy - 2, 1, 5, F);
      R(c, sx - 2, sy, 5, 1, F);
      for (const [dx, dy] of [[-1, -1], [1, 1], [1, -1], [-1, 1]]) P(c, sx + dx, sy + dy, F);
      P(c, sx, sy, '#9fd0ff');
      break;
    }
    case 'elf':
      [16, 14, 12, 10, 8, 6, 4, 3].forEach((w, i) => R(c, x - 8 + i - (i > 2 ? i - 2 : 0) * 2, ht - 1 - i, w, 1, i % 2 ? '#24885a' : '#2f9a62'));
      R(c, x - 10, ht + 1, 20, 3, '#d6334a');
      for (let i = -10; i < 10; i += 2) P(c, x + i, ht + 3, '#ffffff');
      R(c, x - 13, ht - 10, 3, 3, '#f6c453');
      P(c, x - 12, ht - 8, '#a8781a');
      break;
    case 'treehat': {
      for (let i = 0; i < 11; i++) {
        const w = Math.max(2, 18 - i * 1.7);
        R(c, x - w / 2, ht + 1 - i, w, 1, i % 2 ? '#2a6e48' : '#2f7a52');
      }
      const dots: [number, number, string][] = [[-5, 0, '#e2333f'], [3, -2, '#ffd34d'], [-2, -4, '#5b8fd6'], [2, -6, '#e2333f'], [-1, -8, '#ffd34d']];
      for (const [ox, oy, col] of dots) P(c, x + ox, ht + oy, col);
      drawStar(c, x, ht - 12, '#ffd34d');
      break;
    }
    case 'halo':
      c.globalAlpha = 0.3;
      R(c, x - 8, ht - 10, 16, 6, '#fff3a0');
      c.globalAlpha = 1;
      R(c, x - 6, ht - 9, 12, 1, '#ffe066');
      P(c, x - 7, ht - 8, '#ffe066');
      P(c, x + 6, ht - 8, '#ffe066');
      R(c, x - 6, ht - 7, 12, 1, '#f2c14e');
      break;
    case 'crown':
      R(c, x - 7, ht - 2, 14, 3, '#f6c453');
      R(c, x - 7, ht - 2, 14, 1, '#ffe9a0');
      for (const k of [-7, -3, 1, 5]) {
        R(c, x + k, ht - 5, 2, 3, '#f6c453');
        P(c, x + k, ht - 6, '#fff3a0');
      }
      P(c, x - 4, ht - 1, '#e2333f');
      P(c, x, ht - 1, '#3f7fd6');
      P(c, x + 4, ht - 1, '#2f9a62');
      break;
  }
}

function drawItem(c: Ctx, L: Look, a: AvatarPose, hx: number, ty: number, ht: number, d: number, t: number): void {
  switch (L.item) {
    case 'cocoa': {
      R(c, hx, ty + 6, 5, 5, '#ffffff');
      R(c, hx, ty + 6, 5, 1, '#7a4a2a');
      R(c, hx + 1, ty + 8, 3, 1, '#e2333f');
      const handle = d < 0 ? hx - 1 : hx + 5;
      P(c, handle, ty + 7, '#ffffff');
      P(c, handle, ty + 8, '#ffffff');
      c.globalAlpha = 0.6;
      const sp = Math.floor(t * 3) % 2;
      P(c, hx + 1 + sp, ty + 4, '#ffffff');
      P(c, hx + 2 - sp, ty + 2, '#ffffff');
      c.globalAlpha = 1;
      break;
    }
    case 'gift':
      R(c, hx, ty + 4, 7, 7, '#d6334a');
      R(c, hx + 3, ty + 4, 1, 7, '#ffd34d');
      R(c, hx, ty + 7, 7, 1, '#ffd34d');
      for (const [dx, dy] of [[2, 3], [4, 3], [1, 2], [5, 2]]) P(c, hx + dx, ty + dy, '#ffd34d');
      break;
    case 'cane': {
      const cx = hx + 2;
      R(c, cx, ty + 1, 1, 11, '#ffffff');
      for (const k of [2, 5, 8, 11]) P(c, cx, ty + k, '#e2333f');
      P(c, cx - 1, ty, '#e2333f');
      P(c, cx - 2, ty + 1, '#ffffff');
      P(c, cx - 2, ty + 2, '#e2333f');
      break;
    }
    case 'balloon': {
      const bx = hx + 2 + Math.round(Math.sin(t * 1.5 + a.seed));
      const by = ht - 8;
      line(c, hx + 1, ty + 8, bx, by + 4, '#dcd6c8');
      R(c, bx - 3, by - 3, 7, 7, '#ffd34d');
      drawStar(c, bx, by, '#ffd34d', true);
      P(c, bx - 2, by - 2, '#fff6c8');
      break;
    }
    case 'cookie': {
      const B = '#c98a5a';
      R(c, hx + 1, ty + 2, 4, 3, B);
      R(c, hx, ty + 5, 6, 4, B);
      R(c, hx - 1, ty + 5, 1, 2, B);
      R(c, hx + 6, ty + 5, 1, 2, B);
      R(c, hx, ty + 9, 2, 2, B);
      R(c, hx + 4, ty + 9, 2, 2, B);
      P(c, hx + 2, ty + 3, INK);
      P(c, hx + 3, ty + 3, INK);
      P(c, hx + 3, ty + 6, '#ffffff');
      P(c, hx + 3, ty + 8, '#ffffff');
      break;
    }
    case 'bell':
      R(c, hx + 2, ty + 3, 2, 1, '#d6334a');
      R(c, hx + 1, ty + 4, 4, 1, '#f6c453');
      R(c, hx, ty + 5, 6, 4, '#f6c453');
      R(c, hx - 1, ty + 9, 8, 1, '#d9a530');
      P(c, hx + 2, ty + 10, '#a8781a');
      P(c, hx + 1, ty + 5, '#fff3a0');
      break;
    case 'lantern':
      glow(c, hx + 2, ty + 6, 10, '#ffcf7a', 0.45);
      R(c, hx + 2, ty + 1, 1, 2, '#3a2c20');
      R(c, hx, ty + 3, 5, 8, '#3a2c20');
      R(c, hx + 1, ty + 4, 3, 6, '#ffcf7a');
      P(c, hx + 2, ty + 6, '#fff3c4');
      break;
    case 'snowdoll':
      R(c, hx, ty + 6, 6, 5, '#ffffff');
      R(c, hx + 1, ty + 3, 4, 3, '#ffffff');
      R(c, hx + 1, ty + 1, 4, 2, '#2a2228');
      R(c, hx, ty + 3, 6, 1, '#2a2228');
      P(c, hx + 2, ty + 4, '#2a2228');
      P(c, hx + 4, ty + 4, '#2a2228');
      P(c, hx + 3, ty + 5, '#ff8a3a');
      R(c, hx + 1, ty + 6, 4, 1, '#d6334a');
      break;
    case 'snowglobe':
      R(c, hx + 1, ty + 2, 5, 1, '#cfe9ff');
      R(c, hx, ty + 3, 7, 4, '#cfe9ff');
      R(c, hx + 1, ty + 7, 5, 1, '#cfe9ff');
      P(c, hx + 3, ty + 4, '#2f7a52');
      R(c, hx + 2, ty + 5, 3, 1, '#2f7a52');
      P(c, hx + 1, ty + 3, '#ffffff');
      P(c, hx + 5, ty + 4, '#ffffff');
      R(c, hx, ty + 8, 7, 2, '#8a5a3a');
      break;
    case 'sparkler':
      R(c, hx + 2, ty, 1, 10, '#9a9a9a');
      for (let k = 0; k < 7; k++) {
        const an = t * 13 + k * 0.9;
        const rr = 2 + ((t * 20 + k) % 3);
        P(c, hx + 2 + Math.cos(an) * rr, ty - 1 + Math.sin(an) * rr, k % 2 ? '#fff3a0' : '#ffd34d');
      }
      glow(c, hx + 2, ty - 1, 8, '#ffe08a', 0.4);
      break;
    case 'wreath':
      for (let an = 0; an < Math.PI * 2; an += 0.35) {
        P(c, hx + 3 + Math.cos(an) * 3, ty + 5 + Math.sin(an) * 3, '#2f7a52');
        P(c, hx + 3 + Math.cos(an) * 4, ty + 5 + Math.sin(an) * 4, '#24563f');
      }
      R(c, hx + 2, ty + 8, 3, 2, '#e2333f');
      P(c, hx, ty + 3, '#e2333f');
      P(c, hx + 6, ty + 4, '#e2333f');
      break;
    case 'wand':
      R(c, hx + 2, ty + 2, 1, 9, '#c9a14a');
      drawStar(c, hx + 2, ty, '#ffd34d');
      if (Math.floor(t * 5) % 2) P(c, hx + 5, ty - 3, '#ffffff');
      else P(c, hx - 1, ty - 2, '#ffffff');
      break;
  }
}
