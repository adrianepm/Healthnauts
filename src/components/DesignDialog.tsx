import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function DesignDialog({ title, description, close, busy, children }: { title: string; description?: string; close: () => void; busy?: boolean; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const label = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else document.getElementById('main-content')?.focus();
    };
  }, []);
  return <dialog ref={dialog} className="design-dialog" aria-labelledby={label}
    onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <div className="dialog-heading"><div><h2 id={label}>{title}</h2>{description && <p>{description}</p>}</div>
      <button className="icon-button" type="button" onClick={close} disabled={busy} aria-label="Close dialog"><X size={22} /></button></div>
    {children}
  </dialog>;
}
