// 영종 파라다이스시티: 돔 천장 아래 상점가, 아치 창의 전구 커튼, 트리를 도는 장난감 기차
import { type Light, type WallPainter, H, R, P, mix, hash, vgrad, glow, line, perspWall, perspFloor, reflect } from '../engine/pixel';
import { drawTree, drawChalet, drawStar } from '../engine/props';
import type { Spot, TrainTrack } from './types';

export const yeongjong: Spot = {
  key: 'yeongjong',
  chip: '영종 파라다이스시티',
  name: '영종 파라다이스시티',
  snow: false,
  night: { color: '#160d30', alpha: 0.22 },
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 300 };

    // 돔 천장
    vgrad(c, 0, 260, '#1a1233', '#40306a');
    c.globalAlpha = 0.35;
    for (let rr = 110; rr <= 330; rr += 28) for (let a = 0; a < Math.PI; a += 0.004) P(c, 135 + Math.cos(a) * rr * 1.3, -70 + Math.sin(a) * rr, '#8a7ab8');
    for (let a = 0.15; a < Math.PI; a += 0.2) line(c, 135, -70, 135 + Math.cos(a) * 420, -70 + Math.sin(a) * 330, '#8a7ab8');
    c.globalAlpha = 1;
    glow(c, 135, 40, 120, '#c9b6ff', 0.18);

    // 안쪽 벽: 아치 창과 전구 커튼, 금색 기둥
    R(c, 84, 120, 102, 200, '#2f2452');
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 32;
      const cx = x + 12;
      const y0 = 134;
      for (let dy = 0; dy < 12; dy++) {
        const hw = Math.round(Math.sqrt(144 - (12 - dy) ** 2));
        R(c, cx - hw, y0 + dy, hw * 2, 1, '#5b4a8f');
      }
      R(c, x, y0 + 12, 24, 150, '#5b4a8f');
      R(c, cx, y0, 1, 162, '#3b2d66');
      for (let s = 0; s < 4; s++) {
        for (let y = y0 + 4 + s * 2; y < y0 + 160; y += 6) {
          const lx = x + 3 + s * 6;
          c.globalAlpha = 0.3;
          P(c, lx, y, '#ffe6f4');
          c.globalAlpha = 1;
          L.push({ x: lx, y, col: '#ffe6f4', s: 0.8 + r(), p: y * 0.2 + s });
        }
      }
    }
    for (let x = 84; x < 186; x += 34) R(c, x, 120, 4, 200, '#c9a14a');

    perspFloor(c, vp, 316, H, '#ddd3ea', '#cec2de', 28);

    // 양옆 상점가
    const shop: WallPainter = (c, X, s, u, k, ya, yb) => {
      const h = yb - ya;
      const id = Math.floor(u * 2);
      const f = u * 2 - id;
      R(c, X, ya, 1, h, '#3b2d66');
      if (f < 0.09) {
        R(c, X, ya, 1, h, '#c9a14a');
        R(c, X, ya, 1, 1, '#f6dc9a');
        return;
      }
      R(c, X, ya + h * 0.18, 1, h * 0.08, mix('#e8436a', '#5b8fd6', (hash(id + k * 7) % 3) / 2));
      R(c, X, ya + h * 0.3, 1, h * 0.62, mix('#ffcf8a', '#ff9ad5', (hash(id * 5 + k) % 4) / 6));
      if (hash(id * 9 + k) % 2 && f > 0.4 && f < 0.5) R(c, X, ya + h * 0.55, 1, h * 0.37, '#5a3f6e');
      R(c, X, yb - 1, 1, 1, '#c9a14a');
      if (Math.floor(u * 12) !== Math.floor((u + 0.015 / s) * 12)) L.push({ x: X, y: Math.round(ya + h * 0.16), col: '#fff2b0', s: 2, p: u * 9 + k });
    };
    perspWall(c, 'L', vp, 84, 70, 382, 2, shop);
    perspWall(c, 'R', vp, 84, 70, 382, 2, shop);

    // 매달린 별
    for (let i = 0; i < 12; i++) {
      const x = (14 + i * 22 + r() * 6) | 0;
      const len = (14 + r() * 50) | 0;
      R(c, x, 0, 1, len, '#8a7ab8');
      drawStar(c, x, len + 4, '#ffd34d', true);
      glow(c, x, len + 4, 10, '#ffe08a', 0.35);
      L.push({ x, y: len + 4, col: '#fff7c2', s: 1 + r() * 2, p: r() * 7, big: true });
    }

    // 기차 선로
    const T: TrainTrack = { cx: 135, cy: 346, rx: 118, ry: 20 };
    for (let a = 0; a < Math.PI * 2; a += 0.12) R(c, T.cx + Math.cos(a) * T.rx - 2, T.cy + Math.sin(a) * T.ry - 1, 5, 4, '#9a7e62');
    for (let a = 0; a < Math.PI * 2; a += 0.005) {
      const x = T.cx + Math.cos(a) * T.rx;
      const y = T.cy + Math.sin(a) * T.ry;
      P(c, x, y - 1, '#6b5a4a');
      P(c, x, y + 2, '#6b5a4a');
    }

    L.push(...drawChalet(c, r, 4, 356, 42, 30, '#5b8fd6'));
    L.push(...drawChalet(c, r, 224, 356, 42, 30, '#e8436a'));
    L.push(...drawTree(c, r, {
      cx: 135, base: 316, h: 205, w: 146, tiers: 5, green: '#2e6a52', dark: '#225440',
      orn: ['#e8436a', '#ffd34d', '#ffffff', '#b48cff'], ornN: 70, light: ['#ffe9a8', '#ff9ad5'], lightN: 130,
      star: '#ffd34d', pot: '#5b4a8f', garland: '#ffd34d', gifts: ['#e8436a', '#5b8fd6', '#ffd34d', '#b48cff'],
      glow: '#ffb3e0', glowA: 0.2,
    }));
    reflect(c, 331, 110, 0.16);
    return { lights: L, floor: [14, 380, 256, 462], train: T, board: { x: 12, y: 84, hang: true } };
  },
};
