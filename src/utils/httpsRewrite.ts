const TVMAZE_HTTP_PREFIX = /^http:\/\/(api|static)\.tvmaze\.com/

function rewriteString(value: string): string {
  if (TVMAZE_HTTP_PREFIX.test(value)) {
    return value.replace(/^http:/, 'https:')
  }
  return value
}

export function rewriteHttpsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return rewriteString(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteHttpsDeep(item)) as unknown as T
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] = rewriteHttpsDeep(v)
    }
    return result as unknown as T
  }
  return value
}
