// 광장 하나의 상태: 배경, 걸어 다니는 아바타들, 눈, 반짝임. 그리기와 갱신만 맡고 UI는 모른다.
import { type Ctx, W, H, R, P, mix, rng, makeCanvas } from '../engine/pixel';
import { type Look, normalizeLook, randomLook } from '../avatar/options';
import { type AvatarPose, drawAvatar } from '../avatar/draw';
import { SPOTS, type Spot, type SceneBuild, type TrainTrack } from '../scenes';
import type { PeerState } from '../net/protocol';
import { drawBoard } from './board';

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
  big: boolean;
}

interface Sparkle {
  x: number;
  y: number;
  p: number;
  s: number;
}

const NPC_COUNT = 7;
const MY_SPEED = 55;

export class World {
  spot!: Spot;
  scene!: SceneBuild;
  private bg = makeCanvas(W, H);
  private vignette = makeVignette();
  npcs: Walker[] = [];
  me: Walker;
  name = '';
  /** 방에 들어가 있으면 시연용 방문자를 빼고 진짜 사람만 보여 준다 */
  private online = false;
  readonly peers = new Map<string, Peer>();
  private snow: Flake[] = [];
  private sparkles: Sparkle[] = [];
  readonly keys = new Set<string>();
  private cache = new Map<string, { bg: HTMLCanvasElement; scene: SceneBuild }>();

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
      const scene = spot.build(bg.getContext('2d')!, rng(1000 + SPOTS.indexOf(spot) * 77));
      hit = { bg, scene };
      this.cache.set(spot.key, hit);
    }
    this.bg = hit.bg;
    this.scene = hit.scene;

    const [, y0, , y1] = this.scene.floor;
    this.me.x = this.me.tx = 135;
    this.me.y = this.me.ty = Math.min(y1, y0 + 50);
    this.spawnNpcs();
    this.snow = spot.snow
      ? Array.from({ length: 120 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 10 + Math.random() * 20, ph: Math.random() * 7, big: Math.random() < 0.22 }))
      : [];
    this.sparkles = spot.snow
      ? []
      : Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * 300, p: Math.random() * 7, s: 1 + Math.random() * 2 }));
  }

  private spawnNpcs(): void {
    if (this.online) {
      this.npcs = [];
      return;
    }
    const [x0, y0, x1, y1] = this.scene.floor;
    const r = rng((Date.now() & 0xffff) + 1);
    this.npcs = Array.from({ length: NPC_COUNT }, (_, k) => {
      const x = x0 + r() * (x1 - x0);
      const y = y0 + r() * (y1 - y0);
      return { x, y, tx: x, ty: y, dir: 0, moving: false, wait: r() * 4, speed: 12 + r() * 12, seed: k * 5 + 1, look: randomLook(r) };
    });
  }

  setLook(look: Look): void {
    this.me.look = look;
  }

  setOnline(on: boolean): void {
    if (this.online === on) return;
    this.online = on;
    if (!on) this.peers.clear();
    this.spawnNpcs();
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
    const [x0, y0, x1, y1] = this.scene.floor;
    for (const e of this.npcs) {
      if (e.wait > 0) {
        e.wait -= dt;
        e.moving = false;
        continue;
      }
      if (moveToward(e, dt)) {
        e.wait = 1 + Math.random() * 5;
        e.tx = x0 + Math.random() * (x1 - x0);
        e.ty = y0 + Math.random() * (y1 - y0);
        if (Math.random() < 0.4) e.dir = 0;
      }
    }
    for (const f of this.snow) {
      f.y += f.v * dt;
      f.x += Math.sin(f.y / 22 + f.ph) * 0.2;
      if (f.y > H) {
        f.y = -2;
        f.x = Math.random() * W;
      }
    }
  }

  render(c: Ctx, t: number, nowMs: number): void {
    c.drawImage(this.bg, 0, 0);
    // 전구: 어두울 때는 배경에 깔린 흐린 점만 보이고, 밝을 때 겹쳐 그린다
    for (const l of this.scene.lights) {
      const b = (Math.sin(t * l.s + l.p) + 1) / 2;
      if (b < 0.25 && !l.big) continue;
      c.globalAlpha = 0.45 + b * 0.55;
      P(c, l.x, l.y, l.col);
      if (b > 0.8 || l.big) {
        c.globalAlpha = 0.3 * b;
        P(c, l.x - 1, l.y, l.col);
        P(c, l.x + 1, l.y, l.col);
        P(c, l.x, l.y - 1, l.col);
        P(c, l.x, l.y + 1, l.col);
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
    if (this.scene.train) drawTrain(c, t, this.scene.train);
    const here = [...this.peers.values()].filter((p) => p.spot === this.spot.key);
    const all: Walker[] = [...this.npcs, ...here, this.me].sort((a, b) => a.y - b.y);
    for (const e of all) drawAvatar(c, e, t);
    for (const f of this.snow) {
      c.globalAlpha = f.big ? 0.95 : 0.7;
      R(c, f.x, f.y, f.big ? 2 : 1, f.big ? 2 : 1, '#ffffff');
    }
    c.globalAlpha = 1;
    c.drawImage(this.vignette, 0, 0);
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

const TRAIN_CARS: [string, boolean][] = [['#d6334a', true], ['#3f7fd6', false], ['#2f9a62', false], ['#f6c453', false]];
const CARGO = ['#ffd34d', '#ffffff', '#e8436a'];

/** 트리 앞쪽 반원만 지나가는 장난감 기차 */
function drawTrain(c: Ctx, t: number, T: TrainTrack): void {
  const u = (t * 0.06) % 1.4;
  for (let k = TRAIN_CARS.length - 1; k >= 0; k--) {
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
