// 잠실 롯데월드몰 월드파크 크리스마스 마켓: 나무 데크 광장 가운데 빨간 하트를 단 트리,
// 왼쪽엔 둥근 몰 건물과 2층 회전목마, 오른쪽 뒤로 매끈한 유리 원뿔 타워와 하얀 고깔 텐트,
// 가장자리를 가로지르는 전구 줄, 하얀 구형 가로등, 소나무 실루엣, 인공 눈.
import { type Ctx, type Light, W, H, R, P, PX, mix, sky, glow, line, perspFloor, reflect } from '../engine/pixel';
import { drawTree, drawCrowd, drawStar } from '../engine/props';
import { outlined, shade } from '../engine/texture';
import type { Spot } from './types';

const BULB = '#ffe7a3';
const HEART = '#d8232a';
const HEART_HI = '#ff5a5f';
const CREAM = '#f4ebd8';
const DECK = '#6b4a2e';

export const jamsil: Spot = {
  key: 'jamsil',
  chip: '잠실 롯데월드몰',
  name: '잠실 롯데월드몰',
  snow: true,
  outdoor: true,
  hours: [17, 24],
  night: { color: '#070b24', alpha: 0.38 },
  crowd: { y: 286, x0: 0, x1: 270, n: 14, col: '#12182a' },
  build(c, r) {
    const L: Light[] = [];
    const bulb = (x: number, y: number, col = BULB) => {
      x = Math.round(x);
      y = Math.round(y);
      c.globalAlpha = 0.45;
      P(c, x, y, col);
      c.globalAlpha = 1;
      L.push({ x, y, col, s: 1 + ((x * 7 + y) % 5) * 0.4, p: (x * 0.3 + y * 0.11) % 7 });
    };

    // 짙은 남색 하늘, 지평선 쪽 도시 불빛
    sky(c, 0, 280, '#0b1630', '#26304e', 8);
    for (let i = 0; i < 50; i++) {
      c.globalAlpha = 0.3 + r() * 0.5;
      P(c, r() * W, r() * 140, '#ffffff');
    }
    c.globalAlpha = 1;

    // 오른쪽 뒤: 매끈하게 휘며 가늘어지는 유리 원뿔 타워, 가로 빛줄
    const TX = 214;
    const tw = (y: number) => 6 + 44 * Math.pow(Math.max(0, y - 14) / 250, 1.45);
    glow(c, TX, 140, 80, '#7f9ad6', 0.12);
    for (let y = 14; y < 264; y++) {
      const w = tw(y);
      R(c, TX - w / 2, y, w, 1, '#1e2a44');
      R(c, TX - w / 2, y, w * 0.35, 1, '#2a3a5c');
      R(c, TX + w * 0.15, y, w * 0.35, 1, '#18213a');
      P(c, TX - 1, y, '#34466e');
      if (y % 6 === 0) {
        c.globalAlpha = 0.55;
        R(c, TX - w / 2 + 1, y, w - 2, 1, '#dce6f2');
        c.globalAlpha = 1;
      }
    }
    for (let y = 2; y < 14; y += 2) P(c, TX, y, '#9fb2d8');
    L.push({ x: TX, y: 1, col: '#ff5a5a', s: 3, p: 0, big: true });
    // 타워 아래 금빛 포디움
    R(c, TX - 34, 250, 68, 18, '#3a2e22');
    for (let x = TX - 32; x < TX + 34; x += 5) R(c, x, 253, 3, 10, '#f5b94a');
    glow(c, TX, 258, 44, '#f5b94a', 0.35);

    // 왼쪽: 둥근 원통형 몰 건물 (가로 석재 띠 + 위쪽 유리 띠, 불 켜진 창 격자)
    for (let x = 0; x < 112; x++) {
      const f = x / 112;
      const top = 150 + Math.round((1 - Math.cos(f * Math.PI * 0.5)) * 30);
      R(c, x, top, 1, 268 - top, mix('#3a3026', '#241c16', f));
      R(c, x, top, 1, 12, mix('#3a5070', '#22304a', f));
      for (let y = top + 16; y < 266; y += 7) {
        R(c, x, y, 1, 1, '#4e4032');
        if ((x + Math.floor(y / 7)) % 5 === 0 && (x * 13 + y) % 7 < 4) P(c, x, y + 3, '#ffcf8a');
      }
    }
    glow(c, 50, 220, 70, '#ffcf8a', 0.12);

    // 데크 뒤쪽 소나무 실루엣
    for (let x = -6; x < W; x += 13 + ((x * 7) % 5)) {
      const h = 26 + ((x * 11) % 14);
      for (let i = 0; i < h; i++) R(c, x + 6 - (i * 0.3), 278 - i, 1 + i * 0.6, 1, '#0f1e18');
    }

    // 갈색 나무 데크 (판자 결 + 젖어서 비치는 빛)
    perspFloor(c, { x: 135, y: 230 }, 278, H, DECK, '#5a3d25', 10);
    for (let i = 0; i < 90; i++) {
      c.globalAlpha = 0.25 + r() * 0.3;
      R(c, r() * W, 280 + r() * 200, 2 + r() * 5, 1, '#dfe6f4');
    }
    c.globalAlpha = 1;

    // 오른쪽 뒤 크림색 서커스 텐트 파빌리온, 앞쪽 하얀 고깔 텐트들
    outlined(c, [180, 232, 88, 62], (c) => drawPavilion(c, 222, 292, bulb));
    outlined(c, [155, 285, 42, 34], (c) => drawTent(c, 176, 318, 34, bulb));
    outlined(c, [201, 302, 50, 39], (c) => drawTent(c, 226, 340, 42, bulb));

    // 트리: 좁은 원뿔, 따뜻한 흰 전구와 빨간 하트, 하얀 별
    const TREE = { cx: 128, base: 322, h: 232, w: 124 };
    L.push(...drawTree(c, r, {
      cx: TREE.cx, base: TREE.base, h: TREE.h, w: TREE.w, tiers: 6, green: '#1f4a2c', dark: '#0f2e1c',
      orn: [HEART], ornN: 0, light: [BULB, '#fff6dc'], lightN: 170, star: '#ffffff', glow: '#ffd98a', glowA: 0.2,
      gifts: [HEART, CREAM, '#2f7a52', '#f5b94a'], pot: '#2f4a2c', potTop: '#3e6a3e',
    }));
    // 하트 장식을 고르게 흩뿌린다
    for (let row = 0; row < 7; row++) {
      const y = TREE.base - TREE.h + 30 + row * 28;
      const half = (TREE.w / 2) * ((y - (TREE.base - TREE.h)) / TREE.h) * 0.8;
      for (let k = -2; k <= 2; k++) {
        const x = TREE.cx + k * (half / 2.4) + (row % 2 ? 6 : 0);
        if (Math.abs(x - TREE.cx) > half - 4) continue;
        drawHeart(c, x, y);
      }
    }

    // 2층 회전목마
    L.push(...outlined(c, [4, 230, 86, 123], (c) => drawCarousel2(c, 46, 352, bulb)));

    // 가장자리를 가로지르는 전구 줄
    const festoons: [number, number, number, number][] = [[0, 196, 120, 214], [120, 214, 270, 190], [0, 236, 96, 250], [176, 250, 270, 232]];
    for (const [x0, y0, x1, y1] of festoons) {
      for (let t = 0; t <= 1; t += 0.03) {
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 12;
        bulb(x, y);
      }
    }

    // 하얀 구형 머리의 가로등과 빨간 산타 우체통
    for (const lx of [10, 258]) {
      R(c, lx, 352, 2, 46, '#1b1f2a');
      R(c, lx - 2, 396, 6, 3, '#1b1f2a');
      R(c, lx - 3, 345, 8, 8, '#f4f1ea');
      R(c, lx - 2, 344, 6, 1, '#f4f1ea');
      glow(c, lx + 1, 349, 20, '#ffe7c4', 0.5);
      L.push({ x: lx + 1, y: 349, col: '#fff6e0', s: 0.5, p: lx, big: true });
    }
    R(c, 160, 344, 8, 16, HEART);
    R(c, 159, 342, 10, 3, '#a81820');
    R(c, 161, 348, 6, 1, '#2a1f2b');

    drawCrowd(c, r, 300, 70, 200, 10, '#12182a');
    reflect(c, 330, 70, 0.1);
    return { lights: L, floor: [14, 372, 256, 462], board: { x: 8, y: 24 } };
  },
};

function drawHeart(c: Ctx, x: number, y: number): void {
  const rows = [[1, 1, 0, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0]];
  rows.forEach((row, ry) => row.forEach((v, rx) => v && P(c, x - 2 + rx, y + ry, HEART)));
  P(c, x - 1, y, HEART_HI);
  P(c, x - 2, y + 1, HEART_HI);
}

/** 하얀 고깔 텐트 (지붕선에 전구) */
function drawTent(c: Ctx, cx: number, base: number, w: number, bulb: (x: number, y: number) => void): void {
  const h = Math.round(w * 0.55);
  R(c, cx - w / 2, base - h, w, h, '#efe9dc');
  shade(c, cx - w / 2, base - h, w, h, { dark: 3 });
  R(c, cx - w / 2 + 3, base - h + 6, w - 6, h - 8, '#ffcf8a');
  R(c, cx - 0.25, base - h + 6, PX, h - 8, '#e0a860');
  R(c, cx - w / 2 + 3, base - h + 6, w - 6, PX, '#c9873a');
  glow(c, cx, base - h / 2, w * 0.6, '#ffcf8a', 0.25);
  for (let i = 0; i < 12; i++) {
    const ww = w + 4 - i * (w / 12);
    R(c, cx - ww / 2, base - h - i, ww, 1, i % 2 ? '#e2dccd' : '#f8f4ea');
  }
  for (let x = -w / 2 - 2; x <= w / 2 + 2; x += 3) bulb(cx + x, base - h);
  line(c, cx - w / 2 - 2, base - h, cx, base - h - 12, '#d8d0c0');
  line(c, cx + w / 2 + 2, base - h, cx, base - h - 12, '#d8d0c0');
  for (let t = 0; t <= 1; t += 0.12) {
    bulb(cx - w / 2 - 2 + (w / 2 + 2) * t, base - h - 12 * t);
    bulb(cx + w / 2 + 2 - (w / 2 + 2) * t, base - h - 12 * t);
  }
}

/** 크림색 서커스 텐트 파빌리온 */
function drawPavilion(c: Ctx, cx: number, base: number, bulb: (x: number, y: number) => void): void {
  const w = 76;
  R(c, cx - w / 2, base - 24, w, 24, CREAM);
  for (let x = cx - w / 2; x < cx + w / 2; x += 8) R(c, x, base - 24, 4, 24, '#e8dcc0');
  shade(c, cx - w / 2, base - 24, w, 24, { dark: 4 });
  R(c, cx - 10, base - 18, 20, 18, '#ffcf8a');
  R(c, cx - 10, base - 18, 20, PX, '#c9873a');
  R(c, cx - 0.25, base - 18, PX, 18, '#e0a860');
  for (let i = 0; i < 26; i++) {
    const ww = w + 8 - i * 3;
    for (let x = 0; x < ww; x++) P(c, cx - ww / 2 + x, base - 25 - i, Math.floor((x / ww) * 12) % 2 ? CREAM : '#e0d0b0');
  }
  R(c, cx, base - 56, 1, 6, '#c9a14a');
  for (let x = -w / 2 - 4; x <= w / 2 + 4; x += 3) bulb(cx + x, base - 25);
}

/** 2층 회전목마: 빨강·크림 물결 차양, 원형 메달, 줄무늬 원뿔 지붕, 하얀 울타리 */
function drawCarousel2(c: Ctx, cx: number, base: number, bulb: (x: number, y: number) => void): Light[] {
  glow(c, cx, base - 40, 50, '#ffcf7a', 0.35);
  // 울타리
  for (let x = cx - 40; x <= cx + 40; x += 4) R(c, x, base - 8, 2, 8, '#f4f1ea');
  R(c, cx - 40, base - 6, 82, 1, '#f4f1ea');
  // 1층 바닥과 기둥, 말
  R(c, cx - 34, base - 12, 68, 5, '#b8873e');
  R(c, cx - 34, base - 12, 68, PX, '#e0b060');
  R(c, cx - 34, base - 8, 68, 1, '#8a6228');
  for (const k of [-28, -16, -4, 8, 20, 30]) {
    R(c, cx + k, base - 50, 1, 38, '#e8d08a');
    const hy = base - 22 - ((k + 40) % 3) * 4;
    R(c, cx + k - 3, hy, 7, 4, '#f4f1ea');
    R(c, cx + k + 3, hy - 3, 2, 3, '#f4f1ea');
  }
  R(c, cx - 30, base - 50, 60, 38, 'rgba(255,207,122,.22)');
  // 1층 물결 차양
  for (let x = -38; x <= 38; x++) {
    const sc = Math.round(Math.abs(Math.sin(x / 3)) * 3);
    R(c, cx + x, base - 58, 1, 6 + sc, Math.floor((x + 40) / 5) % 2 ? CREAM : '#c8202a');
  }
  for (let x = -38; x <= 38; x += 3) bulb(cx + x, base - 58);
  // 원형 메달
  for (const mx of [-22, 0, 22]) {
    for (let a = 0; a < Math.PI * 2; a += 0.4) P(c, cx + mx + Math.cos(a) * 5, base - 66 + Math.sin(a) * 3, '#f2c14e');
    R(c, cx + mx - 4, base - 68, 8, 5, '#c8202a');
  }
  // 2층
  R(c, cx - 26, base - 86, 52, 22, 'rgba(255,207,122,.25)');
  for (const k of [-20, -6, 8, 20]) R(c, cx + k, base - 86, 1, 22, '#e8d08a');
  for (let x = -28; x <= 28; x++) {
    const sc = Math.round(Math.abs(Math.sin(x / 3)) * 2);
    R(c, cx + x, base - 92, 1, 5 + sc, Math.floor((x + 30) / 5) % 2 ? '#c8202a' : CREAM);
  }
  for (let x = -28; x <= 28; x += 3) bulb(cx + x, base - 92);
  // 줄무늬 원뿔 지붕과 꼭대기 장식
  for (let i = 0; i < 18; i++) {
    const ww = 58 - i * 3.2;
    for (let x = 0; x < ww; x++) P(c, cx - ww / 2 + x, base - 93 - i, Math.floor((x / ww) * 8) % 2 ? CREAM : '#c8202a');
  }
  R(c, cx, base - 116, 1, 6, '#c9a14a');
  drawStar(c, cx, base - 118, '#f2c14e');
  return [];
}
