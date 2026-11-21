import { useRef, useState } from 'react'
import { Eye, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { FormRow, Notice } from '@/pages/admin/adminUi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_MB, checkFile, deleteDocument, listMyDocuments, uploadDocument } from '@/services/uploadService'
import { DocumentPreviewModal } from './DocumentPreview'

const size = (b) => (b == null ? '—' : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const when = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/** The signed-in user's own documents (PDF / images): upload, view, delete. Private to the owner and super admins. */
export function MyDocuments({ ownerId, title = ownerId ? 'Uploaded documents' : 'My documents', description = ownerId ? 'Files this teacher added from their own profile.' : 'Certificates, ID proofs and other files. Only you and the Wellfind admin team can open them.' }) {
  const readOnly = Boolean(ownerId)
  const { data, loading, error, reload } = useLoad(() => listMyDocuments(ownerId), [ownerId])
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [preview, setPreview] = useState(null)
  const docs = data?.docs || []

  const choose = (e) => {
    const f = e.target.files?.[0] || null
    const problem = f ? checkFile(f, 'document') : ''
    if (problem) {
      setMsg({ error: problem, success: '' })
      e.target.value = ''
      return
    }
    setMsg({ error: '', success: '' })
    setFile(f)
  }

  const upload = async () => {
    const problem = checkFile(file, 'document')
    if (problem) return setMsg({ error: problem, success: '' })
    setBusy('upload')
    setMsg({ error: '', success: '' })
    try {
      await uploadDocument(file, { label: label.trim() })
      setFile(null)
      setLabel('')
      if (inputRef.current) inputRef.current.value = ''
      setMsg({ error: '', success: 'File uploaded.' })
      reload()
    } catch (err) {
      setMsg({ error: err.message || 'Could not upload the file.', success: '' })
    } finally {
      setBusy('')
    }
  }

  const view = (d) => setPreview({ url: d.url, name: d.label, mimeType: d.mimeType })

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.label}"? This cannot be undone.`)) return
    setBusy(`del-${d.id}`)
    try {
      await deleteDocument(d.id)
      setMsg({ error: '', success: 'File deleted.' })
      reload()
    } catch (err) {
      setMsg({ error: err.message || 'Could not delete the file.', success: '' })
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <div className="wf-sectionhead"><div><h3>{title}</h3><p>{description}</p></div></div>
      {!readOnly && <div className="wf-testpad">
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
        <div className="wf-grid-2">
          <FormRow label="Name of the document (optional)">
            <input className={inputCls} maxLength={200} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. B.Ed certificate" />
          </FormRow>
          <FormRow label="File" hint={`PDF, JPG, PNG or WebP, up to ${MAX_DOCUMENT_MB} MB`}>
            <input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} onChange={choose} className={inputCls} />
          </FormRow>
        </div>
        <div><Button size="sm" disabled={!file} loading={busy === 'upload'} onClick={upload}><Upload size={14} style={{ marginRight: 6 }} />Upload</Button></div>
      </div>}
      <div className="wf-table-wrap">
        <table className="wf-table" style={{ minWidth: 560 }}>
          <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th className="num">Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ padding: 0 }}><TableLoader columns={5} /></td></tr>}
            {!loading && error && <tr><td colSpan={5} className="wf-state is-error">{error}</td></tr>}
            {!loading && !error && docs.length === 0 && <tr><td colSpan={5} className="wf-state">{readOnly ? 'This teacher has not uploaded any documents yet.' : 'No documents uploaded yet.'}</td></tr>}
            {!loading && docs.map((d) => (
              <tr key={d.id}>
                <td className="wf-cell-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {d.mimeType === 'application/pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
                  <button type="button" className="wf-doclink" onClick={() => view(d)}><strong>{d.label}</strong></button>
                  {d.source === 'application' && <span className="wf-chip" title="Uploaded with your application. Replace it from Application Status.">Application</span>}
                </td>
                <td>{d.mimeType === 'application/pdf' ? 'PDF' : 'Image'}</td>
                <td>{size(d.size)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{when(d.createdAt)}</td>
                <td>
                  <div className="wf-actions" style={{ justifyContent: 'flex-end' }}>
                    <Button size="sm" variant="outline" onClick={() => view(d)}><Eye size={14} style={{ marginRight: 4 }} />Preview</Button>
                    {!readOnly && d.source !== 'application' && <Button size="sm" variant="danger" loading={busy === `del-${d.id}`} onClick={() => remove(d)} title="Delete"><Trash2 size={14} /></Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </Card>
  )
}
