import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Loaders'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import { Trash2 } from 'lucide-react'
import { deleteStudentEnquiry } from '@/services/studentEnquiryService'
import { deleteTeacherEnquiry } from '@/services/teacherEnquiryService'

export function InquiryDeleteModal({
  isOpen,
  onClose,
  type, // 'student' | 'teacher'
  inquiry,
  onSuccess,
}) {
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleDelete = async () => {
    if (!inquiry?.id) return

    setDeleting(true)
    setErrorMessage('')

    try {
      if (type === 'student') {
        await deleteStudentEnquiry(inquiry.id)
      } else {
        await deleteTeacherEnquiry(inquiry.id)
      }

      onSuccess?.(
        `${type === 'student' ? 'Student enquiry' : 'Teacher application'} #${inquiry.id} deleted successfully.`,
        inquiry.id
      )
      onClose()
    } catch (err) {
      const isForbidden = err.isForbidden || err.status === 403
      const isUnauthorized = err.isUnauthorized || err.status === 401
      if (isForbidden || isUnauthorized) {
        setErrorMessage('Access denied: Super admin privileges are required to delete enquiries.')
      } else {
        setErrorMessage(err.message || 'Failed to delete enquiry from server.')
      }
    } finally {
      setDeleting(false)
    }
  }

  const name = inquiry?.name || inquiry?.fullName || 'this applicant'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !deleting && onClose()}>
      <DialogContent size="sm">
        <DialogHeader
          title={`Delete ${type === 'student' ? 'Student Enquiry' : 'Teacher Application'}`}
          description={`Confirmation required for #${inquiry?.id}`}
          action={!deleting ? <DialogClose /> : null}
        />

        <DialogBody className="space-y-3">
          {errorMessage && (
            <Alert variant="error" title="Something needs your attention." />
          )}

          <div
            className="p-4 rounded-lg space-y-2"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--color-danger) 8%, var(--color-surface, #fff))',
              border: 'none',
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger, #e52629)' }}>
              Are you sure you want to permanently delete enquiry <span className="font-mono font-bold">#{inquiry?.id}</span> for <strong>{name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone. All submitted details, internal notes, and associated record references will be removed from the system.
            </p>
          </div>
        </DialogBody>

        <DialogFooter justify="end">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner size={16} className="mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Enquiry
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
