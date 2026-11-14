// Satu sumber ikon SVG. Semua memakai currentColor dan ukuran 1em,
// jadi warnanya ikut teks dan ukurannya ikut skala font di sekitarnya.
const IKON = {
  home: ['M3 11 12 3l9 8', 'M5 10v10h14V10'],
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  plus: ['M12 4v16', 'M4 12h16'],
  list: ['M5 3h14v18H5z', 'M9 8h6', 'M9 12h6', 'M9 16h4'],
  users: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2', 'M17 4a4 4 0 0 1 0 7', 'M22 21v-2a5 5 0 0 0-4-4.9'],
  up: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  ok: ['M5 12l5 5L20 7'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8', 'M13.7 21a2 2 0 0 1-3.4 0'],
  kotak: ['M4 4h16v16H4z'],
  centang: ['M5 12l5 5L20 7'],
  'kotak-centang': ['M4 4h16v16H4z', 'M8 12l3 3 5-6'],
};

export default function Ikon({ name, tebal = 2.5, className, ...sisa }) {
  const paths = IKON[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={tebal}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...sisa}
    >
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
