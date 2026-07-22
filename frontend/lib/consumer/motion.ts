export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  reveal: [0.7, 0, 0.15, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

export const SPRING = {
  ui: { type: "spring", stiffness: 260, damping: 26 } as const,
  panel: { type: "spring", stiffness: 240, damping: 30 } as const,
  snap: { type: "spring", stiffness: 340, damping: 34 } as const,
} as const;
