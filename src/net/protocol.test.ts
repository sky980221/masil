import { describe, expect, it } from 'vitest';
import { admitted, cleanAct, diffPresence, cleanCoord, cleanLook, cleanMove, cleanName, cleanPresence, cleanRoomId, newPeerId, newRoomId } from './protocol';

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
  it('이동은 id가 올바를 때만 받는다', () => {
    const id = newPeerId();
    expect(cleanMove({ id, spot: 'jamsil', x: 10, y: 400, tx: 500, ty: 420 })).toEqual({ id, spot: 'jamsil', x: 10, y: 400, tx: 270, ty: 420 });
    expect(cleanMove({ id: 'nope', x: 1 })).toBeNull();
    expect(cleanMove({ id, junk: 'x'.repeat(5000) })).toBeNull();
  });
  it('접속자 정보도 걸러서 받는다', () => {
    const p = cleanPresence({ id: 'abcdef12', name: ' 친구 ', look: { hat: 'crown', bad: '<x>' }, spot: 'yeouido', x: 1, y: 2, joinedAt: 5 });
    expect(p).toEqual({ id: 'abcdef12', name: '친구', look: { hat: 'crown' }, spot: 'yeouido', x: 1, y: 2, joinedAt: 5 });
  });
});

describe('접속자 목록 비교', () => {
  const base = { look: { hat: 'santa' }, x: 0, y: 0, joinedAt: 0 };
  it('들어온 사람, 옷 바꾼 사람, 장소 옮긴 사람, 나간 사람을 가린다', () => {
    const prev = new Map([
      ['aaaaaaaa', { ...base, id: 'aaaaaaaa', name: '가', spot: 'jamsil' }],
      ['bbbbbbbb', { ...base, id: 'bbbbbbbb', name: '나', spot: 'jamsil' }],
      ['cccccccc', { ...base, id: 'cccccccc', name: '다', spot: 'jamsil' }],
    ]);
    const next = [
      { ...base, id: 'aaaaaaaa', name: '가', spot: 'jamsil' },
      { ...base, id: 'bbbbbbbb', name: '나', spot: 'yeouido', look: { hat: 'crown' } },
      { ...base, id: 'dddddddd', name: '라', spot: 'jamsil' },
    ];
    const d = diffPresence(prev, next);
    expect(d.joins.map((p) => p.id)).toEqual(['dddddddd']);
    expect(d.looks.map((p) => p.id)).toEqual(['bbbbbbbb']);
    expect(d.moves.map((p) => p.id)).toEqual(['bbbbbbbb']);
    expect(d.leaves).toEqual(['cccccccc']);
  });
});

describe('정원', () => {
  it('먼저 온 순서로 정원만큼만 들어간다', () => {
    const list = [
      { id: 'cccccccc', joinedAt: 3 },
      { id: 'aaaaaaaa', joinedAt: 1 },
      { id: 'bbbbbbbb', joinedAt: 1 },
    ];
    expect([...admitted(list, 2)].sort()).toEqual(['aaaaaaaa', 'bbbbbbbb']);
  });
});

describe('순간 동작', () => {
  it('정해진 이모티콘과 포즈만 받는다', () => {
    expect(cleanAct({ id: 'abcdef12', k: 'emote', v: 'heart' })).toEqual({ id: 'abcdef12', k: 'emote', v: 'heart' });
    expect(cleanAct({ id: 'abcdef12', k: 'emote', v: 'skull' })).toBeNull();
    expect(cleanAct({ id: 'abcdef12', k: 'pose', v: 'sit' })).toEqual({ id: 'abcdef12', k: 'pose', v: 'sit' });
    expect(cleanAct({ id: 'abcdef12', k: 'pose', v: 'dance' })).toBeNull();
    expect(cleanAct({ id: 'abcdef12', k: 'jump', v: 'whatever' })).toEqual({ id: 'abcdef12', k: 'jump', v: '' });
    expect(cleanAct({ id: 'nope', k: 'jump' })).toBeNull();
  });
});
