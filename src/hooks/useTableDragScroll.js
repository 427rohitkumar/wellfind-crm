import { useEffect } from 'react'

/**
 * Drag-to-scroll for every `.wf-table-wrap` (the same grab-and-pan feel as the
 * smart Table component). Delegated on the document, so tables added later work too.
 */
export function useTableDragScroll() {
  useEffect(() => {
    let wrap = null
    let startX = 0
    let startLeft = 0
    let dragging = false

    const onDown = (e) => {
      if (e.button !== 0) return
      const el = e.target.closest?.('.wf-table-wrap')
      if (!el || el.scrollWidth <= el.clientWidth) return
      if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return
      wrap = el
      startX = e.pageX
      startLeft = el.scrollLeft
      dragging = false
    }
    const onMove = (e) => {
      if (!wrap) return
      const walk = (e.pageX - startX) * 1.5
      if (!dragging && Math.abs(walk) > 4) {
        dragging = true
        wrap.classList.add('is-dragging')
      }
      if (dragging) wrap.scrollLeft = startLeft - walk
    }
    const onUp = () => {
      if (!wrap) return
      wrap.classList.remove('is-dragging')
      if (dragging) {
        // Swallow the click that ends a drag so rows are not opened by accident.
        const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault() }
        window.addEventListener('click', swallow, true)
        setTimeout(() => window.removeEventListener('click', swallow, true), 60)
      }
      wrap = null
      dragging = false
    }

    document.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])
}
