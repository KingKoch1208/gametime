// Out in Athens design tokens.
// Concept: Athens telephone-pole gig flyer meets ticket stub.

export const palette = {
  brick: '#A63A2B',
  ivy: '#2F4A3A',
  paper: '#F3ECDD',
  ink: '#1C1A17',
  mustard: '#D9A62E',
} as const;

export type ThemeColors = {
  bg: string;
  surface: string; // slightly lighter "fresh paper" for cards
  surfaceAlt: string; // aged paper
  text: string;
  textMuted: string;
  line: string;
  lineStrong: string;
  brick: string; // primary accent (text-safe on bg)
  brickFill: string; // primary fill
  ivy: string;
  ivyFill: string;
  mustard: string;
  onFill: string; // text on brick/ivy fills
  inkFill: string; // 'ink' accent blocks (lifted in after-dark so they don't vanish)
  locked: string;
  overlay: string;
  mapStyle: 'light' | 'dark';
};

// "Paper" — default daylight theme. Contrast checked:
// ink on paper 15.1:1, textMuted on paper 6.4:1, brick on paper 5.6:1, ivy on paper 8.9:1.
export const paperTheme: ThemeColors = {
  bg: palette.paper,
  surface: '#FBF7EE',
  surfaceAlt: '#E9E0CC',
  text: palette.ink,
  textMuted: '#5B5447',
  line: 'rgba(28,26,23,0.16)',
  lineStrong: palette.ink,
  brick: palette.brick,
  brickFill: palette.brick,
  ivy: palette.ivy,
  ivyFill: palette.ivy,
  mustard: palette.mustard,
  onFill: palette.paper,
  inkFill: palette.ink,
  locked: '#6B6457', // 5.0:1 on paper
  overlay: 'rgba(28,26,23,0.45)',
  mapStyle: 'light',
};

// "After dark" — ink background, cream text, brick accents.
// cream on ink 15.1:1, textMuted 8.2:1, brick (lifted) on ink 4.8:1.
export const afterDarkTheme: ThemeColors = {
  bg: palette.ink,
  surface: '#26231F',
  surfaceAlt: '#302C26',
  text: palette.paper,
  textMuted: '#B9AF9C',
  line: 'rgba(243,236,221,0.16)',
  lineStrong: palette.paper,
  brick: '#D4604C',
  brickFill: palette.brick,
  ivy: '#7FA88D',
  ivyFill: '#3B5C48',
  mustard: palette.mustard,
  onFill: palette.paper,
  inkFill: '#3D3831',
  locked: '#9A917F', // 5.0:1 on the dark surface
  overlay: 'rgba(0,0,0,0.6)',
  mapStyle: 'dark',
};

export const fonts = {
  display: 'Fraunces_800ExtraBold',
  displayBlack: 'Fraunces_900Black',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  serif: 'Fraunces_600SemiBold',
  label: 'Oswald_600SemiBold',
  labelMed: 'Oswald_500Medium',
  body: 'DMSans_400Regular',
  bodyMed: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Printed things have tight corners. No pill-shaped "app cards".
export const radius = { none: 0, xs: 2, sm: 4, md: 6 } as const;

export type Accent = 'brick' | 'ivy' | 'mustard' | 'ink';

export function accentFill(c: ThemeColors, a: Accent): string {
  switch (a) {
    case 'brick':
      return c.brickFill;
    case 'ivy':
      return c.ivyFill;
    case 'mustard':
      return c.mustard;
    case 'ink':
      return c.inkFill;
  }
}

export function onAccent(a: Accent): string {
  return a === 'mustard' ? palette.ink : palette.paper;
}
