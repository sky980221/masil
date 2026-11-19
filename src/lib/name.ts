export const NAME_MAX = 8;

/** 앞뒤 공백을 빼고 1~8자면 쓸 수 있는 이름이다. */
export function cleanName(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, ' ');
  const len = [...t].length;
  return len >= 1 && len <= NAME_MAX ? t : null;
}
