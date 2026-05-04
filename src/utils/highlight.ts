export interface HighlightSegment {
  text: string
  match: boolean
}

export function splitForHighlight(text: string, q: string): HighlightSegment[] {
  if (!text) return []
  const query = q.trim()
  if (query.length === 0) return [{ text, match: false }]

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) return [{ text, match: false }]

  const segments: HighlightSegment[] = []
  if (index > 0) segments.push({ text: text.slice(0, index), match: false })
  segments.push({ text: text.slice(index, index + query.length), match: true })
  if (index + query.length < text.length) {
    segments.push({ text: text.slice(index + query.length), match: false })
  }
  return segments
}
