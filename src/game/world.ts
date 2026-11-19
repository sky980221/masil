// 광장 하나의 상태: 배경, 걸어 다니는 아바타들, 눈, 반짝임. 그리기와 갱신만 맡고 UI는 모른다.
import { type Ctx, type Glow, W, H, R, P, mix, rng, makeCanvas, collectGlows, posterize } from '../engine/pixel';
import { type Look, normalizeLook } from '../avatar/options';
import { type AvatarPose, drawAvatar } from '../avatar/draw';
import { SPOTS, type Spot, type SceneBuild, type TrainTrack } from '../scenes';
import type { PeerState } from '../net/protocol';
import { drawBoard } from './board';
import { Lighting } from './lighting';

export interface Walker extends AvatarPose {
  tx: number;
  ty: number;
  wait: number;
  speed: number;
}

/** 같은 방에 들어온 다른 사람 */
export interface Peer extends Walker {
  id: string;
  name: string;
  spot: string;
}

/** 이름표를 붙일 사람 */
export interface NamedWalker {
  x: number;
  y: number;
  look: Look;
  name: string;
  me: boolean;
}

const PEER_SPEED = 60;
/** 받은 위치와 이만큼 넘게 차이 나면 걷지 않고 바로 옮긴다 */
const SNAP_DISTANCE = 40;

interface Flake {
  x: number;
  y: number;
  v: number;
  ph: number;
  /** 0 먼 눈, 1 중간, 2 가까운 눈 */
  z: number;
}

/** 눈밭에 남는 발자국 */
interface Print {
  x: number;
  y: number;
  age: number;
}

const SNOW_LAYERS = [
  { n: 90, size: 0.5, speed: [8, 13], alpha: 0.6, sway: 0.12 },
  { n: 50, size: 1, speed: [15, 24], alpha: 0.8, sway: 0.22 },
  { n: 18, size: 1.5, speed: [28, 40], alpha: 0.95, sway: 0.4 },
] as const;
const PRINT_LIFE = 7;
const MAX_PRINTS = 240;

interface Sparkle {
  x: number;
  y: number;
  p: number;
  s: number;
}

/** 지평선을 오가는 멀리 있는 사람 */
interface FarWalker {
  x: number;
  v: number;
  h: number;
  ph: number;
}

const MY_SPEED = 55;

export class World {
  spot!: Spot;
  scene!: SceneBuild;
  private bg = makeCanvas(W, H);
  private vignette = makeVignette();
  me: Walker;
  name = '';
  /** 같은 방에 링크로 들어온 사람들. 방에 들어가기 전에는 나 혼자다. */
  readonly peers = new Map<string, Peer>();
  private snow: Flake[] = [];
  private sparkles: Sparkle[] = [];
  readonly keys = new Set<string>();
  private cache = new Map<string, { bg: HTMLCanvasElement; scene: SceneBuild; glows: Glow[] }>();
  private glows: Glow[] = [];
  private readonly lighting = new Lighting();
  private far: FarWalker[] = [];
  private prints: Print[] = [];
  /** 걸은 거리를 재서 일정 간격마다 발자국을 찍는다 */
  private stride = new WeakMap<Walker, { x: number; y: number; left: boolean }>();
  private readonly mirror = makeCanvas(48, 64);

  constructor(look: Look, spotIndex: number) {
    this.me = { x: 135, y: 420, tx: 135, ty: 420, dir: 0, moving: false, seed: 3, look, wait: 0, speed: MY_SPEED };
    this.setSpot(spotIndex);
  }

  setSpot(i: number): void {
    const spot = SPOTS[Math.max(0, Math.min(SPOTS.length - 1, i))];
    this.spot = spot;
    // 배경은 장소마다 한 번만 그려 둔다
    let hit = this.cache.get(spot.key);
    if (!hit) {
      const bg = makeCanvas(W, H);
      const { result: scene, glows } = collectGlows(() => spot.build(bg.getContext('2d')!, rng(1000 + SPOTS.indexOf(spot) * 77)));
      posterize(bg.getContext('2d')!);
      hit = { bg, scene, glows };
      this.cache.set(spot.key, hit);
    }
    this.bg = hit.bg;
    this.scene = hit.scene;
    this.glows = hit.glows;
    const cl = spot.crowd;
    this.far = cl
      ? Array.from({ length: cl.n }, () => ({ x: cl.x0 + Math.random() * (cl.x1 - cl.x0), v: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 7), h: Math.random() < 0.5 ? 6 : 7, ph: Math.random() * 7 }))
      : [];

    const [, y0, , y1] = this.scene.floor;
    this.me.x = this.me.tx = 135;
    this.me.y = this.me.ty = Math.min(y1, y0 + 50);
    this.snow = spot.snow
      ? SNOW_LAYERS.flatMap((L, z) =>
          Array.from({ length: L.n }, () => ({ x: Math.random() * W, y: Math.random() * H, v: L.speed[0] + Math.random() * (L.speed[1] - L.speed[0]), ph: Math.random() * 7, z })),
        )
      : [];
    this.prints = [];
    this.sparkles = spot.snow
      ? []
      : Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * 300, p: Math.random() * 7, s: 1 + Math.random() * 2 }));
  }

  setLook(look: Look): void {
    this.me.look = look;
  }

  /** 방에서 나오면 함께 있던 사람들을 지운다. */
  setOnline(on: boolean): void {
    if (!on) this.peers.clear();
  }

  /** 방에 처음 들어왔거나 새 사람이 들어왔을 때 */
  upsertPeer(p: PeerState): void {
    const old = this.peers.get(p.id);
    if (old) {
      Object.assign(old, { name: p.name, look: normalizeLook(p.look), spot: p.spot });
      this.movePeer(p.id, p.spot, p.x, p.y, p.tx, p.ty);
      return;
    }
    this.peers.set(p.id, {
      id: p.id, name: p.name, spot: p.spot, look: normalizeLook(p.look),
      x: p.x, y: p.y, tx: p.tx, ty: p.ty, dir: 0, moving: false, wait: 0, speed: PEER_SPEED,
      seed: (parseInt(p.id.slice(0, 4), 16) || 7) % 97,
    });
  }

  movePeer(id: string, spot: string, x: number, y: number, tx: number, ty: number): void {
    const p = this.peers.get(id);
    if (!p) return;
    if (p.spot !== spot || Math.hypot(p.x - x, p.y - y) > SNAP_DISTANCE) {
      p.x = x;
      p.y = y;
    }
    p.spot = spot;
    p.tx = tx;
    p.ty = ty;
  }

  lookPeer(id: string, name: string, look: Record<string, string>): void {
    const p = this.peers.get(id);
    if (!p) return;
    p.name = name;
    p.look = normalizeLook(look);
  }

  removePeer(id: string): void {
    this.peers.delete(id);
  }

  /** 장소별 방 사람 수 (나는 빼고) */
  peerCounts(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const p of this.peers.values()) out[p.spot] = (out[p.spot] ?? 0) + 1;
    return out;
  }

  /** 지금 보이는, 이름이 있는 사람들 (나 포함) */
  namedWalkers(): NamedWalker[] {
    const list: NamedWalker[] = [];
    for (const p of this.peers.values()) if (p.spot === this.spot.key) list.push({ x: p.x, y: p.y, look: p.look, name: p.name, me: false });
    if (this.name) list.push({ x: this.me.x, y: this.me.y, look: this.me.look, name: this.name, me: true });
    return list;
  }

  /** 화면 좌표(저해상도 기준)로 걸어갈 곳을 정한다. 바닥 밖이면 가장자리로 맞춘다. */
  walkTo(x: number, y: number): void {
    const [x0, y0, x1, y1] = this.scene.floor;
    this.me.tx = Math.min(x1, Math.max(x0, x));
    this.me.ty = Math.min(y1, Math.max(y0, y));
  }

  update(dt: number): void {
    const k = this.keys;
    if (k.size) {
      const vx = Number(k.has('ArrowRight')) - Number(k.has('ArrowLeft'));
      const vy = Number(k.has('ArrowDown')) - Number(k.has('ArrowUp'));
      this.walkTo(this.me.x + vx * 10, this.me.y + vy * 10);
    }
    moveToward(this.me, dt);
    for (const p of this.peers.values()) moveToward(p, dt);
    const cl = this.spot.crowd;
    if (cl) {
      for (const f of this.far) {
        f.x += f.v * dt;
        if (f.x < cl.x0) f.x = cl.x1;
        if (f.x > cl.x1) f.x = cl.x0;
      }
    }
    for (const f of this.snow) {
      f.y += f.v * dt;
      f.x += Math.sin(f.y / 22 + f.ph) * SNOW_LAYERS[f.z].sway;
      if (f.y > H) {
        f.y = -2;
        f.x = Math.random() * W;
      }
    }
    // 눈 오는 날엔 걸은 자리에 발자국이 남았다가 사라진다
    if (this.spot.snow) {
      for (const p of this.prints) p.age += dt;
      while (this.prints.length && this.prints[0].age > PRINT_LIFE) this.prints.shift();
      for (const e of [this.me, ...this.peers.values()]) {
        if ((e as Peer).spot !== undefined && (e as Peer).spot !== this.spot.key) continue;
        const last = this.stride.get(e);
        if (!last || !e.moving) {
          this.stride.set(e, { x: e.x, y: e.y, left: last?.left ?? false });
          continue;
        }
        if (Math.hypot(e.x - last.x, e.y - last.y) >= 5) {
          const left = !last.left;
          this.prints.push({ x: Math.round(e.x + (left ? -2 : 2)), y: Math.round(e.y), age: 0 });
          if (this.prints.length > MAX_PRINTS) this.prints.shift();
          this.stride.set(e, { x: e.x, y: e.y, left });
        }
      }
    }
  }

  render(c: Ctx, t: number, nowMs: number): void {
    // 1) 빛을 받는 것들: 배경, 멀리 있는 사람, 기차, 캐릭터
    c.drawImage(this.bg, 0, 0, W, H);
    const cl = this.spot.crowd;
    if (cl) {
      for (const f of this.far) {
        const step = Math.floor(t * 6 + f.ph) % 2;
        R(c, f.x, cl.y - f.h - step, 2, f.h - 2, cl.col);
        R(c, f.x, cl.y - f.h - 2 - step, 2, 2, cl.col);
        R(c, f.x + (step ? 1 : 0), cl.y - 2, 1, 2, cl.col);
      }
    }
    for (const p of this.prints) {
      c.globalAlpha = 0.55 * (1 - p.age / PRINT_LIFE);
      R(c, p.x - 1, p.y - 1, 2, 1, '#8f9ab8');
      P(c, p.x - 1, p.y, '#b9c2d8');
    }
    c.globalAlpha = 1;
    for (const tr of this.scene.trains ?? []) drawTrain(c, t, tr);
    const here = [...this.peers.values()].filter((p) => p.spot === this.spot.key);
    const all: Walker[] = [...here, this.me].sort((a, b) => a.y - b.y);
    if (this.spot.glossy) for (const e of all) this.drawReflection(c, e, t);
    for (const e of all) drawAvatar(c, e, t);

    // 2) 밤이면 어둠을 덮고 광원 자리만 밝힌다
    // 캐릭터가 어둠에 묻히지 않도록 사람마다 은은한 빛을 둔다
    if (this.spot.night) this.lighting.draw(c, t, this.spot.night, [...this.glows, ...all.map((e) => ({ x: e.x, y: e.y - 16, r: 26, a: 0.3 }))]);

    // 3) 스스로 빛나는 것들은 어둠 위에: 전구, 반짝임, 미디어 파사드, 전광판
    for (const l of this.scene.lights) {
      // 제각각 깜빡임 + 아래에서 위로 올라가는 느린 빛 물결
      const b = ((Math.sin(t * l.s + l.p) + 1) / 2) * 0.65 + ((Math.sin(t * 1.6 + l.y * 0.045) + 1) / 2) * 0.35;
      if (b < 0.25 && !l.big) continue;
      // 반 칸 크기의 밝은 심 + 반 칸 빛살로 더 잘게 반짝인다
      c.globalAlpha = 0.45 + b * 0.55;
      R(c, l.x, l.y, 1, 1, l.col);
      if (b > 0.75 || l.big) {
        c.globalAlpha = Math.min(1, 0.35 + b * 0.5);
        R(c, l.x + 0.25, l.y + 0.25, 0.5, 0.5, '#ffffff');
        c.globalAlpha = 0.35 * b;
        R(c, l.x - 0.5, l.y + 0.25, 0.5, 0.5, l.col);
        R(c, l.x + 1, l.y + 0.25, 0.5, 0.5, l.col);
        R(c, l.x + 0.25, l.y - 0.5, 0.5, 0.5, l.col);
        R(c, l.x + 0.25, l.y + 1, 0.5, 0.5, l.col);
      }
    }
    c.globalAlpha = 1;
    for (const s of this.sparkles) {
      const b = (Math.sin(t * s.s + s.p) + 1) / 2;
      if (b <= 0.85) continue;
      c.globalAlpha = b - 0.5;
      for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) P(c, s.x + dx, s.y + dy, '#fff3c4');
    }
    c.globalAlpha = 1;
    this.scene.animate?.(c, t);
    if (this.scene.board) drawBoard(c, t, this.scene.board, nowMs);

    // 4) 먼 눈 → 그늘 → 가까운 눈 순서로 깊이를 낸다
    this.drawSnow(c, 0, 1);
    c.drawImage(this.vignette, 0, 0, W, H);
    this.drawSnow(c, 2, 2);
  }

  private drawSnow(c: Ctx, z0: number, z1: number): void {
    for (const f of this.snow) {
      if (f.z < z0 || f.z > z1) continue;
      const L = SNOW_LAYERS[f.z];
      c.globalAlpha = L.alpha;
      R(c, f.x, f.y, L.size, L.size, '#ffffff');
    }
    c.globalAlpha = 1;
  }

  /** 반짝이는 바닥에 비친 모습: 발밑을 기준으로 뒤집어 흐리게 그린다 */
  private drawReflection(c: Ctx, e: Walker, t: number): void {
    const m = this.mirror.getContext('2d')!;
    m.clearRect(0, 0, 48, 64);
    drawAvatar(m, { ...e, x: 24, y: 58 }, t);
    c.save();
    c.globalAlpha = 0.16;
    c.translate(0, 2 * Math.round(e.y));
    c.scale(1, -1);
    c.drawImage(this.mirror, Math.round(e.x) - 24, Math.round(e.y) - 58, 48, 64);
    c.restore();
  }
}

/** 목표 지점까지 걸어간다. 도착하면 true. */
function moveToward(a: Walker, dt: number): boolean {
  const dx = a.tx - a.x;
  const dy = a.ty - a.y;
  const dd = Math.hypot(dx, dy);
  if (dd < 0.6) {
    a.moving = false;
    a.x = a.tx;
    a.y = a.ty;
    return true;
  }
  const st = Math.min(dd, a.speed * dt);
  a.x += (dx / dd) * st;
  a.y += (dy / dd) * st;
  a.moving = true;
  a.dir = Math.abs(dx) > dd * 0.3 ? Math.sign(dx) : 0;
  return false;
}

function makeVignette(): HTMLCanvasElement {
  const cv = makeCanvas(W, H);
  const v = cv.getContext('2d')!;
  const g = v.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.38)');
  v.fillStyle = g;
  v.fillRect(0, 0, W, H);
  return cv;
}

// 빨강·크림 빈티지 장난감 기차
const TRAIN_CARS: [string, boolean][] = [['#c8202a', true], ['#f3e6c8', false], ['#c8202a', false], ['#f3e6c8', false]];
const CARGO = ['#ffd34d', '#ffffff', '#e8436a'];

/** 트리 앞쪽 반원만 지나가는 장난감 기차 */
function drawTrain(c: Ctx, t: number, T: TrainTrack): void {
  const u = (t * 0.06 * (T.speed ?? 1) + (T.phase ?? 0)) % 1.4;
  for (let k = Math.min(TRAIN_CARS.length, T.cars ?? 4) - 1; k >= 0; k--) {
    const a = Math.PI * (1 - (u - k * 0.07));
    if (a < 0 || a > Math.PI) continue;
    const x = Math.round(T.cx + Math.cos(a) * T.rx);
    const y = Math.round(T.cy + Math.sin(a) * T.ry);
    const [col, engine] = TRAIN_CARS[k];
    R(c, x - 7, y - 10, 14, 8, col);
    R(c, x - 7, y - 10, 14, 1, '#ffffff');
    R(c, x - 7, y - 3, 14, 1, mix(col, '#000000', 0.3));
    R(c, x - 5, y - 2, 3, 3, '#222');
    R(c, x + 2, y - 2, 3, 3, '#222');
    P(c, x - 4, y - 1, '#888');
    P(c, x + 3, y - 1, '#888');
    if (engine) {
      R(c, x - 7, y - 16, 6, 6, col);
      R(c, x - 6, y - 15, 4, 3, '#ffe9a8');
      R(c, x + 3, y - 15, 3, 5, '#333');
      R(c, x + 2, y - 16, 5, 1, '#555');
      R(c, x + 7, y - 6, 2, 3, '#f6c453');
      c.globalAlpha = 0.55;
      const p = Math.floor(t * 4) % 3;
      R(c, x + 4 + p, y - 19 - p * 2, 3, 2, '#ffffff');
      R(c, x + 6 + p, y - 23 - p * 2, 2, 2, '#ffffff');
      c.globalAlpha = 1;
    } else {
      const cargo = CARGO[k % CARGO.length];
      R(c, x - 4, y - 14, 8, 4, cargo);
      R(c, x, y - 14, 1, 4, '#d6334a');
      R(c, x - 4, y - 12, 8, 1, '#d6334a');
    }
  }
}
