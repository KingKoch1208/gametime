// Web stand-in for react-native-maps (swapped in by metro.config.js for web only).
// Apple/Google map tiles can't load in the hosted web preview, so this draws an
// illustrated "flyer" map of Athens and supports the subset of the API the app
// uses: MapView (initialRegion, onRegionChangeComplete, onPress, animateToRegion,
// drag to pan, pinch / buttons to zoom), Marker (anchor, onPress, title callout)
// and Circle (heat glow).
import {
  Children,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle as SvgCircle, Path, Polygon, Text as SvgText } from 'react-native-svg';

export type LatLng = { latitude: number; longitude: number };
export type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

type Projector = {
  toXY: (c: LatLng) => { x: number; y: number };
  metersToPx: (m: number) => number;
  width: number;
  height: number;
};

const ProjCtx = createContext<Projector | null>(null);

const COS = Math.cos((33.95 * Math.PI) / 180);

function project(region: Region, w: number, h: number): Projector {
  const latSpan = region.latitudeDelta;
  const lngSpan = (latSpan * (w / Math.max(h, 1))) / COS;
  const top = region.latitude + latSpan / 2;
  const left = region.longitude - lngSpan / 2;
  return {
    toXY: (c) => ({ x: ((c.longitude - left) / lngSpan) * w, y: ((top - c.latitude) / latSpan) * h }),
    metersToPx: (m) => (m / (111_320 * latSpan)) * h,
    width: w,
    height: h,
  };
}

function unproject(region: Region, w: number, h: number, x: number, y: number): LatLng {
  const latSpan = region.latitudeDelta;
  const lngSpan = (latSpan * (w / Math.max(h, 1))) / COS;
  return {
    latitude: region.latitude + latSpan / 2 - (y / h) * latSpan,
    longitude: region.longitude - lngSpan / 2 + (x / w) * lngSpan,
  };
}

// ——— Rough hand-drawn Athens basemap (approximate, illustrative only) ———
type Feature = { pts: [number, number][]; kind: 'river' | 'major' | 'road' | 'loop' };
const LINES: Feature[] = [
  {
    kind: 'river',
    pts: [
      [34.04, -83.385],
      [34.0, -83.372],
      [33.975, -83.368],
      [33.962, -83.366],
      [33.952, -83.364],
      [33.94, -83.361],
      [33.925, -83.354],
      [33.9, -83.348],
      [33.87, -83.34],
    ],
  },
  {
    kind: 'river',
    pts: [
      [33.99, -83.44],
      [33.965, -83.436],
      [33.945, -83.433],
      [33.925, -83.418],
      [33.905, -83.395],
      [33.885, -83.375],
      [33.87, -83.36],
    ],
  },
  {
    kind: 'loop',
    pts: [
      [33.995, -83.38],
      [33.99, -83.345],
      [33.97, -83.325],
      [33.94, -83.322],
      [33.915, -83.34],
      [33.905, -83.375],
      [33.915, -83.41],
      [33.94, -83.43],
      [33.97, -83.425],
      [33.99, -83.405],
      [33.995, -83.38],
    ],
  },
  {
    kind: 'major',
    pts: [
      [33.952, -83.47],
      [33.955, -83.43],
      [33.957, -83.4],
      [33.9583, -83.38],
      [33.9585, -83.37],
      [33.962, -83.35],
      [33.966, -83.32],
    ],
  },
  {
    kind: 'major',
    pts: [
      [33.9595, -83.379],
      [33.964, -83.389],
      [33.968, -83.398],
      [33.976, -83.412],
      [33.99, -83.43],
    ],
  },
  {
    kind: 'major',
    pts: [
      [33.962, -83.3805],
      [33.99, -83.376],
      [34.03, -83.372],
      [34.06, -83.37],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.962, -83.3855],
      [33.95, -83.384],
      [33.935, -83.383],
      [33.915, -83.385],
      [33.895, -83.39],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.9585, -83.377],
      [33.945, -83.3765],
      [33.93, -83.379],
      [33.915, -83.383],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.952, -83.376],
      [33.951, -83.39],
      [33.948, -83.405],
      [33.945, -83.42],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.9575, -83.371],
      [33.955, -83.355],
      [33.952, -83.335],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.943, -83.372],
      [33.93, -83.365],
      [33.915, -83.356],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.946, -83.392],
      [33.952, -83.4],
      [33.955, -83.41],
    ],
  },
  {
    kind: 'road',
    pts: [
      [33.966, -83.392],
      [33.972, -83.385],
      [33.98, -83.383],
    ],
  },
];
const AREAS: { pts: [number, number][]; kind: 'campus' | 'downtown' }[] = [
  {
    kind: 'campus',
    pts: [
      [33.957, -83.38],
      [33.957, -83.37],
      [33.945, -83.366],
      [33.93, -83.364],
      [33.926, -83.376],
      [33.94, -83.383],
    ],
  },
  {
    kind: 'downtown',
    pts: [
      [33.962, -83.3805],
      [33.962, -83.371],
      [33.957, -83.371],
      [33.957, -83.3805],
    ],
  },
];
const PARKS: [number, number, number][] = [
  [34.029, -83.372, 700],
  [33.9993, -83.3825, 400],
  [33.9046, -83.3832, 650],
  [33.945, -83.3989, 280],
  [33.9396, -83.3779, 300],
  [33.9672, -83.3925, 220],
  [33.9133, -83.3367, 300],
];
const LABELS: [number, number, string][] = [
  [33.9605, -83.3755, 'DOWNTOWN'],
  [33.9555, -83.3765, 'NORTH CAMPUS'],
  [33.937, -83.371, 'EAST CAMPUS'],
  [33.9465, -83.3915, 'FIVE POINTS'],
  [33.9675, -83.3975, 'NORMALTOWN'],
  [33.948, -83.36, 'N. OCONEE RIVER'],
  [33.985, -83.39, 'LOOP 10'],
];

function Basemap({ p, dark }: { p: Projector; dark: boolean }) {
  const ink = dark ? '#F3ECDD' : '#1C1A17';
  const water = dark ? '#5E8FA3' : '#7FA7B8';
  const parkFill = dark ? 'rgba(127,168,141,0.22)' : 'rgba(47,74,58,0.16)';
  const campusFill = dark ? 'rgba(212,96,76,0.12)' : 'rgba(166,58,43,0.08)';
  const path = (pts: [number, number][]) =>
    pts
      .map(([la, lo], i) => {
        const { x, y } = p.toXY({ latitude: la, longitude: lo });
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  const poly = (pts: [number, number][]) =>
    pts
      .map(([la, lo]) => {
        const { x, y } = p.toXY({ latitude: la, longitude: lo });
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  const latSpan = p.height / (p.metersToPx(1) * 111_320);
  return (
    <Svg width={p.width} height={p.height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {AREAS.map((a, i) => (
        <Polygon key={`a${i}`} points={poly(a.pts)} fill={a.kind === 'campus' ? campusFill : dark ? 'rgba(217,166,46,0.14)' : 'rgba(217,166,46,0.18)'} />
      ))}
      {PARKS.map(([la, lo, r], i) => {
        const { x, y } = p.toXY({ latitude: la, longitude: lo });
        return <SvgCircle key={`p${i}`} cx={x} cy={y} r={p.metersToPx(r)} fill={parkFill} />;
      })}
      {LINES.map((l, i) => (
        <Path
          key={`l${i}`}
          d={path(l.pts)}
          fill="none"
          stroke={l.kind === 'river' ? water : ink}
          strokeOpacity={l.kind === 'river' ? 0.9 : l.kind === 'major' ? 0.45 : l.kind === 'loop' ? 0.35 : 0.25}
          strokeWidth={l.kind === 'river' ? 5 : l.kind === 'major' ? 3.2 : l.kind === 'loop' ? 4 : 2}
          strokeDasharray={l.kind === 'loop' ? '10 6' : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {latSpan < 0.09 &&
        LABELS.map(([la, lo, t]) => {
          const { x, y } = p.toXY({ latitude: la, longitude: lo });
          return (
            <SvgText key={t} x={x} y={y} fill={ink} fillOpacity={0.5} fontSize={11} fontFamily="Oswald_600SemiBold" letterSpacing={1.5} textAnchor="middle">
              {t}
            </SvgText>
          );
        })}
    </Svg>
  );
}

// ——— MapView ———

export type MapViewHandle = { animateToRegion: (r: Region, ms?: number) => void };

type MapViewProps = {
  style?: ViewStyle | ViewStyle[];
  initialRegion?: Region;
  onRegionChangeComplete?: (r: Region) => void;
  onPress?: (e: { nativeEvent: { coordinate: LatLng } }) => void;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  userInterfaceStyle?: 'light' | 'dark';
  children?: ReactNode;
  accessibilityLabel?: string;
  ref?: Ref<MapViewHandle>;
  [k: string]: unknown;
};

const DEFAULT: Region = { latitude: 33.957, longitude: -83.376, latitudeDelta: 0.06, longitudeDelta: 0.06 };

export default function MapView({
  style,
  initialRegion,
  onRegionChangeComplete,
  onPress,
  scrollEnabled = true,
  zoomEnabled = true,
  userInterfaceStyle,
  children,
  accessibilityLabel,
  ref,
}: MapViewProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [region, setRegion] = useState<Region>(initialRegion ?? DEFAULT);
  const regionRef = useRef(region);
  const sizeRef = useRef(size);
  const gesture = useRef<{ start: Region; dist: number } | null>(null);
  const dark = userInterfaceStyle === 'dark';

  const commit = useCallback(
    (r: Region, notify: boolean) => {
      regionRef.current = r;
      setRegion(r);
      if (notify) onRegionChangeComplete?.(r);
    },
    [onRegionChangeComplete],
  );

  useImperativeHandle(ref, () => ({
    animateToRegion: (target: Region, ms = 300) => {
      const from = regionRef.current;
      const t0 = Date.now();
      const step = () => {
        const k = Math.min(1, (Date.now() - t0) / Math.max(ms, 1));
        const e = 1 - Math.pow(1 - k, 3);
        const r = {
          latitude: from.latitude + (target.latitude - from.latitude) * e,
          longitude: from.longitude + (target.longitude - from.longitude) * e,
          latitudeDelta: from.latitudeDelta + (target.latitudeDelta - from.latitudeDelta) * e,
          longitudeDelta: target.longitudeDelta,
        };
        commit(r, k === 1);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  }));

  const zoomBy = (f: number) => {
    const r = regionRef.current;
    commit({ ...r, latitudeDelta: Math.min(0.4, Math.max(0.004, r.latitudeDelta * f)) }, true);
  };

  // Refs below are read inside gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const pan = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6 || (e.nativeEvent.touches?.length ?? 0) > 1,
      onPanResponderGrant: () => {
        gesture.current = { start: regionRef.current, dist: 0 };
      },
      onPanResponderMove: (e, g) => {
        const s = gesture.current;
        const { w, h } = sizeRef.current;
        if (!s || !h) return;
        const touches = e.nativeEvent.touches ?? [];
        if (touches.length === 2) {
          const d = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (!s.dist) s.dist = d;
          const f = s.dist / Math.max(d, 1);
          commit({ ...s.start, latitudeDelta: Math.min(0.4, Math.max(0.004, s.start.latitudeDelta * f)) }, false);
          return;
        }
        const latPerPx = s.start.latitudeDelta / h;
        const lngPerPx = (s.start.latitudeDelta * (w / h)) / COS / w;
        commit({ ...s.start, latitude: s.start.latitude + g.dy * latPerPx, longitude: s.start.longitude - g.dx * lngPerPx }, false);
      },
      onPanResponderRelease: () => {
        gesture.current = null;
        commit(regionRef.current, true);
      },
      onPanResponderTerminate: () => {
        gesture.current = null;
      },
    }),
  )[0];

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current = { w: width, h: height };
    setSize({ w: width, h: height });
  };

  const p = project(region, size.w, size.h);

  return (
    <View
      style={[{ overflow: 'hidden', backgroundColor: dark ? '#26231F' : '#E6DCC6' }, style as ViewStyle]}
      onLayout={onLayout}
      accessibilityLabel={accessibilityLabel}
      {...(scrollEnabled ? pan.panHandlers : {})}
      // @ts-expect-error web-only wheel zoom
      onWheel={zoomEnabled ? (e: { deltaY: number }) => zoomBy(e.deltaY > 0 ? 1.15 : 0.87) : undefined}
    >
      {size.w > 0 && (
        <ProjCtx.Provider value={p}>
          <Basemap p={p} dark={dark} />
          <Pressable
            style={StyleSheet.absoluteFill}
            accessible={false}
            onPress={(e) => {
              const ne = e.nativeEvent as unknown as { locationX: number; locationY: number };
              onPress?.({ nativeEvent: { coordinate: unproject(region, size.w, size.h, ne.locationX, ne.locationY) } });
            }}
          />
          {sortByZ(children)}
        </ProjCtx.Provider>
      )}
      {zoomEnabled && scrollEnabled && (
        <View style={styles.zoom}>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={() => zoomBy(0.6)} style={[styles.zoomBtn, dark && styles.zoomDark]}>
            <Text style={[styles.zoomTxt, dark && { color: '#F3ECDD' }]}>+</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={() => zoomBy(1.6)} style={[styles.zoomBtn, dark && styles.zoomDark]}>
            <Text style={[styles.zoomTxt, dark && { color: '#F3ECDD' }]}>−</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function sortByZ(children: ReactNode) {
  const arr = Children.toArray(children).filter(isValidElement) as ReactElement<{ zIndex?: number }>[];
  return arr.sort((a, b) => (a.props.zIndex ?? 0) - (b.props.zIndex ?? 0));
}

// ——— Marker ———

type MarkerProps = {
  coordinate: LatLng;
  anchor?: { x: number; y: number };
  onPress?: (e: { stopPropagation: () => void }) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  zIndex?: number;
  accessibilityLabel?: string;
  [k: string]: unknown;
};

export function Marker({ coordinate, anchor = { x: 0.5, y: 1 }, onPress, title, description, children, accessibilityLabel }: MarkerProps) {
  const p = useContext(ProjCtx);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [showCallout, setShowCallout] = useState(false);
  if (!p) return null;
  const { x, y } = p.toXY(coordinate);
  if (x < -80 || y < -80 || x > p.width + 80 || y > p.height + 80) return null;
  return (
    <View
      style={{ position: 'absolute', left: x - box.w * anchor.x, top: y - box.h * anchor.y, opacity: box.w ? 1 : 0 }}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {showCallout && title && (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {title}
          </Text>
          {description ? (
            <Text style={styles.calloutBody} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={() => {
          if (title) setShowCallout((s) => !s);
          onPress?.({ stopPropagation: () => {} });
        }}
      >
        {children}
      </Pressable>
    </View>
  );
}

// ——— Circle ———

export function Circle({ center, radius, fillColor }: { center: LatLng; radius: number; fillColor?: string; strokeColor?: string }) {
  const p = useContext(ProjCtx);
  if (!p) return null;
  const { x, y } = p.toXY(center);
  const r = p.metersToPx(radius);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: fillColor }}
    />
  );
}

export { MapView };

const styles = StyleSheet.create({
  zoom: { position: 'absolute', right: 14, top: '42%', gap: 6 },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F3ECDD',
    borderWidth: 1.5,
    borderColor: '#1C1A17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDark: { backgroundColor: '#1C1A17', borderColor: '#F3ECDD' },
  zoomTxt: { fontSize: 22, fontWeight: '700', color: '#1C1A17', lineHeight: 24 },
  callout: {
    position: 'absolute',
    bottom: '100%',
    left: -60,
    width: 160,
    marginBottom: 4,
    backgroundColor: '#F3ECDD',
    borderWidth: 1.5,
    borderColor: '#1C1A17',
    padding: 6,
    alignItems: 'center',
  },
  calloutTitle: { fontWeight: '700', fontSize: 12, color: '#1C1A17' },
  calloutBody: { fontSize: 11, color: '#5B5447', textAlign: 'center' },
});
