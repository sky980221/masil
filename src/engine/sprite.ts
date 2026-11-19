// 손으로 찍은 픽셀 그림(PNG)을 장면에 붙인다. PNG 한 칸 = 장면 좌표 1칸.
// 배경은 한 번 구워 두므로, 그림이 아직 안 불러졌으면 코드 그림(fallback)으로 먼저 그리고
// 다 불러지면 World가 배경을 다시 굽는다.
import type { Ctx } from './pixel';
import gableHouse from '../assets/sprites/gable-house.png';
import santa from '../assets/sprites/santa.png';
import deer from '../assets/sprites/deer.png';

const SRC = { gableHouse, santa, deer } as const;
export type SpriteName = keyof typeof SRC;

const loaded: Partial<Record<SpriteName, HTMLImageElement>> = {};

/** 모든 그림을 다 불러오면 풀린다 (하나가 실패해도 나머지는 쓴다) */
export const spritesReady: Promise<void> =
  typeof Image === 'undefined'
    ? Promise.resolve()
    : Promise.all(
        (Object.entries(SRC) as [SpriteName, string][]).map(([name, url]) => {
          const img = new Image();
          img.src = url;
          return img.decode().then(
            () => void (loaded[name] = img),
            () => undefined,
          );
        }),
      ).then(() => undefined);

/**
 * 바닥 가운데(cx, base)에 맞춰 그림을 붙인다. 아직 없으면 fallback을 그린다.
 * 그림으로 그렸으면 true.
 */
export function sprite(c: Ctx, name: SpriteName, cx: number, base: number, fallback: () => void, flip = false): boolean {
  const img = loaded[name];
  if (!img) {
    fallback();
    return false;
  }
  const x = Math.round(cx - img.width / 2);
  const y = base - img.height;
  if (flip) {
    c.save();
    c.translate(x + img.width, y);
    c.scale(-1, 1);
    c.drawImage(img, 0, 0, img.width, img.height);
    c.restore();
  } else c.drawImage(img, x, y, img.width, img.height);
  return true;
}
