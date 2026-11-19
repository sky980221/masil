import { useMemo, useRef, useState } from 'react';
import { type Category, type Look, CATEGORIES, optionKeys } from '../avatar/options';
import { isUnlocked, lockDay } from '../advent/calendar';
import { NAME_MAX, cleanName } from '../lib/name';
import { AvatarCanvas } from './AvatarCanvas';
import { GROUPS, OutfitPicker } from './OutfitPicker';
import { Overlay } from './Overlay';

interface Props {
  look: Look;
  name: string;
  opened: ReadonlySet<number>;
  seen: ReadonlySet<number>;
  onSave: (look: Look, name: string) => void;
  /** 이번에 본 새 아이템 번호들 */
  onClose: (seenNow: number[]) => void;
}

/** 내 옷장(보관함). 고른 옷은 "이대로 입기"를 눌러야 저장된다. */
export function Wardrobe({ look, name, opened, seen, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Look>(look);
  const [draftName, setDraftName] = useState(name);
  const [tab, setTab] = useState(0);
  const shown = useRef(new Set<number>());

  const isNew = (cat: Category, opt: string) => {
    const i = lockDay(cat, opt);
    const fresh = i !== undefined && opened.has(i) && !seen.has(i);
    if (fresh && GROUPS[tab].cats.some(([c]) => c === cat)) shown.current.add(i!);
    return fresh;
  };
  const newCount = (gi: number) =>
    GROUPS[gi].cats.reduce((n, [cat]) => n + optionKeys(cat).filter((o) => {
      const i = lockDay(cat, o);
      return i !== undefined && opened.has(i) && !seen.has(i) && !shown.current.has(i);
    }).length, 0);

  const { owned, total } = useMemo(() => {
    let owned = 0;
    let total = 0;
    for (const cat of CATEGORIES) for (const o of optionKeys(cat)) {
      total++;
      if (isUnlocked(cat, o, opened)) owned++;
    }
    return { owned, total };
  }, [opened]);

  const close = () => onClose([...shown.current]);
  const valid = cleanName(draftName);

  return (
    <Overlay label="옷장" onClose={close}>
      <div className="sheet px">
        <div className="wd-head">
          <h2>{name ? `${name}의 옷장` : '옷장'}</h2>
          <button onClick={close}>닫기</button>
        </div>
        <div className="wd-top">
          <div className="mirror">
            <AvatarCanvas look={draft} scale={2} animate label="옷장 거울에 비친 내 캐릭터" />
          </div>
          <div className="wd-info">
            <label className="field">
              이름
              <input type="text" id="wardrobeName" value={draftName} maxLength={NAME_MAX * 2} autoComplete="off" onChange={(e) => setDraftName(e.target.value)} />
              {!valid && <small className="warn">이름은 1~{NAME_MAX}자로 지어 주세요.</small>}
            </label>
            <div className="wd-count">
              보관함 {owned}/{total}칸 채움 · 선물 달력에서 더 모을 수 있어요
            </div>
          </div>
        </div>
        <div className="wd-tabs" role="tablist">
          {GROUPS.map((g, i) => {
            const n = i === tab ? 0 : newCount(i);
            return (
              <button key={g.label} role="tab" aria-selected={i === tab} onClick={() => setTab(i)}>
                {g.label}
                {n > 0 && <span className="n">+{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="wd-body" role="tabpanel">
          <OutfitPicker group={GROUPS[tab]} look={draft} opened={opened} isNew={isNew} onPick={(cat, opt) => setDraft({ ...draft, [cat]: opt })} />
        </div>
        <div className="wd-foot">
          <button
            onClick={() => {
              setDraft(look);
              setDraftName(name);
            }}
          >
            처음대로
          </button>
          <button className="red" disabled={!valid} onClick={() => valid && onSave(draft, valid)}>
            이대로 입기
          </button>
        </div>
      </div>
    </Overlay>
  );
}
