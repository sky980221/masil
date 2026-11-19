import { yeouido } from './yeouido';
import { starfield } from './starfield';
import { jamsil } from './jamsil';
import { myeongdong } from './myeongdong';
import { yeongjong } from './yeongjong';
import { shinsegae } from './shinsegae';
import type { Spot } from './types';

export type { Spot, SceneBuild, BoardSpot, TrainTrack, Floor, Night, CrowdLine } from './types';

/** 탭에 보이는 순서 */
export const SPOTS: readonly Spot[] = [yeouido, starfield, jamsil, myeongdong, shinsegae, yeongjong];
