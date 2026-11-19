// 명동 신세계백화점: 건물 한 면을 덮은 대형 미디어 파사드와 그 앞의 오래된 석조 본관.
// 파사드 영상은 실제 콘텐츠를 옮기지 않고 이 서비스용으로 새로 만든 겨울밤 애니메이션이다.
import { type Ctx, type Light, W, H, R, P, mix, hash, rng, vgrad, glow, perspFloor, makeCanvas } from '../engine/pixel';
import { drawLamp, drawLightTree, drawCrowd } from '../engine/props';
import type { Spot } from './types';

// 미디어 파사드 영역
const FX = 76;
const FY = 30;
const FW = 188;
const FH = 250;

export const shinsegae: Spot = {
  key: 'shinsegae',
  chip: '명동 신세계',
  name: '명동 신세계백화점',
  snow: true,
  night: { color: '#08081e', alpha: 0.4 },
  crowd: { y: 330, x0: 10, x1: 260, n: 10, col: '#16131f' },
  build(c, r) {
    const L: Light[] = [];
    vgrad(c, 0, 320, '#07071a', '#1c1634');

    // 파사드가 붙은 본점 건물
    R(c, FX - 8, FY - 10, FW + 16, 300, '#211c2c');
    R(c, FX - 3, FY - 3, FW + 6, FH + 6, '#0e0b16');
    glow(c, FX + FW / 2, FY + FH / 2, 170, '#6a7cff', 0.18);
    // 1층 상점
    R(c, FX - 8, FY + FH + 3, FW + 16, 318 - (FY + FH + 3), '#2c2536');
    for (let x = FX; x < FX + FW - 10; x += 26) {
      R(c, x, FY + FH + 10, 20, 24, '#ffcf8a');
      glow(c, x + 10, FY + FH + 22, 18, '#ffcf7a', 0.3);
    }

    // 앞쪽의 석조 본관: 구리 돔, 기둥, 아치 창
    const ox = 0;
    const ow = 100;
    const oy = 184;
    R(c, ox, oy, ow, 318 - oy, '#9a8a72');
    for (let y = oy; y < 318; y++) R(c, ox, y, ow, 1, mix('#b8a68a', '#7a6a56', (y - oy) / (318 - oy)));
    glow(c, ox + ow / 2, 318, 90, '#ffd9a0', 0.22);
    for (let x = ox + 4; x < ox + ow; x += 12) {
      R(c, x, oy + 10, 3, 318 - oy - 10, '#cbb998');
      R(c, x + 3, oy + 10, 1, 318 - oy - 10, '#8a7a62');
    }
    for (let x = ox + 8; x < ox + ow - 6; x += 12) {
      for (const wy of [oy + 22, oy + 70]) {
        R(c, x, wy, 7, 30, '#ffcf8a');
        R(c, x + 1, wy - 2, 5, 2, '#ffcf8a');
        R(c, x + 3, wy, 1, 30, '#c98a3a');
      }
    }
    R(c, ox, oy, ow, 6, '#d8c6a4');
    R(c, ox, oy + 6, ow, 2, '#6a5a46');
    for (let x = ox; x < ox + ow; x += 3) L.push({ x, y: oy + 2, col: '#fff1c8', s: 1 + r(), p: x * 0.3 });
    // 모서리 돔
    for (let dy = 0; dy < 18; dy++) {
      const hw = Math.round(Math.sqrt(18 * 18 - (18 - dy) ** 2) * 0.9);
      R(c, 24 - hw, oy - 18 + dy, hw * 2, 1, dy < 4 ? '#7aa592' : '#4f7a6a');
    }
    R(c, 23, oy - 26, 2, 8, '#4f7a6a');
    L.push({ x: 24, y: oy - 27, col: '#fff3c4', s: 1, p: 0, big: true });

    // 인도와 광장
    R(c, 0, 318, W, 14, '#3a3644');
    R(c, 0, 331, W, 1, '#55506a');
    perspFloor(c, { x: 150, y: 250 }, 332, H, '#2c2a35', '#36333f', 24);
    for (let i = 0; i < 60; i++) {
      c.globalAlpha = 0.2 + r() * 0.3;
      R(c, r() * W, 333 + r() * 147, 2 + r() * 5, 1, '#dfe6f4');
    }
    c.globalAlpha = 1;
    drawCrowd(c, r, 330, 20, 250, 22, '#16131f');
    L.push(...drawLightTree(c, r, 22, 352, 104), ...drawLightTree(c, r, 248, 352, 104));
    L.push(...drawLamp(c, r, 112, 336, '#4a4458', 44), ...drawLamp(c, r, 200, 336, '#4a4458', 44));

    // 파사드 위에 덮을 LED 격자
    const grid = makeCanvas(W, H);
    const g = grid.getContext('2d')!;
    g.fillStyle = 'rgba(8,6,14,.32)';
    for (let x = FX; x < FX + FW; x += 2) g.fillRect(x, FY, 1, FH);
    for (let y = FY; y < FY + FH; y += 2) g.fillRect(FX, y, FW, 1);

    const fr = rng(42);
    const stars = Array.from({ length: 40 }, () => ({ x: FX + fr() * FW, y: FY + fr() * 90, p: fr() * 7 }));
    const houses = Array.from({ length: 9 }, (_, i) => ({ x: FX + 4 + i * 21, h: 16 + ((fr() * 14) | 0), w: 16 }));

    const animate = (c: Ctx, t: number) => drawFacade(c, t, stars, houses, grid);
    return { lights: L, floor: [14, 374, 256, 462], board: { x: 4, y: 70 }, animate };
  },
};

function drawFacade(
  c: Ctx,
  t: number,
  stars: { x: number; y: number; p: number }[],
  houses: { x: number; h: number; w: number }[],
  grid: HTMLCanvasElement,
): void {
  c.save();
  c.beginPath();
  c.rect(FX, FY, FW, FH);
  c.clip();

  // 밤하늘 색이 천천히 바뀐다
  const k = (Math.sin(t * 0.15) + 1) / 2;
  const top = mix('#0b1a4a', '#2a0f48', k);
  const bot = mix('#3a2a78', '#6a2a6a', k);
  for (let y = FY; y < FY + FH; y += 2) R(c, FX, y, FW, 2, mix(top, bot, (y - FY) / FH));

  // 달과 별
  glow(c, FX + 150, FY + 40, 40, '#fff4cf', 0.35);
  for (let dy = -12; dy <= 12; dy++) {
    const hw = Math.sqrt(144 - dy * dy);
    R(c, FX + 150 - hw, FY + 40 + dy, hw * 2, 1, '#fff4cf');
  }
  R(c, FX + 144, FY + 34, 4, 3, '#efe2b8');
  R(c, FX + 153, FY + 44, 3, 3, '#efe2b8');
  for (const s of stars) {
    const b = (Math.sin(t * 2 + s.p) + 1) / 2;
    if (b > 0.4) P(c, s.x, s.y, b > 0.85 ? '#ffffff' : '#c9d4ff');
  }
  // 별똥별 (몇 초마다)
  const sp = (t * 0.35) % 1;
  if (sp < 0.25) {
    const q = sp / 0.25;
    const sx = FX + 20 + q * 120;
    const sy = FY + 10 + q * 40;
    for (let i = 0; i < 10; i++) {
      c.globalAlpha = 1 - i / 10;
      P(c, sx - i * 2, sy - i * 0.66, '#ffffff');
    }
    c.globalAlpha = 1;
  }

  // 가운데 큰 트리: 전구가 아래부터 나선으로 켜진다
  const cx = FX + 94;
  const tTop = FY + 70;
  const tBot = FY + 214;
  for (let y = tTop; y < tBot; y++) {
    const p = (y - tTop) / (tBot - tTop);
    const hw = 6 + p * 52 * (0.7 + 0.3 * ((y - tTop) % 24) / 24);
    R(c, cx - hw, y, hw * 2, 1, (y >> 1) % 2 ? '#1f6a46' : '#24784f');
  }
  R(c, cx - 5, tBot, 10, 10, '#5a3a24');
  const phase = (t * 0.25) % 1.3;
  const N = 70;
  for (let i = 0; i < N; i++) {
    const q = i / N;
    if (q > phase) break;
    const y = tBot - q * (tBot - tTop - 6);
    const p = (y - tTop) / (tBot - tTop);
    const hw = 6 + p * 46;
    const x = cx + Math.sin(q * 26) * hw;
    const col = ['#ffd36b', '#ff6b6b', '#7fd1ff', '#ffffff'][i % 4];
    R(c, x - 1, y - 1, 2, 2, col);
  }
  if (phase > 1) {
    glow(c, cx, tTop - 4, 22, '#fff1b0', 0.7);
    R(c, cx - 3, tTop - 7, 7, 7, '#ffd34d');
  }

  // 아래쪽 마을: 창문 불이 하나씩 켜졌다 꺼진다
  for (const [i, h] of houses.entries()) {
    const by = FY + FH - 10;
    R(c, h.x, by - h.h, h.w, h.h, '#140f26');
    for (let j = 0; j < 6; j++) R(c, h.x + j, by - h.h - j, h.w - j * 2, 1, '#140f26');
    const on = Math.floor(t * 1.5 + i * 1.7) % 3 !== 0;
    R(c, h.x + 5, by - h.h + 5, 5, 5, on ? '#ffd970' : '#2a2140');
  }
  R(c, FX, FY + FH - 10, FW, 10, '#e9eef8');

  // 내리는 눈
  for (let i = 0; i < 70; i++) {
    const hx = hash(i * 13 + 5);
    const x = FX + (hx % FW) + Math.sin(t + i) * 3;
    const y = FY + ((t * (10 + (hx % 9)) + (hash(i * 7) % FH)) % FH);
    R(c, x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1, '#ffffff');
  }

  // 대각선으로 지나가는 빛줄기
  const bx = ((t * 50) % (FW + 160)) - 80 + FX;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.18;
  for (let y = FY; y < FY + FH; y += 2) R(c, bx + (y - FY) * 0.4, y, 18, 2, '#ffffff');
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';

  c.drawImage(grid, 0, 0);
  c.restore();
}
