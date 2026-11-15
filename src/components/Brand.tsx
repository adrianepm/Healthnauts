// Marca do Healthnauts: quadrado magenta com órbita e linha de pulso (desenho próprio). O mesmo desenho está em public/favicon.svg.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="7" className="fill-brand" />
      <ellipse cx="16" cy="16" rx="11.5" ry="5" transform="rotate(-24 16 16)" fill="none" stroke="#07090F" strokeOpacity="0.45" strokeWidth="1.6" />
      <path d="M5 17h5.2l2.3-5.4 3.6 9.8 2.6-6.4 1.4 2h6.9" fill="none" stroke="#07090F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandName() {
  return <span className="text-lg font-semibold tracking-tight text-slate-50">Healthnauts</span>;
}
