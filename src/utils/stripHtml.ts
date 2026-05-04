const ALLOWED_TAGS = new Set(['p', 'b', 'i', 'em', 'strong', 'br'])

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''

  let result = html

  result = result.replace(/<!--[\s\S]*?-->/g, '')
  result = result.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')

  result = result.replace(/<\/?\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, rawTag: string) => {
    const tag = rawTag.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) return ''
    return match.startsWith('</') ? `</${tag}>` : `<${tag}>`
  })

  return result
}
