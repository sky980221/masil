import { type FormEvent, useState } from 'react';
import { type Look, DEFAULT_LOOK } from '../avatar/options';
import { NAME_MAX, cleanName } from '../lib/name';
import { AvatarCanvas } from './AvatarCanvas';
import { GROUPS, OutfitPicker } from './OutfitPicker';
import { Overlay } from './Overlay';

interface Props {
  opened: ReadonlySet<number>;
  onDone: (name: string, look: Look) => void;
}

/**
 * 처음 들어온 사람이 캐릭터를 만든다.
 * 고른다고 다음 칸으로 넘어가지 않는다. 탭을 자유롭게 오가며 다 고른 뒤, 이름을 쓰고 한 번에 확정한다.
 */
export function Creator({ opened, onDone }: Props) {
  const [tab, setTab] = useState(0);
  const [look, setLook] = useState<Look>({ ...DEFAULT_LOOK, hat: 'none', item: 'none' });
  const [visited, setVisited] = useState(() => new Set([0]));
  const [name, setName] = useState('');
  const valid = cleanName(name);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onDone(valid, look);
  };

  return (
    <Overlay label="캐릭터 만들기">
      <form className="sheet px creator" onSubmit={submit}>
        <div className="wd-head">
          <h2>캐릭터 만들기</h2>
        </div>
        <div className="wd-top">
          <div className="mirror">
            <AvatarCanvas look={look} scale={2} animate label="지금 만든 캐릭터" />
          </div>
          <div className="wd-info">
            <p className="creator-hint">아래 탭을 오가며 마음껏 골라 보세요. 다 고르면 이름을 쓰고 시작하면 돼요.</p>
            <label className="field">
              이름
              <input type="text" id="creatorName" value={name} maxLength={NAME_MAX * 2} autoComplete="off" placeholder="예: 눈사람" onChange={(e) => setName(e.target.value)} />
              <small>1~{NAME_MAX}자. 광장에서 머리 위에 보여요.</small>
            </label>
          </div>
        </div>
        <div className="wd-tabs" role="tablist">
          {GROUPS.map((g, i) => (
            <button
              key={g.label}
              type="button"
              role="tab"
              aria-selected={i === tab}
              onClick={() => {
                setTab(i);
                setVisited(new Set(visited).add(i));
              }}
            >
              {g.label}
              {visited.has(i) && i !== tab && <span className="check" aria-label="봤어요">✓</span>}
            </button>
          ))}
        </div>
        <div className="wd-body" role="tabpanel">
          <OutfitPicker group={GROUPS[tab]} look={look} opened={opened} onPick={(cat, opt) => setLook({ ...look, [cat]: opt })} />
        </div>
        <div className="wd-foot">
          <button type="submit" className="red" disabled={!valid}>
            {valid ? '이대로 마실 나가기' : '이름을 쓰면 시작할 수 있어요'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
