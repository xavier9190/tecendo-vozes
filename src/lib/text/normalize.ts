export interface NormalizeTextOptions {
  replaceHyphensAndUnderscores?: boolean;
}

/**
 * Normalizes text for accent- and case-insensitive matching.
 */
export function normalizeText(text: string, options?: NormalizeTextOptions): string {
  let result = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (options?.replaceHyphensAndUnderscores) {
    result = result.replace(/[-_]+/g, " ");
  }

  return result.replace(/\s+/g, " ").trim();
}
