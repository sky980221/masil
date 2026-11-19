import { type Category, type Look, optionKeys, optName } from '../avatar/options';
import { clockNow, dayIndex, dayLabel, isUnlocked, lockDay } from '../advent/calendar';
import { AvatarCanvas } from './AvatarCanvas';

export interface PickerGroup {
  label: string;
  cats: [Category, string][];
}

/** 옷장과 캐릭터 만들기에서 함께 쓰는 탭 묶음 */
export const GROUPS: PickerGroup[] = [
  { label: '헤어', cats: [['hair', '머리 모양'], ['hairc', '머리색']] },
  { label: '얼굴', cats: [['skin', '피부'], ['eyes', '눈'], ['glasses', '안경']] },
  { label: '옷', cats: [['top', '겉옷'], ['topc', '옷 색'], ['bottom', '하의']] },
  { label: '모자', cats: [['hat', '모자']] },
  { label: '소품', cats: [['scarf', '목도리'], ['item', '손에 드는 것']] },
];

interface Props {
  group: PickerGroup;
  look: Look;
  opened: ReadonlySet<number>;
  /** 새로 받은 아이템인지 */
  isNew?: (cat: Category, opt: string) => boolean;
  onPick: (cat: Category, opt: string) => void;
}

/** 칸마다 그 아이템을 입은 내 캐릭터를 작게 그려 보여 준다. 잠긴 칸은 열리는 날짜를 보여 준다. */
export function OutfitPicker({ group, look, opened, isNew, onPick }: Props) {
  return (
    <>
      {group.cats.map(([cat, label]) => (
        <section key={cat} aria-label={label}>
          <h3 className="wd-sec">{label}</h3>
          <div className="slots">
            {optionKeys(cat).map((opt) => {
              const name = optName(cat, opt);
              const open = isUnlocked(cat, opt, opened);
              const day = lockDay(cat, opt);
              const preview = { ...look, [cat]: opt };
              if (!open) {
                // 그날 열지 못한 선물은 놓친 것으로 표시한다
                const missed = day! < dayIndex(clockNow());
                const note = missed ? `${dayLabel(day!)} 놓침` : `${dayLabel(day!)} 공개`;
                return (
                  <button key={opt} className="slot locked" disabled aria-label={`${label} 잠김, ${note}`}>
                    <AvatarCanvas look={preview} width={40} height={52} scale={1.5} />
                    <span className="lock">잠김</span>
                    <span>{note}</span>
                  </button>
                );
              }
              return (
                <button key={opt} className="slot" aria-pressed={look[cat] === opt} aria-label={`${label} ${name}`} onClick={() => onPick(cat, opt)}>
                  <AvatarCanvas look={preview} width={40} height={52} scale={1.5} />
                  {isNew?.(cat, opt) && <span className="new">NEW</span>}
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
