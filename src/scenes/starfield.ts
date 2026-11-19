// 삼성 별마당 도서관: 한쪽에 둥글게 휘어 솟은 거대한 책장 탑(층마다 하얀 빛 띠),
// 그 옆으로 올라가는 쌍둥이 에스컬레이터, 다른 쪽엔 천장에 닿을 듯한 좁고 높은 트리.
// 위로는 철골 격자 채광창과 매달린 별·불꽃 전구·장난감 모양 장식, 뒤로 유리벽과 빛 커튼 걸린 발코니.
import { type Ctx, type Light, W, H, R, P, mix, hash, glow, line, perspFloor, BOOK } from '../engine/pixel';
import { drawTree, drawStar } from '../engine/props';
import type { Spot } from './types';

const LIGHT = '#f6d98a';
const GOLD = '#c9963f';
const WOOD = '#a0522d';
const SKY = '#6c8fb8';

export const starfield: Spot = {
  key: 'starfield',
  chip: '삼성 별마당',
  name: '삼성 별마당 도서관',
  snow: false,
  night: { color: '#140c06', alpha: 0.1 },
  crowd: { y: 334, x0: 0, x1: 270, n: 12, col: '#2a221c' },
  build(c, r) {
    const L: Light[] = [];
    const bulb = (x: number, y: number, col = LIGHT) => {
      x = Math.round(x);
      y = Math.round(y);
      c.globalAlpha = 0.45;
      P(c, x, y, col);
      c.globalAlpha = 1;
      L.push({ x, y, col, s: 0.8 + ((x + y) % 5) * 0.4, p: (x * 0.37 + y * 0.13) % 7 });
    };

    // 철골 격자 채광창 (금빛이 번진다)
    for (let y = 0; y < 112; y++) R(c, 0, y, W, 1, mix(SKY, '#a9b8c6', y / 112));
    c.globalAlpha = 0.7;
    for (let x = -120; x < W + 120; x += 9) {
      line(c, x, 0, x + 60, 112, '#3a4a60');
      line(c, x + 60, 0, x, 112, '#3a4a60');
    }
    for (let y = 0; y < 112; y += 10) R(c, 0, y, W, 1, '#3a4a60');
    c.globalAlpha = 1;
    glow(c, 160, 90, 130, '#ffd98a', 0.35);
    R(c, 0, 112, W, 6, '#d9b98c');

    // 뒤쪽 유리벽과 위층 발코니 (빛 커튼 + 초록 갈랜드)
    R(c, 0, 118, W, 186, '#2b3a5c');
    for (let x = 0; x < W; x += 14) R(c, x, 118, 1, 186, '#1e2a44');
    for (let y = 118; y < 304; y += 22) R(c, 0, y, W, 1, '#1e2a44');
    R(c, 0, 196, W, 6, '#d9b98c');
    for (let x = 0; x < W; x++) P(c, x, 194 + Math.round(Math.abs(Math.sin(x / 9)) * 3), '#2f4a2a');
    for (let x = 4; x < W; x += 6) for (let y = 204; y < 246; y += 4) if ((x + y) % 8 < 4) bulb(x, y);
    glow(c, 135, 222, 140, '#ffd98a', 0.15);

    // 옅은 베이지 돌바닥
    perspFloor(c, { x: 150, y: 270 }, 304, H, '#d9b98c', '#ccab7e', 24);

    // 왼쪽: 둥글게 휜 거대한 책장 탑 (가장자리로 갈수록 책이 좁아진다)
    const TX0 = 0;
    const TX1 = 104;
    const TOPY = 54;
    const BOTY = 316;
    const shelfH = 13;
    for (let x = TX0; x < TX1; x++) {
      const f = (x - TX0) / (TX1 - TX0); // 0 왼쪽 끝, 1 오른쪽 가장자리(휘어져 멀어짐)
      const curve = Math.sin(f * Math.PI * 0.5);
      const top = TOPY + Math.round(curve * curve * 16);
      const shade = 0.15 + curve * 0.45;
      R(c, x, top, 1, BOTY - top, mix('#3a2a1e', '#1e150e', shade));
      const density = 9 + curve * 14; // 휘어진 쪽일수록 책이 촘촘
      for (let y = top + 4, row = 0; y < BOTY - 4; y += shelfH, row++) {
        const id = Math.floor(f * density * 4) + row * 31;
        const h0 = hash(id);
        if (h0 % 9 !== 0) R(c, x, y + 2 + (h0 % 3), 1, shelfH - 4 - (h0 % 3), mix(BOOK[h0 % BOOK.length], '#1e150e', shade));
        R(c, x, y + shelfH - 2, 1, 2, mix(WOOD, '#3a2a1e', shade));
        // 세 칸마다 하얀 빛 띠
        if (row % 3 === 2) R(c, x, y + shelfH - 1, 1, 1, mix('#fff4d6', '#a8a090', curve * 0.6));
      }
      if (Math.floor(f * 6) !== Math.floor(((x + 1 - TX0) / (TX1 - TX0)) * 6)) R(c, x, top, 1, BOTY - top, mix(WOOD, '#2a1d14', shade));
    }
    for (let x = TX0; x < TX1; x += 3) {
      const f = (x - TX0) / (TX1 - TX0);
      const curve = Math.sin(f * Math.PI * 0.5);
      for (let y = TOPY + 4; y < BOTY; y += shelfH * 3) bulb(x, y + Math.round(curve * curve * 16) + shelfH * 3 - 5, '#fff4d6');
    }
    // 꼭대기 간판 자리: 따뜻한 흰 빛 덩어리 (글자는 쓰지 않는다)
    for (let i = 0; i < 6; i++) R(c, 12 + i * 13, TOPY - 10, 9, 7, '#fff4d6');
    glow(c, 50, TOPY - 6, 40, '#fff4d6', 0.4);
    glow(c, 60, 200, 80, '#ffd98a', 0.15);

    // 책장과 트리 사이로 올라가는 쌍둥이 에스컬레이터 (난간에 갈랜드)
    for (const off of [0, 14]) {
      const x0 = 96 + off;
      for (let i = 0; i < 120; i++) {
        const x = x0 + i * 0.22;
        const y = 330 - i;
        R(c, x, y, 10, 1, i % 4 === 0 ? '#9a9aa2' : '#c4c4cc');
        P(c, x, y - 4, '#2f4a2a');
        if (i % 5 === 0) bulb(x, y - 5);
      }
    }

    // 트리: 좁고 높은 원뿔(폭:높이 ≈ 2:7), 금·청동·빨강 공, 큰 금별, 지팡이 사탕 줄이 휘감김
    const T = { cx: 186, base: 324, h: 286, w: 92 };
    L.push(...drawTree(c, r, {
      cx: T.cx, base: T.base, h: T.h, w: T.w, tiers: 7, green: '#2f4a2a', dark: '#1e2a1c',
      orn: [GOLD, GOLD, '#a05a2c', '#b8322c', '#3e6a3e', '#6c8fb8', '#e8e3d8'], ornN: 110,
      light: [LIGHT, '#fff4d6'], lightN: 210, star: '#f2c14e', glow: '#ffd98a', glowA: 0.22, pot: '#b8322c', potTop: GOLD,
    }));
    const top = T.base - T.h;
    for (let i = 0; i < 260; i++) {
      const t = i / 260;
      const y = top + 20 + t * (T.h - 30);
      const hw = (T.w / 2) * ((y - top) / T.h) * 0.85;
      const x = T.cx + Math.sin(t * Math.PI * 9) * hw;
      if (Math.cos(t * Math.PI * 9) < 0) continue; // 뒤로 돌아간 부분은 가린다
      P(c, x, y, Math.floor(i / 3) % 2 ? '#b8322c' : '#ffffff');
    }
    // 트리에 붙은 납작한 장난감 (기차, 페가수스, 곰)
    drawToyTrain(c, T.cx - 22, top + 200);
    drawPegasus(c, T.cx + 16, top + 120);
    drawTeddy(c, T.cx - 10, top + 90);

    // 천장에 매달린 불꽃 전구, 큰 금별, 장난감 모양 장식
    for (const [x, y] of [[120, 70], [230, 48], [150, 140], [252, 120], [128, 30]] as const) {
      R(c, x, 0, 1, y - 8, '#5a4a3a');
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) for (let d = 2; d <= 8; d += 3) bulb(x + Math.cos(a) * d, y + Math.sin(a) * d, '#fff4d6');
      glow(c, x, y, 16, '#fff4d6', 0.35);
    }
    for (const [x, y] of [[214, 84], [104, 104], [258, 160]] as const) {
      R(c, x, 0, 1, y - 5, '#5a4a3a');
      drawStar(c, x, y, '#f2c14e', true);
      R(c, x - 3, y - 3, 7, 7, '#f2c14e');
      drawStar(c, x, y, '#ffe9a8', true);
    }
    drawController(c, 150, 96);
    drawFootball(c, 236, 190);

    // 바닥: 작은 원뿔 트리와 기둥 등불
    for (const [x, h] of [[18, 36], [44, 28], [244, 34], [126, 26]] as const) {
      L.push(...drawTree(c, r, { cx: x, base: 336, h, w: h * 0.55, tiers: 3, green: '#2f4a2a', dark: '#1e2a1c', orn: [GOLD], ornN: 4, light: [LIGHT], lightN: 14, glowA: 0.06 }));
    }
    for (const lx of [72, 226]) {
      R(c, lx, 330, 2, 30, '#1a1a1e');
      R(c, lx - 3, 322, 8, 9, '#1a1a1e');
      R(c, lx - 2, 323, 6, 7, '#ffd98a');
      glow(c, lx + 1, 326, 14, '#ffd98a', 0.45);
    }
    return { lights: L, floor: [14, 368, 256, 462], board: { x: 8, y: 132, hang: true } };
  },
};

function drawToyTrain(c: Ctx, x: number, y: number): void {
  R(c, x, y, 14, 7, '#e8743a');
  R(c, x, y - 5, 6, 5, '#e8743a');
  R(c, x + 10, y - 4, 3, 4, '#2a2228');
  R(c, x + 1, y + 7, 3, 3, '#2a2228');
  R(c, x + 9, y + 7, 3, 3, '#2a2228');
  R(c, x + 1, y - 4, 4, 3, '#ffe9a8');
}

function drawPegasus(c: Ctx, x: number, y: number): void {
  const Wt = '#e8e3d8';
  R(c, x, y, 12, 6, Wt);
  R(c, x + 10, y - 6, 4, 7, Wt);
  R(c, x + 12, y - 7, 4, 3, Wt);
  for (const lx of [x + 1, x + 4, x + 7, x + 10]) R(c, lx, y + 6, 1, 5, '#cfc8b8');
  for (let i = 0; i < 7; i++) R(c, x + 2 + i, y - 1 - i, 6 - i * 0.6, 1, '#fff8ec');
}

function drawTeddy(c: Ctx, x: number, y: number): void {
  R(c, x - 4, y, 8, 8, '#a8743a');
  R(c, x - 3, y - 6, 6, 6, '#a8743a');
  R(c, x - 4, y - 7, 2, 2, '#a8743a');
  R(c, x + 2, y - 7, 2, 2, '#a8743a');
  P(c, x - 1, y - 4, '#2a1f2b');
  P(c, x + 1, y - 4, '#2a1f2b');
}

function drawController(c: Ctx, x: number, y: number): void {
  R(c, x, 0, 1, y - 6, '#5a4a3a');
  R(c, x - 12, y - 5, 24, 10, '#9a9aa2');
  R(c, x - 14, y - 2, 4, 9, '#9a9aa2');
  R(c, x + 10, y - 2, 4, 9, '#9a9aa2');
  R(c, x - 8, y - 2, 5, 1, '#2a2228');
  R(c, x - 6, y - 4, 1, 5, '#2a2228');
  for (const [dx, col] of [[5, '#d8323a'], [8, '#3a7ad8'], [6, '#3aa85a'], [9, '#f2c14e']] as const) P(c, x + dx, y - 3 + (dx % 2) * 2, col);
}

function drawFootball(c: Ctx, x: number, y: number): void {
  R(c, x, 0, 1, y - 7, '#5a4a3a');
  for (let dy = -6; dy <= 6; dy++) {
    const hw = Math.round(Math.sqrt(36 - dy * dy));
    R(c, x - hw, y + dy, hw * 2 + 1, 1, '#f4f4f2');
  }
  for (const [dx, dy] of [[0, 0], [-4, -3], [4, -3], [-3, 4], [3, 4]] as const) R(c, x + dx - 1, y + dy - 1, 3, 3, '#2a2228');
}
