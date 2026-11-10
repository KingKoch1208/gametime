// One consistent line-icon set, drawn for this app: 24px grid, 1.8 stroke,
// round caps — like marker on a flyer. No emoji anywhere.
import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type Dot = [number, number, number, boolean?]; // cx, cy, r, filled
type Glyph = { d: string; dots?: Dot[] };

const G: Record<string, Glyph> = {
  music: {
    d: 'M9 18V6.6l10-2.3V16',
    dots: [
      [6.6, 18, 2.4],
      [16.6, 16, 2.4],
    ],
  },
  trail: { d: 'M12 3.4l-5.2 7.1h3.1l-4.3 6.1h12.8l-4.3-6.1h3.1z M12 16.6V21' },
  sports: { d: 'M12 3.5v17 M3.5 12h17 M6.1 5.9c2.9 3.3 2.9 8.9 0 12.2 M17.9 5.9c-2.9 3.3-2.9 8.9 0 12.2', dots: [[12, 12, 8.5]] },
  arts: {
    d: 'M12 3.6c-4.9 0-8.5 3.6-8.5 8.2 0 4.4 3.5 8.3 7.6 8.3 1.4 0 1.9-.9 1.6-2-.4-1.4.3-2.6 1.9-2.6h2.2c2.3 0 4.2-1.6 4.2-4.1 0-4.4-4-7.8-9-7.8z',
    dots: [
      [8, 10.4, 1.1, true],
      [11.6, 7.6, 1.1, true],
      [15.4, 9.2, 1.1, true],
    ],
  },
  food: { d: 'M7 3.5v6.4c0 1.4 1 2.5 2.4 2.5s2.4-1.1 2.4-2.5V3.5 M9.4 3.5V21 M17 21V3.5c-2 1.2-3 3.8-3 6.8 0 1.6.9 2.7 3 2.7' },
  moon: { d: 'M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z' },
  fitness: { d: 'M3.5 9.5v5 M6.5 7v10 M17.5 7v10 M20.5 9.5v5 M6.5 12h11' },
  heart: { d: 'M12 19.6s-7.6-4.3-7.6-9.6A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.6 2.4c0 5.3-7.6 9.6-7.6 9.6z' },
  dice: {
    d: 'M5.2 4h13.6c.7 0 1.2.5 1.2 1.2v13.6c0 .7-.5 1.2-1.2 1.2H5.2c-.7 0-1.2-.5-1.2-1.2V5.2C4 4.5 4.5 4 5.2 4z',
    dots: [
      [8.6, 8.6, 1.2, true],
      [12, 12, 1.2, true],
      [15.4, 15.4, 1.2, true],
    ],
  },
  family: {
    d: 'M3.5 19.6c0-3 2-5.1 4.5-5.1s4.5 2.1 4.5 5.1 M13.6 19.6c.2-2.4 1.4-4 3-4s2.8 1.6 3 4',
    dots: [
      [8, 8, 2.7],
      [16.6, 10, 2.1],
    ],
  },
  candle: { d: 'M8.8 21h6.4 M10 21V11h4v10 M12 8.6c-1.3-1.3-1.3-2.9 0-4.6 1.3 1.7 1.3 3.3 0 4.6z' },
  film: {
    d: 'M4.6 6h14.8c.6 0 1.1.5 1.1 1.1v9.8c0 .6-.5 1.1-1.1 1.1H4.6c-.6 0-1.1-.5-1.1-1.1V7.1c0-.6.5-1.1 1.1-1.1z M7.6 6v12 M16.4 6v12 M3.5 12h4 M16.4 12h4',
  },
  basket: { d: 'M3.5 10.2h17l-1.8 9.4H5.3z M8 10.2l3-5.6 M16 10.2l-3-5.6 M9 13.4v3 M12 13.4v3 M15 13.4v3' },
  book: { d: 'M4 5.6c2.7-1 5.4-1 8 .8v13.2c-2.6-1.8-5.3-1.8-8-.8z M20 5.6c-2.7-1-5.4-1-8 .8v13.2c2.6-1.8 5.3-1.8 8-.8z' },
  museum: { d: 'M3.5 9.4L12 4.5l8.5 4.9 M5 9.4h14 M6.6 9.4v8 M10.2 9.4v8 M13.8 9.4v8 M17.4 9.4v8 M4 20.1h16 M4.6 17.4h14.8' },
  court: {
    d: 'M4.6 5.5h14.8c.6 0 1.1.5 1.1 1.1v10.8c0 .6-.5 1.1-1.1 1.1H4.6c-.6 0-1.1-.5-1.1-1.1V6.6c0-.6.5-1.1 1.1-1.1z M12 5.5v13 M3.5 12h3.8 M16.7 12h3.8',
    dots: [[12, 12, 2.6]],
  },
  record: {
    d: 'M7.6 12A4.4 4.4 0 0 1 12 7.6',
    dots: [
      [12, 12, 8.5],
      [12, 12, 2.2],
    ],
  },
  sunset: { d: 'M3 17.5h18 M6.5 17.5a5.5 5.5 0 0 1 11 0 M12 6.4v2.2 M5.1 9.6l1.5 1.5 M18.9 9.6l-1.5 1.5 M7 20.6h10' },
  tag: { d: 'M3.6 12.3V4.6h7.7l9.1 9.1-7.7 7.7z', dots: [[7.9, 8.9, 1.3]] },
  pin: { d: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z', dots: [[12, 10, 2.3]] },
  coffee: {
    d: 'M4.5 9h11.6v5.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5z M16.1 10.5h1.6a2.4 2.4 0 0 1 0 4.8h-1.6 M8 3.5c-.6 1 .6 2-.1 3 M11.6 3.5c-.6 1 .6 2-.1 3',
  },
  cone: { d: 'M7.6 10.6L12 21l4.4-10.4 M7 10.6a5 5 0 0 1 10 0z' },
  leaf: { d: 'M5 19c0-8 5-13.5 14.5-14-.5 9.5-6 14.5-14 14 M5 19l7.6-7.6' },
  truck: {
    d: 'M3 6.5h11v10H3z M14 9.6h4.1l2.9 3.4v3.5h-7',
    dots: [
      [7, 17.6, 1.8],
      [17, 17.6, 1.8],
    ],
  },
  arch: { d: 'M4.4 20.4V9.2 M19.6 20.4V9.2 M3 9.2h18 M4 6h16 M8.6 20.4v-5.6a3.4 3.4 0 0 1 6.8 0v5.6' },
  calendar: { d: 'M4.6 5h14.8c.6 0 1.1.5 1.1 1.1v13.3c0 .6-.5 1.1-1.1 1.1H4.6c-.6 0-1.1-.5-1.1-1.1V6.1c0-.6.5-1.1 1.1-1.1z M3.5 9.6h17 M8 3v4 M16 3v4' },
  share: { d: 'M12 15V3.6 M7.6 8L12 3.6 16.4 8 M5 12v7.6h14V12' },
  bookmark: { d: 'M6.6 3.6h10.8v17l-5.4-4-5.4 4z' },
  directions: { d: 'M20.5 3.5L3.5 10.6l7 2.4 2.4 7z' },
  close: { d: 'M6 6l12 12 M18 6L6 18' },
  sliders: {
    d: 'M4 7h8.8 M17.2 7h2.8 M4 17h2.8 M11.2 17h8.8',
    dots: [
      [15, 7, 2.1],
      [9, 17, 2.1],
    ],
  },
  search: { d: 'M15 15l5.5 5.5', dots: [[10.5, 10.5, 6]] },
  user: { d: 'M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6', dots: [[12, 8.5, 3.8]] },
  users: {
    d: 'M3.5 19.6c.5-3.3 2.8-5 5.5-5s5 1.7 5.5 5 M15.1 14.6c2.6-.3 4.8 1.2 5.4 4.9',
    dots: [
      [9, 8, 3],
      [16.6, 9.2, 2.3],
    ],
  },
  clock: { d: 'M12 7.4V12l3 2', dots: [[12, 12, 8.5]] },
  sun: {
    d: 'M12 2.8v2.3 M12 18.9v2.3 M2.8 12h2.3 M18.9 12h2.3 M5.5 5.5l1.6 1.6 M16.9 16.9l1.6 1.6 M5.5 18.5l1.6-1.6 M16.9 7.1l1.6-1.6',
    dots: [[12, 12, 3.9]],
  },
  cloud: { d: 'M7 17.5a4 4 0 0 1-.3-8 5.5 5.5 0 0 1 10.6 1.5 3.3 3.3 0 0 1 .2 6.5z' },
  rain: { d: 'M7 14.6a4 4 0 0 1-.3-8 5.5 5.5 0 0 1 10.6 1.5 3.3 3.3 0 0 1 .2 6.5z M8.2 17.6l-1 2.6 M12.2 17.6l-1 2.6 M16.2 17.6l-1 2.6' },
  walk: { d: 'M12.6 8l-2.4 5 3 2.6v4.9 M10.2 13l-2.6 7.4 M12.6 8l3 3.6 2.8.8 M12.2 8.4L8.4 10.4l-1 3', dots: [[13.2, 4.6, 1.7]] },
  bike: {
    d: 'M6 16l3.9-7.4h5.4 M18 16l-3-7.4 M9.9 8.6L12.4 16H6 M8.6 6.4h3',
    dots: [
      [6, 16, 3.4],
      [18, 16, 3.4],
    ],
  },
  car: {
    d: 'M4 16.4v-4l2-5h12l2 5v4z M4 12.4h16 M7 19v-2.6 M17 19v-2.6',
    dots: [
      [7.6, 14.4, 0.9, true],
      [16.4, 14.4, 0.9, true],
    ],
  },
  bus: {
    d: 'M7 3.6h10c1.1 0 2 .9 2 2V18H5V5.6c0-1.1.9-2 2-2z M5 11h14 M8 21v-3 M16 21v-3',
    dots: [
      [8.6, 14.6, 0.9, true],
      [15.4, 14.6, 0.9, true],
    ],
  },
  check: { d: 'M4.6 12.6l4.4 4.4 10.4-10.4' },
  plus: { d: 'M12 5v14 M5 12h14' },
  minus: { d: 'M5 12h14' },
  chevronRight: { d: 'M9 5.6l6.4 6.4L9 18.4' },
  chevronLeft: { d: 'M15 5.6L8.6 12l6.4 6.4' },
  chevronDown: { d: 'M5.6 9l6.4 6.4L18.4 9' },
  ghost: {
    d: 'M5.6 20.4V10a6.4 6.4 0 0 1 12.8 0v10.4l-2.1-1.6-2.1 1.6-2.2-1.6-2.2 1.6-2.1-1.6z',
    dots: [
      [9.8, 10.4, 1, true],
      [14.2, 10.4, 1, true],
    ],
  },
  ticket: { d: 'M3.5 7.5h17v3.1a1.8 1.8 0 0 0 0 3.6v3.3h-17v-3.3a1.8 1.8 0 0 0 0-3.6z M14.6 7.5v1.6 M14.6 11.2v1.6 M14.6 14.9v2.6' },
  flame: { d: 'M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-4 3.5-5.6 3.9-9.4 2.4 1.4 3.6 3.4 3.6 5.6 1-.6 1.6-1.6 1.8-2.8 2 1.7 3.7 4.1 3.7 6.6 0 3.5-2.6 6.1-6.5 6.1z' },
  shuffle: { d: 'M3.5 7H7c4.5 0 5.5 10 10 10h3.5 M3.5 17H7c1.8 0 3-1.5 4-3.5 M13 10.5c1-2 2.2-3.5 4-3.5h3.5 M18 4.5L20.5 7 18 9.5 M18 14.5l2.5 2.5-2.5 2.5' },
  locate: {
    d: 'M12 2.6v3 M12 18.4v3 M2.6 12h3 M18.4 12h3',
    dots: [
      [12, 12, 6.4],
      [12, 12, 1.9, true],
    ],
  },
  lock: { d: 'M6.2 10.6h11.6c.7 0 1.2.5 1.2 1.2v7.6c0 .7-.5 1.2-1.2 1.2H6.2c-.7 0-1.2-.5-1.2-1.2v-7.6c0-.7.5-1.2 1.2-1.2z M8 10.6V8a4 4 0 0 1 8 0v2.6' },
  star: { d: 'M12 3.8l2.5 5.3 5.7.7-4.2 3.9 1.1 5.7L12 16.6l-5.1 2.8 1.1-5.7-4.2-3.9 5.7-.7z' },
  bell: { d: 'M6 16.4V11a6 6 0 0 1 12 0v5.4l1.6 2.1H4.4z M10 20.6a2 2 0 0 0 4 0' },
  list: {
    d: 'M8.6 6.6h11.8 M8.6 12h11.8 M8.6 17.4h11.8',
    dots: [
      [4.6, 6.6, 1, true],
      [4.6, 12, 1, true],
      [4.6, 17.4, 1, true],
    ],
  },
  map: { d: 'M3.5 6.5L9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z M9 4v13.5 M15 6.5V20' },
  bolt: { d: 'M13.6 3L5.6 13.6h6L10.4 21l8-10.6h-6z' },
  compass: { d: 'M15.6 8.4l-2 5.2-5.2 2 2-5.2z', dots: [[12, 12, 8.5]] },
  bowl: { d: 'M3.5 11.6h17a8.5 8.5 0 0 1-17 0z M8 8.4c0-1.5 1-2 1-3.5 M12 8.4c0-1.5 1-2 1-3.5 M16 8.4c0-1.5 1-2 1-3.5' },
  flag: { d: 'M5.6 21V4 M5.6 4.6h11l-2 4 2 4h-11' },
  info: { d: 'M12 11v5.6 M12 7.8v.1', dots: [[12, 12, 8.5]] },
  chart: { d: 'M4 20.5h16 M7 17v-6 M11.6 17V6.6 M16.2 17v-8' },
  paw: {
    d: 'M12 12c-2.5 0-5 3.5-5 5.5 0 1.5 1.2 2 2.5 2s1.6-.7 2.5-.7 1.2.7 2.5.7 2.5-.5 2.5-2c0-2-2.5-5.5-5-5.5z',
    dots: [
      [8, 8.8, 1.5],
      [12, 6.6, 1.5],
      [16, 8.8, 1.5],
      [5.6, 12.6, 1.3],
      [18.4, 12.6, 1.3],
    ],
  },
  accessible: { d: 'M10 7.6V13h5.6l2.4 5.6 M10 10h5 M7.6 10.6a5.6 5.6 0 1 0 7.8 6.8', dots: [[10, 4.6, 1.5]] },
  camera: {
    d: 'M4.6 7.6h3l1.6-2.4h5.6l1.6 2.4h3c.6 0 1.1.5 1.1 1.1v9.7c0 .6-.5 1.1-1.1 1.1H4.6c-.6 0-1.1-.5-1.1-1.1V8.7c0-.6.5-1.1 1.1-1.1z',
    dots: [[12, 13.2, 3.4]],
  },
  text: { d: 'M4 7V5h11v2 M9.5 5v14 M7.6 19h3.8 M14 12v-1.5h6.5V12 M17.2 10.5V19 M15.8 19h2.8' },
  external: { d: 'M14 4.5h5.5V10 M19.5 4.5L11 13 M17 14v5.5H4.5V7H10' },
  passport: { d: 'M6.4 3.5h11.2c.6 0 1.1.5 1.1 1.1v14.8c0 .6-.5 1.1-1.1 1.1H6.4c-.6 0-1.1-.5-1.1-1.1V4.6c0-.6.5-1.1 1.1-1.1z M9 16.6h6', dots: [[12, 10, 3]] },
  megaphone: { d: 'M4 10v4h3l7 4.5V5.5L7 10z M17 9.4a3.6 3.6 0 0 1 0 5.2 M7.6 14l1 5.4h2.2l-.8-4.4' },
  moonStar: { d: 'M18.6 14.6A7.6 7.6 0 1 1 9.4 5.4a6 6 0 0 0 9.2 9.2z M17.6 3.5v3 M16.1 5h3' },
  refresh: { d: 'M19.5 11a7.5 7.5 0 0 0-13.6-3.7 M4.5 13a7.5 7.5 0 0 0 13.6 3.7 M5 3.6v3.9h3.9 M19 20.4v-3.9h-3.9' },
  home: { d: 'M4 11l8-6.6 8 6.6 M6 9.4V20h12V9.4' },
};

export type IconName = keyof typeof G;

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  fill?: string;
};

function IconImpl({ name, size = 22, color, strokeWidth = 1.8, fill = 'none' }: Props) {
  const g = G[name] ?? G.info;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={g.d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill} />
      {g.dots?.map(([cx, cy, r, filled], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={filled ? 0 : strokeWidth} fill={filled ? color : 'none'} />
      ))}
    </Svg>
  );
}

export const Icon = memo(IconImpl);

// Category → icon, used across cards, pins and filters.
export const CATEGORY_ICON: Record<string, IconName> = {
  concerts: 'music',
  sports: 'sports',
  shows: 'film',
  campus: 'arch',
  community: 'users',
  outdoors: 'trail',
  arts: 'arts',
  volunteer: 'heart',
  trails: 'trail',
  museums: 'museum',
  study: 'book',
  courts: 'court',
  gyms: 'fitness',
  records: 'record',
  scenic: 'sunset',
  free: 'tag',
  music: 'music',
  food: 'food',
  nightlife: 'moon',
  fitness: 'fitness',
  nerdy: 'dice',
  family: 'family',
  faith: 'candle',
  film: 'film',
  markets: 'basket',
  restaurant: 'food',
  cafe: 'coffee',
  truck: 'truck',
  dining_hall: 'arch',
  market: 'basket',
};
