export const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

export const toSafeInt = (v, fallback = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.trunc(n);
};
