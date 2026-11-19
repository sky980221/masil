// 지금 장면을 1080×1920 폴라로이드 사진으로 만든다. 이름표와 장소·D-day 문구가 들어간다.
import { W, H, makeCanvas } from '../engine/pixel';
import { headTop } from '../avatar/draw';
import { daysLeft } from '../advent/calendar';
import type { World } from './world';

const INK = '#2b2118';
const PAPER = '#fbf5e8';

export async function takePhoto(world: World, t: number, name: string, nowMs: number): Promise<string> {
  try {
    await Promise.all([document.fonts.load('52px Galmuri14'), document.fonts.load('30px Galmuri11')]);
  } catch {
    /* 글꼴을 못 불러와도 기본 글꼴로 찍는다 */
  }
  const lo = makeCanvas(W, H);
  world.render(lo.getContext('2d')!, t, nowMs);

  const S = 3;
  const M = 135;
  const TOP = 110;
  const hi = makeCanvas(1080, 1920);
  const h = hi.getContext('2d')!;
  h.fillStyle = PAPER;
  h.fillRect(0, 0, hi.width, hi.height);
  h.imageSmoothingEnabled = false;
  h.drawImage(lo, M, TOP, W * S, H * S);
  h.lineWidth = 6;
  h.strokeStyle = INK;
  h.strokeRect(M - 3, TOP - 3, W * S + 6, H * S + 6);

  const me = world.me;
  if (name) {
    const tx = M + me.x * S;
    const ty = TOP + (me.y - headTop(me.look) - 2) * S - 14;
    h.font = '30px Galmuri11';
    const bw = Math.round(h.measureText(name).width) + 28;
    const bh = 46;
    h.fillStyle = PAPER;
    h.fillRect(tx - bw / 2, ty - bh, bw, bh);
    h.strokeRect(tx - bw / 2, ty - bh, bw, bh);
    h.fillStyle = INK;
    h.beginPath();
    h.moveTo(tx - 10, ty + 3);
    h.lineTo(tx + 10, ty + 3);
    h.lineTo(tx, ty + 15);
    h.fill();
    h.textAlign = 'center';
    h.textBaseline = 'middle';
    h.fillText(name, tx, ty - bh / 2 + 2);
  }

  const d = daysLeft(nowMs);
  const dt = new Date(nowMs);
  const p2 = (n: number) => String(n).padStart(2, '0');
  const stamp = `${dt.getFullYear()}.${p2(dt.getMonth() + 1)}.${p2(dt.getDate())} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
  const by = TOP + H * S;
  h.textBaseline = 'alphabetic';
  h.textAlign = 'left';
  h.fillStyle = INK;
  h.font = '52px Galmuri14';
  h.fillText(world.spot.name, M, by + 108);
  h.fillStyle = '#c8322f';
  h.font = '46px Galmuri14';
  h.textAlign = 'right';
  h.fillText(d > 0 ? `D-${d}` : 'D-DAY', hi.width - M, by + 108);
  h.textAlign = 'left';
  h.fillStyle = '#6f5d48';
  h.font = '30px Galmuri11';
  h.fillText(name ? `${stamp} · ${name}` : stamp, M, by + 168);
  h.textAlign = 'right';
  h.fillText('마실 · 누워서 가는 트리 명소', hi.width - M, by + 168);
  return hi.toDataURL('image/png');
}
