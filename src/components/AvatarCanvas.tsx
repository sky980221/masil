import { useEffect, useRef } from 'react';
import type { Look } from '../avatar/options';
import { drawAvatar } from '../avatar/draw';

interface Props {
  look: Look;
  /** 캔버스 실제 픽셀 크기 */
  width?: number;
  height?: number;
  /** 화면에 보이는 배율 */
  scale?: number;
  /** 깜빡임·김 같은 움직임을 계속 그린다 */
  animate?: boolean;
  className?: string;
  label?: string;
}

/** 아바타 하나만 그리는 작은 캔버스. 옷장 칸, 미리보기에 쓴다. */
export function AvatarCanvas({ look, width = 48, height = 60, scale = 2.5, animate = false, className, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d')!;
    const draw = (t: number) => {
      c.clearRect(0, 0, width, height);
      drawAvatar(c, { x: width / 2, y: height - 5, dir: 0, moving: false, seed: 1, look }, t);
    };
    if (!animate) {
      draw(1.2);
      return;
    }
    let raf = 0;
    const loop = (ts: number) => {
      draw(ts / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [look, width, height, animate]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className}
      style={{ width: width * scale, height: height * scale }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
