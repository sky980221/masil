// 방 서버와 연결을 유지하는 얇은 클라이언트. 끊기면 점점 간격을 늘려 다시 붙는다.
import { type ClientMessage, type PeerState, type ServerMessage, MOVE_INTERVAL } from './protocol';

export type RoomStatus = 'connecting' | 'open' | 'reconnecting' | 'full';

export interface RoomHandlers {
  status(s: RoomStatus): void;
  welcome(myId: string, peers: PeerState[]): void;
  join(peer: PeerState): void;
  move(m: Extract<ServerMessage, { t: 'move' }>): void;
  look(m: Extract<ServerMessage, { t: 'look' }>): void;
  leave(id: string): void;
}

type Hello = Extract<ClientMessage, { t: 'hello' }>;
type Move = Extract<ClientMessage, { t: 'move' }>;

/** 개발 중에는 같은 컴퓨터의 wrangler dev(8787)에 붙는다. 배포 때는 VITE_ROOM_SERVER를 넣는다. */
export function roomServerBase(): string | null {
  const env = import.meta.env.VITE_ROOM_SERVER as string | undefined;
  if (env) return env.replace(/\/$/, '');
  if (import.meta.env.DEV) return `ws://${location.hostname}:8787`;
  return null;
}

export class RoomClient {
  private ws: WebSocket | null = null;
  private stopped = false;
  private retry = 0;
  private lastMoveAt = 0;
  private pendingMove: Move | null = null;
  private moveTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly url: string,
    private readonly hello: () => Hello,
    private readonly on: RoomHandlers,
  ) {
    this.connect();
  }

  private connect(): void {
    this.on.status(this.retry ? 'reconnecting' : 'connecting');
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      ws.send(JSON.stringify(this.hello()));
      this.on.status('open');
    };
    ws.onmessage = (e) => {
      let m: ServerMessage;
      try {
        m = JSON.parse(String(e.data)) as ServerMessage;
      } catch {
        return;
      }
      switch (m.t) {
        case 'welcome': return this.on.welcome(m.id, m.peers ?? []);
        case 'join': return this.on.join(m.peer);
        case 'move': return this.on.move(m);
        case 'look': return this.on.look(m);
        case 'leave': return this.on.leave(m.id);
        case 'full':
          this.stopped = true;
          return this.on.status('full');
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws || this.stopped) return;
      this.retry++;
      this.on.status('reconnecting');
      this.retryTimer = setTimeout(() => this.connect(), Math.min(10_000, 500 * 2 ** this.retry));
    };
  }

  private send(m: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  /** 이동은 MOVE_INTERVAL마다 한 번만, 마지막 값을 보낸다. */
  move(m: Move): void {
    const wait = this.lastMoveAt + MOVE_INTERVAL - Date.now();
    if (wait <= 0) {
      this.lastMoveAt = Date.now();
      this.send(m);
      return;
    }
    this.pendingMove = m;
    if (this.moveTimer) return;
    this.moveTimer = setTimeout(() => {
      this.moveTimer = null;
      if (this.pendingMove) {
        this.lastMoveAt = Date.now();
        this.send(this.pendingMove);
        this.pendingMove = null;
      }
    }, wait);
  }

  look(name: string, look: Record<string, string>): void {
    this.send({ t: 'look', name, look });
  }

  close(): void {
    this.stopped = true;
    if (this.moveTimer) clearTimeout(this.moveTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
  }
}
