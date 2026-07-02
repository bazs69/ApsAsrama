/**
 * generatePageNumbers
 *
 * Returns an array of page numbers (and "..." ellipsis placeholders)
 * to render in a smart pagination component — similar to GitHub's approach.
 *
 * Examples:
 *   totalPages=5, currentPage=3  → [1, 2, 3, 4, 5]
 *   totalPages=20, currentPage=1 → [1, 2, 3, "...", 20]
 *   totalPages=20, currentPage=10 → [1, "...", 8, 9, 10, 11, 12, "...", 20]
 *   totalPages=20, currentPage=19 → [1, "...", 17, 18, 19, 20]
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
): (number | "...")[] {
  if (totalPages <= 0) return []

  // If total pages are small enough, show all pages without ellipsis.
  if (totalPages <= siblingCount * 2 + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSiblingIndex > 3
  const showRightEllipsis = rightSiblingIndex < totalPages - 2

  const firstPage = 1
  const lastPage = totalPages

  if (!showLeftEllipsis && showRightEllipsis) {
    // Near the start
    const leftRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => i + 1,
    )
    return [...leftRange, "...", lastPage]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Near the end
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => totalPages - (3 + siblingCount * 2 - 1) + i,
    )
    return [firstPage, "...", ...rightRange]
  }

  // Middle
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  )
  return [firstPage, "...", ...middleRange, "...", lastPage]
}

export type PageItem = number | "..."
