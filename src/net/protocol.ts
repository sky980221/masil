// 방 서버와 앱이 주고받는 메시지. 서버(server/)와 앱이 이 파일을 같이 쓴다.
// 들어온 값은 믿지 않고 항상 아래 clean* 함수로 걸러서 쓴다.

export const ROOM_CAPACITY = 12;
export const MAX_MESSAGE_BYTES = 2048;
/** 이동 메시지는 이 간격보다 자주 보내지 않는다 (ms) */
export const MOVE_INTERVAL = 100;

/** 다른 사람에게 보이는 내 모습 */
export interface PeerState {
  id: string;
  name: string;
  /** 꾸미기 항목. 앱에서 normalizeLook으로 한 번 더 거른다. */
  look: Record<string, string>;
  spot: string;
  x: number;
  y: number;
  /** 걸어가는 목적지 */
  tx: number;
  ty: number;
}

export type ClientMessage =
  | { t: 'hello'; name: string; look: Record<string, string>; spot: string; x: number; y: number; tx: number; ty: number }
  | { t: 'move'; spot: string; x: number; y: number; tx: number; ty: number }
  | { t: 'look'; name: string; look: Record<string, string> };

export type ServerMessage =
  | { t: 'welcome'; id: string; peers: PeerState[] }
  | { t: 'join'; peer: PeerState }
  | { t: 'move'; id: string; spot: string; x: number; y: number; tx: number; ty: number }
  | { t: 'look'; id: string; name: string; look: Record<string, string> }
  | { t: 'leave'; id: string }
  | { t: 'full' };

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

function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  // 제어 문자를 빼고 길이를 글자 수 기준으로 자른다
  return [...raw.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, max).join('');
}

export function cleanName(raw: unknown): string {
  return cleanText(raw, 8) || '손님';
}

/** 항목 이름과 값 모두 짧은 영문 키만 받는다. 실제로 있는 항목인지는 앱에서 확인한다. */
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

export function parseClientMessage(text: string): ClientMessage | null {
  if (text.length > MAX_MESSAGE_BYTES) return null;
  let m: unknown;
  try {
    m = JSON.parse(text);
  } catch {
    return null;
  }
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  const pos = { x: cleanCoord(o.x, 270), y: cleanCoord(o.y, 480), tx: cleanCoord(o.tx, 270), ty: cleanCoord(o.ty, 480) };
  switch (o.t) {
    case 'hello':
      return { t: 'hello', name: cleanName(o.name), look: cleanLook(o.look), spot: cleanSpot(o.spot), ...pos };
    case 'move':
      return { t: 'move', spot: cleanSpot(o.spot), ...pos };
    case 'look':
      return { t: 'look', name: cleanName(o.name), look: cleanLook(o.look) };
    default:
      return null;
  }
}
