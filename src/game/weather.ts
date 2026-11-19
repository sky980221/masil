// 지금 서울 날씨 (Open-Meteo, 키 없이 쓰는 공개 API). 서울 좌표만 보내고 사용자 정보는 보내지 않는다.
// 실패하면 조용히 날씨 없이 지낸다.

export interface Weather {
  /** 기온 (°C) */
  temp: number;
  /** 지금 눈이 오는지 */
  snow: boolean;
  /** 비가 오는지 */
  rain: boolean;
}

const URL_ =
  'https://api.open-meteo.com/v1/forecast?latitude=37.5636&longitude=126.9810&current=temperature_2m,weather_code&timezone=Asia%2FSeoul';
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

let current: Weather | null = null;
const listeners = new Set<(w: Weather) => void>();

/** 시연용: 주소에 ?weather=snow 를 붙이면 눈 오는 날로 */
const fake = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('weather') : null;

async function load(): Promise<void> {
  if (fake) {
    current = { temp: fake === 'snow' ? -3 : 4, snow: fake === 'snow', rain: fake === 'rain' };
  } else {
    try {
      const res = await fetch(URL_);
      if (!res.ok) return;
      const j = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
      const t = j.current?.temperature_2m;
      const code = j.current?.weather_code;
      if (typeof t !== 'number' || typeof code !== 'number') return;
      current = { temp: Math.round(t), snow: SNOW_CODES.has(code), rain: RAIN_CODES.has(code) };
    } catch {
      return;
    }
  }
  for (const f of listeners) f(current);
}

let started = false;
/** 날씨가 바뀔 때마다 부른다. 처음 부르면 불러오기 시작하고 15분마다 새로 받는다. */
export function onWeather(f: (w: Weather) => void): () => void {
  listeners.add(f);
  if (current) f(current);
  if (!started && typeof window !== 'undefined') {
    started = true;
    void load();
    if (!fake) setInterval(() => void load(), 15 * 60_000);
  }
  return () => listeners.delete(f);
}

export const weatherNow = (): Weather | null => current;
