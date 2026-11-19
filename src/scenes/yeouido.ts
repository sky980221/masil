// 여의도 더현대 서울: 유리 천장 아래 곡선형 발코니가 층층이 보이는 실내 정원과 유럽풍 마을
import { type Light, type WallPainter, W, H, R, P, mix, hash, pick, vgrad, glow, perspWall, perspFloor, reflect } from '../engine/pixel';
import { drawTree, drawHouseEU } from '../engine/props';
import type { Spot } from './types';

export const yeouido: Spot = {
  key: 'yeouido',
  chip: '여의도 더현대',
  name: '여의도 더현대 서울',
  snow: false,
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 300 };
    const yF = 318;

    // 하늘이 비치는 유리 천장
    vgrad(c, 0, 210, '#7d9cc9', '#f2d2bc');
    R(c, 0, 210, W, 110, '#f0dcc6');
    c.globalAlpha = 0.6;
    for (let x = -300; x <= 570; x += 26) for (let y = 0; y < 128; y++) P(c, x + (vp.x - x) * (y / vp.y), y, '#e4ebf2');
    for (let k = 0; k < 6; k++) for (let X = 0; X < W; X++) P(c, X, 6 + k * 21 + ((X - 135) / 135) ** 2 * -7 + 7, '#e4ebf2');
    c.globalAlpha = 1;
    glow(c, 135, 0, 160, '#ffffff', 0.25);
    R(c, 0, 126, W, 6, '#e9dcc4');
    R(c, 0, 132, W, 1, '#cdb796');

    perspFloor(c, vp, yF, H, '#ece0ca', '#ddcbae', 30);

    // 안쪽 벽의 작은 상점들과 정원수
    R(c, 96, 250, 78, 70, '#efe2cc');
    for (let y = 258; y < 312; y += 13) {
      R(c, 96, y, 78, 1, '#dccaa8');
      for (let x = 99; x < 172; x += 7) {
        R(c, x, y + 3, 5, 7, '#f9e4bf');
        if (r() < 0.5) R(c, x + 1 + ((r() * 3) | 0), y + 6, 1, 3, '#7a6a5a');
      }
    }
    for (let i = 0; i < 9; i++) {
      const tx = 100 + i * 9 + r() * 4;
      const ty = 300 + r() * 8;
      const rr = 6 + r() * 5;
      for (let dy = -rr; dy <= rr; dy++) {
        const hw = Math.sqrt(rr * rr - dy * dy);
        R(c, tx - hw, ty + dy - rr, hw * 2, 1, dy < 0 ? '#4f8a4f' : '#3c7040');
      }
      R(c, tx - 1, ty, 2, 8, '#6b4a32');
    }

    // 양옆 층: 흰 곡선 발코니, 상점, 유리 난간, 난간 위 전구
    const mall: WallPainter = (c, X, s, u, k, ya, yb) => {
      const h = yb - ya;
      const slab = Math.max(1, s * 4);
      const id = Math.floor(u * 2.4);
      const f = u * 2.4 - id;
      R(c, X, ya, 1, h, '#f5e9d6');
      if (f < 0.07) R(c, X, ya, 1, h, '#ddcdb2');
      else {
        R(c, X, ya + slab + h * 0.08, 1, h * 0.12, mix('#c9a46a', '#8a6a4a', (hash(id + k * 13) % 4) / 4));
        R(c, X, ya + slab + h * 0.22, 1, h * 0.45, mix('#fbe7c3', '#f2d3a0', (hash(id * 3 + k) % 3) / 3));
      }
      const wob = Math.sin(u * 2.4 + k * 1.3) * s * 3;
      R(c, X, ya + wob, 1, slab + 1, '#fbf8f2');
      R(c, X, ya + wob + slab + 1, 1, 1, '#d8ccb6');
      c.globalAlpha = 0.45;
      R(c, X, yb - h * 0.3, 1, h * 0.3, '#cfe3ea');
      c.globalAlpha = 1;
      R(c, X, yb - h * 0.3, 1, 1, '#b9a68a');
      if (k > 0 && f > 0.3 && f < 0.33 && hash(id * 7 + k) % 3 === 0) R(c, X, yb - h * 0.45, 1, h * 0.15, '#5a4a5a');
      if (Math.floor(u * 9) !== Math.floor((u + 0.02) * 9) && k < 3) {
        c.globalAlpha = 0.6;
        P(c, X, yb - h * 0.3 - 1, '#4f8a4f');
        c.globalAlpha = 1;
        L.push({ x: X, y: Math.round(yb - h * 0.3 - 1), col: '#ffe7a3', s: 1 + s * 2, p: u * 5 });
      }
    };
    perspWall(c, 'L', vp, 100, 132, 360, 4, mall);
    perspWall(c, 'R', vp, 100, 132, 360, 4, mall);

    // 천장을 가로지르는 갈랜드와 매달린 오너먼트
    for (let k = 0; k < 3; k++) {
      const y0 = 150 + k * 12;
      for (let x = 0; x < W; x++) {
        const y = y0 + Math.sin((x / W) * Math.PI) * 16 + Math.sin(x / 14 + k) * 2;
        P(c, x, y, '#4f7a4a');
        if (x % 6 === 0) L.push({ x, y: Math.round(y + 1), col: pick(r, ['#ffe7a3', '#fff6dc']), s: 1.5 + r() * 2, p: r() * 7 });
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = (20 + i * 24 + r() * 8) | 0;
      const len = (10 + r() * 28) | 0;
      const col = pick(r, ['#d6334a', '#f2c14e', '#5b8fd6', '#ffffff']);
      R(c, x, 132, 1, len, '#b8a58a');
      R(c, x - 2, 132 + len, 5, 5, col);
      P(c, x - 1, 133 + len, 'rgba(255,255,255,.75)');
    }

    L.push(...drawTree(c, r, {
      cx: 135, base: 316, h: 200, w: 150, tiers: 5, green: '#2f6b4f', dark: '#24563f',
      orn: ['#d6334a', '#f2c14e', '#ffffff'], ornN: 70, light: ['#fff2c4', '#ffd27a'], lightN: 130,
      star: '#ffd34d', garland: '#f2c14e', gifts: ['#d6334a', '#2f7a52', '#f6c453', '#5b8fd6'],
    }));
    L.push(...drawHouseEU(c, r, 40, 352, 26, 24, '#cfe3d0', '#3f6f55'));
    L.push(...drawHouseEU(c, r, 4, 372, 34, 30, '#f6c6c6', '#9a3a3a'));
    L.push(...drawHouseEU(c, r, 204, 352, 26, 24, '#d7d1f0', '#5a4f8f'));
    L.push(...drawHouseEU(c, r, 232, 372, 34, 30, '#fbe3b0', '#a8623a'));
    reflect(c, 333, 110, 0.12);
    return { lights: L, floor: [14, 378, 256, 462], board: { x: 12, y: 140, hang: true } };
  },
};
