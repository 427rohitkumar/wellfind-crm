/** Turns a document reference (id, url or Payload doc object) into a fetchable path and a display name. */
export function resolveDocRef(ref, fallbackName = 'Document') {
  if (!ref) return { url: '', name: fallbackName }
  if (typeof ref === 'string' || typeof ref === 'number') {
    const s = String(ref)
    return { url: s.startsWith('/') ? s : `/api/teacher-documents/${s}`, name: fallbackName }
  }
  return {
    url: ref.url || (ref.id ? `/api/teacher-documents/${ref.id}` : ''),
    name: ref.label || ref.alt || ref.fileName || ref.filename || fallbackName,
    mimeType: ref.mimeType,
  }
}

