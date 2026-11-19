import type { Ctx, Light, Rand } from '../engine/pixel';
import type { Hours } from '../game/daytime';

/** 장면 안에 걸린 카운트다운 전광판 위치 */
export interface BoardSpot {
  x: number;
  y: number;
  /** 위에서 줄로 매단 모양 */
  hang?: boolean;
}

/** 트리 둘레를 도는 장난감 기차 궤도 (타원). 공중 와이어를 타고 돌 수도 있다. */
export interface TrainTrack {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** 한 바퀴 속도 배율 (기본 1) */
  speed?: number;
  /** 출발 위치를 어긋나게 */
  phase?: number;
  /** 칸 수 (기관차 포함, 기본 4) */
  cars?: number;
}

/** 아바타가 걸어 다닐 수 있는 바닥 영역 [x0, y0, x1, y1] */
export type Floor = [number, number, number, number];

/** 움직이는 부분이 참고하는 지금 상태 */
export interface SceneEnv {
  /** 조명 켜짐 정도 0~1 (점등 순간엔 서서히 올라간다) */
  lit: number;
  /** 서울 시각 0~24 */
  hour: number;
}

export interface SceneBuild {
  lights: Light[];
  floor: Floor;
  board?: BoardSpot;
  trains?: TrainTrack[];
  /** 매 프레임 배경 위에 덧그리는 움직이는 부분 (미디어 파사드 등) */
  animate?: (c: Ctx, t: number, env: SceneEnv) => void;
}

/** 밤 장면을 덮는 어둠. 광원 자리만 뚫려서 밝게 남는다. */
export interface Night {
  color: string;
  alpha: number;
}

/** 지평선을 따라 오가는 멀리 있는 사람들 */
export interface CrowdLine {
  y: number;
  x0: number;
  x1: number;
  n: number;
  col: string;
}

export interface Spot {
  key: string;
  night?: Night;
  /** 반짝이는 바닥이라 캐릭터가 비쳐 보인다 */
  glossy?: boolean;
  crowd?: CrowdLine;
  /** 위쪽 탭에 보이는 짧은 이름 */
  chip: string;
  /** 사진에 찍히는 이름 */
  name: string;
  snow: boolean;
  /** 하늘이 보이는 바깥 장소 (낮엔 하늘이 밝아지고, 서울에 눈이 오면 눈도 온다) */
  outdoor?: boolean;
  /** 조명이 켜져 있는 시간 (서울 시각). 실제 운영 시간은 해마다 달라 대략으로 잡았다. */
  hours: Hours;
  /** 실내라 문 닫는 시간이 있는 곳 (꺼져 있을 때 '영업 끝'으로 안내) */
  closes?: boolean;
  /** 저해상도 배경 캔버스에 정적인 장면을 한 번 그리고, 깜빡일 전구 목록을 돌려준다. */
  build(c: Ctx, r: Rand): SceneBuild;
}
