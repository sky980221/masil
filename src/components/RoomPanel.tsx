import { useRef, useState } from 'react';
import { ROOM_CAPACITY } from '../net/protocol';
import type { RoomInfo } from '../net/useRoom';
import { roomServerBase } from '../net/room';

interface Props {
  roomId: string | null;
  info: RoomInfo;
  onCreate: () => void;
  onLeave: () => void;
}

const STATUS_TEXT: Record<RoomInfo['status'], string> = {
  off: '',
  connecting: '연결하는 중',
  open: '연결됨',
  reconnecting: '다시 연결하는 중',
  full: `방이 꽉 찼어요 (최대 ${ROOM_CAPACITY}명)`,
};

/** 친구와 같은 광장에 모이는 방. 링크를 가진 사람만 들어온다. */
export function RoomPanel({ roomId, info, onCreate, onLeave }: Props) {
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const available = roomServerBase() !== null;

  if (!roomId) {
    return (
      <section className="panel px room" aria-label="같이 보기">
        <div className="panel-title">
          <h2>같이 보기</h2>
          <p>링크를 받은 사람만 같은 광장에 모여요</p>
        </div>
        <button className="red" onClick={onCreate} disabled={!available}>
          방 만들고 링크 받기
        </button>
        {!available && <p className="room-note">방 서버 주소가 아직 설정되지 않았어요.</p>}
      </section>
    );
  }

  const link = location.href;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      linkRef.current?.select();
    }
  };

  return (
    <section className="panel px room" aria-label="같이 보기">
      <div className="panel-title">
        <h2>방 {roomId}</h2>
        <p className={`room-status s-${info.status}`}>
          {STATUS_TEXT[info.status]}
          {info.status === 'open' && ` · ${info.total}명`}
        </p>
      </div>
      <label className="field">
        이 링크를 보내면 같이 볼 수 있어요
        <input ref={linkRef} id="roomLink" type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
      </label>
      <div className="row room-actions">
        <button onClick={onLeave}>방 나가기</button>
        <button className="red" onClick={copy}>
          {copied ? '복사했어요' : '링크 복사'}
        </button>
      </div>
    </section>
  );
}
