export const duration = {
  instant: 100,
  fast: 150,
  base: 250,
  slow: 400,
  slower: 600,
} as const;

export const ease = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOut: "cubic-bezier(0.45, 0, 0.55, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const spring = {
  gentle: { stiffness: 120, damping: 14 },
  snappy: { stiffness: 300, damping: 20 },
} as const;

export const distance = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
} as const;

export const stagger = {
  item: 60,
  section: 120,
} as const;

export const shake = {
  distance: 6,
  duration: 400,
  iterations: 3,
} as const;

export type Duration = keyof typeof duration;
export type Ease = keyof typeof ease;
