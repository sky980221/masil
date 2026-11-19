// 서울 시간에 맞춘 하루: 낮·노을·밤, 장소별 점등 시간, 신세계 파사드 쇼 시간.

const HOUR = 3_600_000;
const KST = 9 * HOUR;

/** 서울 시각 (0~24, 소수점은 분) */
export function seoulHour(ms: number): number {
  return (((ms + KST) % (24 * HOUR)) + 24 * HOUR) % (24 * HOUR) / HOUR;
}

const ramp = (h: number, a: number, b: number) => Math.max(0, Math.min(1, (h - a) / (b - a)));

/**
 * 11~12월 서울 기준 하늘. 해 뜨는 7시 반, 해 지는 5시 15분 무렵.
 * day: 낮 밝기 0~1, dusk: 노을(해 질 녘·해 뜰 녘) 세기 0~1
 */
export function skyPhase(h: number): { day: number; dusk: number } {
  const day = Math.min(ramp(h, 7, 8.2), 1 - ramp(h, 16.3, 17.7));
  const evening = Math.max(0, 1 - Math.abs(h - 17.1) / 0.75);
  const morning = Math.max(0, 1 - Math.abs(h - 7.4) / 0.6) * 0.6;
  return { day, dusk: Math.max(evening, morning) };
}

/** 장소 조명이 켜져 있는 시간 [켜짐, 꺼짐]. 꺼짐이 24면 자정. */
export type Hours = readonly [number, number];

export function isLit(h: number, [on, off]: Hours): boolean {
  return off > on ? h >= on && h < off : h >= on || h < off;
}

/** h에서 t시까지 남은 시간(시) */
const until = (h: number, t: number) => (t - h + 24) % 24;

function clockText(t: number): string {
  if (t % 24 === 0) return '자정';
  const hh = Math.floor(t % 24);
  const mm = Math.round((t % 1) * 60);
  return mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}시`;
}

function durText(hours: number): string {
  const m = Math.max(1, Math.ceil(hours * 60));
  if (m < 60) return `${m}분`;
  const hh = Math.floor(m / 60);
  return m % 60 ? `${hh}시간 ${m % 60}분` : `${hh}시간`;
}

/** 위쪽 상태 줄에 쓸 조명 안내 */
export function lightText(h: number, hours: Hours, closed: boolean): string {
  if (hours[0] === 0 && hours[1] === 24) return '24시간 점등 중';
  if (isLit(h, hours)) return `점등 중 · ${clockText(hours[1])}에 꺼져요`;
  const left = until(h, hours[0]);
  if (left <= 1) return `점등까지 ${durText(left)}`;
  return closed ? `영업 끝 · ${clockText(hours[0])}에 다시 켜져요` : `${clockText(hours[0])} 점등 · ${durText(left)} 남음`;
}

/** 신세계 파사드 쇼: 매시 정각과 30분에 3분 동안. 쇼 중이면 진행도 0~1, 아니면 -1 */
export const SHOW_EVERY = 30;
export const SHOW_LEN = 3;
export function showProgress(h: number): number {
  const m = (h * 60) % SHOW_EVERY;
  return m < SHOW_LEN ? m / SHOW_LEN : -1;
}

export function showText(h: number): string {
  const p = showProgress(h);
  if (p >= 0) return '지금 파사드 쇼 중';
  const left = SHOW_EVERY - ((h * 60) % SHOW_EVERY);
  return `다음 쇼까지 ${Math.ceil(left)}분`;
}
