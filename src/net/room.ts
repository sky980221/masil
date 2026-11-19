// Supabase Realtime으로 방에 붙는다.
// - 접속자 목록(presence): 이름·옷·장소처럼 가끔 바뀌는 정보, 들어오고 나가는 것
// - 브로드캐스트(move): 자주 바뀌는 이동
// 서버 코드 없이 Supabase가 메시지를 전달만 하므로, 받은 값은 모두 protocol.ts에서 거른다.
// 라이브러리는 방에 들어갈 때만 불러온다 (첫 화면 용량을 줄이려고)
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { type ActKind, type ActPayload, type MovePayload, type PeerState, type Presence, MOVE_INTERVAL, admitted, cleanAct, cleanMove, cleanPresence, diffPresence } from './protocol';

export type RoomStatus = 'connecting' | 'open' | 'reconnecting' | 'full';

export interface RoomHandlers {
  status(s: RoomStatus): void;
  welcome(peers: PeerState[]): void;
  join(peer: PeerState): void;
  move(m: MovePayload): void;
  look(m: { id: string; name: string; look: Record<string, string> }): void;
  leave(id: string): void;
  act(a: ActPayload): void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Supabase 주소와 공개 키가 설정돼 있어야 방을 쓸 수 있다. */
export function roomsAvailable(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}

let supabase: Promise<SupabaseClient> | null = null;
function getClient(): Promise<SupabaseClient> {
  supabase ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    }),
  );
  return supabase;
}

const toPeer = (p: Presence): PeerState => ({ id: p.id, name: p.name, look: p.look, spot: p.spot, x: p.x, y: p.y, tx: p.x, ty: p.y });

export class RoomClient {
  private channel: RealtimeChannel | null = null;
  private readonly me: Presence;
  private readonly known = new Map<string, Presence>();
  private welcomed = false;
  private stopped = false;
  private lastMoveAt = 0;
  private pendingMove: MovePayload | null = null;
  private moveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(roomId: string, me: Omit<Presence, 'joinedAt'>, private readonly on: RoomHandlers) {
    this.me = { ...me, joinedAt: Date.now() };
    on.status('connecting');
    void this.start(roomId);
  }

  private async start(roomId: string): Promise<void> {
    const sb = await getClient();
    if (this.stopped) return;
    const on = this.on;
    const channel = sb.channel(`masil:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: this.me.id } },
    });
    this.channel = channel;
    channel
      .on('presence', { event: 'sync' }, () => this.sync())
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const m = cleanMove(payload);
        if (!m || m.id === this.me.id || !this.known.has(m.id)) return;
        this.known.get(m.id)!.spot = m.spot;
        on.move(m);
      })
      .on('broadcast', { event: 'act' }, ({ payload }) => {
        const a = cleanAct(payload);
        if (!a || a.id === this.me.id || !this.known.has(a.id)) return;
        on.act(a);
      })
      .subscribe(async (status) => {
        if (this.stopped) return;
        if (status === 'SUBSCRIBED') {
          await channel.track(this.me);
          on.status('open');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          on.status('reconnecting');
        }
      });
  }

  /** 접속자 목록이 바뀔 때마다 들어온 사람·나간 사람·바뀐 사람을 가려 알린다. */
  private sync(): void {
    if (this.stopped || !this.channel) return;
    const state = this.channel.presenceState();
    const list: Presence[] = [];
    for (const [key, metas] of Object.entries(state)) {
      const p = cleanPresence(metas[metas.length - 1]);
      if (p && p.id === key) list.push(p);
    }
    if (!list.some((p) => p.id === this.me.id)) return; // 내 정보가 아직 안 올라감

    const ok = admitted(list);
    if (!ok.has(this.me.id)) {
      this.stopped = true;
      this.on.status('full');
      void this.channel.unsubscribe();
      return;
    }
    const others = list.filter((p) => p.id !== this.me.id && ok.has(p.id));

    if (!this.welcomed) {
      this.welcomed = true;
      others.forEach((p) => this.known.set(p.id, p));
      this.on.welcome(others.map(toPeer));
      return;
    }
    const d = diffPresence(this.known, others);
    this.known.clear();
    others.forEach((p) => this.known.set(p.id, p));
    d.joins.forEach((p) => this.on.join(toPeer(p)));
    d.looks.forEach((p) => this.on.look(p));
    d.moves.forEach((p) => this.on.move({ id: p.id, spot: p.spot, x: p.x, y: p.y, tx: p.x, ty: p.y }));
    d.leaves.forEach((id) => this.on.leave(id));
  }

  private broadcastMove(m: MovePayload): void {
    void this.channel?.send({ type: 'broadcast', event: 'move', payload: m });
  }

  /** 이동은 MOVE_INTERVAL마다 한 번만, 마지막 값을 보낸다. 장소가 바뀌면 접속자 정보도 고친다. */
  move(m: Omit<MovePayload, 'id'>): void {
    if (this.stopped) return;
    const payload = { ...m, id: this.me.id };
    const spotChanged = m.spot !== this.me.spot;
    Object.assign(this.me, { spot: m.spot, x: m.x, y: m.y });
    if (spotChanged) void this.channel?.track(this.me);

    const wait = this.lastMoveAt + MOVE_INTERVAL - Date.now();
    if (wait <= 0) {
      this.lastMoveAt = Date.now();
      this.broadcastMove(payload);
      return;
    }
    this.pendingMove = payload;
    if (this.moveTimer) return;
    this.moveTimer = setTimeout(() => {
      this.moveTimer = null;
      if (this.pendingMove) {
        this.lastMoveAt = Date.now();
        this.broadcastMove(this.pendingMove);
        this.pendingMove = null;
      }
    }, wait);
  }

  /** 점프·이모티콘·포즈는 바로 보낸다 (사람이 누를 때만 생기므로 잦지 않다) */
  act(k: ActKind, v: string): void {
    if (this.stopped) return;
    void this.channel?.send({ type: 'broadcast', event: 'act', payload: { id: this.me.id, k, v } });
  }

  look(name: string, look: Record<string, string>): void {
    if (this.stopped) return;
    Object.assign(this.me, { name, look });
    void this.channel?.track(this.me);
  }

  close(): void {
    this.stopped = true;
    if (this.moveTimer) clearTimeout(this.moveTimer);
    const ch = this.channel;
    if (ch) void getClient().then((sb) => sb.removeChannel(ch));
  }
}
