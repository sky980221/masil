// 명동 롯데백화점: 조명으로 덮인 백화점 외벽, 쇼윈도, 입구 앞 빛 터널, 전구 감은 가로수
import { type Light, W, H, R, P, vgrad, glow, perspFloor } from '../engine/pixel';
import { drawLamp, drawLightTree, drawCrowd } from '../engine/props';
import type { Spot } from './types';

export const myeongdong: Spot = {
  key: 'myeongdong',
  chip: '명동 롯데백화점',
  name: '명동 롯데백화점',
  snow: true,
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 250 };
    const warm = '#fff1c8';
    const ice = '#d6ecff';
    const dot = (x: number, y: number, col: string, a: number) => {
      c.globalAlpha = a;
      P(c, x, y, col);
      c.globalAlpha = 1;
    };

    vgrad(c, 0, 60, '#0b0a1c', '#1d1736');
    R(c, 0, 60, W, 250, '#1d1736');

    // 건물 외벽: 돌 벽, 층 사이 띠, 기둥, 창문
    R(c, 6, 34, 258, 276, '#3a3142');
    for (const y of [34, 96, 158, 220]) R(c, 6, y, 258, 4, '#4d4258');
    for (let x = 6; x < 264; x += 43) R(c, x, 34, 5, 192, '#463c50');
    for (let y = 42; y < 218; y += 12) {
      for (let x = 13; x < 262; x += 7) {
        if ((x - 6) % 43 < 6) continue;
        R(c, x, y, 4, 8, r() < 0.15 ? '#4a3a2e' : '#251d2c');
      }
    }
    // 옥상 테두리 전구와 기둥 사이 전구 커튼
    for (let x = 8; x < 263; x += 3) {
      P(c, x, 33, warm);
      L.push({ x, y: 33, col: warm, s: 1.2 + r(), p: x * 0.2 });
    }
    for (let b = 0; b < 6; b++) {
      const bx = 11 + b * 43;
      for (let s = 0; s < 5; s++) {
        const sx = bx + 3 + s * 7;
        for (let y = 42; y < 214; y += 4) {
          dot(sx, y, warm, 0.35);
          if ((y + s * 4 + b) % 12 === 0) L.push({ x: sx, y, col: warm, s: 0.6 + r(), p: y * 0.05 + s });
        }
      }
    }
    // 가운데 눈꽃 장식
    const mx = 135;
    const my = 126;
    R(c, mx - 42, my - 42, 84, 84, '#2a2232');
    glow(c, mx, my, 60, '#9fd0ff', 0.25);
    for (let a = 0; a < Math.PI * 2; a += 0.09) {
      for (const rr of [38, 34]) {
        const x = Math.round(mx + Math.cos(a) * rr);
        const y = Math.round(my + Math.sin(a) * rr);
        dot(x, y, ice, 0.4);
        L.push({ x, y, col: ice, s: 1.5, p: a * 4 + rr });
      }
    }
    for (let a = 0; a < 6; a++) {
      const t = (a * Math.PI) / 3 - Math.PI / 2;
      for (let d = 0; d <= 30; d += 2) {
        const x = Math.round(mx + Math.cos(t) * d);
        const y = Math.round(my + Math.sin(t) * d);
        dot(x, y, ice, 0.5);
        L.push({ x, y, col: ice, s: 1.2, p: d * 0.12 });
      }
      for (const d of [14, 24]) {
        for (const sg of [-0.7, 0.7]) {
          for (let e = 2; e <= 7; e += 2) {
            const bx = mx + Math.cos(t) * d;
            const by = my + Math.sin(t) * d;
            const x = Math.round(bx + Math.cos(t + sg) * e);
            const y = Math.round(by + Math.sin(t + sg) * e);
            dot(x, y, ice, 0.5);
            L.push({ x, y, col: ice, s: 1.2, p: (d + e) * 0.12 });
          }
        }
      }
    }

    // 1층 쇼윈도와 입구
    R(c, 6, 226, 258, 84, '#2f2836');
    R(c, 6, 226, 258, 3, '#5a4e66');
    for (const wx of [14, 62, 186, 234]) {
      R(c, wx, 240, 30, 52, '#ffcf8a');
      glow(c, wx + 15, 266, 30, '#ffcf7a', 0.35);
      R(c, wx, 240, 30, 2, '#c98a3a');
      for (let k = 0; k < 3; k++) {
        const tx = wx + 6 + k * 9;
        R(c, tx, 282 - (k % 2) * 4, 1, 6, '#5a3a24');
        for (let i = 0; i < 8; i++) R(c, tx - i / 2, 274 - (k % 2) * 4 + i, i + 1, 1, '#2f7a52');
      }
      R(c, wx + 2, 286, 8, 6, '#d6334a');
      R(c, wx + 20, 287, 7, 5, '#3f6fb6');
    }
    R(c, 104, 236, 62, 74, '#4a3a2a');
    R(c, 108, 244, 54, 66, '#ffd99a');
    glow(c, 135, 280, 40, '#ffcf7a', 0.45);
    for (let i = 0; i < 14; i++) R(c, 104 + i, 236 - i * 0.6, 62 - i * 2, 1, '#5a4a3a');
    for (let a = 0; a < Math.PI * 2; a += 0.18) {
      P(c, 135 + Math.cos(a) * 9, 232 + Math.sin(a) * 9, '#2f7a52');
      P(c, 135 + Math.cos(a) * 8, 232 + Math.sin(a) * 8, '#24563f');
      P(c, 135 + Math.cos(a) * 10, 232 + Math.sin(a) * 10, '#24563f');
    }
    R(c, 132, 239, 3, 3, '#e2333f');
    R(c, 136, 239, 3, 3, '#e2333f');
    for (let x = 6; x < 264; x++) {
      const y = 228 + Math.round(Math.abs(Math.sin((x - 6) / 10.75)) * 5);
      P(c, x, y, '#2f6b4f');
      P(c, x, y + 1, '#24563f');
    }

    // 인도와 광장
    R(c, 0, 310, W, 22, '#3a3644');
    R(c, 0, 331, W, 1, '#55506a');
    perspFloor(c, vp, 332, H, '#2c2a35', '#36333f', 24);
    for (let i = 0; i < 60; i++) {
      c.globalAlpha = 0.2 + r() * 0.3;
      R(c, r() * W, 333 + r() * 147, 2 + r() * 5, 1, '#dfe6f4');
    }
    c.globalAlpha = 1;
    L.push(...drawLightTree(c, r, 24, 338, 110), ...drawLightTree(c, r, 246, 338, 110));
    L.push(...drawLamp(c, r, 66, 332, '#4a4458', 46), ...drawLamp(c, r, 204, 332, '#4a4458', 46));
    drawCrowd(c, r, 318, 60, 210, 14, '#1a1724');

    // 입구 앞 빛 터널 (먼 아치부터)
    const arches: [number, number][] = [[338, 44], [350, 54], [366, 66], [388, 82]];
    arches.forEach(([by, rx], k) => {
      const ry = rx * 1.2;
      R(c, 135 - rx - 1, by - ry * 0.15, 2, ry * 0.15, '#5a5068');
      R(c, 135 + rx - 1, by - ry * 0.15, 2, ry * 0.15, '#5a5068');
      for (let a = 0; a <= Math.PI + 0.001; a += 1.6 / rx) {
        const x = Math.round(135 + Math.cos(a) * rx);
        const y = Math.round(by - ry * 0.15 - Math.sin(a) * ry * 0.85);
        dot(x, y, ice, 0.6);
        L.push({ x, y, col: ice, s: 1.6, p: a * 3 + k });
      }
    });
    return { lights: L, floor: [14, 372, 256, 462], board: { x: 186, y: 44 } };
  },
};
