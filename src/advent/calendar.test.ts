import { describe, expect, it } from 'vitest';
import { SCHEDULE, START, XMAS, dayIndex, dayLabel, daysLeft, isUnlocked, scheduleIsValid } from './calendar';

describe('선물 달력', () => {
  it('11/15부터 12/25까지 41칸이다', () => {
    expect(SCHEDULE).toHaveLength(41);
    expect(dayLabel(0)).toBe('11/15');
    expect(dayLabel(16)).toBe('12/1');
    expect(dayLabel(40)).toBe('12/25');
  });

  it('스케줄의 아이템은 모두 실제 꾸미기 항목이고 겹치지 않는다', () => {
    expect(scheduleIsValid()).toBe(true);
    const keys = SCHEDULE.map(([c, o]) => `${c}:${o}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('한국 시간 자정을 기준으로 날짜가 넘어간다', () => {
    expect(dayIndex(START)).toBe(0);
    expect(dayIndex(START - 1)).toBe(-1);
    expect(dayIndex(START + 86_400_000 - 1)).toBe(0);
    expect(dayIndex(XMAS)).toBe(40);
  });

  it('남은 날은 크리스마스 당일부터 0이다', () => {
    expect(daysLeft(START)).toBe(40);
    expect(daysLeft(XMAS - 1)).toBe(1);
    expect(daysLeft(XMAS)).toBe(0);
  });

  it('기본 아이템은 열려 있고 달력 아이템은 연 뒤에만 열린다', () => {
    expect(isUnlocked('hat', 'santa', new Set())).toBe(true);
    expect(isUnlocked('hat', 'catears', new Set())).toBe(false);
    expect(isUnlocked('hat', 'catears', new Set([0]))).toBe(true);
    expect(isUnlocked('hat', 'crown', new Set([0, 1, 2]))).toBe(false);
  });
});
