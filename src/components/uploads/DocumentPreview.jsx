import { useEffect, useState } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/ui/Loaders'
import { Modal } from '@/pages/admin/adminUi'
import { fetchPrivateDocumentBlob } from '@/services/apiClient'

/**
 * Preview of a private document, inside a dialog. Images are shown directly and PDFs in a viewer.
 * The file needs the login token, so it is fetched as a blob first.
 * `doc` = { url, name, mimeType? }
 */
export function DocumentPreviewModal({ doc, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', objectUrl: '', kind: '' })

  useEffect(() => {
    let alive = true
    let created = ''
    fetchPrivateDocumentBlob(doc.url)
      .then((blob) => {
        if (!alive) return
        const type = blob.type || doc.mimeType || ''
        const kind = type.startsWith('image/') ? 'image' : type === 'application/pdf' || /\.pdf($|\?)/i.test(doc.url) ? 'pdf' : 'other'
        created = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: doc.mimeType || 'application/octet-stream' }))
        setState({ loading: false, error: '', objectUrl: created, kind })
      })
      .catch((e) => alive && setState({ loading: false, error: e.message || 'Could not load the document.', objectUrl: '', kind: '' }))
    return () => {
      alive = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [doc.url, doc.mimeType])

  return (
    <Modal wide title={doc.name || 'Document'} description="Preview" onClose={onClose}>
      {state.loading && <div className="wf-docview__state"><Spinner size={22} /> Loading…</div>}
      {state.error && <div className="wf-docview__state is-error">{state.error}</div>}
      {!state.loading && !state.error && (
        <>
          <div className="wf-docview">
            {state.kind === 'image' && <img src={state.objectUrl} alt={doc.name || 'Document'} />}
            {state.kind === 'pdf' && <iframe src={state.objectUrl} title={doc.name || 'PDF document'} />}
            {state.kind === 'other' && <div className="wf-docview__state">This file type cannot be previewed. Use Download.</div>}
          </div>
          <div className="wf-formfoot">
            <a className="button button--outline button--sm" href={state.objectUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} style={{ marginRight: 6 }} />Open in new tab</a>
            <a className="button button--sm" href={state.objectUrl} download={doc.name || 'document'}><Download size={14} style={{ marginRight: 6 }} />Download</a>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </>
      )}
    </Modal>
  )
}
