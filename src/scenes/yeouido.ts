// 여의도 더현대 서울: 하얀 천 패널이 뒤집힌 피라미드처럼 매달린 천장(접힌 선마다 빨간 줄)과 사이사이 유리 띠,
// 하얀 S자 곡선 발코니(유리 난간 + 나무 손잡이), 벽돌 무늬 바닥.
// 가운데엔 금색 구슬 갈랜드가 크게 늘어진 넓은 트리, 뒤엔 유리 새장 돔, 한쪽엔 빨간 계단식 박공 집.
import { type Ctx, type Light, type WallPainter, W, H, R, P, PX, mix, hash, glow, line, perspWall, perspFloor } from '../engine/pixel';
import { drawTree, drawStar } from '../engine/props';
import { outlined, bricks, shade, ledge, pane } from '../engine/texture';
import { sprite } from '../engine/sprite';
import type { Spot } from './types';

const CEIL = '#ecedee';
const CEIL_D = '#c9ced3';
const FOLD = '#b8323a';
const GLASS = '#cfe3ee';
const GOLD = '#d8ae52';
const RED = '#c0202a';
const HOUSE = '#a3262d';

export const yeouido: Spot = {
  key: 'yeouido',
  chip: '여의도 더현대',
  name: '여의도 더현대 서울',
  snow: false,
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 300 };

    // 천장: 뒤집힌 피라미드 천 패널 줄, 줄 사이 유리 띠, 빨간 사선 보
    R(c, 0, 0, W, 140, '#dfe4e8');
    const rows = [[0, 34, 6], [36, 62, 7], [64, 84, 9], [86, 102, 11], [104, 116, 13], [118, 126, 16]] as const;
    for (const [y0, y1, n] of rows) {
      const tw = W / n;
      for (let i = 0; i < n; i++) {
        const x0 = i * tw;
        const cx = x0 + tw / 2;
        const cy = (y0 + y1) / 2 + 2;
        // 네 면을 서로 다른 밝기로 칠해 접힌 천처럼
        for (let y = y0; y < y1; y++) {
          for (let x = Math.floor(x0); x < x0 + tw; x++) {
            const dx = (x - cx) / (tw / 2);
            const dy = (y - cy) / ((y1 - y0) / 2);
            const face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 1) : dy < 0 ? 2 : 3;
            P(c, x, y, [CEIL, CEIL_D, '#f6f7f8', '#d6dadf'][face]);
          }
        }
        line(c, x0, y0, x0 + tw, y1, FOLD);
        line(c, x0 + tw, y0, x0, y1, FOLD);
      }
      R(c, 0, y1, W, 2, GLASS);
    }
    c.globalAlpha = 0.45;
    for (let x = -60; x < W + 60; x += 110) line(c, x, 0, x + 50, 126, '#9a2830');
    c.globalAlpha = 1;
    glow(c, 135, 40, 140, '#ffffff', 0.18);
    R(c, 0, 128, W, 4, '#f4f4f2');

    // 천장 아래 안쪽 공간을 먼저 흰 벽으로 채운다
    R(c, 0, 132, W, 190, '#eeeeec');

    // 벽돌 무늬 포장 바닥
    perspFloor(c, vp, 318, H, '#c7b6a3', '#b3a18c', 14);
    for (let y = 322, g = 3; y < H; y += g, g *= 1.12) {
      const off = Math.round(g * 1.5) % 2 ? 0 : 6;
      for (let x = off; x < W; x += 12) R(c, x, y, 1, Math.max(1, g * 0.8), '#9c8a78');
    }

    // 안쪽 벽과 유리 새장 돔
    R(c, 96, 132, 78, 186, '#eeeeec');
    for (let x = 96; x < 174; x += 4) R(c, x, 132, 1, 186, '#e0e1e0');
    const dcx = 135;
    for (let dy = 0; dy < 70; dy++) {
      const hw = Math.round(36 * Math.sqrt(1 - ((70 - dy) / 70) ** 2));
      R(c, dcx - hw, 248 + dy, hw * 2, 1, mix('#dfeef5', '#b9d3e0', dy / 70));
    }
    for (let k = -4; k <= 4; k++) {
      for (let dy = 0; dy < 70; dy++) {
        const hw = 36 * Math.sqrt(1 - ((70 - dy) / 70) ** 2);
        P(c, dcx + (hw * k) / 4, 248 + dy, '#f8f8f6');
      }
    }
    for (let y = 262; y < 318; y += 12) {
      const hw = 36 * Math.sqrt(1 - ((318 - y) / 70) ** 2);
      R(c, dcx - hw, y, hw * 2, 1, '#f8f8f6');
    }
    R(c, dcx - 1, 240, 2, 8, '#f8f8f6');

    // 양옆 층: 하얀 세로 골 벽, S자로 휘는 하얀 발코니, 유리 난간과 나무 손잡이
    const mall: WallPainter = (c, X, s, u, k, ya, yb) => {
      const h = yb - ya;
      R(c, X, ya, 1, h, mix('#f2f2f0', '#d8dad8', 1 - s));
      if (Math.floor(u * 22) % 2 === 0) R(c, X, ya, 1, h, mix('#e6e7e6', '#cfd1cf', 1 - s));
      // 안쪽 상점의 따뜻한 빛
      if (hash(Math.floor(u * 3) + k * 7) % 3 !== 0) R(c, X, ya + h * 0.3, 1, h * 0.35, mix('#fbe7c3', '#f2d3a0', (hash(k + Math.floor(u * 5)) % 3) / 3));
      const wob = Math.sin(u * 2.2 + k * 1.7) * s * 5;
      const slab = Math.max(2, s * 6);
      R(c, X, yb - h * 0.32 + wob, 1, slab, '#fbfbfa');
      R(c, X, yb - h * 0.32 + wob + slab, 1, 1, '#cfd3d6');
      c.globalAlpha = 0.35;
      R(c, X, yb - h * 0.32 + wob - h * 0.18, 1, h * 0.18, GLASS);
      c.globalAlpha = 1;
      P(c, X, yb - h * 0.32 + wob - h * 0.18, '#c9a27a');
    };
    perspWall(c, 'L', vp, 96, 132, 360, 4, mall);
    perspWall(c, 'R', vp, 96, 132, 360, 4, mall);

    // 한쪽: 빨간 계단식 박공 집 (둥근 창, 초록 문 장식)
    if (sprite(c, 'gableHouse', 18 + 26, 334, () => outlined(c, [11, 226, 66, 108], (c) => drawGableHouse(c, 18, 334, L)))) {
      for (const wx of [27, 58]) L.push({ x: wx, y: 288, col: '#fff6c8', s: 0.6, p: wx });
      glow(c, 18 + 26, 318, 22, '#ffcf7a', 0.3);
    }
    // 다른 쪽: 차양 달린 벽돌 상점
    for (const [x, w] of [[206, 30], [234, 34]] as const) {
      outlined(c, [x - 1, 292, w + 2, 44], (c) => {
        R(c, x, 296, w, 40, '#9a4a3a');
        bricks(c, x, 296, w, 40, '#843a2d');
        shade(c, x, 296, w, 40);
        ledge(c, x - 1, 294, w + 2, '#e9dcc4', 2);
        pane(c, x + 4, 314, w - 8, 18, '#ffd98a', '#5a2a1e', { sill: false });
        glow(c, x + w / 2, 322, 16, '#ffcf7a', 0.3);
        // 줄무늬 차양: 아래 가장자리를 물결로, 그림자 한 줄
        for (let i = 0; i < w; i += 4) {
          const col = (i / 4) % 2 ? '#f4f1ea' : '#2f6b4f';
          R(c, x + i, 306, 4, 5, col);
          R(c, x + i + 0.5, 311, 3, 1, col);
        }
        R(c, x, 306, w, PX, 'rgba(255,255,255,0.4)');
        R(c, x + 1, 312, w - 2, 1, 'rgba(30,10,30,0.3)');
        R(c, x, 334, w, 2, '#5a2a1e');
      });
    }

    // 트리: 넓고 꽉 찬 원뿔, 금색 구슬 갈랜드가 크게 늘어지고 빨간 공·곰·별·달 장식
    const T = { cx: 135, base: 318, h: 262, w: 176 };
    L.push(...drawTree(c, r, {
      cx: T.cx, base: T.base, h: T.h, w: T.w, tiers: 5, green: '#24402c', dark: '#16291c',
      orn: [RED, RED, RED, GOLD], ornN: 90, light: ['#ffe3a0', '#fff3d0'], lightN: 170, garland: GOLD,
      glow: '#ffe3a0', glowA: 0.2, gifts: [RED, RED, '#f3e6c8', GOLD], pot: RED, potTop: GOLD,
    }));
    const top = T.base - T.h;
    for (let i = 0; i < 26; i++) {
      const yy = top + 30 + r() * (T.h - 50);
      const hw = (T.w / 2) * ((yy - top) / T.h) * 0.7;
      const xx = T.cx + (r() * 2 - 1) * hw;
      const kind = i % 4;
      if (kind === 0) drawBear(c, xx, yy);
      else if (kind === 1) drawStar(c, xx, yy, GOLD);
      else if (kind === 2) drawMoon(c, xx, yy);
      else drawDrum(c, xx, yy);
    }
    // 꼭대기: 빛나는 하얀 원
    glow(c, T.cx, top - 6, 26, '#ffffff', 0.6);
    for (let dy = -6; dy <= 6; dy++) {
      const hw = Math.round(Math.sqrt(36 - dy * dy));
      R(c, T.cx - hw, top - 6 + dy, hw * 2 + 1, 1, dy < -2 ? '#ffffff' : '#fff6dc');
    }
    R(c, T.cx - 2, top - 8, 4, 4, GOLD);
    L.push({ x: T.cx, y: top - 6, col: '#ffffff', s: 1, p: 0, big: true });

    // 밑동 주변: 빨간 선물 더미와 빨간 모자 곰 인형, 흰 북극곰, 인공 눈 둔덕
    for (const [x, y] of [[70, 340], [196, 340]] as const) {
      outlined(c, [x - 10, y - 20, 34, 20], (c) => {
        for (let k = 0; k < 4; k++) {
          const gx = x - 10 + k * 6;
          const gh = 8 + (k % 2) * 4;
          R(c, gx, y - gh, 7, gh, k % 2 ? RED : '#a81820');
          R(c, gx + 3, y - gh, 1, gh, '#f3d27a');
          R(c, gx, y - gh, 7, PX, 'rgba(255,255,255,0.3)');
          R(c, gx + 5.5, y - gh, 1.5, gh, 'rgba(30,10,30,0.25)');
        }
        drawTeddy(c, x + 8, y);
      });
    }
    outlined(c, [212, 338, 30, 18], (c) => drawPolarBear(c, 226, 356));
    for (const [x, w] of [[40, 40], [104, 24], [176, 30]] as const) {
      for (let i = 0; i < 4; i++) R(c, x - w / 2 + i * 2, 346 - i, w - i * 4, 1, '#f8fafc');
    }

    return { lights: L, floor: [14, 372, 256, 462], board: { x: 12, y: 142, hang: true } };
  },
};

function drawGableHouse(c: Ctx, x: number, base: number, L: Light[]): void {
  const w = 52;
  const h = 64;
  R(c, x, base - h, w, h, HOUSE);
  R(c, x + w - 6, base - h, 6, h, '#82191f');
  // 계단식 곡선 박공
  for (let i = 0; i < 4; i++) R(c, x + 6 + i * 5, base - h - 8 - i * 7, w - 12 - i * 10, 8, HOUSE);
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.05) P(c, x + w / 2 + Math.cos(a) * 6, base - h - 30 + Math.sin(a) * 6, '#f3e6c8');
  // 둥근 창과 창문들
  for (let a = 0; a < Math.PI * 2; a += 0.2) P(c, x + w / 2 + Math.cos(a) * 5, base - h - 6 + Math.sin(a) * 5, '#f3e6c8');
  R(c, x + w / 2 - 3, base - h - 9, 6, 6, '#ffd98a');
  for (const wx of [x + 7, x + w - 16]) {
    R(c, wx, base - h + 10, 9, 14, '#ffd98a');
    R(c, wx + 4, base - h + 10, 1, 14, '#f3e6c8');
    L.push({ x: wx + 2, y: base - h + 12, col: '#fff6c8', s: 0.6, p: wx });
  }
  // 문과 초록 장식
  R(c, x + w / 2 - 7, base - 24, 14, 24, '#4a2a1a');
  R(c, x + w / 2 - 5, base - 22, 10, 10, '#ffcf8a');
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.15) R(c, x + w / 2 + Math.cos(a) * 10, base - 24 + Math.sin(a) * 6, 2, 2, '#2f6b4f');
  glow(c, x + w / 2, base - 16, 22, '#ffcf7a', 0.3);
}

function drawBear(c: Ctx, x: number, y: number): void {
  R(c, x - 2, y, 5, 5, '#f2a7c0');
  R(c, x - 3, y - 1, 2, 2, '#f2a7c0');
  R(c, x + 2, y - 1, 2, 2, '#f2a7c0');
  P(c, x - 1, y + 2, '#2a1f2b');
  P(c, x + 1, y + 2, '#2a1f2b');
}

function drawMoon(c: Ctx, x: number, y: number): void {
  for (let a = Math.PI * 0.6; a < Math.PI * 1.9; a += 0.25) P(c, x + Math.cos(a) * 3, y + Math.sin(a) * 3, GOLD);
  P(c, x - 2, y, '#f2d48a');
}

function drawDrum(c: Ctx, x: number, y: number): void {
  R(c, x - 2, y, 5, 4, RED);
  R(c, x - 2, y, 5, 1, '#f3e6c8');
  R(c, x - 2, y + 3, 5, 1, '#f3e6c8');
  P(c, x, y + 1, GOLD);
}

function drawTeddy(c: Ctx, x: number, base: number): void {
  R(c, x - 4, base - 9, 8, 9, '#a8743a');
  R(c, x - 3, base - 15, 6, 6, '#a8743a');
  R(c, x + 2, base - 9, 2, 9, '#8a5a2a');
  R(c, x - 1, base - 7, 2, 3, '#c8955a');
  R(c, x - 4, base - 18, 8, 3, RED);
  R(c, x - 4, base - 16, 8, 1, '#ffffff');
  P(c, x + 3, base - 19, '#ffffff');
  P(c, x - 1, base - 13, '#2a1f2b');
  P(c, x + 1, base - 13, '#2a1f2b');
}

function drawPolarBear(c: Ctx, x: number, base: number): void {
  R(c, x - 12, base - 12, 22, 10, '#f4f6f8');
  R(c, x + 8, base - 16, 8, 8, '#f4f6f8');
  for (const lx of [x - 11, x - 5, x + 2, x + 7]) R(c, lx, base - 3, 3, 3, '#dfe4ea');
  P(c, x + 14, base - 13, '#2a1f2b');
  P(c, x + 15, base - 11, '#2a1f2b');
  R(c, x - 12, base - 12, 22, 1, '#ffffff');
  R(c, x - 12, base - 5, 22, 2, '#d9dfe7');
  R(c, x + 9, base - 17, 2, 2, '#f4f6f8');
  P(c, x + 9.5, base - 16.5, '#d9dfe7');
}
