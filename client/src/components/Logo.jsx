// Logo — reusable GameTime logo mark
// Uses the correct image file per background — no CSS filter tricks.
//
// variant:
//   'dark'   → black bg, white+red bells  (use on dark/black backgrounds)
//   'light'  → white bg, black+red bells  (use on white/light backgrounds)
//   'white'  → black bg, all-white        (use as faded watermark on dark bg)
//   'color'  → white bg, original colors  (original full-color version)
//
// The Logo component also accepts isDark so callers can pass the theme and
// get the right variant automatically without thinking about it.

const SRCS = {
  dark:  '/logo-dark.png',   // black bg, white + red
  light: '/logo-light.png',  // white bg, black + red
  white: '/logo-white.png',  // black bg, all white
  color: '/logo-color.png',  // white bg, original color
}

export default function Logo({ variant = 'dark', size = 40, style = {}, alt = 'GameTime' }) {
  const src = SRCS[variant] ?? SRCS.dark
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
