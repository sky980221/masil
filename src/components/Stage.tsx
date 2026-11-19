import { type ReactNode, useEffect, useRef, useState } from 'react';
import { W, H, SS, prepare } from '../engine/pixel';
import { headTop } from '../avatar/draw';
import { clockNow } from '../advent/calendar';
import type { World } from '../game/world';
import { EmoteButtons } from './EmoteButtons';

interface Props {
  world: World;
  /** 창이 떠 있으면 방향키 이동을 막는다 */
  keysEnabled: boolean;
  /** 값이 바뀔 때마다 사진 플래시를 터뜨린다 */
  flashKey: number;
  /** 광장 위에 겹쳐 띄울 것 (포즈 줄 등) */
  overlay?: ReactNode;
}

/** 광장 캔버스. 매 프레임 갱신·그리기를 하고, 이름 있는 사람들 머리 위에 이름표를 붙인다. */
export function Stage({ world, keysEnabled, flashKey, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(true);
  // 두 번 탭하면 점프
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    prepare(ctx);
    const box = tagsRef.current!;
    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      world.update(dt);
      const now = clockNow();
      world.render(ctx, ts / 1000, now);
      // 점등·쇼·날씨 안내 (바뀔 때만 글자를 고친다)
      const st = statusRef.current;
      const text = world.status(now);
      if (st && st.textContent !== text) st.textContent = text;

      // 이름표: 필요한 만큼 div를 늘리고 줄인다
      const people = world.namedWalkers();
      while (box.children.length < people.length) box.appendChild(document.createElement('div'));
      while (box.children.length > people.length) box.lastChild!.remove();
      const k = cv.clientWidth / W;
      people.forEach((p, i) => {
        const el = box.children[i] as HTMLDivElement;
        const cls = p.me ? 'tag me' : 'tag';
        if (el.className !== cls) el.className = cls;
        if (el.textContent !== p.name) el.textContent = p.name;
        el.style.left = `${Math.round(p.x * k)}px`;
        el.style.top = `${Math.round((p.y - headTop(p.look) - 2) * k - 6)}px`;
        el.style.zIndex = String(Math.round(p.y));
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [world]);

  useEffect(() => {
    if (!keysEnabled) {
      world.keys.clear();
      return;
    }
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space' && tag !== 'BUTTON') {
        e.preventDefault();
        world.jump();
        setHint(false);
        return;
      }
      if (!e.key.startsWith('Arrow')) return;
      world.keys.add(e.key);
      e.preventDefault();
      setHint(false);
    };
    const up = (e: KeyboardEvent) => world.keys.delete(e.key);
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    return () => {
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
    };
  }, [world, keysEnabled]);

  useEffect(() => {
    const id = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const f = flashRef.current;
    if (!flashKey || !f) return;
    f.style.transition = 'none';
    f.style.opacity = '1';
    requestAnimationFrame(() => {
      f.style.transition = 'opacity .35s';
      f.style.opacity = '0';
    });
  }, [flashKey]);

  return (
    <div className="frame">
      <div className="stage">
        <canvas
          ref={canvasRef}
          id="cv"
          width={W * SS}
          height={H * SS}
          aria-label={`${world.spot.name}. 바닥을 누르면 그 자리로 걸어가요.`}
          onPointerDown={(e) => {
            const now = performance.now();
            const prev = lastTap.current;
            lastTap.current = { t: now, x: e.clientX, y: e.clientY };
            setHint(false);
            if (now - prev.t < 320 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 24) {
              world.jump();
              return;
            }
            const rc = e.currentTarget.getBoundingClientRect();
            world.walkTo(((e.clientX - rc.left) / rc.width) * W, ((e.clientY - rc.top) / rc.height) * H);
          }}
        />
        <div ref={tagsRef} className="tags" aria-hidden="true" />
        <div ref={flashRef} className="flash" />
        <div ref={statusRef} className="status" aria-live="polite" />
        <div className="hint" style={{ opacity: hint ? 1 : 0 }}>
          바닥을 누르면 걸어가요 · 두 번 누르면 점프
        </div>
        <EmoteButtons world={world} />
        {overlay}
      </div>
    </div>
  );
}
