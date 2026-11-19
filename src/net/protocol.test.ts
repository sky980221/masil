import { describe, expect, it } from 'vitest';
import { cleanCoord, cleanLook, cleanName, cleanRoomId, newRoomId, parseClientMessage } from './protocol';

describe('방 이름', () => {
  it('영문 소문자·숫자·하이픈 3~32자만 받는다', () => {
    expect(cleanRoomId('Snow-4821')).toBe('snow-4821');
    expect(cleanRoomId('ab')).toBeNull();
    expect(cleanRoomId('눈송이')).toBeNull();
    expect(cleanRoomId('a--b')).toBeNull();
    expect(cleanRoomId('../admin')).toBeNull();
    expect(cleanRoomId(42)).toBeNull();
  });
  it('새로 만든 방 이름은 그대로 통과한다', () => {
    for (let i = 0; i < 20; i++) expect(cleanRoomId(newRoomId())).not.toBeNull();
  });
});

describe('받은 값 거르기', () => {
  it('이름은 8글자까지, 비면 손님', () => {
    expect(cleanName('  도리  ')).toBe('도리');
    expect(cleanName('가나다라마바사아자차')).toBe('가나다라마바사아');
    expect(cleanName('\u0000')).toBe('손님');
    expect(cleanName(null)).toBe('손님');
  });
  it('옷 정보는 짧은 영문 키만 남긴다', () => {
    expect(cleanLook({ hat: 'santa', item: '<script>', 'x y': 'a', top: 3 })).toEqual({ hat: 'santa' });
    expect(cleanLook('nope')).toEqual({});
  });
  it('좌표는 캔버스 안으로 자른다', () => {
    expect(cleanCoord(-5, 270)).toBe(0);
    expect(cleanCoord(999, 270)).toBe(270);
    expect(cleanCoord(Number.NaN, 270)).toBe(0);
    expect(cleanCoord('12', 270)).toBe(0);
  });
});

describe('메시지 해석', () => {
  it('모르는 종류나 깨진 JSON은 버린다', () => {
    expect(parseClientMessage('{oops')).toBeNull();
    expect(parseClientMessage('{"t":"admin"}')).toBeNull();
    expect(parseClientMessage('x'.repeat(5000))).toBeNull();
  });
  it('이동 메시지를 걸러서 돌려준다', () => {
    expect(parseClientMessage('{"t":"move","spot":"jamsil","x":10,"y":400,"tx":500,"ty":420}')).toEqual({
      t: 'move', spot: 'jamsil', x: 10, y: 400, tx: 270, ty: 420,
    });
  });
});
