/**
 * Pagination Strategy
 * 
 * Abstraction layer for different pagination approaches.
 * Currently defaults to OffsetPaginationStrategy.
 * In Production V2, CursorPaginationStrategy can be implemented here without altering API contracts.
 */

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextCursor?: string
  }
}

export interface PaginationStrategy {
  paginate<T>(queryExecutor: () => Promise<[number, T[]]> | Promise<T[]>): Promise<PaginationResult<T>>
  createResponse<T>(data: T[], total?: number): PaginationResult<T>
}

/**
 * Offset-based pagination strategy
 * Compatible with existing skip/take implementations.
 */
export class OffsetPaginationStrategy implements PaginationStrategy {
  constructor(private page: number, private pageSize: number) {}

  async paginate<T>(queryExecutor: () => Promise<[number, T[]]>): Promise<PaginationResult<T>> {
    const [total, data] = await queryExecutor()
    return this.createResponse(data, total)
  }

  createResponse<T>(data: T[], total: number = 0): PaginationResult<T> {
    const totalPages = Math.ceil(total / this.pageSize)
    return {
      data,
      pagination: {
        page: this.page,
        pageSize: this.pageSize,
        total,
        totalPages,
        hasNextPage: this.page < totalPages,
        hasPreviousPage: this.page > 1
      }
    }
  }
}
