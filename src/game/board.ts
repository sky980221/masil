// 장면 안에 걸린 크리스마스 카운트다운 전광판. 3×5 픽셀 글꼴로 직접 그린다.
import { type Ctx, R, P, glow } from '../engine/pixel';
import { XMAS } from '../advent/calendar';
import type { BoardSpot } from '../scenes/types';

const GLYPH: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  D: ['110', '101', '101', '101', '110'],
  '-': ['000', '000', '111', '000', '000'],
  ':': ['000', '010', '000', '010', '000'],
  A: ['010', '101', '111', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
};

const charW = (ch: string, s: number) => (ch === ':' ? 3 : 4) * s;
export const textWidth = (str: string, s: number) => [...str].reduce((w, ch) => w + charW(ch, s), 0) - s;

export function drawPixelText(c: Ctx, str: string, x: number, y: number, s: number, col: string): void {
  let cx = x;
  for (const ch of str) {
    const g = GLYPH[ch];
    if (g) {
      g.forEach((row, ry) => {
        for (let rx = 0; rx < 3; rx++) if (row[rx] === '1') R(c, cx + (ch === ':' ? rx - 1 : rx) * s, y + ry * s, s, s, col);
      });
    }
    cx += charW(ch, s);
  }
}

export function boardText(nowMs: number): { big: string; small: string } {
  const diff = XMAS - nowMs;
  if (diff <= 0) return { big: 'D-DAY', small: '00:00:00' };
  const s = Math.floor(diff / 1000);
  const small = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, '0')).join(':');
  return { big: `D-${Math.ceil(diff / 86_400_000)}`, small };
}

export function drawBoard(c: Ctx, t: number, b: BoardSpot, nowMs: number): void {
  const { big, small } = boardText(nowMs);
  const w = 64;
  const h = 28;
  const { x, y } = b;
  if (b.hang) {
    R(c, x + 9, 0, 1, y, '#5a4a3a');
    R(c, x + w - 10, 0, 1, y, '#5a4a3a');
  }
  glow(c, x + w / 2, y + h / 2, 46, '#ffd98a', 0.18);
  R(c, x - 2, y - 2, w + 4, h + 4, '#8a6a2a');
  R(c, x - 1, y - 1, w + 2, h + 2, '#e0b84a');
  R(c, x, y, w, h, '#17122a');
  R(c, x + 1, y + 1, w - 2, 1, '#2a2244');
  // 테두리 전구가 번갈아 깜빡인다
  for (let i = 0; i < w; i += 4) {
    const on = (Math.floor(t * 3) + i / 4) % 2 === 0;
    P(c, x + i, y - 2, on ? '#ff6b6b' : '#a6ff8a');
    P(c, x + i + 2, y + h + 1, on ? '#a6ff8a' : '#ff6b6b');
  }
  drawPixelText(c, big, x + Math.round((w - textWidth(big, 2)) / 2), y + 4, 2, '#ffd34d');
  drawPixelText(c, small, x + Math.round((w - textWidth(small, 1)) / 2), y + 18, 1, '#f4efe6');
}
