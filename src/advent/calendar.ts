// 선물 달력: 11/15부터 12/25까지 하루에 하나씩 꾸미기 아이템이 열린다. 날짜는 한국 시간 기준이다.
import { type Category, OPTS } from '../avatar/options';

const DAY = 86_400_000;
export const START = Date.parse('2026-11-15T00:00:00+09:00');
export const XMAS = Date.parse('2026-12-25T00:00:00+09:00');

/** 하루에 하나씩, 순서대로 열린다. 12/24 천사 링, 12/25 왕관. */
export const SCHEDULE: readonly (readonly [Category, string])[] = [
  ['hat', 'catears'], ['topc', 'gold'], ['item', 'cookie'], ['scarf', 'check'], ['hairc', 'mint'],
  ['glasses', 'heart'], ['item', 'bell'], ['topc', 'sky'], ['hat', 'bear'], ['scarf', 'gold'],
  ['eyes', 'wink'], ['item', 'lantern'], ['hairc', 'purple'], ['topc', 'mint'], ['top', 'treesweater'],
  ['item', 'snowdoll'], ['scarf', 'sky'], ['hat', 'hairpin'], ['topc', 'purple'], ['glasses', 'star'],
  ['hairc', 'red'], ['item', 'snowglobe'], ['topc', 'white'], ['hat', 'elf'], ['scarf', 'purple'],
  ['top', 'elfsuit'], ['item', 'sparkler'], ['hairc', 'blue'], ['topc', 'burgundy'], ['glasses', 'sunglasses'],
  ['eyes', 'staryes'], ['item', 'wreath'], ['scarf', 'pink'], ['topc', 'black'], ['hat', 'treehat'],
  ['hairc', 'orange'], ['top', 'hoodie'], ['topc', 'brown'], ['item', 'wand'], ['hat', 'halo'], ['hat', 'crown'],
];

/** "cat:opt" → 열리는 날 번호 */
export const LOCK: Readonly<Record<string, number>> = Object.fromEntries(SCHEDULE.map(([c, o], i) => [`${c}:${o}`, i]));

export function lockDay(cat: Category, opt: string): number | undefined {
  return LOCK[`${cat}:${opt}`];
}

/** 달력에 없는 기본 아이템은 처음부터 열려 있다. */
export function isUnlocked(cat: Category, opt: string, opened: ReadonlySet<number>): boolean {
  const i = lockDay(cat, opt);
  return i === undefined || opened.has(i);
}

export function dayIndex(nowMs: number): number {
  return Math.floor((nowMs - START) / DAY);
}

export function dayLabel(i: number): string {
  const d = new Date(START + i * DAY + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/** 크리스마스까지 남은 날 (당일과 그 이후는 0) */
export function daysLeft(nowMs: number): number {
  const diff = XMAS - nowMs;
  return diff <= 0 ? 0 : Math.ceil(diff / DAY);
}

/**
 * 시연용 시계. 주소에 ?date=2026-12-24 를 붙이면 그날 밤 9시로,
 * ?time=16:59 를 붙이면 (오늘 또는 date 날의) 서울 그 시각으로 시간을 옮긴다. 시계는 거기서부터 흐른다.
 */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
const fakeDate = params?.get('date');
const fakeTime = params?.get('time');
function startAt(): number | null {
  if (!fakeDate && !fakeTime) return null;
  const date = fakeDate && /^\d{4}-\d{2}-\d{2}$/.test(fakeDate) ? fakeDate : new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
  const time = fakeTime && /^\d{1,2}:\d{2}$/.test(fakeTime) ? fakeTime.padStart(5, '0') : '21:00';
  const ms = Date.parse(`${date}T${time}:00+09:00`);
  return Number.isNaN(ms) ? null : ms;
}
const DEMO_START = startAt();
const OFFSET = DEMO_START === null ? 0 : DEMO_START - Date.now();
export const clockNow = (): number => Date.now() + OFFSET;

/** 스케줄의 모든 항목이 실제 꾸미기 항목인지 (테스트용) */
export function scheduleIsValid(): boolean {
  return SCHEDULE.every(([c, o]) => o in OPTS[c]);
}
