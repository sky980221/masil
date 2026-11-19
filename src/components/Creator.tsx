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

const STEPS = [...GROUPS.map((g) => g.label), '이름'];

/** 처음 들어온 사람이 헤어 → 얼굴 → 옷 → 모자 → 소품 → 이름 순서로 직접 캐릭터를 만든다. */
export function Creator({ opened, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [look, setLook] = useState<Look>({ ...DEFAULT_LOOK, hat: 'none', item: 'none' });
  const [name, setName] = useState('');
  const isNameStep = step === GROUPS.length;
  const valid = cleanName(name);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isNameStep) return setStep(step + 1);
    if (valid) onDone(valid, look);
  };

  return (
    <Overlay label="캐릭터 만들기">
      <form className="sheet px creator" onSubmit={submit}>
        <div className="wd-head">
          <h2>캐릭터 만들기</h2>
          <span className="step-count">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <ol className="steps" aria-label="만드는 순서">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined} className={i < step ? 'done' : undefined}>
              <button type="button" onClick={() => setStep(i)} disabled={i > step}>
                {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="wd-top">
          <div className="mirror">
            <AvatarCanvas look={look} scale={2} animate label="지금 만든 캐릭터" />
          </div>
          <div className="wd-info">
            {isNameStep ? (
              <label className="field">
                이름
                <input type="text" id="creatorName" value={name} maxLength={NAME_MAX * 2} autoComplete="off" placeholder="예: 눈사람" autoFocus onChange={(e) => setName(e.target.value)} />
                <small>1~{NAME_MAX}자. 광장에서 머리 위에 보여요.</small>
              </label>
            ) : (
              <p className="creator-hint">
                {step === 0 && '먼저 머리 모양과 머리색을 골라 주세요.'}
                {step === 1 && '피부색과 눈을 고르고, 원하면 안경도 써 보세요.'}
                {step === 2 && '겨울 외투와 하의를 골라 주세요.'}
                {step === 3 && '모자는 안 써도 괜찮아요.'}
                {step === 4 && '목도리와 손에 들 것을 골라 주세요.'}
              </p>
            )}
          </div>
        </div>
        {!isNameStep && (
          <div className="wd-body">
            <OutfitPicker group={GROUPS[step]} look={look} opened={opened} onPick={(cat, opt) => setLook({ ...look, [cat]: opt })} />
          </div>
        )}
        <div className="wd-foot">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            이전
          </button>
          <button type="submit" className="red" disabled={isNameStep && !valid}>
            {isNameStep ? '마실 나가기' : '다음'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
