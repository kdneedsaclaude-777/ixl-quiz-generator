/* Concept Mastery — shared icon set (inline SVG) */
const Icon = ({ name, size = 18, color = "currentColor", stroke = 1.75 }) => {
  const paths = {
    plus: <><path d="M12 5v14M5 12h14"/></>,
    check: <><path d="M5 12l5 5L20 7"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>,
    chevron: <><path d="M9 6l6 6-6 6"/></>,
    chevronL: <><path d="M15 6l-6 6 6 6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    home: <><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3M10 14h4M9 20h6M12 16v4"/></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/></>,
    flame: <><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s.5 2 2 2c0-3 2-5 2-8z"/></>,
    book: <><path d="M4 4h7v16H6a2 2 0 0 1-2-2zM13 4h7v14a2 2 0 0 1-2 2h-5z"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 20a4 4 0 0 1 6.5-3.1"/></>,
    bell: <><path d="M6 10a6 6 0 1 1 12 0v4l1.5 3h-15L6 14zM10 20a2 2 0 0 0 4 0"/></>,
    chart: <><path d="M4 20V8M10 20V4M16 20v-7M22 20H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></>,
    play: <><path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/></>,
    pause: <><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></>,
    pencil: <><path d="M4 20h4l11-11-4-4L4 16zM14 6l4 4"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    search: <><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    download: <><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    layers: <><path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    sliders: <><path d="M4 6h12M4 12h6M4 18h14"/><circle cx="18" cy="6" r="2"/><circle cx="13" cy="12" r="2"/><circle cx="19" cy="18" r="2"/></>,
    qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h2v2h-2zM18 14h3v3M14 18h3v3M19 19h2v2"/></>,
    file: <><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h4"/></>,
    star: <><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/></>,
  };
  const node = paths[name];
  if (!node) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
         style={{ flex: 'none' }}>
      {node}
    </svg>
  );
};

window.Icon = Icon;
