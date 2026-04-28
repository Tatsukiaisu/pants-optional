// ─── Number formatting ────────────────────────────────────────────────────────

/** Compact abbreviated format — use where space is limited */
export function fmt(n: number): string {
  if (n < 10_000) return Math.floor(n).toLocaleString('fr-FR');
  const suffixes = ['', 'K', 'M', 'Md', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  const scaled = n / Math.pow(1000, tier);
  return scaled.toFixed(2).replace('.', ',') + '\u202f' + (suffixes[tier] || '?');
}

/** Full locale format — abbreviated above 1 000 000, full below */
export function fmtFull(n: number): string {
  if (n < 1_000_000) return Math.floor(n).toLocaleString('fr-FR');
  const suffixes = ['', 'K', 'M', 'Md', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  const factor = Math.pow(1000, tier);
  const scaled = Math.floor(n / factor * 100) / 100; // truncate, don't round
  return scaled.toFixed(2).replace('.', ',') + '\u202f' + (suffixes[tier] || '?');
}

export function fmtRate(n: number): string {
  if (n < 1) return n.toFixed(2).replace('.', ',');
  return fmt(n);
}

export function fmtPrice(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}
