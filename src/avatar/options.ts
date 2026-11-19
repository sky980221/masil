// 아바타 꾸미기 항목. 색이 있는 항목은 기본색(c)·그늘(d)·하이라이트(h)를 가진다.
import { type Rand, pick } from '../engine/pixel';

export interface ColorOpt {
  n: string;
  c: string;
  d: string;
  h?: string;
}
export interface ScarfOpt {
  n: string;
  /** 바탕색 (없음이면 비어 있음) */
  a?: string;
  d?: string;
  /** 줄무늬·체크 무늬색 */
  b?: string;
}

export const SKIN: Record<string, ColorOpt> = {
  light: { n: '밝은', c: '#ffe3d2', d: '#efc3ab' },
  mid: { n: '보통', c: '#f6d0b2', d: '#e0ac8a' },
  tan: { n: '구릿빛', c: '#d9a37c', d: '#bb825c' },
  deep: { n: '갈색', c: '#9a6a4a', d: '#7a5034' },
};

export const HAIRC: Record<string, Required<ColorOpt>> = {
  black: { n: '검정', c: '#2b2430', d: '#19141c', h: '#4c4156' },
  brown: { n: '갈색', c: '#6b432c', d: '#4c2e1c', h: '#93613f' },
  blond: { n: '금발', c: '#e8c06a', d: '#c39942', h: '#f8e2a6' },
  pink: { n: '분홍', c: '#f29bb6', d: '#d17496', h: '#ffc8da' },
  silver: { n: '은색', c: '#d7dbe6', d: '#a9b0c2', h: '#f6f8fc' },
  mint: { n: '민트', c: '#8fdcc0', d: '#62b89a', h: '#c4f2e0' },
  purple: { n: '보라', c: '#9a7ad6', d: '#7656b4', h: '#c4adf0' },
  red: { n: '빨강', c: '#c8323f', d: '#962230', h: '#ec6a72' },
  blue: { n: '파랑', c: '#4f7fd6', d: '#355fb0', h: '#8fb2f0' },
  orange: { n: '주황', c: '#e8843a', d: '#c06424', h: '#f6b27a' },
};

export const HAIR: Record<string, string> = { short: '짧은 머리', bob: '단발', long: '긴 머리', twin: '양갈래', curly: '뽀글' };
export const EYES: Record<string, string> = { round: '동글', smile: '웃음', sparkle: '반짝', wink: '윙크', staryes: '별눈' };
export const TOP: Record<string, string> = {
  padding: '패딩', coat: '코트', knit: '니트', santa: '산타 옷', treesweater: '트리 스웨터', elfsuit: '요정 옷', hoodie: '후드티',
};

export const TOPC: Record<string, ColorOpt> = {
  red: { n: '빨강', c: '#d6334a', d: '#a52238' },
  green: { n: '초록', c: '#2f7a52', d: '#20593b' },
  cream: { n: '크림', c: '#f1e6d2', d: '#cfbea0' },
  navy: { n: '남색', c: '#34447a', d: '#222d55' },
  pink: { n: '분홍', c: '#f2a7c0', d: '#d3819e' },
  gold: { n: '금색', c: '#e8b84a', d: '#c0902a' },
  sky: { n: '하늘', c: '#8cc8ec', d: '#64a6cf' },
  mint: { n: '민트', c: '#9fdcc4', d: '#74baa0' },
  purple: { n: '보라', c: '#8a6ac8', d: '#6a4ca6' },
  white: { n: '눈꽃 흰색', c: '#f8f8fb', d: '#d4d8e2' },
  burgundy: { n: '버건디', c: '#7a2238', d: '#5a1628' },
  black: { n: '검정', c: '#2e2a36', d: '#1c1922' },
  brown: { n: '갈색', c: '#8a5a3a', d: '#6a4026' },
};

export const BOTTOM: Record<string, string> = { pants: '바지', skirt: '치마' };

export const HATS: Record<string, string> = {
  none: '없음', santa: '산타 모자', beanie: '비니', antler: '루돌프 뿔', earmuff: '귀마개', ribbon: '리본',
  catears: '고양이 귀', bear: '곰돌이 귀', hairpin: '눈꽃 핀', elf: '요정 모자', treehat: '트리 모자', halo: '천사 링', crown: '왕관',
};

export const SCARF: Record<string, ScarfOpt> = {
  none: { n: '없음' },
  red: { n: '빨강', a: '#d6334a', d: '#a52238' },
  green: { n: '초록', a: '#2f7a52', d: '#20593b' },
  stripe: { n: '줄무늬', a: '#f4f1ea', d: '#cfc6b6', b: '#d6334a' },
  check: { n: '체크', a: '#d6334a', d: '#a52238', b: '#2e2a36' },
  gold: { n: '금색', a: '#e8b84a', d: '#c0902a' },
  sky: { n: '하늘', a: '#8cc8ec', d: '#64a6cf' },
  purple: { n: '보라', a: '#8a6ac8', d: '#6a4ca6' },
  pink: { n: '분홍', a: '#f29bb6', d: '#d17496', b: '#ffffff' },
};

export const ITEMS: Record<string, string> = {
  none: '없음', cocoa: '핫초코', gift: '선물', cane: '사탕', balloon: '별 풍선', cookie: '진저 쿠키', bell: '종',
  lantern: '랜턴', snowdoll: '눈사람 인형', snowglobe: '스노우볼', sparkler: '불꽃 막대', wreath: '리스', wand: '별 지팡이',
};

export const GLASSES: Record<string, string> = { none: '없음', round: '동글 안경', heart: '하트 안경', star: '별 안경', sunglasses: '선글라스' };

export const OPTS = {
  skin: SKIN, hair: HAIR, hairc: HAIRC, eyes: EYES, top: TOP, topc: TOPC, bottom: BOTTOM, hat: HATS, scarf: SCARF, item: ITEMS, glasses: GLASSES,
} as const;

export type Category = keyof typeof OPTS;
export type Look = Record<Category, string>;
export const CATEGORIES = Object.keys(OPTS) as Category[];

export const CATNAME: Record<Category, string> = {
  skin: '피부', hair: '머리', hairc: '머리색', eyes: '눈', top: '겉옷', topc: '옷 색', bottom: '하의', hat: '모자', scarf: '목도리', item: '소품', glasses: '안경',
};

export const DEFAULT_LOOK: Look = {
  skin: 'light', hair: 'bob', hairc: 'brown', eyes: 'round', top: 'padding', topc: 'cream', bottom: 'pants', hat: 'santa', scarf: 'red', item: 'cocoa', glasses: 'none',
};

export function optionKeys(cat: Category): string[] {
  return Object.keys(OPTS[cat]);
}

export function optName(cat: Category, opt: string): string {
  const v = (OPTS[cat] as Record<string, string | { n: string }>)[opt];
  if (v === undefined) return opt;
  return typeof v === 'string' ? v : v.n;
}

/** 저장된 값이 깨졌거나 예전 항목이면 기본값으로 채운다. */
export function normalizeLook(raw: unknown): Look {
  const out: Look = { ...DEFAULT_LOOK };
  if (raw && typeof raw === 'object') {
    for (const cat of CATEGORIES) {
      const v = (raw as Record<string, unknown>)[cat];
      if (typeof v === 'string' && v in OPTS[cat]) out[cat] = v;
    }
  }
  return out;
}

/** allow를 통과한 항목 중에서 무작위로 입힌다. 소품과 안경은 가끔만 고른다. */
export function randomLook(r: Rand, allow: (cat: Category, opt: string) => boolean = () => true): Look {
  const out = { ...DEFAULT_LOOK };
  for (const cat of CATEGORIES) {
    const keys = optionKeys(cat).filter((o) => allow(cat, o));
    if (keys.length) out[cat] = pick(r, keys);
  }
  if (r() < 0.4) out.item = 'none';
  if (r() < 0.6) out.glasses = 'none';
  return out;
}
