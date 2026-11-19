import { useEffect, useRef, useState } from 'react';
import { W, H } from '../engine/pixel';
import { headTop } from '../avatar/draw';
import { clockNow } from '../advent/calendar';
import type { World } from '../game/world';

interface Props {
  world: World;
  name: string;
  /** 창이 떠 있으면 방향키 이동을 막는다 */
  keysEnabled: boolean;
  /** 값이 바뀔 때마다 사진 플래시를 터뜨린다 */
  flashKey: number;
}

/** 광장 캔버스. 매 프레임 갱신·그리기를 하고, 내 캐릭터 머리 위에 이름표를 붙인다. */
export function Stage({ world, name, keysEnabled, flashKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      world.update(dt);
      world.render(ctx, ts / 1000, clockNow());
      const tag = tagRef.current;
      if (tag) {
        const k = cv.clientWidth / W;
        tag.style.left = `${Math.round(world.me.x * k)}px`;
        tag.style.top = `${Math.round((world.me.y - headTop(world.me.look) - 2) * k - 6)}px`;
      }
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
      if (!e.key.startsWith('Arrow') || (e.target as HTMLElement).tagName === 'INPUT') return;
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
          width={W}
          height={H}
          aria-label={`${world.spot.name}. 바닥을 누르면 그 자리로 걸어가요.`}
          onPointerDown={(e) => {
            const rc = e.currentTarget.getBoundingClientRect();
            world.walkTo(((e.clientX - rc.left) / rc.width) * W, ((e.clientY - rc.top) / rc.height) * H);
            setHint(false);
          }}
        />
        {name && (
          <div ref={tagRef} className="tag">
            {name}
          </div>
        )}
        <div ref={flashRef} className="flash" />
        <div className="hint" style={{ opacity: hint ? 1 : 0 }}>
          바닥을 누르면 걸어가요
        </div>
      </div>
    </div>
  );
}
