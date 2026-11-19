import { type Look, CATNAME, optName } from '../avatar/options';
import { SCHEDULE, dayLabel } from '../advent/calendar';
import { AvatarCanvas } from './AvatarCanvas';
import { Overlay } from './Overlay';

interface RevealProps {
  index: number;
  isNew: boolean;
  look: Look;
  onWear: () => void;
  onClose: () => void;
}

/** 선물 달력 칸을 열었을 때 나오는 창 */
export function RevealDialog({ index, isNew, look, onWear, onClose }: RevealProps) {
  const [cat, opt] = SCHEDULE[index];
  return (
    <Overlay label="선물 열기" onClose={onClose}>
      <div className="card px">
        <p>
          {dayLabel(index)} 선물 · {CATNAME[cat]}
        </p>
        <div className="mirror">
          <AvatarCanvas look={{ ...look, [cat]: opt }} scale={2.5} animate label={`${optName(cat, opt)}을 입은 내 캐릭터`} />
        </div>
        <h2>{optName(cat, opt)}</h2>
        <p>{isNew ? '옷장에 넣어 뒀어요' : '옷장에 있는 아이템이에요'}</p>
        <div className="row">
          <button onClick={onClose}>옷장에 두기</button>
          <button className="red" onClick={onWear}>
            바로 입기
          </button>
        </div>
      </div>
    </Overlay>
  );
}

interface PhotoProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

export function PhotoDialog({ url, fileName, onClose }: PhotoProps) {
  return (
    <Overlay label="찍은 사진" onClose={onClose}>
      <div className="card px photo-card">
        <img className="shot" src={url} alt="방금 찍은 사진" />
        <p className="only-touch">사진을 길게 눌러도 저장할 수 있어요</p>
        <div className="row">
          <button onClick={onClose}>닫기</button>
          <a className="btn red" href={url} download={fileName}>
            사진 저장
          </a>
        </div>
      </div>
    </Overlay>
  );
}
