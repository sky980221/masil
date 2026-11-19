// 명동 롯데백화점 본점: 넓고 평평한 베이지 석조 건물 위를 따뜻한 전구 선으로 그린 고전풍 외관.
// 층층이 둥근 창, 계단식 기둥 탑, 1층 위 반원 아치 줄, 부채꼴 장식. 왼쪽엔 리본·선물 간판,
// 오른쪽 둥근 모서리엔 남색 LED 화면, 가장자리엔 금색 원뿔 트리. 앞은 넓은 인도와 소나무, 인파.
import { type Ctx, type Light, W, H, R, P, mix, vgrad, glow, line, perspFloor } from '../engine/pixel';
import { drawTree, drawLamp, drawCrowd, drawStar } from '../engine/props';
import type { Spot } from './types';

const BULB = '#ffe9c4';
const STONE = '#76573e';
const STONE_LIT = '#9a785a';
const AWNING = '#561c20';
const WINDOW = '#ded3bd';
const RIBBON = '#d8303a';
const NAVY = '#183753';

// 건물 영역
const TOP = 112;
const GROUND = 300; // 1층 시작
const BASE = 330; // 인도 시작
const MAIN_R = 208; // 본관 오른쪽 끝, 그 오른쪽은 둥근 모서리 동

export const myeongdong: Spot = {
  key: 'myeongdong',
  chip: '명동 롯데백화점',
  name: '명동 롯데백화점',
  snow: false,
  night: { color: '#0a0806', alpha: 0.3 },
  crowd: { y: 356, x0: 0, x1: 270, n: 16, col: '#1c1612' },
  build(c, r) {
    const L: Light[] = [];
    // 전구 한 알: 흐린 바탕을 깔고 깜빡임 목록에 넣는다
    const bulb = (x: number, y: number, s = 1.2) => {
      x = Math.round(x);
      y = Math.round(y);
      c.globalAlpha = 0.55;
      P(c, x, y, BULB);
      c.globalAlpha = 1;
      L.push({ x, y, col: BULB, s, p: (x * 0.31 + y * 0.17) % 7 });
    };
    const bulbLine = (x0: number, y0: number, x1: number, y1: number, gap = 3) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / gap));
      for (let i = 0; i <= n; i++) bulb(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
    };
    const bulbArc = (cx: number, cy: number, rx: number, ry: number, gap = 3) => {
      const n = Math.max(4, Math.round((Math.PI * (rx + ry)) / 2 / gap));
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + (Math.PI * i) / n;
        bulb(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
      }
    };

    // 검은 밤하늘과 뒤쪽의 어두운 빌딩들, 유리 돔 탑
    vgrad(c, 0, BASE, '#0a0a0a', '#15100d', 4);
    for (const [x, w, h] of [[0, 40, 150], [36, 46, 120], [150, 50, 170], [196, 74, 140]] as const) {
      R(c, x, TOP - h + 80, w, h, '#221a14');
      for (let i = 0; i < (w * h) / 90; i++) {
        c.globalAlpha = 0.5;
        P(c, x + 2 + r() * (w - 4), TOP - h + 84 + r() * (h - 10), r() < 0.7 ? '#6a5a44' : '#ffd98a');
      }
      c.globalAlpha = 1;
    }
    for (let dy = 0; dy < 16; dy++) {
      const hw = Math.round(Math.sqrt(256 - (16 - dy) ** 2) * 1.2);
      R(c, 104 - hw, 34 + dy, hw * 2, 1, mix('#4a5a68', '#26303a', dy / 16));
    }
    R(c, 86, 50, 36, 62, '#1d1914');
    glow(c, 104, 42, 24, '#9fc0d8', 0.15);

    // 본관: 넓고 평평한 석조 건물, 전구 빛에 따뜻하게 물든 벽
    R(c, 0, TOP, MAIN_R, GROUND - TOP, STONE);
    for (let y = TOP; y < GROUND; y++) {
      c.globalAlpha = 0.5 * Math.sin(((y - TOP) / (GROUND - TOP)) * Math.PI);
      R(c, 0, y, MAIN_R, 1, STONE_LIT);
    }
    c.globalAlpha = 1;
    for (let y = TOP + 6; y < GROUND; y += 9) for (let x = 4; x < MAIN_R; x += 7) R(c, x, y, 3, 4, '#5e4532');
    R(c, 0, TOP - 3, MAIN_R, 3, '#8a6a4e');
    bulbLine(0, TOP - 2, MAIN_R, TOP - 2, 3);

    // 계단식 기둥 탑 (전구로 그린 작은 직사각형 더미)
    const towers = [6, 70, 134, 196];
    for (const tx of towers) {
      bulbLine(tx, TOP - 2, tx, GROUND - 4, 4);
      bulbLine(tx + 8, TOP - 2, tx + 8, GROUND - 4, 4);
      for (let k = 0; k < 3; k++) {
        const w = 8 - k * 2;
        const x0 = tx + k;
        const y0 = TOP - 8 - k * 7;
        bulbLine(x0, y0, x0 + w, y0, 2);
        bulbLine(x0, y0, x0, y0 + 6, 2);
        bulbLine(x0 + w, y0, x0 + w, y0 + 6, 2);
      }
      bulb(tx + 4, TOP - 30, 2);
    }

    // 오른쪽 패널(70~134, 134~196): 부채꼴 장식 + 층층이 둥근 창
    for (const [px0, px1] of [[78, 134], [142, 196]] as const) {
      const cx = (px0 + px1) / 2;
      bulbArc(cx, TOP + 26, (px1 - px0) / 2 - 2, 20, 3);
      for (let a = 0; a <= 8; a++) {
        const ang = Math.PI + (Math.PI * a) / 8;
        bulbLine(cx, TOP + 26, cx + Math.cos(ang) * ((px1 - px0) / 2 - 6), TOP + 26 + Math.sin(ang) * 16, 4);
      }
      for (let row = 0; row < 3; row++) {
        const wy = TOP + 36 + row * 48;
        for (let wx = px0 + 2; wx + 12 <= px1; wx += 16) {
          bulbArc(wx + 6, wy + 6, 6, 6, 3);
          bulbLine(wx, wy + 6, wx, wy + 38, 4);
          bulbLine(wx + 12, wy + 6, wx + 12, wy + 38, 4);
          bulbLine(wx + 6, wy + 2, wx + 6, wy + 38, 5);
        }
      }
    }

    // 왼쪽 패널(14~70): 리본이 감긴 선물 더미와 작은 관람차·회전목마가 있는 큰 간판
    drawGiftSign(c, r, 14, TOP + 8, 56, 170, bulb);

    // 1층 위 반원 아치 줄
    for (let x = 0; x < MAIN_R; x += 16) bulbArc(x + 8, GROUND - 2, 8, 9, 3);

    // 1층: 낮고 어두운 줄에 빨간 차양, 빛나는 쇼윈도
    R(c, 0, GROUND, MAIN_R, BASE - GROUND, '#2a2018');
    for (let x = 4; x < MAIN_R - 10; x += 26) {
      R(c, x, GROUND + 9, 20, BASE - GROUND - 12, WINDOW);
      glow(c, x + 10, GROUND + 18, 16, '#ffe2b0', 0.3);
      for (let k = 0; k < 20; k += 4) R(c, x + k, GROUND + 4, 4, 5, k % 8 ? AWNING : '#6e262a');
      R(c, x + 3, BASE - 10, 5, 6, RIBBON);
      R(c, x + 12, BASE - 9, 4, 5, '#3f6fb6');
    }

    // 오른쪽 둥근 모서리 동 + 남색 LED 화면 (매 프레임 반짝임)
    for (let x = MAIN_R; x < W; x++) {
      const f = (x - MAIN_R) / (W - MAIN_R);
      R(c, x, TOP + 6, 1, BASE - TOP - 6, mix(STONE_LIT, '#4a3628', f * 0.8));
    }
    bulbLine(MAIN_R, TOP + 4, W, TOP + 10, 3);
    const SX = MAIN_R + 8;
    const SY = TOP + 30;
    const SW = W - SX - 6;
    const SH = 110;
    R(c, SX - 2, SY - 2, SW + 4, SH + 4, '#2a2018');
    R(c, SX, SY, SW, SH, NAVY);
    glow(c, SX + SW / 2, SY + SH / 2, 50, '#6a9ad0', 0.25);

    // 인도와 연석, 볼라드, 난간
    perspFloor(c, { x: 135, y: 250 }, BASE, H, '#4a3f36', '#3e342c', 24);
    R(c, 0, BASE, W, 3, '#6a5c50');
    for (let x = 6; x < W; x += 18) {
      R(c, x, 338, 3, 10, '#15110e');
      R(c, x, 337, 3, 1, '#4a4038');
    }
    R(c, 0, 342, W, 1, '#2a2420');

    // 양쪽 끝의 낮고 넓은 소나무
    for (const px of [10, 42, 224]) drawPine(c, r, px, BASE + 4);

    // 오른쪽 가장자리의 금색 원뿔 트리
    L.push(...drawTree(c, r, {
      cx: 246, base: 352, h: 150, w: 56, tiers: 5, green: '#b8913e', dark: '#8a6a2a',
      orn: ['#fff3c4', '#e8c26a'], ornN: 30, light: ['#fff3c4', '#ffe9a8'], lightN: 110, star: '#ffe9a8', glow: '#e8c26a', glowA: 0.3,
    }));

    drawCrowd(c, r, 352, 0, 270, 30, '#16120e');
    L.push(...drawLamp(c, r, 120, BASE + 2, '#2a2420', 44));

    const animate = (c: Ctx, t: number) => drawScreen(c, t, SX, SY, SW, SH);
    return { lights: L, floor: [14, 372, 256, 462], board: { x: 8, y: 18 }, animate };
  },
};

/** 왼쪽 큰 간판: 크림색 판 위로 빨간 리본이 고리를 그리며 감기고, 아래엔 선물 더미와 관람차·회전목마 */
function drawGiftSign(c: Ctx, r: () => number, x: number, y: number, w: number, h: number, bulb: (x: number, y: number, s?: number) => void): void {
  glow(c, x + w / 2, y + h / 2, 70, '#ffd9a0', 0.25);
  // 머리글 자리: 크림색 띠 두 줄 (글자는 쓰지 않는다)
  R(c, x + 4, y + 8, w - 8, 10, '#f3e6c8');
  R(c, x + 8, y + 22, w - 16, 6, '#f3e6c8');
  // 리본 고리
  for (let a = 0; a < Math.PI * 4.2; a += 0.05) {
    const rx = x + w / 2 + Math.cos(a) * (w / 2 - 4) * (1 - a / 30);
    const ry = y + 14 + a * 9 + Math.sin(a * 2) * 6;
    R(c, rx, ry, 2, 2, RIBBON);
  }
  // 관람차
  const fx = x + 16;
  const fy = y + 70;
  for (let a = 0; a < Math.PI * 2; a += 0.2) bulb(fx + Math.cos(a) * 12, fy + Math.sin(a) * 12);
  for (let a = 0; a < Math.PI; a += Math.PI / 4) line(c, fx - Math.cos(a) * 12, fy - Math.sin(a) * 12, fx + Math.cos(a) * 12, fy + Math.sin(a) * 12, '#c9a14a');
  line(c, fx, fy, fx - 6, fy + 18, '#8a6a2a');
  line(c, fx, fy, fx + 6, fy + 18, '#8a6a2a');
  // 작은 회전목마 지붕(왕관 모양)
  const cx = x + w - 16;
  const cy = y + 88;
  for (let i = 0; i < 8; i++) R(c, cx - i, cy - 8 + i, i * 2 + 1, 1, i % 2 ? RIBBON : '#f3e6c8');
  drawStar(c, cx, cy - 11, '#ffd34d');
  R(c, cx - 8, cy, 16, 10, '#ffcf8a');
  // 선물 더미
  const cols = [RIBBON, '#2f7a52', '#f6c453', '#5b8fd6', '#f3e6c8', RIBBON];
  for (let i = 0; i < 9; i++) {
    const gw = 8 + ((r() * 6) | 0);
    const gh = 7 + ((r() * 6) | 0);
    const gx = x + 2 + ((i * 6) % (w - 12));
    const gy = y + h - 10 - gh - ((i / 3) | 0) * 9;
    R(c, gx, gy, gw, gh, cols[i % cols.length]);
    R(c, gx + (gw >> 1), gy, 1, gh, '#fff3c4');
  }
  // 별과 사탕
  for (const [sx, sy] of [[x + 6, y + 40], [x + w - 8, y + 50], [x + w / 2, y + 58]] as const) drawStar(c, sx, sy, '#ffe066');
  // 간판 둘레 전구
  for (let i = 0; i <= w; i += 4) {
    bulb(x + i, y);
    bulb(x + i, y + h);
  }
  for (let i = 0; i <= h; i += 4) {
    bulb(x, y + i);
    bulb(x + w, y + i);
  }
}

/** 낮고 넓게 퍼진 소나무 실루엣 */
function drawPine(c: Ctx, r: () => number, x: number, base: number): void {
  R(c, x + 10, base - 22, 3, 22, '#2a1f16');
  for (let k = 0; k < 4; k++) {
    const cy = base - 26 - k * 7;
    const hw = 16 - k * 3 + r() * 3;
    for (let dy = -3; dy <= 3; dy++) R(c, x + 11 - hw + Math.abs(dy), cy + dy, (hw - Math.abs(dy)) * 2, 1, k % 2 ? '#372f21' : '#2e2719');
  }
}

/** 오른쪽 LED 화면: 남색 밤하늘에 작은 트리와 캐릭터들, 별이 반짝인다 */
function drawScreen(c: Ctx, t: number, x: number, y: number, w: number, h: number): void {
  R(c, x, y, w, h, NAVY);
  for (let i = 0; i < 14; i++) {
    const sx = x + ((i * 37) % w);
    const sy = y + ((i * 23) % (h / 2));
    if ((Math.sin(t * 2 + i) + 1) / 2 > 0.4) P(c, sx, sy, '#dfe8ff');
  }
  const cx = x + w / 2;
  for (let i = 0; i < 40; i++) R(c, cx - i * 0.4, y + 30 + i * 1.6, i * 0.8 + 1, 2, i % 2 ? '#2f7a52' : '#3b8a5e');
  drawStar(c, cx, y + 28, '#ffe066');
  for (let i = 0; i < 10; i++) {
    const on = Math.floor(t * 3 + i) % 3 !== 0;
    if (on) P(c, cx - 12 + ((i * 7) % 24), y + 50 + ((i * 11) % 40), ['#ff6b6b', '#ffe066', '#7fd1ff'][i % 3]);
  }
  for (const [px, col] of [[x + 6, '#f2a7c0'], [x + w - 12, '#f6d0b2']] as const) {
    const hop = Math.round(Math.abs(Math.sin(t * 3 + px)) * 3);
    R(c, px, y + h - 18 - hop, 6, 6, col);
    R(c, px + 1, y + h - 12 - hop, 4, 6, '#d6334a');
  }
  R(c, x, y + h - 6, w, 6, '#dfe8f4');
  c.globalAlpha = 0.25;
  for (let yy = y; yy < y + h; yy += 2) R(c, x, yy, w, 1, '#000000');
  c.globalAlpha = 1;
}
