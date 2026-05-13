export const QUALITY_OPTIONS = {
  '2K': '2K',
  '4K': '4K',
} as const;

export type Quality = keyof typeof QUALITY_OPTIONS;
