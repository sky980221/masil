// 삼성 별마당 도서관: 양옆으로 높이 솟은 책장 사이의 하얀 트리
import { type Light, type WallPainter, W, H, R, P, hash, pick, vgrad, glow, perspWall, perspFloor, reflect, BOOK } from '../engine/pixel';
import { drawTree } from '../engine/props';
import type { Spot } from './types';

export const starfield: Spot = {
  key: 'starfield',
  chip: '삼성 별마당',
  name: '삼성 별마당 도서관',
  snow: false,
  night: { color: '#1a1008', alpha: 0.14 },
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 250 };

    // 채광창
    vgrad(c, 0, 90, '#fff8e4', '#e9d9b9');
    c.globalAlpha = 0.5;
    for (let x = 0; x < W; x += 18) R(c, x, 0, 1, 60, '#d8c6a0');
    for (let y = 0; y < 60; y += 10) R(c, 0, y, W, 1, '#d8c6a0');
    c.globalAlpha = 1;
    glow(c, 135, 10, 140, '#ffffff', 0.35);

    // 멀리 보이는 안쪽 책장
    R(c, 60, 52, 150, 260, '#2a1d17');
    for (let y = 60; y < 304; y += 9) {
      for (let x = 62; x < 208;) {
        const bw = 1 + (r() < 0.3 ? 1 : 0);
        const bh = 6 + ((r() * 2) | 0);
        R(c, x, y + 8 - bh, bw, bh, pick(r, BOOK));
        x += bw + (r() < 0.1 ? 1 : 0);
      }
      R(c, 60, y + 8, 150, 1, '#5a3e2a');
    }
    c.globalAlpha = 0.4;
    R(c, 60, 52, 150, 260, '#2a1d17');
    c.globalAlpha = 1;
    R(c, 60, 50, 150, 3, '#6b4a32');

    perspFloor(c, vp, 300, H, '#b8956d', '#a5825c', 20);

    // 열람 테이블과 스탠드
    R(c, 92, 300, 86, 3, '#6b4a32');
    R(c, 96, 303, 2, 10, '#5a3e2a');
    R(c, 172, 303, 2, 10, '#5a3e2a');
    for (const lx of [104, 134, 164]) {
      R(c, lx, 294, 1, 6, '#3a2c20');
      R(c, lx - 2, 292, 5, 2, '#2f5a3a');
      glow(c, lx, 295, 10, '#ffe2a0', 0.5);
      L.push({ x: lx, y:294, col: '#fff3c4', s: 0.5, p: lx, big: true });
    }

    // 양옆 대형 책장 (원근)
    const books: WallPainter = (c, X, s, u, k, ya, yb) => {
      const h = yb - ya;
      const sh = Math.max(1, Math.round(s * 2.6));
      const v = u * 16 + k * 3.7;
      const id = Math.floor(v);
      const f = v - id;
      const hh = hash(id * 31 + k * 17);
      R(c, X, ya, 1, h, '#3a281c');
      if (Math.floor(u * 1.6) !== Math.floor((u + 0.012 / s) * 1.6)) {
        R(c, X, ya, 1, h, '#7a5538');
        return;
      }
      if (f > 0.1) {
        const gap = ((hh % 4) / 10) * (h - sh);
        R(c, X, ya + gap + 1, 1, h - gap - sh - 1, BOOK[hh % BOOK.length]);
        if (hh % 5 === 0) P(c, X, ya + gap + 2 + (h - gap) * 0.25, '#e8d9b0');
        if (hh % 7 === 0) P(c, X, ya + gap + 2 + (h - gap) * 0.6, '#e8d9b0');
      }
      R(c, X, yb - sh, 1, sh, '#7a5538');
      c.globalAlpha = Math.min(0.6, (1 - s) * 0.75);
      R(c, X, ya, 1, h, '#1a120d');
      c.globalAlpha = 1;
    };
    perspWall(c, 'L', vp, 78, -70, 384, 22, books);
    perspWall(c, 'R', vp, 78, -70, 384, 22, books);

    // 천장에서 내려오는 전구
    for (let i = 0; i < 9; i++) {
      const x = (70 + i * 16 + r() * 6) | 0;
      const len = (20 + r() * 50) | 0;
      R(c, x, 0, 1, len, '#5a3e2a');
      R(c, x - 1, len, 3, 4, '#ffe9a8');
      glow(c, x, len + 2, 12, '#ffd98a', 0.5);
      L.push({ x, y: len + 2, col: '#fff7da', s: 0.4, p: r() * 7, big: true });
    }

    L.push(...drawTree(c, r, {
      cx: 135, base: 316, h: 250, w: 126, tiers: 6, green: '#e8eef0', dark: '#c3ced4',
      orn: ['#c9a14a', '#e6c66a', '#9fb8c9'], ornN: 80, light: ['#ffe9a8', '#ffffff'], lightN: 140,
      star: '#ffe28a', trunk: '#8a6a4a', pot: '#2f4a6a', potTop: '#c9a14a', garland: '#c9a14a',
      gifts: ['#2f4a6a', '#c9a14a', '#8c3b4f'], glow: '#fff2c8', glowA: 0.18,
    }));
    reflect(c, 331, 120, 0.1);
    return { lights: L, floor: [14, 372, 256, 462], board: { x: 12, y: 92, hang: true } };
  },
};
