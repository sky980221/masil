import type { World } from '../game/world';

// 픽셀로 찍은 아이콘 (1 = 칠함)
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
const TREE = ['0001000', '0011100', '0111110', '0011100', '0111110', '1111111', '0001000'];

function PixelIcon({ rows, color }: { rows: string[]; color: string }) {
  const w = rows[0].length;
  return (
    <svg viewBox={`0 0 ${w} ${rows.length}`} width={w * 3} height={rows.length * 3} aria-hidden="true" shapeRendering="crispEdges">
      {rows.flatMap((row, y) => [...row].map((v, x) => (v === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)))}
    </svg>
  );
}

/** 광장 오른쪽 아래의 하트·트리 이모티콘 버튼 */
export function EmoteButtons({ world }: { world: World }) {
  return (
    <div className="emotes" role="group" aria-label="이모티콘">
      <button aria-label="하트 띄우기" onClick={() => world.emote('heart')}>
        <PixelIcon rows={HEART} color="#e2333f" />
      </button>
      <button aria-label="트리 띄우기" onClick={() => world.emote('tree')}>
        <PixelIcon rows={TREE} color="#2f7a52" />
      </button>
    </div>
  );
}
