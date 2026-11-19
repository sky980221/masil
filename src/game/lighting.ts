// 밤 장면 조명 레이어: 장면 전체를 어둡게 덮고, 장면을 그릴 때 모아 둔 광원 자리만 뚫는다.
// 캐릭터도 이 아래에 그려지므로 가로등·트리 근처에 가면 밝아지고, 어두운 곳에선 어두워진다.
import { type Ctx, type Glow, W, H, makeCanvas } from '../engine/pixel';
import type { Night } from '../scenes/types';

export class Lighting {
  private readonly cv = makeCanvas(W, H);
  private readonly lc = this.cv.getContext('2d')!;

  draw(c: Ctx, t: number, night: Night, glows: readonly Glow[]): void {
    const l = this.lc;
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, W, H);
    l.globalAlpha = night.alpha;
    l.fillStyle = night.color;
    l.fillRect(0, 0, W, H);
    l.globalAlpha = 1;
    l.globalCompositeOperation = 'destination-out';
    for (const g of glows) {
      // 광원마다 박자를 달리해 아주 살짝 일렁이게
      const flicker = 1 + Math.sin(t * 2.3 + g.x * 0.37 + g.y * 0.11) * 0.04;
      const r = g.r * 1.15 * flicker;
      const k = Math.min(1, g.a * 2.4);
      const grad = l.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
      grad.addColorStop(0, `rgba(0,0,0,${k})`);
      grad.addColorStop(0.55, `rgba(0,0,0,${k * 0.45})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = grad;
      l.fillRect(g.x - r, g.y - r, r * 2, r * 2);
    }
    l.globalCompositeOperation = 'source-over';
    c.drawImage(this.cv, 0, 0);
  }
}
