export function CrewFigure() {
  return <svg className="crew-figure" viewBox="0 0 240 340" aria-hidden="true">
    <defs>
      <pattern id="suit-hatch" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5 5 0" stroke="#354b63" strokeWidth="1" /></pattern>
    </defs>
    <g fill="none" stroke="#3b5670">
      <path opacity=".55" d="M120 9v319M36 70h168M28 165h184M37 249h166" strokeDasharray="2 6" />
      <ellipse cx="120" cy="314" rx="77" ry="16" opacity=".45" /><ellipse cx="120" cy="314" rx="51" ry="9" opacity=".65" />
    </g>
    <g fill="#192d42" stroke="#85a9c2" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M95 90c-10 1-24 6-28 14l-16 42-14 37-3 11 5 6 8-3 6-8 14-32 13-27 5 23-3 30 6 34 4 36-3 40-6 11 1 6h26l4-7-1-19 3-45 4-39 4 39 3 45-1 19 4 7h26l1-6-6-11-3-40 4-36 6-34-3-30 5-23 13 27 14 32 6 8 8 3 5-6-3-11-14-37-16-42c-4-8-18-13-28-14z" />
      <path d="M94 83h52l-3 14-13 9h-20l-13-9z" fill="#253d54" />
      <path d="M90 52c1-20 14-33 30-33s29 13 30 33v21l-10 13h-40L90 73z" />
      <path d="M97 48c12-11 34-11 46 0l-2 19-12 9h-18l-12-9z" fill="#294d68" />
      <path d="M101 52c9-8 29-8 38 0M102 57h36" stroke="#92c6e1" opacity=".65" />
      <path d="M88 126h64l-5 44H93z" fill="url(#suit-hatch)" />
      <path d="M94 171h52l5 12-8 12H97l-8-12z" fill="#29435b" />
      <path d="M103 117h34v34h-34z" fill="#223f57" />
      <path d="M108 138h5l4-8 5 12 4-7h6" fill="none" stroke="#81d3f4" strokeWidth="1.6" />
      <path d="M90 225l16 5 6-11m38 6-16 5-6-11M90 268l18 1m24 0 18-1M51 145l16 8m106 0 16-8M39 178l13 7m136 0 13-7" fill="none" />
    </g>
    <g fill="#a3d9ed"><circle cx="120" cy="182" r="2" /><circle cx="94" cy="108" r="2" /><circle cx="146" cy="108" r="2" /></g>
  </svg>;
}
