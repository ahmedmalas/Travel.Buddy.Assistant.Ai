const whitespacePattern = /\s+/g;

export function normalizeSearchValue(value: string): string {
  return value.normalize('NFKD').replace(whitespacePattern, ' ').trim().toLowerCase();
}
