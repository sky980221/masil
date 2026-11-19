import { useEffect, useRef, useState } from 'react';
import { type Pose, POSES } from '../avatar/draw';
import type { World } from '../game/world';

interface Props {
  world: World;
  /** 카운트다운이 끝나면 부른다 */
  onShoot: () => Promise<void> | void;
  onClose: () => void;
}

/** 사진 찍기 전에 포즈를 고르는 줄. 고르면 캐릭터가 바로 그 포즈를 하고, 3·2·1 뒤에 찍는다. */
export function PoseBar({ world, onShoot, onClose }: Props) {
  const [pose, setPose] = useState<Pose>(world.me.pose ?? 'none');
  const [count, setCount] = useState<number | null>(null);
  // 부모가 다시 그려져도 카운트다운이 끊기지 않게 최신 콜백만 기억한다
  const cb = useRef({ onShoot, onClose });
  cb.current = { onShoot, onClose };

  useEffect(() => {
    world.setPose(pose);
  }, [world, pose]);

  // 닫히면 포즈를 푼다
  useEffect(() => () => world.setPose('none'), [world]);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      void Promise.resolve(cb.current.onShoot()).then(() => cb.current.onClose());
      return;
    }
    const id = setTimeout(() => setCount(count - 1), 800);
    return () => clearTimeout(id);
  }, [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && count === null && cb.current.onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [count]);

  return (
    <>
      {count !== null && count > 0 && (
        <div className="countdown" aria-live="assertive">
          {count}
        </div>
      )}
      <div className="posebar" role="group" aria-label="사진 포즈 고르기">
        <div className="poses">
          {POSES.map((p) => (
            <button key={p.key} aria-pressed={pose === p.key} disabled={count !== null} onClick={() => setPose(p.key)}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="pose-actions">
          <button onClick={() => cb.current.onClose()} disabled={count !== null}>
            취소
          </button>
          <button className="red" onClick={() => setCount(3)} disabled={count !== null}>
            {count === null ? '3초 뒤 찰칵' : '찍는 중…'}
          </button>
        </div>
      </div>
    </>
  );
}
