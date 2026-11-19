// 이 기기 브라우저에만 저장한다. 사생활 보호 모드처럼 저장소가 막혀 있어도 앱은 그대로 동작해야 한다.
const PREFIX = 'masil:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 저장이 막혀 있으면 이번 방문 동안만 기억한다 */
  }
}
