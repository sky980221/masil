// 손으로 찍은 픽셀 격자를 PNG로 굽는다: node scripts/make-sprites.mjs
// 한 글자 = 픽셀 한 칸(장면 좌표 1칸). 만든 PNG는 src/assets/sprites에 들어가고,
// 그 뒤로는 PNG가 원본이다. Aseprite 같은 도구로 PNG를 직접 고쳐도 되고, 여기 격자를 고쳐 다시 구워도 된다.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/assets/sprites/', import.meta.url));

// ---------- PNG 쓰기 (RGBA 8비트) ----------
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(grid, pal) {
  const h = grid.length;
  const w = grid[0].length;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  grid.forEach((row, y) => {
    if (row.length !== w) throw new Error(`row ${y} is ${row.length} wide, expected ${w}`);
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const hex = pal[ch];
      if (!hex) throw new Error(`no color for '${ch}'`);
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = parseInt(hex.slice(1, 3), 16);
      raw[o + 1] = parseInt(hex.slice(3, 5), 16);
      raw[o + 2] = parseInt(hex.slice(5, 7), 16);
      raw[o + 3] = 255;
    });
  });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const mirror = (rows) => rows.map((s) => s + [...s].reverse().join(''));
const pad = (rows) => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, '.'));
};
const stamp = (g, s, col, top) => s.forEach((ln, y) => [...ln].forEach((ch, x) => ch !== '.' && (g[top + y][col + x] = ch)));

// ---------- 여의도 빨간 계단식 박공 집 (52×108) ----------
function gableHouse() {
  const HALF = 26;
  const row = (n, s) => {
    const out = '.'.repeat(n) + s;
    if (out.length !== HALF) throw new Error(`house row ${out.length}: ${out}`);
    return out;
  };
  // 벽돌: 3줄마다 줄눈, 세로 줄눈은 엇갈리게. 가운데부터 세어 좌우 대칭
  const wall = (r, n) => {
    if (r % 3 === 0) return 'b'.repeat(n);
    const off = Math.floor(r / 3) % 2 ? 3 : 0;
    return Array.from({ length: n }, (_, i) => ((n - 1 - i + off) % 6 === 5 ? 'b' : 'R')).join('');
  };
  const rows = [row(24, 'kk'), row(23, 'kcc'), row(22, 'kcCs'), row(22, 'kccs'), row(23, 'kcc'), row(24, 'kk'), row(21, 'kkkkk'), row(20, 'kccccc'), row(20, 'kCCCCC')];
  for (let r = 9; r <= 14; r++) rows.push(row(21, 'kh' + wall(r, 3)));
  rows.push(row(15, 'kkkkkk' + 'RRRRR'), row(15, 'k' + 'c'.repeat(10)), row(15, 'k' + 'C'.repeat(10)));
  for (let r = 18; r <= 23; r++) rows.push(row(16, 'kh' + wall(r, 8)));
  rows.push(row(10, 'kkkkkk' + 'R'.repeat(10)), row(10, 'k' + 'c'.repeat(15)), row(10, 'k' + 'C'.repeat(15)));
  for (let r = 27; r <= 32; r++) rows.push(row(11, 'kh' + wall(r, 13)));
  rows.push(row(5, 'kkkkkk' + 'R'.repeat(15)), row(5, 'k' + 'c'.repeat(20)), row(5, 'k' + 'C'.repeat(20)));
  for (let r = 36; r <= 46; r++) rows.push(row(6, 'kh' + wall(r, 18)));
  rows.push(row(0, 'kkkkkk' + 'R'.repeat(20)), row(0, 'k' + 'c'.repeat(25)), row(0, 'k' + 'C'.repeat(25)));
  for (let r = 50; r <= 106; r++) rows.push(row(0, 'kh' + wall(r, 24)));
  rows.push('k'.repeat(HALF));

  const g = mirror(rows).map((s) => [...s]);
  // 오른쪽 그늘: 줄마다 외곽선 바로 안쪽 4칸을 어둡게, 하이라이트는 왼쪽에만
  const shade = { R: 'r', b: 'B', h: 'r', c: 'C' };
  for (const line of g) {
    const e = line.lastIndexOf('k');
    for (let i = HALF; i < line.length; i++) if (line[i] === 'h') line[i] = 'r';
    for (let i = Math.max(HALF, e - 4); i < e; i++) line[i] = shade[line[i]] ?? line[i];
  }
  const ROUND = mirror(['...kk', '.kkcc', '.kcyw', 'kcyYw', 'kcyyw', 'kcwww', 'kcyyw', 'kcyyw', '.kcyw', '.kkcc', '...kk']);
  const SMALL = mirror(['.kk', 'kcc', 'kcY', 'kcy', 'kcy', 'kcc', 'CCC']);
  const WIN = ['.kkkkkkk.', 'kccccccck', 'kcYycyyck', 'kcYycyyck', 'kcyycyyck', 'kcyycyyck', 'kccccccck', 'kcYycyyck', 'kcyycyyck', 'kcyycyyck', 'kcyycyyck', 'kcyycyyck', 'kccccccck', 'kkkkkkkkk', 'ccccccccc', 'BBBBBBBBB'];
  const DOOR = mirror([
    '...kkkk', '..kcccc', '.kcoooo', 'kcooYoo', 'kcooooo', 'kcccccc',
    'kcddddk', 'kcdDDdk', 'kcdDDdk', 'kcdDDdk', 'kcdDDdk', 'kcddddk',
    'kcdDDdk', 'kcdDDdk', 'kcdDDsk', 'kcdDDdk', 'kcdDDdk', 'kcddddk',
    'kcdDDdk', 'kcdDDdk', 'kcdDDdk', 'kcddddk', 'kcddddk', 'kcddddk',
    'kCCCCCC', 'CCCCCCC',
  ]);
  const GAR = mirror(['....gGgee', '..gGgegGe', '.gGe.....', 'gGg......', 'gG.......', 'ge.......', 'Gg.......', 'gG.......', 'eg.......', 'gG.......', 'Gg.......', 'ge.......', 'gG.......', 'g........']);
  stamp(g, SMALL, 23, 18);
  stamp(g, ROUND, 21, 36);
  stamp(g, WIN, 6, 58);
  stamp(g, WIN, 37, 58);
  stamp(g, DOOR, 19, 82);
  stamp(g, GAR, 17, 80);
  return g.map((r) => r.join(''));
}
const HOUSE_PAL = {
  k: '#3a1216', R: '#a3262d', r: '#7e1a21', h: '#c2463f', b: '#8c1f27', B: '#6a141b',
  c: '#f3e6c8', C: '#cdb894', s: '#d8ae52', y: '#ffd98a', Y: '#fff4c8', w: '#7a4a2a',
  d: '#4a2a1a', D: '#5f3822', o: '#ffcf8a', g: '#2f6b4f', G: '#4f9a6a', e: '#e2333f',
};

// ---------- 영종 산타 인형 (15×26) ----------
const SANTA = pad([
  '......kkk......',
  '.....kWWWk.....',
  '.....kWWwk.....',
  '.....kkRkk.....',
  '....kRRRRrk....',
  '...kRhRRRRrk...',
  '..kRhRRRRRRrk..',
  '..kWWWWWWWWWk..',
  '..kwwwwwwwwwk..',
  '...ksssssssk...',
  '...ksesssesk...',
  '..kWsssnsssWk..',
  '..kWWWWWWWWWk..',
  '..kWWWWWWWWWk..',
  '..kwWWWWWWWwk..',
  '.kRkwWWWWWwkRk.',
  'kRRRkwWWWwkRRRk',
  'kRhRRkwwwkRRRrk',
  'kRhRRRkkkRRRRrk',
  'kWkRRRRRRRRRkWk',
  'kkkbbbbgbbbbkkk',
  '..kRhRRRRRRrk..',
  '..kWWWWWWWWWk..',
  '..kBBBk.kBBBk..',
  '.kBBBBk.kBBBBk.',
  '.kkkkkk.kkkkkk.',
]);
const SANTA_PAL = {
  k: '#2a1418', R: '#c8202a', r: '#8e1520', h: '#e8524a', W: '#ffffff', w: '#d8dde6',
  s: '#f6d0b2', e: '#2a1f2b', n: '#e88a8a', b: '#2a2228', g: '#e8c060', B: '#3a2a30',
};

// ---------- 영종 사슴 인형 (22×24) ----------
const DEER = pad([
  '..............k...k...',
  '.............kAk.kAk..',
  '..............kAkAk...',
  '...............kAAk...',
  '..............kBBBk...',
  '.............kBBBBBkk.',
  '.............kBBeBBBek',
  '.............kBBBBBBk.',
  '..............kRRRkk..',
  '..............kRrRk...',
  '..kk..........kbBBk...',
  '.kBBkkkkkkkkkkkBBBk...',
  '.kBhhhhhhhhhhhhBBBk...',
  '..kBBBBBBBBBBBBBBBk...',
  '..kBBBBBBBBBBBBBBk....',
  '..kbBBBBBBBBBBBBbk....',
  '..kbbWWWWWWWWWbbbk....',
  '...kbbkkkkkkkbbbk.....',
  '...kbk.......kbk......',
  '...kbk.......kbk......',
  '...kbk.......kbk......',
  '...kbk.......kbk......',
  '...kek.......kek......',
  '...kkk.......kkk......',
]);
const DEER_PAL = {
  k: '#2a1a12', A: '#7a5226', B: '#a8743a', b: '#8a5a2a', h: '#c8955a', e: '#2a1f2b',
  W: '#f4ead8', R: '#c8202a', r: '#8e1520',
};

for (const [name, grid, pal] of [
  ['gable-house', gableHouse(), HOUSE_PAL],
  ['santa', SANTA, SANTA_PAL],
  ['deer', DEER, DEER_PAL],
]) {
  writeFileSync(OUT + name + '.png', png(grid, pal));
  console.log(`${name}.png ${grid[0].length}×${grid.length}`);
}
