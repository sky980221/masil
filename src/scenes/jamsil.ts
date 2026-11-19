// 잠실 롯데월드몰: 롯데월드타워를 등진 야외 광장, 호수, 회전목마와 마켓 부스
import { type Light, W, H, R, P, pick, vgrad, glow, perspFloor } from '../engine/pixel';
import { drawTree, drawChalet, drawCarousel, drawLamp, drawCrowd } from '../engine/props';
import type { Spot } from './types';

export const jamsil: Spot = {
  key: 'jamsil',
  chip: '잠실 롯데월드몰',
  name: '잠실 롯데월드몰',
  snow: true,
  night: { color: '#070b26', alpha: 0.42 },
  crowd: { y: 300, x0: 0, x1: 270, n: 10, col: '#1b1f33' },
  build(c, r) {
    const L: Light[] = [];
    const vp = { x: 135, y: 240 };

    // 밤하늘, 별, 옅은 구름
    vgrad(c, 0, 262, '#060a1f', '#2c3062');
    for (let i = 0; i < 70; i++) {
      c.globalAlpha = 0.3 + r() * 0.6;
      P(c, r() * W, r() * 170, '#ffffff');
    }
    for (let i = 0; i < 5; i++) {
      c.globalAlpha = 0.05;
      const cx = r() * W;
      const cy = 40 + r() * 120;
      for (let k = 0; k < 4; k++) R(c, cx - 30 + k * 8, cy - k * 2, 50 - k * 6, 6, '#9aa4d8');
    }
    c.globalAlpha = 1;

    // 먼 도시 스카이라인
    for (let x = 0; x < W;) {
      const bw = 10 + ((r() * 16) | 0);
      const bh = 12 + ((r() * 30) | 0);
      if (!(x > 164 && x < 226)) {
        R(c, x, 262 - bh, bw, bh, '#151b3d');
        for (let k = 0; k < (bw * bh) / 30; k++) {
          c.globalAlpha = 0.6;
          P(c, x + 1 + r() * (bw - 2), 262 - bh + 2 + r() * (bh - 3), pick(r, ['#ffe9a0', '#ffffff', '#ffcf7a']));
        }
        c.globalAlpha = 1;
      }
      x += bw + 1;
    }

    // 타워: 위로 갈수록 가늘어지는 유리 외벽과 왕관 모양 꼭대기
    const TX = 194;
    const tw = (y: number) => 10 + 36 * Math.pow(Math.max(0, y - 20) / 242, 1.3);
    glow(c, TX, 120, 70, '#7f8fd6', 0.12);
    for (let y = 20; y < 262; y++) {
      const w = tw(y);
      R(c, TX - w / 2, y, w, 1, '#28325f');
      R(c, TX - w / 2, y, w * 0.3, 1, '#36427a');
      R(c, TX + w * 0.2, y, w * 0.3, 1, '#1d2550');
      for (let m = -w / 2 + 3; m < w / 2; m += 3) P(c, TX + m, y, '#222b54');
    }
    for (let i = 0; i < 120; i++) {
      const y = (26 + r() * 234) | 0;
      const w = tw(y);
      c.globalAlpha = 0.4 + r() * 0.4;
      P(c, Math.round(TX - w / 2 + 1 + r() * (w - 2)), y, '#ffe9a0');
    }
    c.globalAlpha = 1;
    for (let y = 4; y < 20; y++) {
      const w = 4 + (20 - y) * 0.15;
      P(c, TX - w, y, '#5a66a0');
      P(c, TX + w, y, '#5a66a0');
      if (y % 3 === 0) R(c, TX - w, y, w * 2, 1, '#3a4580');
    }
    L.push({ x: TX, y: 3, col: '#ff5a5a', s: 3, p: 0, big: true });

    // 호수와 반영
    vgrad(c, 262, 292, '#11173a', '#1b224b');
    for (let y = 262; y < 292; y++) {
      const my = 262 - (y - 262) * 3.2;
      if (my < 20) break;
      const w = tw(my);
      const off = Math.round(Math.sin(y * 1.7) * 1.5);
      c.globalAlpha = 0.45;
      R(c, TX - w / 2 + off, y, w, 1, '#3a4680');
      c.globalAlpha = 1;
    }
    for (let i = 0; i < 50; i++) {
      c.globalAlpha = 0.25 + r() * 0.35;
      R(c, r() * W, 263 + r() * 28, 2 + r() * 6, 1, pick(r, ['#ffe9a0', '#ffcf7a', '#9fb2ff']));
    }
    c.globalAlpha = 1;
    R(c, 0, 292, W, 3, '#8a90a8');
    for (let x = 2; x < W; x += 9) R(c, x, 286, 1, 6, '#6a7090');
    R(c, 0, 286, W, 1, '#8a90a8');

    // 눈 쌓인 광장
    perspFloor(c, vp, 295, H, '#3a3f58', '#444a67', 26);
    for (let i = 0; i < 120; i++) {
      c.globalAlpha = 0.2 + r() * 0.4;
      const y = 296 + r() * 184;
      R(c, r() * W, y, 2 + (r() * (y - 290)) / 12, 1, '#dfe6f4');
    }
    c.globalAlpha = 1;
    R(c, 0, 295, W, 2, '#e9eef8');
    drawCrowd(c, r, 300, 150, 270, 14, '#1b1f33');
    drawCrowd(c, r, 300, 0, 60, 6, '#1b1f33');

    L.push(...drawChalet(c, r, 214, 318, 40, 26, '#a8323f'));
    L.push(...drawChalet(c, r, 196, 346, 58, 34, '#2f7a52'));
    L.push(...drawCarousel(c, r, 42, 348));

    // 트리 꼭대기에서 늘어진 전구 줄
    const multi = ['#ffd36b', '#ff6b6b', '#7fd1ff', '#a6ff8a'];
    const ends: [number, number][] = [[0, 262], [40, 250], [200, 250], [270, 262]];
    for (const [ex, ey] of ends) {
      const sx = 116;
      const sy = 96;
      for (let t = 0.06; t <= 1; t += 0.024) {
        const x = Math.round(sx + (ex - sx) * t);
        const y = Math.round(sy + (ey - sy) * t + Math.sin(t * Math.PI) * 26);
        c.globalAlpha = 0.3;
        P(c, x, y, '#ffffff');
        c.globalAlpha = 1;
        L.push({ x, y, col: pick(r, multi), s: 1 + r() * 2, p: r() * 7 });
      }
    }
    L.push(...drawTree(c, r, {
      cx: 116, base: 322, h: 220, w: 150, tiers: 5, green: '#2c6e4a', dark: '#1f5638',
      orn: ['#e23b4e', '#f6c453', '#5fa8e8'], ornN: 70, light: multi, lightN: 150, star: '#ffe066',
      garland: '#f6c453', gifts: ['#e23b4e', '#5fa8e8', '#f6c453', '#2f7a52'], glowA: 0.18,
    }));
    L.push(...drawLamp(c, r, 8, 402, '#1b1f33', 52), ...drawLamp(c, r, 258, 402, '#1b1f33', 52));
    return { lights: L, floor: [14, 374, 256, 462], board: { x: 12, y: 40, hang: true } };
  },
};
