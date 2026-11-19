import type { Ctx, Light, Rand } from '../engine/pixel';

/** 장면 안에 걸린 카운트다운 전광판 위치 */
export interface BoardSpot {
  x: number;
  y: number;
  /** 위에서 줄로 매단 모양 */
  hang?: boolean;
}

/** 트리 둘레를 도는 장난감 기차 궤도 (타원) */
export interface TrainTrack {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** 아바타가 걸어 다닐 수 있는 바닥 영역 [x0, y0, x1, y1] */
export type Floor = [number, number, number, number];

export interface SceneBuild {
  lights: Light[];
  floor: Floor;
  board?: BoardSpot;
  train?: TrainTrack;
  /** 매 프레임 배경 위에 덧그리는 움직이는 부분 (미디어 파사드 등) */
  animate?: (c: Ctx, t: number) => void;
}

export interface Spot {
  key: string;
  /** 위쪽 탭에 보이는 짧은 이름 */
  chip: string;
  /** 사진에 찍히는 이름 */
  name: string;
  snow: boolean;
  /** 저해상도 배경 캔버스에 정적인 장면을 한 번 그리고, 깜빡일 전구 목록을 돌려준다. */
  build(c: Ctx, r: Rand): SceneBuild;
}
