/**
 * Enterprise Business Normalizer
 * 
 * Standardized data normalization utilities for Master Data input sanitization
 * and duplicate checks.
 */

export const BusinessNormalizer = {
  /**
   * Trims whitespace and collapses multiple interior spaces into a single space.
   */
  normalizeWhitespace(input?: string | null): string {
    if (!input) return ""
    return input.trim().replace(/\s+/g, " ")
  },

  /**
   * Normalizes an entity name (collapses multiple spaces and trims).
   */
  normalizeName(input?: string | null): string {
    return this.normalizeWhitespace(input)
  },

  /**
   * Normalizes an entity code (collapses spaces and converts to uppercase).
   */
  normalizeCode(input?: string | null): string {
    return this.normalizeWhitespace(input).toUpperCase()
  },

  /**
   * Normalizes case for uniform comparisons.
   */
  normalizeCase(input?: string | null, mode: "upper" | "lower" = "upper"): string {
    const normalized = this.normalizeWhitespace(input)
    return mode === "upper" ? normalized.toUpperCase() : normalized.toLowerCase()
  }
}
