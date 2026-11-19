import { describe, expect, it } from 'vitest';
import { cleanName } from './name';

describe('이름 확인', () => {
  it('앞뒤 공백을 빼고 받아들인다', () => {
    expect(cleanName('  도리 ')).toBe('도리');
  });
  it('비었거나 8자를 넘으면 받지 않는다', () => {
    expect(cleanName('   ')).toBeNull();
    expect(cleanName('가나다라마바사아자')).toBeNull();
    expect(cleanName('가나다라마바사아')).toBe('가나다라마바사아');
  });
  it('이모지도 한 글자로 센다', () => {
    expect(cleanName('🎄🎄🎄🎄🎄🎄🎄🎄')).toBe('🎄🎄🎄🎄🎄🎄🎄🎄');
  });
});
