// 마실 방 서버. GET /rooms/:id 로 웹소켓을 열면 그 방(Durable Object)에 들어간다.
// 방은 사람이 있는 동안만 메모리에 살아 있고, 아무것도 디스크에 저장하지 않는다.
import { DurableObject } from 'cloudflare:workers';
import {
  type PeerState,
  type ServerMessage,
  MOVE_INTERVAL,
  ROOM_CAPACITY,
  cleanRoomId,
  parseClientMessage,
} from '../../src/net/protocol';

export interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  ALLOWED_ORIGINS?: string;
}

/** 소켓마다 붙여 두는 정보. 서버가 잠들었다 깨어나도 남아 있다. */
interface Seat extends PeerState {
  lastMove: number;
}

const toPeer = ({ lastMove: _lastMove, ...peer }: Seat): PeerState => peer;

export class Room extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('웹소켓으로만 들어올 수 있어요', { status: 426 });
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    if (this.ctx.getWebSockets().length > ROOM_CAPACITY) {
      this.send(server, { t: 'full' });
      server.close(4001, 'room full');
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== 'string') return;
    const m = parseClientMessage(raw);
    if (!m) return;
    const me = ws.deserializeAttachment() as Seat | null;

    if (m.t === 'hello') {
      if (me) return;
      const seat: Seat = { id: crypto.randomUUID().slice(0, 8), name: m.name, look: m.look, spot: m.spot, x: m.x, y: m.y, tx: m.tx, ty: m.ty, lastMove: 0 };
      ws.serializeAttachment(seat);
      this.send(ws, { t: 'welcome', id: seat.id, peers: this.seats(ws).map(toPeer) });
      this.broadcast(ws, { t: 'join', peer: toPeer(seat) });
      return;
    }
    if (!me) return;

    if (m.t === 'move') {
      // 너무 잦은 이동은 버린다
      const now = Date.now();
      if (now - me.lastMove < MOVE_INTERVAL / 2) return;
      Object.assign(me, { spot: m.spot, x: m.x, y: m.y, tx: m.tx, ty: m.ty, lastMove: now });
      ws.serializeAttachment(me);
      this.broadcast(ws, { t: 'move', id: me.id, spot: me.spot, x: me.x, y: me.y, tx: me.tx, ty: me.ty });
    } else if (m.t === 'look') {
      Object.assign(me, { name: m.name, look: m.look });
      ws.serializeAttachment(me);
      this.broadcast(ws, { t: 'look', id: me.id, name: me.name, look: me.look });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.leave(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.leave(ws);
  }

  private leave(ws: WebSocket): void {
    const me = ws.deserializeAttachment() as Seat | null;
    if (me) this.broadcast(ws, { t: 'leave', id: me.id });
    try {
      ws.close(1000, 'bye');
    } catch {
      /* 이미 닫힘 */
    }
  }

  /** ws를 뺀, 인사를 마친 사람들 */
  private seats(except: WebSocket): Seat[] {
    return this.ctx
      .getWebSockets()
      .filter((w) => w !== except)
      .map((w) => w.deserializeAttachment() as Seat | null)
      .filter((s): s is Seat => !!s);
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* 끊긴 소켓 */
    }
  }

  private broadcast(except: WebSocket, msg: ServerMessage): void {
    const text = JSON.stringify(msg);
    for (const w of this.ctx.getWebSockets()) {
      if (w === except || !w.deserializeAttachment()) continue;
      try {
        w.send(text);
      } catch {
        /* 끊긴 소켓 */
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/rooms\/([^/]+)$/);
    if (!match) return new Response('마실 방 서버', { headers: { 'content-type': 'text/plain; charset=utf-8' } });

    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin');
    if (allowed.length && (!origin || !allowed.includes(origin))) return new Response('허용되지 않은 주소예요', { status: 403 });

    const id = cleanRoomId(decodeURIComponent(match[1]));
    if (!id) return new Response('방 이름이 올바르지 않아요', { status: 400 });
    return env.ROOMS.get(env.ROOMS.idFromName(id)).fetch(request);
  },
} satisfies ExportedHandler<Env>;
