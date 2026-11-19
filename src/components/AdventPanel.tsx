import { SCHEDULE, dayLabel } from '../advent/calendar';
import { optName } from '../avatar/options';

interface Props {
  today: number;
  opened: ReadonlySet<number>;
  hidden: boolean;
  onOpen: (i: number) => void;
  onShow: (i: number) => void;
}

/** 11/15~12/25 선물 달력. 오늘까지의 칸만 열 수 있다. */
export function AdventPanel({ today, opened, hidden, onOpen, onShow }: Props) {
  return (
    <section id="advent" className="panel px" hidden={hidden} aria-label="선물 달력">
      <div className="panel-title">
        <h2>선물 달력</h2>
        <p>12월 25일까지 하루에 하나씩 열려요</p>
      </div>
      <div className="grid">
        {SCHEDULE.map(([cat, opt], i) => {
          const label = dayLabel(i);
          if (opened.has(i)) {
            return (
              <button key={i} className="cell open" onClick={() => onShow(i)} aria-label={`${label} ${optName(cat, opt)}`}>
                <b>{label}</b>
                {optName(cat, opt)}
              </button>
            );
          }
          if (i <= today) {
            return (
              <button key={i} className="cell ready" onClick={() => onOpen(i)} aria-label={`${label} 열 수 있는 선물`}>
                <b>{label}</b>
                {i === today ? '오늘' : '열기'}
              </button>
            );
          }
          return (
            <button key={i} className="cell locked" disabled aria-label={`${label} 아직 잠긴 선물`}>
              <b>{label}</b>
              {i === SCHEDULE.length - 1 ? '성탄' : '···'}
            </button>
          );
        })}
      </div>
    </section>
  );
}
