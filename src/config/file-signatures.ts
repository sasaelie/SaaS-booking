export const FILE_SIGNATURES = {
  JPEG: [255, 216, 255],
  PNG: [137, 80, 78, 71, 13, 10, 26, 10],
  WEBP_PREFIX: [82, 73, 70, 70],
  WEBP_SUFFIX: [87, 69, 66, 80],
  WEBP_OFFSET: 8,
  WEBP_MIN: 12,
} as const;
