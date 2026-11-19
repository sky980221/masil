import { useEffect, useRef, useState } from 'react';
import type { Look } from '../avatar/options';
import type { World } from '../game/world';
import { RoomClient, type RoomStatus, roomServerBase } from './room';

export interface RoomInfo {
  status: RoomStatus | 'off';
  /** 장소별로 나를 뺀 방 사람 수 */
  counts: Record<string, number>;
  /** 나를 포함한 방 전체 인원 */
  total: number;
}

/**
 * roomId가 있으면 방 서버에 붙어 다른 사람을 광장에 그리고, 내 이동·옷을 보낸다.
 * 이름이 없으면(캐릭터를 아직 안 만들었으면) 붙지 않는다.
 */
export function useRoom(world: World, roomId: string | null, name: string, look: Look, spotKey: string): RoomInfo {
  const [status, setStatus] = useState<RoomInfo['status']>('off');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const client = useRef<RoomClient | null>(null);
  const latest = useRef({ name, look });
  latest.current = { name, look };
  const hasName = name !== '';

  useEffect(() => {
    const base = roomServerBase();
    if (!roomId || !hasName || !base) {
      setStatus('off');
      return;
    }
    const refresh = () => setCounts(world.peerCounts());
    world.setOnline(true);
    const me = world.me;
    const c = new RoomClient(
      `${base}/rooms/${encodeURIComponent(roomId)}`,
      () => ({ t: 'hello', name: latest.current.name, look: latest.current.look, spot: world.spot.key, x: me.x, y: me.y, tx: me.tx, ty: me.ty }),
      {
        status: setStatus,
        welcome: (_id, peers) => {
          world.peers.clear();
          peers.forEach((p) => world.upsertPeer(p));
          refresh();
        },
        join: (p) => {
          world.upsertPeer(p);
          refresh();
        },
        move: (m) => {
          world.movePeer(m.id, m.spot, m.x, m.y, m.tx, m.ty);
          refresh();
        },
        look: (m) => world.lookPeer(m.id, m.name, m.look),
        leave: (id) => {
          world.removePeer(id);
          refresh();
        },
      },
    );
    client.current = c;

    // 목적지나 장소가 바뀌었을 때만 보낸다. 상대 화면에서는 그쪽으로 걸어간다.
    let sent = '';
    const tick = setInterval(() => {
      const key = `${world.spot.key}|${Math.round(me.tx)}|${Math.round(me.ty)}`;
      if (key === sent) return;
      sent = key;
      c.move({ t: 'move', spot: world.spot.key, x: me.x, y: me.y, tx: me.tx, ty: me.ty });
    }, 50);

    return () => {
      clearInterval(tick);
      c.close();
      client.current = null;
      world.setOnline(false);
      setCounts({});
    };
  }, [world, roomId, hasName]);

  // 옷이나 이름을 바꾸면 알린다
  useEffect(() => {
    client.current?.look(name, look);
  }, [name, look]);

  // 장소를 바꾸면 바로 알린다 (위치가 초기화되므로)
  useEffect(() => {
    const me = world.me;
    client.current?.move({ t: 'move', spot: spotKey, x: me.x, y: me.y, tx: me.tx, ty: me.ty });
  }, [world, spotKey]);

  const total = 1 + Object.values(counts).reduce((a, b) => a + b, 0);
  return { status, counts, total };
}
