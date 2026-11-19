// 영종 파라다이스시티 플라자: 높은 실내 광장. 어두운 슬랫 천장과 유리 띠, 베이지 석조 아케이드,
// 빨간 기차역 건물 위에 선 트리, 공중 와이어를 타고 트리 둘레를 도는 장난감 기차, 빨강·크림 마켓 부스.
import { type Ctx, type Light, type WallPainter, W, H, R, P, mix, hash, vgrad, glow, line, perspWall, perspFloor } from '../engine/pixel';
import { drawTree, drawChalet } from '../engine/props';
import type { Spot, TrainTrack } from './types';

const RED = '#c8202a';
const RED_D = '#8e1418';
const CREAM = '#f3e6c8';
const GOLD = '#d9a441';
const STONE = '#c9b49a';
const STONE_D = '#a8927a';
const BULB = '#ffe9a8';

export const yeongjong: Spot = {
  key: 'yeongjong',
  chip: '영종 파라다이스시티',
  name: '영종 파라다이스시티',
  snow: false,
  night: { color: '#1a1208', alpha: 0.12 },
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 300 };

    // 높고 비스듬한 슬랫 천장 + 유리 띠
    vgrad(c, 0, 120, '#1f1e22', '#3a383d', 6);
    for (let x = -200; x <= 470; x += 9) line(c, x, 0, x + (vp.x - x) * 0.36, 112, '#2b2a2e');
    R(c, 0, 104, W, 14, '#c9d6df');
    for (let x = 0; x < W; x += 12) R(c, x, 104, 1, 14, '#8b98a3');
    R(c, 0, 117, W, 2, '#5d5a58');
    glow(c, 135, 110, 120, '#ffffff', 0.12);
    // 천장에 매달린 각진 거울 패널
    for (let y = 22; y < 74; y++) R(c, 182 - (y - 22) * 0.5, y, 30 + (y - 22) * 0.9, 1, mix('#cfd3d8', '#7f858c', (y - 22) / 52));

    // 안쪽: 유리 커튼월
    R(c, 88, 118, 94, 210, '#4a5562');
    for (let x = 88; x < 182; x += 8) R(c, x, 118, 1, 210, '#2f3843');
    for (let y = 118; y < 328; y += 14) R(c, 88, y, 94, 1, '#2f3843');
    c.globalAlpha = 0.35;
    for (let i = 0; i < 40; i++) R(c, 89 + ((r() * 11) | 0) * 8, 119 + ((r() * 14) | 0) * 14, 7, 13, r() < 0.5 ? '#ffd98a' : '#8fa3b6');
    c.globalAlpha = 1;

    // 무광 베이지 돌바닥 + 큰 마름모 무늬
    perspFloor(c, vp, 318, H, '#d8cbb8', '#c6b7a1', 26);
    for (let x = -W; x <= W * 2; x += 52) {
      for (let y = 318; y < H; y++) {
        const t = (y - vp.y) / (H - vp.y);
        P(c, vp.x + (x - vp.x) * t + (y - 318) * 0.9, y, '#c2b39b');
      }
    }

    // 양옆: 석조 건물. 1층은 둥근 아치 아케이드, 위층은 높고 어두운 창 격자
    const facade: WallPainter = (c, X, s, u, k, ya, yb) => {
      const h = yb - ya;
      const id = Math.floor(u * 2.6);
      const f = u * 2.6 - id;
      R(c, X, ya, 1, h, mix(STONE, STONE_D, (1 - s) * 0.6));
      R(c, X, ya, 1, Math.max(1, s * 2), '#dcc9ad');
      if (k < 3) {
        if (f > 0.25 && f < 0.75) R(c, X, ya + h * 0.18, 1, h * 0.62, '#3a3540');
      } else if (f > 0.12 && f < 0.88) {
        const arc = Math.sqrt(1 - ((f - 0.5) / 0.38) ** 2);
        const top = ya + h * (0.5 - 0.35 * arc);
        R(c, X, top, 1, yb - top, '#ffcf8a');
        R(c, X, top, 1, 1, '#b9a07c');
        if (hash(id * 13 + Math.floor(f * 10)) % 5 === 0) R(c, X, yb - h * 0.3, 1, h * 0.3, '#7a4a2a');
      }
      if (k === 3 && Math.floor(u * 10) !== Math.floor((u + 0.02) * 10)) L.push({ x: X, y: Math.round(ya + h * 0.12), col: BULB, s: 1.5, p: u * 6 });
    };
    perspWall(c, 'L', vp, 88, 112, 382, 4, facade);
    perspWall(c, 'R', vp, 88, 112, 382, 4, facade);
    glow(c, 40, 340, 60, '#ffcf7a', 0.2);
    glow(c, 230, 340, 60, '#ffcf7a', 0.2);

    // 트리에서 벽으로 늘어진 전구 줄
    const swags: [number, number][] = [[0, 200], [270, 200], [20, 150], [250, 150]];
    for (const [ex, ey] of swags) {
      for (let t = 0.05; t <= 1; t += 0.03) {
        const x = Math.round(135 + (ex - 135) * t);
        const y = Math.round(96 + (ey - 96) * t + Math.sin(t * Math.PI) * 22);
        c.globalAlpha = 0.35;
        P(c, x, y, BULB);
        c.globalAlpha = 1;
        L.push({ x, y, col: BULB, s: 1 + r(), p: r() * 7 });
      }
    }

    // 섬 모양의 낮은 단
    for (let dy = 0; dy < 16; dy++) {
      const hw = 96 * Math.sqrt(Math.max(0, 1 - ((dy - 8) / 8.5) ** 2));
      R(c, 135 - hw, 318 + dy, hw * 2, 1, dy < 3 ? '#e4d8c4' : '#b9a78f');
    }

    // 빨간 기차역 건물 (트리 받침)
    const bx = 93;
    const bw = 84;
    const by = 264;
    R(c, bx, by, bw, 318 - by, RED);
    R(c, bx + bw - 10, by, 10, 318 - by, RED_D);
    R(c, bx - 3, by - 4, bw + 6, 5, CREAM);
    R(c, bx - 3, by - 5, bw + 6, 1, GOLD);
    for (const px of [bx, bx + 20, bx + bw - 24, bx + bw - 4]) R(c, px, by + 1, 4, 318 - by - 1, CREAM);
    const ax = bx + bw / 2;
    for (let dy = 0; dy < 16; dy++) {
      const hw = Math.round(Math.sqrt(256 - (16 - dy) ** 2) * 0.95);
      R(c, ax - hw, by + 10 + dy, hw * 2, 1, dy < 8 ? '#ffe2a6' : '#ffcf8a');
    }
    R(c, ax - 15, by + 26, 30, 318 - by - 26, '#ffcf8a');
    for (let a = 0; a < Math.PI + 0.01; a += Math.PI / 6) line(c, ax, by + 26, ax + Math.cos(a) * 14, by + 26 - Math.sin(a) * 14, GOLD);
    R(c, ax - 16, by + 26, 32, 1, GOLD);
    glow(c, ax, by + 36, 30, '#ffcf7a', 0.4);
    for (const wx of [bx + 7, bx + bw - 16]) {
      R(c, wx, by + 18, 9, 20, '#ffd98a');
      R(c, wx + 1, by + 16, 7, 2, '#ffd98a');
      R(c, wx + 4, by + 16, 1, 22, GOLD);
    }
    // 시계
    for (let dy = -5; dy <= 5; dy++) {
      const hw = Math.round(Math.sqrt(25 - dy * dy));
      R(c, ax - hw, by - 12 + dy, hw * 2 + 1, 1, CREAM);
    }
    P(c, ax, by - 15, RED_D);
    P(c, ax, by - 14, RED_D);
    P(c, ax + 1, by - 12, RED_D);
    P(c, ax + 2, by - 12, RED_D);
    R(c, ax - 6, by - 18, 13, 1, GOLD);

    // 트리: 좁고 높은 원뿔, 따뜻한 흰 전구, 빨간 공과 리본, 금색 별
    L.push(...drawTree(c, r, {
      cx: 135, base: by - 18, h: 168, w: 96, tiers: 6, green: '#2f4a2c', dark: '#1e3320',
      orn: [RED, RED, RED_D, GOLD], ornN: 80, light: [BULB, '#fff6dc'], lightN: 160,
      star: '#f2c14e', garland: RED, glow: '#ffd98a', glowA: 0.22, trunk: '#3a2a1a', pot: RED_D, potTop: GOLD,
    }));

    // 단 주변의 작은 트리들
    const minis: [number, number, number][] = [[62, 332, 34], [208, 332, 34], [44, 342, 26], [226, 342, 26], [80, 338, 22], [190, 338, 22]];
    for (const [x, y, h] of minis) {
      L.push(...drawTree(c, r, { cx: x, base: y - 10, h, w: h * 0.62, tiers: 3, green: '#2f4a2c', dark: '#1e3320', orn: [RED], ornN: 6, light: [BULB], lightN: 12, glowA: 0.06 }));
    }

    // 빨강·크림 마켓 부스와 산타·사슴 인형
    L.push(...drawChalet(c, r, 6, 372, 44, 30, RED));
    L.push(...drawChalet(c, r, 220, 372, 44, 30, RED));
    drawSanta(c, 58, 372);
    drawDeer(c, 206, 372);

    // 트리 둘레 공중 와이어 두 줄 (기차는 매 프레임 따로 그린다)
    const tracks: TrainTrack[] = [
      { cx: 135, cy: 196, rx: 66, ry: 9, speed: 1.1, phase: 0.2, cars: 3 },
      { cx: 135, cy: 248, rx: 84, ry: 11, speed: 0.8, phase: 0.9, cars: 4 },
    ];
    c.globalAlpha = 0.5;
    for (const T of tracks) for (let a = 0; a < Math.PI; a += 0.01) P(c, T.cx + Math.cos(a) * T.rx, T.cy + Math.sin(a) * T.ry, '#5a4a3a');
    c.globalAlpha = 1;
    return { lights: L, floor: [14, 380, 256, 462], trains: tracks, board: { x: 12, y: 132, hang: true } };
  },
};

function drawSanta(c: Ctx, x: number, base: number): void {
  R(c, x - 5, base - 14, 10, 12, RED);
  R(c, x - 5, base - 6, 10, 1, '#2a2228');
  R(c, x - 5, base - 3, 10, 1, '#ffffff');
  R(c, x - 3, base - 20, 6, 6, '#f6d0b2');
  R(c, x - 4, base - 16, 8, 4, '#ffffff');
  R(c, x - 4, base - 23, 8, 3, RED);
  R(c, x - 4, base - 21, 8, 1, '#ffffff');
  P(c, x + 4, base - 24, '#ffffff');
  R(c, x - 4, base - 2, 3, 2, '#2a2228');
  R(c, x + 1, base - 2, 3, 2, '#2a2228');
}

function drawDeer(c: Ctx, x: number, base: number): void {
  const B = '#a8743a';
  R(c, x - 6, base - 12, 12, 5, B);
  for (const lx of [x - 5, x - 2, x + 2, x + 4]) R(c, lx, base - 7, 1, 7, '#7a5226');
  R(c, x + 4, base - 18, 4, 6, B);
  R(c, x + 6, base - 17, 3, 3, B);
  P(c, x + 8, base - 16, '#2a1f2b');
  line(c, x + 5, base - 18, x + 3, base - 23, '#7a5226');
  line(c, x + 7, base - 18, x + 9, base - 23, '#7a5226');
  P(c, x + 2, base - 22, '#7a5226');
  P(c, x + 10, base - 22, '#7a5226');
  R(c, x - 6, base - 12, 12, 1, mix(B, '#ffffff', 0.2));
}
