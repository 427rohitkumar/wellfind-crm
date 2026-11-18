import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import { Trash2, AlertTriangle } from 'lucide-react'

export function StudentDeleteModal({
  isOpen,
  onClose,
  student,
  onConfirm,
}) {
  if (!student) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader
          title="Delete Student Record"
          description="Are you sure you want to remove this student?"
          action={<DialogClose />}
        />

        <DialogBody className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-danger">Action cannot be undone</p>
              <p className="text-muted-foreground mt-0.5">
                This will delete the student profile for <strong>{student.name}</strong> ({student.id}) including enrolment notes.
              </p>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="neutral" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={() => {
              onConfirm(student.id)
              onClose()
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

