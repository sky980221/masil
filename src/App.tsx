import { useEffect, useState } from 'react';
import { type Look, normalizeLook } from './avatar/options';
import { SCHEDULE, clockNow, dayIndex } from './advent/calendar';
import { SPOTS } from './scenes';
import { World } from './game/world';
import { takePhoto } from './game/photo';
import { load, save } from './lib/storage';
import { cleanName } from './lib/name';
import { Stage } from './components/Stage';
import { AdventPanel } from './components/AdventPanel';
import { Wardrobe } from './components/Wardrobe';
import { Creator } from './components/Creator';
import { PhotoDialog, RevealDialog } from './components/Dialogs';
import { RoomPanel } from './components/RoomPanel';
import { cleanRoomId, newRoomId } from './net/protocol';
import { useRoom } from './net/useRoom';

function initialSpot(): number {
  const key = load<string>('spot', '');
  return Math.max(0, SPOTS.findIndex((s) => s.key === key));
}

/** 주소의 ?room= 값을 바꾼다. ?date= 같은 다른 값은 그대로 둔다. */
function setRoomInUrl(id: string | null): void {
  const url = new URL(location.href);
  if (id) url.searchParams.set('room', id);
  else url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

export function App() {
  const [name, setName] = useState(() => cleanName(load<string>('name', '')) ?? '');
  const [look, setLook] = useState<Look>(() => normalizeLook(load('look', null)));
  const [opened, setOpened] = useState(() => new Set(load<number[]>('opened', [])));
  const [seen, setSeen] = useState(() => new Set(load<number[]>('seen', [])));
  const [spot, setSpot] = useState(initialSpot);
  const [today, setToday] = useState(() => dayIndex(clockNow()));
  const [adventOpen, setAdventOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [reveal, setReveal] = useState<{ index: number; isNew: boolean } | null>(null);
  const [photo, setPhoto] = useState<{ url: string; fileName: string } | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  // 광장은 한 번만 만들고, 장소와 옷은 아래 effect에서 바꿔 끼운다
  const [world] = useState(() => new World(look, spot));

  const [roomId, setRoomId] = useState(() => cleanRoomId(new URLSearchParams(location.search).get('room')));
  const room = useRoom(world, roomId, name, look, SPOTS[spot].key);

  useEffect(() => world.setLook(look), [world, look]);
  useEffect(() => {
    world.name = name;
  }, [world, name]);
  useEffect(() => world.setSpot(spot), [world, spot]);
  useEffect(() => save('name', name), [name]);
  useEffect(() => save('look', look), [look]);
  useEffect(() => save('opened', [...opened]), [opened]);
  useEffect(() => save('seen', [...seen]), [seen]);
  useEffect(() => save('spot', SPOTS[spot].key), [spot]);
  useEffect(() => {
    const id = setInterval(() => setToday(dayIndex(clockNow())), 60_000);
    return () => clearInterval(id);
  }, []);

  const hasGift = SCHEDULE.some((_, i) => i <= today && !opened.has(i));
  const creating = !name;
  const anyOverlay = creating || wardrobeOpen || !!reveal || !!photo;

  const shoot = async () => {
    setFlashKey((k) => k + 1);
    const url = await takePhoto(world, performance.now() / 1000, name, clockNow());
    setPhoto({ url, fileName: `masil-${SPOTS[spot].key}-${Date.now()}.png` });
  };

  return (
    <div className="app">
      <header className="top">
        <h1 className="logo">
          <small>누워서 가는 트리 명소</small>
          <span>마실</span>
        </h1>
        {name && (
          <button className="name-chip" onClick={() => setWardrobeOpen(true)} aria-label="옷장 열기, 이름 바꾸기">
            {name}님
          </button>
        )}
      </header>

      <nav className="spots" aria-label="명소 고르기">
        {SPOTS.map((s, i) => {
          const n = room.counts[s.key] ?? 0;
          return (
            <button key={s.key} aria-pressed={i === spot} onClick={() => setSpot(i)} aria-label={n ? `${s.chip}, 방 사람 ${n}명` : s.chip}>
              {s.chip}
              {n > 0 && <span className="spot-count">{n}</span>}
            </button>
          );
        })}
      </nav>

      <Stage world={world} keysEnabled={!anyOverlay} flashKey={flashKey} />

      <div className="actions">
        <button className={`gift-btn${hasGift ? ' has' : ''}`} aria-expanded={adventOpen} onClick={() => setAdventOpen(!adventOpen)}>
          선물 달력{hasGift && <span className="dot">NEW</span>}
        </button>
        <button onClick={() => setWardrobeOpen(true)}>옷장</button>
        <button className="red" onClick={shoot}>
          사진 찍기
        </button>
      </div>

      <AdventPanel
        today={today}
        opened={opened}
        hidden={!adventOpen}
        onOpen={(i) => {
          setOpened(new Set(opened).add(i));
          setReveal({ index: i, isNew: true });
        }}
        onShow={(i) => setReveal({ index: i, isNew: false })}
      />

      <RoomPanel
        roomId={roomId}
        info={room}
        onCreate={() => {
          const id = newRoomId();
          setRoomInUrl(id);
          setRoomId(id);
        }}
        onLeave={() => {
          setRoomInUrl(null);
          setRoomId(null);
        }}
      />

      <footer className="note">
        실제 명소를 참고해 새로 그린 픽셀 그림이에요. 각 장소·회사와 관계없는 비공식 프로젝트예요.
        {roomId ? ' 방에서는 링크로 들어온 사람만 보여요.' : ' 방에 들어가기 전에는 다른 방문자가 시연용으로 움직여요.'}
      </footer>

      {creating && (
        <Creator
          opened={opened}
          onDone={(n, l) => {
            setLook(l);
            setName(n);
          }}
        />
      )}
      {wardrobeOpen && (
        <Wardrobe
          look={look}
          name={name}
          opened={opened}
          seen={seen}
          onSave={(l, n) => {
            setLook(l);
            setName(n);
            setWardrobeOpen(false);
          }}
          onClose={(ids) => {
            if (ids.length) setSeen(new Set([...seen, ...ids]));
            setWardrobeOpen(false);
          }}
        />
      )}
      {reveal && (
        <RevealDialog
          index={reveal.index}
          isNew={reveal.isNew}
          look={look}
          onWear={() => {
            const [cat, opt] = SCHEDULE[reveal.index];
            setLook({ ...look, [cat]: opt });
            setSeen(new Set(seen).add(reveal.index));
            setReveal(null);
          }}
          onClose={() => setReveal(null)}
        />
      )}
      {photo && <PhotoDialog url={photo.url} fileName={photo.fileName} onClose={() => setPhoto(null)} />}
    </div>
  );
}
