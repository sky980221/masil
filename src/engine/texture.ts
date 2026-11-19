// 큰 사각형으로만 그린 면에 손맛을 더하는 도구들: 외곽선, 벽돌·석재 줄눈, 명암, 처마 띠, 창틀.
// 모양은 그대로 두고 그 위에 덧칠하므로 기존 장면 코드에 한 줄씩 끼워 넣을 수 있다.
import { type Ctx, R, PX, SS, deferGlows, glow } from './pixel';

/**
 * draw로 그린 소품 바깥에 좌표 1칸 굵기 외곽선을 두른다.
 * 외곽선 색은 맞닿은 픽셀 색을 어둡게 한 색이라(셀아웃) 검은 테두리보다 부드럽다.
 * box는 소품이 들어갈 영역(좌표 단위). 바깥 1칸은 외곽선 자리로 자동으로 넓힌다.
 */
export function outlined<T>(c: Ctx, box: [number, number, number, number], draw: (c: Ctx) => T, dark = 0.35): T {
  const [bx, by, bw, bh] = [Math.floor(box[0]) - 2, Math.floor(box[1]) - 2, Math.ceil(box[2]) + 4, Math.ceil(box[3]) + 4];
  const cv = document.createElement('canvas');
  cv.width = bw * SS;
  cv.height = bh * SS;
  const oc = cv.getContext('2d', { willReadFrequently: true })!;
  oc.setTransform(SS, 0, 0, SS, -bx * SS, -by * SS);
  oc.imageSmoothingEnabled = false;
  let out!: T;
  const glows = deferGlows(() => {
    out = draw(oc);
  });
  addOutline(oc, dark);
  for (const g of glows) glow(c, ...g);
  c.drawImage(cv, bx, by, bw, bh);
  return out;
}

function addOutline(c: Ctx, dark: number): void {
  const w = c.canvas.width;
  const h = c.canvas.height;
  for (let pass = 0; pass < SS; pass++) {
    const img = c.getImageData(0, 0, w, h);
    const d = img.data;
    const src = new Uint8ClampedArray(d);
    const solid = (o: number) => src[o + 3] > 200;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (solid(o)) continue;
        // 맞닿은 이웃 중 하나의 색을 가져와 어둡게
        let n = -1;
        if (x > 0 && solid(o - 4)) n = o - 4;
        else if (x < w - 1 && solid(o + 4)) n = o + 4;
        else if (y > 0 && solid(o - w * 4)) n = o - w * 4;
        else if (y < h - 1 && solid(o + w * 4)) n = o + w * 4;
        if (n < 0) continue;
        d[o] = src[n] * dark * 0.9 + 20 * (1 - dark);
        d[o + 1] = src[n + 1] * dark * 0.8 + 8 * (1 - dark);
        d[o + 2] = src[n + 2] * dark * 0.9 + 16 * (1 - dark);
        d[o + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
  }
}

/** 벽돌 줄눈: row칸마다 가로 줄, 세로 줄은 줄마다 반 장씩 엇갈림 */
export function bricks(c: Ctx, x: number, y: number, w: number, h: number, mortar: string, row = 3, len = 5): void {
  for (let yy = y + row, j = 0; yy < y + h; yy += row, j++) {
    R(c, x, yy, w, PX, mortar);
    for (let xx = x + (j % 2 ? len / 2 : 0); xx < x + w; xx += len) R(c, xx, yy - row + PX, PX, row - PX, mortar);
  }
}

/** 큰 돌 줄눈: 가로 줄을 step마다, 세로 줄은 드문드문 */
export function courses(c: Ctx, x: number, y: number, w: number, h: number, ln: string, step = 6, len = 14): void {
  for (let yy = y + step, j = 0; yy < y + h; yy += step, j++) {
    R(c, x, yy, w, PX, ln);
    for (let xx = x + (j % 2 ? len / 2 : len / 4); xx < x + w; xx += len) R(c, xx, yy - step + PX, PX, step - PX, ln);
  }
}

/** 왼쪽 위에서 빛이 오는 명암: 왼쪽 가장자리 밝게, 오른쪽 가장자리 어둡게, 위쪽 처마 그림자 */
export function shade(c: Ctx, x: number, y: number, w: number, h: number, o: { light?: number; dark?: number; top?: number } = {}): void {
  const { light = 1, dark = Math.min(5, w * 0.12), top = 0 } = o;
  if (light) R(c, x, y, light, h, 'rgba(255,236,210,0.22)');
  if (dark) R(c, x + w - dark, y, dark, h, 'rgba(30,10,30,0.28)');
  if (top) R(c, x, y, w, top, 'rgba(30,10,30,0.25)');
}

/** 처마·돌림띠: 밝은 띠 + 아래 그림자 한 줄 */
export function ledge(c: Ctx, x: number, y: number, w: number, col: string, thick = 1.5): void {
  R(c, x, y, w, thick, col);
  R(c, x, y, w, PX, 'rgba(255,255,255,0.25)');
  R(c, x, y + thick, w, PX, 'rgba(30,10,30,0.35)');
}

/** 창문: 어두운 테 + 창틀 + 유리 + 십자 창살 + 반사 + 창턱 */
export function pane(c: Ctx, x: number, y: number, w: number, h: number, glass: string, frame: string, o: { sill?: boolean; cross?: boolean } = {}): void {
  const { sill = true, cross = true } = o;
  R(c, x - PX, y - PX, w + 1, h + 1, 'rgba(30,10,20,0.75)');
  R(c, x, y, w, h, frame);
  R(c, x + PX, y + PX, w - 1, h - 1, glass);
  R(c, x + PX, y + PX, Math.max(PX, (w - 1) * 0.35), Math.max(PX, (h - 1) * 0.2), 'rgba(255,255,255,0.35)');
  if (cross && w >= 4) R(c, x + w / 2 - PX / 2, y, PX, h, frame);
  if (cross && h >= 6) R(c, x, y + h * 0.4, w, PX, frame);
  if (sill) {
    R(c, x - PX, y + h, w + 1, 1, frame);
    R(c, x - PX, y + h + 1, w + 1, PX, 'rgba(30,10,30,0.35)');
  }
}
