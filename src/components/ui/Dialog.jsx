import { clsx } from 'clsx'
import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { X } from 'lucide-react'
import ReactDOM from 'react-dom'

const DialogContext = createContext(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within Dialog')
  }
  return context
}

export function Dialog({ children, className = '', defaultOpen = false, open: controlledOpen, onOpenChange, ...props }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const open = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(true)
    onOpenChange?.(true)
  }, [isControlled, onOpenChange])

  const close = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(false)
    onOpenChange?.(false)
  }, [isControlled, onOpenChange])

  const triggerRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        close()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, close])

  return (
    <DialogContext.Provider value={{ isOpen, open, close, triggerRef, contentRef }}>
      <div className={clsx('dialog', className)} {...props}>
        {children}
        {isOpen && (
          <Portal>
            <div className="dialog__overlay" onClick={close} aria-hidden="true" />
          </Portal>
        )}
      </div>
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, className = '', 'aria-label': ariaLabel, ...props }) {
  const { isOpen, open, triggerRef } = useDialogContext()

  return (
    <button
      ref={triggerRef}
      type="button"
      className={clsx('dialog__trigger', className)}
      onClick={open}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}

export function DialogContent({ children, className = '', size = 'md', ...props }) {
  const { isOpen, contentRef } = useDialogContext()

  if (!isOpen) return null

  const sizes = {
    sm: 'dialog__panel--sm',
    md: '',
    lg: 'dialog__panel--lg',
    xl: 'dialog__panel--xl',
    full: 'dialog__panel--full',
  }

  return (
    <Portal>
      <div
        ref={contentRef}
        className={clsx('dialog__panel', sizes[size], className)}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        <div className="dialog__content">
          {children}
        </div>
      </div>
    </Portal>
  )
}

export function DialogHeader({ children, className = '', title, description, action, ...props }) {
  return (
    <div className={clsx('dialog__header', className)} {...props}>
      <div className="dialog__header-content">
        {title && <h2 className="dialog__title">{title}</h2>}
        {description && <p className="dialog__description">{description}</p>}
        {children}
      </div>
      {action && <div className="dialog__action">{action}</div>}
    </div>
  )
}

export function DialogBody({ children, className = '', ...props }) {
  return (
    <div className={clsx('dialog__body', className)} {...props}>
      {children}
    </div>
  )
}

export function DialogFooter({ children, className = '', justify = 'end', ...props }) {
  const justifies = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }

  return (
    <div className={clsx('dialog__footer', justifies[justify], className)} {...props}>
      {children}
    </div>
  )
}

export function DialogClose({ className = '', 'aria-label': ariaLabel = 'Close', ...props }) {
  const { close } = useDialogContext()

  return (
    <button
      type="button"
      className={clsx('dialog__close button button--ghost button--icon button--sm', className)}
      onClick={close}
      aria-label={ariaLabel}
      {...props}
    >
      <X className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}

export function DialogTitle({ children, className = '', ...props }) {
  return <h2 className={clsx('dialog__title', className)} {...props}>{children}</h2>
}

export function DialogDescription({ children, className = '', ...props }) {
  return <p className={clsx('dialog__description', className)} {...props}>{children}</p>
}

function Portal({ children }) {
  if (typeof document === 'undefined') return null
  return ReactDOM.createPortal(children, document.body)
}
