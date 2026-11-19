// 명동 신세계백화점 본점: 분수 로터리 건너편에서 본 모습.
// 오래된 본관 위층을 가로로 넓고 낮게 덮은 미디어 파사드(오른쪽 모서리가 둥글고 가운데 위가 아치),
// 그 아래 따뜻한 1층 상점, 뒤로 어두운 신관 빌딩, 오른쪽엔 기둥이 선 크림색 석조 건물.
// 앞은 차가 도는 넓은 도로와 둥근 분수, 휴대폰을 든 인파.
// 파사드 영상은 실제 콘텐츠를 옮기지 않고, 빨강·금색·흰 대리석·짙은 파랑 분위기만 따서 새로 만들었다.
import { type Ctx, type Light, W, H, R, P, mix, hash, rng, vgrad, glow, perspFloor, makeCanvas } from '../engine/pixel';
import { drawLamp, drawLightTree, drawCrowd, drawStar } from '../engine/props';
import type { Spot } from './types';

// 미디어 파사드 영역 (왼쪽은 화면 밖으로 잘린다)
const FX = 0;
const FY = 126;
const FW = 200;
const FH = 96;
const ROAD_Y = 256;

export const shinsegae: Spot = {
  key: 'shinsegae',
  chip: '명동 신세계',
  name: '명동 신세계백화점',
  snow: false,
  night: { color: '#060816', alpha: 0.38 },
  crowd: { y: 352, x0: 0, x1: 270, n: 14, col: '#141220' },
  build(c, r) {
    const L: Light[] = [];
    vgrad(c, 0, ROAD_Y, '#0b1026', '#1a1e38', 6);

    // 뒤로 솟은 어두운 신관 빌딩
    R(c, 26, 24, 150, FY, '#1c2340');
    R(c, 150, 24, 26, FY, '#161c34');
    for (let y = 30; y < FY - 4; y += 7) for (let x = 30; x < 172; x += 6) if (r() < 0.22) R(c, x, y, 3, 4, r() < 0.6 ? '#ffb04a' : '#c9d4ff');
    R(c, 80, 16, 40, 8, '#141a30');
    glow(c, 100, 18, 20, '#ff6a6a', 0.25);
    L.push({ x: 100, y: 19, col: '#ff8a8a', s: 2, p: 0, big: true });
    // 더 먼 빌딩들
    R(c, 0, 60, 26, FY, '#141a30');
    R(c, 176, 50, 40, 90, '#141a30');
    for (let i = 0; i < 30; i++) {
      c.globalAlpha = 0.6;
      P(c, r() < 0.5 ? r() * 26 : 176 + r() * 40, 60 + r() * 70, '#ffb04a');
    }
    c.globalAlpha = 1;

    // 본관: 파사드 테두리, 가운데 위로 살짝 솟은 빛나는 처마
    R(c, FX, FY - 8, FW + 6, FH + 16, '#2a2430');
    for (let x = FX; x < FX + FW; x++) {
      const bulge = Math.round(Math.max(0, 1 - Math.abs(x - 100) / 70) * 6);
      R(c, x, FY - 6 - bulge, 1, 3, '#ffe6f2');
      if (x % 3 === 0) L.push({ x, y: FY - 5 - bulge, col: '#fff1f6', s: 1.2, p: x * 0.2 });
    }
    glow(c, 100, FY - 6, 70, '#ffd0e0', 0.2);
    glow(c, FX + FW / 2, FY + FH / 2, 150, '#5070ff', 0.2);
    // 1층: 따뜻한 유리 상점 띠
    R(c, FX, FY + FH + 6, FW + 6, 30, '#2a2018');
    for (let x = FX + 2; x < FX + FW; x += 18) {
      R(c, x, FY + FH + 10, 15, 22, '#ffb04a');
      R(c, x, FY + FH + 10, 15, 2, '#fff1d6');
      glow(c, x + 7, FY + FH + 22, 14, '#ffb04a', 0.3);
    }

    // 오른쪽: 기둥이 선 크림색 석조 건물 (아래에서 따뜻하게 비춘다)
    const hx = 202;
    const hy = 142;
    R(c, hx, hy, W - hx, ROAD_Y - hy, '#ede6d6');
    for (let y = hy; y < ROAD_Y; y++) {
      c.globalAlpha = 0.5 * ((y - hy) / (ROAD_Y - hy));
      R(c, hx, y, W - hx, 1, '#ffcf8a');
    }
    c.globalAlpha = 1;
    R(c, hx - 2, hy - 6, W - hx + 2, 6, '#d8cfbc');
    R(c, hx - 2, hy, W - hx + 2, 2, '#b9a98a');
    for (let x = hx + 4; x < W; x += 11) {
      R(c, x, hy + 6, 5, ROAD_Y - hy - 22, '#f6f1e6');
      R(c, x + 4, hy + 6, 1, ROAD_Y - hy - 22, '#b9a98a');
    }
    for (let y = hy + 10; y < ROAD_Y - 22; y += 12) for (let x = hx + 10; x < W; x += 11) R(c, x, y, 4, 6, r() < 0.7 ? '#ffb04a' : '#5a4a3a');
    glow(c, 236, ROAD_Y - 10, 50, '#ffcf8a', 0.3);

    // 넓은 도로, 횡단보도, 그 앞 분수 로터리와 인도
    R(c, 0, ROAD_Y, W, 4, '#4a4450');
    perspFloor(c, { x: 135, y: 200 }, ROAD_Y + 4, 336, '#2a2a30', '#26262c', 40);
    for (let x = 0; x < W; x += 30) R(c, x, 296, 16, 1, '#8a8590');
    for (let x = 20; x < 250; x += 8) R(c, x, 320, 5, 10, '#c9c4cc');
    R(c, 0, 336, W, 4, '#6a6470');
    perspFloor(c, { x: 135, y: 260 }, 340, H, '#3a3644', '#34303e', 24);

    // 둥근 분수: 돌 수반과 가운데 받침대
    const fcx = 66;
    const fcy = 368;
    for (let dy = -12; dy <= 12; dy++) {
      const hw = 46 * Math.sqrt(1 - (dy / 12) ** 2);
      R(c, fcx - hw, fcy + dy, hw * 2, 1, dy < -9 ? '#c9c2b4' : dy < 6 ? '#3a5470' : '#9a9284');
    }
    R(c, fcx - 5, fcy - 22, 10, 22, '#c9c2b4');
    R(c, fcx - 9, fcy - 26, 18, 4, '#d8d1c2');
    glow(c, fcx, fcy - 6, 40, '#9fc0ff', 0.2);

    L.push(...drawLightTree(c, r, 128, 344, 100), ...drawLightTree(c, r, 258, 344, 96));
    L.push(...drawLamp(c, r, 176, 340, '#4a4458', 48), ...drawLamp(c, r, 8, 340, '#4a4458', 48));
    drawCrowd(c, r, 350, 10, 260, 26, '#141220');
    // 휴대폰 화면 불빛
    for (let i = 0; i < 10; i++) {
      const x = 14 + r() * 240;
      R(c, x, 336 + r() * 6, 2, 2, '#dfe8ff');
      L.push({ x: Math.round(x), y: 337, col: '#eef4ff', s: 0.4, p: r() * 7, big: true });
    }

    // 파사드 위에 덮을 LED 격자
    const grid = makeCanvas(W, H);
    const g = grid.getContext('2d')!;
    g.fillStyle = 'rgba(6,6,14,.3)';
    for (let x = FX; x < FX + FW + 8; x += 1) g.fillRect(x, FY, 0.5, FH);
    for (let y = FY; y < FY + FH; y += 1) g.fillRect(FX, y, FW + 8, 0.5);
    const fr = rng(42);
    const flakes = Array.from({ length: 50 }, () => ({ x: fr() * FW, y: fr() * FH, v: 6 + fr() * 10 }));

    const animate = (c: Ctx, t: number) => {
      drawFacade(c, t, flakes, grid);
      drawTraffic(c, t);
    };
    return { lights: L, floor: [14, 384, 256, 462], board: { x: 200, y: 50 }, animate };
  },
};

/** 미디어 파사드: 짙은 파랑 하늘을 흰 대리석 아치와 기둥이 감싸고, 빨간 리본 선물 상자가 화면 밖으로 튀어나온다 */
function drawFacade(c: Ctx, t: number, flakes: { x: number; y: number; v: number }[], grid: HTMLCanvasElement): void {
  c.save();
  c.beginPath();
  c.moveTo(FX, FY);
  c.lineTo(FX + FW - 14, FY);
  c.quadraticCurveTo(FX + FW + 6, FY, FX + FW + 6, FY + 20);
  c.lineTo(FX + FW + 6, FY + FH);
  c.lineTo(FX, FY + FH);
  c.closePath();
  c.clip();

  const k = (Math.sin(t * 0.25) + 1) / 2;
  for (let y = FY; y < FY + FH; y += 2) R(c, FX, y, FW + 6, 2, mix(mix('#0e1a52', '#1e3a8a', k * 0.5), '#2a4aa8', (y - FY) / FH));
  // 흰 대리석 아치와 기둥
  const cx = FX + 100;
  for (const x of [cx - 70, cx - 50, cx + 46, cx + 66]) {
    R(c, x, FY + 26, 6, FH - 26, '#f2eee6');
    R(c, x + 4, FY + 26, 2, FH - 26, '#c9c2b4');
    R(c, x - 2, FY + 24, 10, 3, '#ffffff');
  }
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.01) {
    for (const rr of [62, 58]) R(c, cx + Math.cos(a) * rr, FY + 30 + Math.sin(a) * 26, 2, 2, rr === 62 ? '#f2eee6' : '#c9c2b4');
  }
  // 금빛 반짝임
  for (let i = 0; i < 24; i++) {
    const b = (Math.sin(t * 3 + i * 1.7) + 1) / 2;
    if (b > 0.6) P(c, FX + ((i * 47) % FW), FY + 8 + ((i * 29) % (FH - 16)), '#f2c46b');
  }
  // 내리는 눈
  for (const f of flakes) R(c, FX + f.x + Math.sin(t + f.x) * 2, FY + ((f.y + t * f.v) % FH), 1, 1, '#ffffff');
  // 긴 빨간 식탁과 보석 장식이 앞으로 뻗어 나온다
  R(c, cx - 40, FY + FH - 18, 80, 6, '#c8102e');
  R(c, cx - 44, FY + FH - 12, 88, 4, '#8a0a1e');
  for (let i = 0; i < 6; i++) R(c, cx - 34 + i * 13, FY + FH - 22, 5, 4, i % 2 ? '#f2c46b' : '#ffffff');
  // 대각선으로 지나가는 빛줄기
  const bx = ((t * 60) % (FW + 160)) - 80;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.16;
  for (let y = FY; y < FY + FH; y += 2) R(c, bx + (y - FY) * 0.5, y, 16, 2, '#ffffff');
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.drawImage(grid, 0, 0, W, H);
  c.restore();

  // 화면 밖으로 튀어나온 듯한 빨간 리본 선물 상자 (아치 위에서 위아래로 둥실)
  const bob = Math.round(Math.sin(t * 1.4) * 3);
  const gx = cx - 16;
  const gy = FY + 18 + bob;
  R(c, gx + 3, gy + 26, 26, 3, 'rgba(0,0,0,.35)');
  R(c, gx, gy + 6, 32, 20, '#c8102e');
  R(c, gx, gy + 6, 32, 3, '#e8394a');
  R(c, gx + 14, gy + 6, 4, 20, '#f2c46b');
  R(c, gx, gy + 14, 32, 3, '#f2c46b');
  for (const s of [-1, 1]) {
    for (let i = 0; i < 9; i++) R(c, gx + 16 + s * (2 + i), gy + 4 - Math.round(Math.sin((i / 9) * Math.PI) * 9), 2, 3, '#e8394a');
  }
  R(c, gx + 14, gy + 2, 4, 4, '#c8102e');
  drawStar(c, gx + 16 + Math.round(Math.sin(t) * 30), gy - 8, '#f2c46b');
}

/** 분수 로터리를 도는 버스와 택시 (헤드라이트·후미등이 어둠 위에 보이게 매 프레임 그린다) */
function drawTraffic(c: Ctx, t: number): void {
  const lanes = [
    { y: 276, dir: 1, speed: 46, cars: [0, 0.45, 0.8] },
    { y: 304, dir: -1, speed: 38, cars: [0.15, 0.6] },
  ];
  for (const lane of lanes) {
    lane.cars.forEach((off, i) => {
      const span = W + 80;
      let x = ((t * lane.speed + off * span) % span) - 40;
      if (lane.dir < 0) x = W - x;
      const bus = i === 0 && lane.y === 276;
      const len = bus ? 36 : 18;
      const h = bus ? 13 : 8;
      const body = bus ? (hash(Math.floor(t / 20)) % 2 ? '#c8202a' : '#2a6ad0') : i % 2 ? '#e8b84a' : '#e8e8ec';
      const x0 = Math.round(x - len / 2);
      R(c, x0, lane.y - h, len, h, body);
      R(c, x0 + 2, lane.y - h + 2, len - 4, bus ? 4 : 3, '#9fb8d8');
      R(c, x0 + 3, lane.y - 1, 4, 2, '#111111');
      R(c, x0 + len - 7, lane.y - 1, 4, 2, '#111111');
      const front = lane.dir > 0 ? x0 + len : x0 - 1;
      const back = lane.dir > 0 ? x0 - 1 : x0 + len;
      R(c, front, lane.y - 4, 1, 2, '#fff6c8');
      R(c, back, lane.y - 4, 1, 2, '#ff3a3a');
      glow(c, front + lane.dir * 8, lane.y - 2, 12, '#fff3c4', 0.35);
    });
  }
}
