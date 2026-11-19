// 방에서 주고받는 데이터 모양과 거르는 규칙.
// Supabase Realtime 채널은 누구나 아무 값이나 보낼 수 있으므로, 받은 값은 항상 clean* 함수로 걸러서 쓴다.

export const ROOM_CAPACITY = 12;
/** 이동은 이 간격보다 자주 보내지 않는다 (ms) */
export const MOVE_INTERVAL = 100;
/** 받은 데이터가 이보다 크면 버린다 (JSON 글자 수) */
export const MAX_PAYLOAD = 2048;

/** 접속자 목록(presence)에 올리는 내 정보. 이름·옷·장소처럼 가끔 바뀌는 것 */
export interface Presence {
  id: string;
  name: string;
  look: Record<string, string>;
  spot: string;
  x: number;
  y: number;
  /** 방에 들어온 시각. 정원이 넘쳤을 때 늦게 온 사람을 가린다. */
  joinedAt: number;
}

/** 자주 바뀌는 이동은 브로드캐스트로 따로 보낸다 */
export interface MovePayload {
  id: string;
  spot: string;
  x: number;
  y: number;
  /** 걸어가는 목적지 */
  tx: number;
  ty: number;
}

export interface PeerState extends MovePayload {
  name: string;
  look: Record<string, string>;
}

const ROOM_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 방 이름: 영문 소문자·숫자·하이픈, 3~32자 */
export function cleanRoomId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  return s.length >= 3 && s.length <= 32 && ROOM_RE.test(s) ? s : null;
}

const ROOM_WORDS = ['snow', 'star', 'bell', 'tree', 'deer', 'gift', 'mitten', 'cocoa', 'candle', 'cookie'];

export function newRoomId(rand: () => number = Math.random): string {
  const w = ROOM_WORDS[Math.floor(rand() * ROOM_WORDS.length)];
  const n = Math.floor(rand() * 9000) + 1000;
  return `${w}-${n}`;
}

export function newPeerId(rand: () => number = Math.random): string {
  return Array.from({ length: 8 }, () => Math.floor(rand() * 16).toString(16)).join('');
}

function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  // 제어 문자를 빼고 글자 수 기준으로 자른다
  return [...raw.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, max).join('');
}

export function cleanName(raw: unknown): string {
  return cleanText(raw, 8) || '손님';
}

/** 항목 이름과 값 모두 짧은 영문 키만 받는다. 실제로 있는 항목인지는 normalizeLook에서 확인한다. */
export function cleanLook(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= 16) break;
    if (/^[a-z]{1,12}$/.test(k) && typeof v === 'string' && /^[a-z]{1,16}$/.test(v)) {
      out[k] = v;
      n++;
    }
  }
  return out;
}

export function cleanSpot(raw: unknown): string {
  return typeof raw === 'string' && /^[a-z]{1,16}$/.test(raw) ? raw : '';
}

/** 좌표는 캔버스(270×480) 안으로 자른다 */
export function cleanCoord(raw: unknown, max: number): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  return Math.round(Math.min(max, Math.max(0, n)) * 10) / 10;
}

function cleanId(raw: unknown): string | null {
  return typeof raw === 'string' && /^[0-9a-f]{8}$/.test(raw) ? raw : null;
}

function asObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    if (JSON.stringify(raw).length > MAX_PAYLOAD) return null;
  } catch {
    return null;
  }
  return raw as Record<string, unknown>;
}

export function cleanMove(raw: unknown): MovePayload | null {
  const o = asObject(raw);
  const id = o && cleanId(o.id);
  if (!o || !id) return null;
  return { id, spot: cleanSpot(o.spot), x: cleanCoord(o.x, 270), y: cleanCoord(o.y, 480), tx: cleanCoord(o.tx, 270), ty: cleanCoord(o.ty, 480) };
}

export function cleanPresence(raw: unknown): Presence | null {
  const o = asObject(raw);
  const id = o && cleanId(o.id);
  if (!o || !id) return null;
  const joinedAt = typeof o.joinedAt === 'number' && Number.isFinite(o.joinedAt) ? o.joinedAt : 0;
  return { id, name: cleanName(o.name), look: cleanLook(o.look), spot: cleanSpot(o.spot), x: cleanCoord(o.x, 270), y: cleanCoord(o.y, 480), joinedAt };
}

export interface PresenceDiff {
  joins: Presence[];
  /** 이름이나 옷이 바뀐 사람 */
  looks: Presence[];
  /** 장소를 옮긴 사람 */
  moves: Presence[];
  leaves: string[];
}

/** 이전에 알던 사람들과 새 접속자 목록을 비교한다. */
export function diffPresence(prev: ReadonlyMap<string, Presence>, next: Presence[]): PresenceDiff {
  const d: PresenceDiff = { joins: [], looks: [], moves: [], leaves: [] };
  const ids = new Set<string>();
  for (const p of next) {
    ids.add(p.id);
    const old = prev.get(p.id);
    if (!old) d.joins.push(p);
    else {
      if (old.name !== p.name || JSON.stringify(old.look) !== JSON.stringify(p.look)) d.looks.push(p);
      if (old.spot !== p.spot) d.moves.push(p);
    }
  }
  for (const id of prev.keys()) if (!ids.has(id)) d.leaves.push(id);
  return d;
}

/**
 * 정원이 넘쳤을 때 들어갈 수 있는 사람들. 먼저 온 순서, 같으면 id 순서.
 * 모두가 같은 목록을 보고 같은 결론을 내리므로, 밀려난 사람은 스스로 나간다.
 */
export function admitted(list: Pick<Presence, 'id' | 'joinedAt'>[], capacity = ROOM_CAPACITY): Set<string> {
  const sorted = [...list].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  return new Set(sorted.slice(0, capacity).map((p) => p.id));
}
