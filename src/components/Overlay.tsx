import { type ReactNode, useEffect } from 'react';

interface Props {
  onClose?: () => void;
  children: ReactNode;
  label: string;
}

/** 화면을 덮는 창. 바깥을 누르거나 Esc를 누르면 닫힌다 (onClose가 있을 때만). */
export function Overlay({ onClose, children, label }: Props) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      {children}
    </div>
  );
}
