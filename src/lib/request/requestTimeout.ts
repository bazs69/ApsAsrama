/**
 * Request Timeout
 * 
 * Safely races a promise against a timeout using AbortController.
 * Ensures memory safety by clearing the timeout if the promise resolves first.
 */

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message)
    this.name = "TimeoutError"
  }
}

export async function withTimeout<T>(
  promiseFactory: (abortController: AbortController) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const abortController = new AbortController()
  let timeoutId: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      abortController.abort() // Cancel the underlying request if supported
      reject(new TimeoutError(`Request exceeded timeout of ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([
      promiseFactory(abortController),
      timeoutPromise
    ])
    return result
  } finally {
    // Clear timeout to prevent memory leaks and dangling timeouts keeping event loop alive
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
