const UNIT_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

export const parseDuration = (value, fallbackMs) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d+)\s*(ms|s|m|h|d|w)$/i);
    if (match) {
      return Number(match[1]) * UNIT_MS[match[2].toLowerCase()];
    }
  }

  return fallbackMs;
};
