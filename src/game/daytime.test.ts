import { describe, expect, it } from 'vitest';
import { seoulHour, skyPhase, isLit, lightText, showProgress, showText } from './daytime';

const at = (hhmm: string) => Date.parse(`2026-12-01T${hhmm}:00+09:00`);

describe('daytime', () => {
  it('서울 시각으로 바꾼다', () => {
    expect(seoulHour(at('17:30'))).toBeCloseTo(17.5);
    expect(seoulHour(at('00:15'))).toBeCloseTo(0.25);
  });

  it('낮·노을·밤을 나눈다', () => {
    expect(skyPhase(12)).toEqual({ day: 1, dusk: 0 });
    expect(skyPhase(17.1).dusk).toBe(1);
    expect(skyPhase(22)).toEqual({ day: 0, dusk: 0 });
  });

  it('점등 시간을 판단하고 안내한다', () => {
    expect(isLit(16.9, [17, 24])).toBe(false);
    expect(isLit(17, [17, 24])).toBe(true);
    expect(isLit(23.99, [17, 24])).toBe(true);
    expect(isLit(1, [22, 2])).toBe(true);
    expect(lightText(16.5, [17, 24], false)).toBe('점등까지 30분');
    expect(lightText(18, [17, 24], false)).toBe('점등 중 · 자정에 꺼져요');
    expect(lightText(21, [10.5, 20.5], true)).toBe('영업 끝 · 10:30에 다시 켜져요');
    expect(lightText(3, [0, 24], false)).toBe('24시간 점등 중');
  });

  it('신세계 쇼는 정각과 30분에 3분', () => {
    expect(showProgress(18)).toBe(0);
    expect(showProgress(18 + 1.5 / 60)).toBeCloseTo(0.5);
    expect(showProgress(18 + 5 / 60)).toBe(-1);
    expect(showText(18 + 18 / 60)).toBe('다음 쇼까지 12분');
  });
});
