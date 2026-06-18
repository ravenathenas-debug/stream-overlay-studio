export const CANVAS_DIMS = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
} as const

export type AspectRatio = keyof typeof CANVAS_DIMS
